import { db } from '../db/index.js';
import { allJobs, findDuplicate, getJob, insertJob, listForRescoring, setMatch, updateJob } from '../db/jobs.js';
import { getPreferences } from '../db/settings.js';
import { mapLimit } from '../lib/http.js';
import { candidateProfile } from '../matching/profile.js';
import { scoreJob } from '../matching/score.js';
import type { Job, Preferences, RawJob } from '../types.js';
import { fetchDescription } from './enrich.js';
import { evaluate } from './filter.js';
import { cleanRaw, dedupeKey, jobId } from './normalize.js';

const union = (a: string[], b: string[] = []) => [...new Set([...a, ...b])];

function asRaw(job: Job): RawJob {
  return {
    source: job.sources[0] ?? '',
    title: job.title,
    company: job.company,
    locations: job.locations,
    url: job.url,
    description: job.description ?? undefined,
    terms: job.terms,
    degrees: job.degrees,
    active: job.active,
    curated: job.curated,
  };
}

function applyVerdict(job: Job, prefs: Preferences): Job {
  const verdict = evaluate(asRaw(job), prefs);
  return { ...job, relevant: verdict.relevant, filterReason: verdict.reason ?? null, termStatus: verdict.termStatus, tags: verdict.tags };
}

function score(job: Job): Job {
  const profile = candidateProfile();
  return { ...job, match: job.relevant && profile ? scoreJob(job, profile) : job.match };
}

function createJob(raw: RawJob, now: number): Job {
  return {
    id: jobId(raw.url),
    dedupeKey: dedupeKey(raw),
    title: raw.title,
    company: raw.company,
    locations: raw.locations,
    url: raw.url,
    sources: [raw.source],
    description: raw.description ?? null,
    terms: raw.terms ?? [],
    degrees: raw.degrees ?? [],
    salary: raw.salary ?? null,
    curated: Boolean(raw.curated),
    active: raw.active ?? true,
    postedAt: raw.postedAt ?? null,
    discoveredAt: now,
    relevant: false,
    filterReason: null,
    termStatus: null,
    tags: [],
    status: 'new',
    statusChangedAt: null,
    appliedAt: null,
    notes: '',
    match: null,
    enrichedAt: null,
  };
}

function merge(existing: Job, raw: RawJob): Job {
  const ownsActivity = existing.sources[0] === raw.source;
  return {
    ...existing,
    sources: union(existing.sources, [raw.source]),
    locations: union(existing.locations, raw.locations),
    terms: union(existing.terms, raw.terms),
    degrees: existing.degrees.length ? existing.degrees : raw.degrees ?? [],
    description: existing.description ?? raw.description ?? null,
    salary: existing.salary ?? raw.salary ?? null,
    curated: existing.curated || Boolean(raw.curated),
    active: ownsActivity && raw.active !== undefined ? raw.active : existing.active,
    postedAt: existing.postedAt && raw.postedAt ? Math.min(existing.postedAt, raw.postedAt) : existing.postedAt ?? raw.postedAt ?? null,
  };
}

const signature = (job: Job) =>
  JSON.stringify([job.sources, job.locations, job.terms, job.degrees, job.description?.length, job.salary, job.curated, job.active, job.postedAt, job.relevant, job.tags, job.filterReason]);

async function enrich(job: Job, prefs: Preferences): Promise<Job> {
  if (job.description) return job;
  try {
    const description = await fetchDescription(job.url);
    return applyVerdict({ ...job, description: description ?? null, enrichedAt: Date.now() }, prefs);
  } catch {
    return { ...job, enrichedAt: Date.now() };
  }
}

export interface IngestResult {
  added: Job[];
  withdrawn: Job[];
}

async function ingestBatch(rawJobs: RawJob[]): Promise<IngestResult> {
  const prefs = getPreferences();
  const now = Date.now();
  const fresh = new Map<string, Job>();
  const freshByKey = new Map<string, string[]>();
  const updates = new Map<string, Job>();
  const surfaced: Job[] = [];
  const withdrawn: Job[] = [];

  for (const raw of rawJobs.map(cleanRaw)) {
    if (!raw.title || !raw.company || !raw.url.startsWith('http')) continue;
    const id = jobId(raw.url);
    const key = dedupeKey(raw);
    const pending =
      fresh.get(id) ?? (freshByKey.get(key) ?? []).map((other) => fresh.get(other)!).find((job) => !job.sources.includes(raw.source));
    if (pending) {
      fresh.set(pending.id, merge(pending, raw));
      continue;
    }
    const stored = getJob(id) ?? findDuplicate(key, raw.source, raw.postedAt);
    const existing = stored && (updates.get(stored.id) ?? stored);
    if (!existing) {
      fresh.set(id, createJob(raw, now));
      freshByKey.set(key, [...(freshByKey.get(key) ?? []), id]);
      continue;
    }
    const merged = applyVerdict(merge(existing, raw), prefs);
    if (signature(merged) === signature(existing)) continue;
    updates.set(existing.id, merged.description !== existing.description || (merged.relevant && !existing.relevant) ? score(merged) : merged);
  }

  for (const job of updates.values()) {
    const original = getJob(job.id)!;
    const wasShown = original.status === 'new' && original.relevant && original.active;
    const isShown = job.status === 'new' && job.relevant && job.active;
    if (isShown && !wasShown) surfaced.push(job);
    if (wasShown && !isShown) withdrawn.push(job);
  }

  const evaluated = [...fresh.values()].map((job) => applyVerdict(job, prefs));
  const needsDetails = evaluated.filter((job) => job.relevant && !job.description);
  const enriched = new Map((await mapLimit(needsDetails, 4, (job) => enrich(job, prefs))).map((job) => [job.id, job]));
  const created = evaluated.map((job) => score(enriched.get(job.id) ?? job));

  db().transaction(() => {
    created.forEach(insertJob);
    updates.forEach((job) => updateJob(job.id, job));
  })();

  return { added: [...created.filter((job) => job.relevant && job.active), ...surfaced], withdrawn };
}

let queue: Promise<unknown> = Promise.resolve();

export function ingest(rawJobs: RawJob[]): Promise<IngestResult> {
  const run = queue.then(() => ingestBatch(rawJobs));
  queue = run.catch(() => undefined);
  return run;
}

export function reevaluateAll() {
  const prefs = getPreferences();
  db().transaction(() => {
    for (const job of allJobs()) {
      const next = applyVerdict(job, prefs);
      if (signature(next) !== signature(job)) updateJob(job.id, score(next));
    }
  })();
}

export function rescoreAll() {
  const profile = candidateProfile();
  db().transaction(() => {
    for (const job of listForRescoring()) setMatch(job.id, profile ? scoreJob(job, profile) : null);
  })();
}

export async function addManualJob(input: { title: string; company: string; url: string; location: string; notes?: string }) {
  const prefs = getPreferences();
  const existing = getJob(jobId(input.url));
  if (existing) return existing;
  const job = createJob(
    cleanRaw({ source: 'Added by you', title: input.title, company: input.company, url: input.url, locations: [input.location] }),
    Date.now(),
  );
  const enriched = await enrich({ ...job, notes: input.notes ?? '' }, prefs);
  const final = score({ ...applyVerdict(enriched, prefs), relevant: true });
  insertJob(final);
  return final;
}
