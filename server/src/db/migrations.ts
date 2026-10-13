export const migrations = [
  `
  CREATE TABLE jobs (
    id TEXT PRIMARY KEY,
    dedupe_key TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    locations TEXT NOT NULL,
    url TEXT NOT NULL,
    sources TEXT NOT NULL,
    description TEXT,
    terms TEXT NOT NULL DEFAULT '[]',
    degrees TEXT NOT NULL DEFAULT '[]',
    salary TEXT,
    curated INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    posted_at INTEGER,
    discovered_at INTEGER NOT NULL,
    relevant INTEGER NOT NULL DEFAULT 0,
    filter_reason TEXT,
    term_status TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'new',
    status_changed_at INTEGER,
    applied_at INTEGER,
    notes TEXT NOT NULL DEFAULT '',
    match TEXT,
    enriched_at INTEGER
  );
  CREATE INDEX jobs_dedupe ON jobs (dedupe_key);
  CREATE INDEX jobs_status ON jobs (status, relevant);

  CREATE TABLE job_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    at INTEGER NOT NULL,
    automatic INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX job_events_job ON job_events (job_id);

  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_data BLOB NOT NULL,
    text TEXT NOT NULL,
    uploaded_at INTEGER NOT NULL
  );

  CREATE TABLE source_runs (
    source TEXT PRIMARY KEY,
    last_run_at INTEGER,
    last_success_at INTEGER,
    last_error TEXT,
    found INTEGER NOT NULL DEFAULT 0,
    added INTEGER NOT NULL DEFAULT 0,
    cursor TEXT
  );
  `,
];
