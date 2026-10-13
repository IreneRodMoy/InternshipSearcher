import { getRun, saveRun } from '../db/source-runs.js';
import { getPreferences } from '../db/settings.js';
import { setStatus, staleApplications, getJob } from '../db/jobs.js';
import { broadcast } from '../events.js';
import { pushNotification } from '../notify.js';
import { sources } from '../sources/index.js';
import type { Source } from '../sources/types.js';
import { toPublicJob } from '../routes/serialize.js';
import { ingest } from './ingest.js';

const running = new Set<string>();
const MINUTE = 60_000;

export function sourceStatuses() {
  return sources.map((source) => ({
    ...getRun(source.id),
    cursor: undefined,
    id: source.id,
    name: source.name,
    enabled: source.enabled(),
    running: running.has(source.id),
    intervalMinutes: source.intervalMinutes,
  }));
}

export async function runSource(source: Source) {
  if (running.has(source.id) || !source.enabled()) return;
  running.add(source.id);
  broadcast('scan', { source: source.id, running: true });

  const run = getRun(source.id);
  const warnings: string[] = [];
  const isFirstRun = run.lastSuccessAt === null;
  run.lastRunAt = Date.now();

  try {
    const result = await source.fetch({
      prefs: getPreferences(),
      cursor: run.cursor,
      setCursor: (value) => (run.cursor = value),
      warn: (message) => warnings.push(message),
    });
    if (result !== 'unchanged') {
      const { added, withdrawn } = await ingest(result);
      run.found = result.length;
      run.added = added.length;
      withdrawn.forEach((job) => broadcast('job', toPublicJob(job)));
      if (added.length) {
        broadcast('jobs', { jobs: added.map(toPublicJob), quiet: isFirstRun });
        if (!isFirstRun) await pushNotification(added);
      }
    }
    run.lastSuccessAt = Date.now();
    run.lastError = warnings.length ? `Couldn't reach ${warnings.slice(0, 4).join(', ')}${warnings.length > 4 ? ` and ${warnings.length - 4} more` : ''}` : null;
  } catch (error) {
    run.lastError = (error as Error).message;
    console.warn(`[${source.id}]`, run.lastError);
  } finally {
    saveRun(run);
    running.delete(source.id);
    broadcast('scan', { source: source.id, running: false });
  }
}

export function runAll() {
  return Promise.all(sources.filter((s) => s.enabled()).map(runSource));
}

function due(source: Source) {
  const { lastRunAt } = getRun(source.id);
  return !lastRunAt || Date.now() - lastRunAt >= source.intervalMinutes * MINUTE;
}

export function ghostStaleApplications() {
  const days = getPreferences().ghostAfterDays;
  const ids = staleApplications(Date.now() - days * 24 * 60 * MINUTE);
  for (const id of ids) {
    setStatus(id, 'ghosted', true);
    broadcast('job', toPublicJob(getJob(id)!));
  }
  return ids.length;
}

export function startScheduler() {
  const tick = () => {
    for (const source of sources) if (source.enabled() && due(source)) void runSource(source);
  };
  tick();
  ghostStaleApplications();
  setInterval(tick, MINUTE);
  setInterval(ghostStaleApplications, 15 * MINUTE);
}
