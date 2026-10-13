import { db } from './index.js';

export interface SourceRun {
  source: string;
  lastRunAt: number | null;
  lastSuccessAt: number | null;
  lastError: string | null;
  found: number;
  added: number;
  cursor: string | null;
}

export function getRun(source: string): SourceRun {
  const row = db()
    .prepare(
      `SELECT source, last_run_at AS lastRunAt, last_success_at AS lastSuccessAt, last_error AS lastError,
       found, added, cursor FROM source_runs WHERE source = ?`,
    )
    .get(source) as SourceRun | undefined;
  return row ?? { source, lastRunAt: null, lastSuccessAt: null, lastError: null, found: 0, added: 0, cursor: null };
}

export function saveRun(run: SourceRun) {
  db()
    .prepare(
      `INSERT INTO source_runs (source, last_run_at, last_success_at, last_error, found, added, cursor)
       VALUES (@source, @lastRunAt, @lastSuccessAt, @lastError, @found, @added, @cursor)
       ON CONFLICT (source) DO UPDATE SET last_run_at = excluded.last_run_at, last_success_at = excluded.last_success_at,
       last_error = excluded.last_error, found = excluded.found, added = excluded.added, cursor = excluded.cursor`,
    )
    .run(run);
}
