import type { Job, MatchResult, Status } from '../types.js';
import { db } from './index.js';

interface JobRow {
  id: string;
  dedupe_key: string;
  title: string;
  company: string;
  locations: string;
  url: string;
  sources: string;
  description: string | null;
  terms: string;
  degrees: string;
  salary: string | null;
  curated: number;
  active: number;
  posted_at: number | null;
  discovered_at: number;
  relevant: number;
  filter_reason: string | null;
  term_status: Job['termStatus'];
  tags: string;
  status: Status;
  status_changed_at: number | null;
  applied_at: number | null;
  notes: string;
  match: string | null;
  enriched_at: number | null;
}

const COLUMNS: Record<keyof Job, keyof JobRow> = {
  id: 'id',
  dedupeKey: 'dedupe_key',
  title: 'title',
  company: 'company',
  locations: 'locations',
  url: 'url',
  sources: 'sources',
  description: 'description',
  terms: 'terms',
  degrees: 'degrees',
  salary: 'salary',
  curated: 'curated',
  active: 'active',
  postedAt: 'posted_at',
  discoveredAt: 'discovered_at',
  relevant: 'relevant',
  filterReason: 'filter_reason',
  termStatus: 'term_status',
  tags: 'tags',
  status: 'status',
  statusChangedAt: 'status_changed_at',
  appliedAt: 'applied_at',
  notes: 'notes',
  match: 'match',
  enrichedAt: 'enriched_at',
};

const JSON_FIELDS = new Set<keyof Job>(['locations', 'sources', 'terms', 'degrees', 'tags', 'match']);
const BOOLEAN_FIELDS = new Set<keyof Job>(['curated', 'active', 'relevant']);

function fromRow(row: JobRow): Job {
  const job = {} as Record<string, unknown>;
  for (const [field, column] of Object.entries(COLUMNS) as [keyof Job, keyof JobRow][]) {
    const value = row[column];
    if (JSON_FIELDS.has(field)) job[field] = value === null ? null : JSON.parse(value as string);
    else if (BOOLEAN_FIELDS.has(field)) job[field] = Boolean(value);
    else job[field] = value;
  }
  return job as unknown as Job;
}

function toRow(job: Partial<Job>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(job) as [keyof Job, unknown][]) {
    const column = COLUMNS[field];
    if (!column || value === undefined) continue;
    if (JSON_FIELDS.has(field)) row[column] = value === null ? null : JSON.stringify(value);
    else if (BOOLEAN_FIELDS.has(field)) row[column] = value ? 1 : 0;
    else row[column] = value;
  }
  return row;
}

export const BOARD_STATUSES: Status[] = ['will_apply', 'applied', 'rejected', 'accepted', 'ghosted'];

export function getJob(id: string): Job | undefined {
  const row = db().prepare('SELECT * FROM jobs WHERE id = ?').get(id) as JobRow | undefined;
  return row && fromRow(row);
}

const DUPLICATE_WINDOW = 45 * 24 * 60 * 60 * 1000;

export function findDuplicate(dedupeKey: string, source: string, postedAt?: number): Job | undefined {
  const rows = db()
    .prepare('SELECT * FROM jobs WHERE dedupe_key = ? AND active = 1 ORDER BY COALESCE(posted_at, discovered_at) DESC')
    .all(dedupeKey) as JobRow[];
  return rows
    .map(fromRow)
    .find((job) => !job.sources.includes(source) && (!postedAt || !job.postedAt || Math.abs(job.postedAt - postedAt) < DUPLICATE_WINDOW));
}

export function insertJob(job: Job) {
  const row = toRow(job);
  const columns = Object.keys(row);
  db()
    .prepare(`INSERT INTO jobs (${columns.join(', ')}) VALUES (${columns.map((c) => `@${c}`).join(', ')})`)
    .run(row);
}

export function updateJob(id: string, changes: Partial<Job>) {
  const row = toRow(changes);
  const columns = Object.keys(row);
  if (!columns.length) return;
  db()
    .prepare(`UPDATE jobs SET ${columns.map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`)
    .run({ ...row, id });
}

export function listFresh(): Job[] {
  const rows = db()
    .prepare(
      `SELECT * FROM jobs WHERE status = 'new' AND relevant = 1 AND active = 1
       ORDER BY COALESCE(posted_at, discovered_at) DESC`,
    )
    .all() as JobRow[];
  return rows.map(fromRow);
}

export function listBoard(): Job[] {
  const rows = db()
    .prepare(
      `SELECT * FROM jobs WHERE status IN (${BOARD_STATUSES.map(() => '?').join(', ')})
       ORDER BY status_changed_at DESC`,
    )
    .all(...BOARD_STATUSES) as JobRow[];
  return rows.map(fromRow);
}

export function listForRescoring(): Job[] {
  const rows = db().prepare(`SELECT * FROM jobs WHERE relevant = 1 OR status != 'new'`).all() as JobRow[];
  return rows.map(fromRow);
}

export function allJobs(): Job[] {
  return (db().prepare('SELECT * FROM jobs').all() as JobRow[]).map(fromRow);
}

export function setStatus(id: string, status: Status, automatic = false, at = Date.now()) {
  const changes: Partial<Job> = { status, statusChangedAt: at };
  if (status === 'applied') changes.appliedAt = at;
  db().transaction(() => {
    updateJob(id, changes);
    db().prepare('INSERT INTO job_events (job_id, status, at, automatic) VALUES (?, ?, ?, ?)').run(id, status, at, automatic ? 1 : 0);
  })();
}

export function staleApplications(cutoff: number): string[] {
  const rows = db().prepare(`SELECT id FROM jobs WHERE status = 'applied' AND applied_at <= ?`).all(cutoff) as { id: string }[];
  return rows.map((r) => r.id);
}

export function jobEvents(id: string) {
  return db()
    .prepare('SELECT status, at, automatic FROM job_events WHERE job_id = ? ORDER BY at')
    .all(id) as { status: Status; at: number; automatic: number }[];
}

export function setMatch(id: string, match: MatchResult | null) {
  updateJob(id, { match });
}
