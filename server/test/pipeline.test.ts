import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openDatabase, useDatabase } from '../src/db/index.js';
import { getJob, listBoard, listFresh, setStatus } from '../src/db/jobs.js';
import { savePreferences } from '../src/db/settings.js';
import { ingest, reevaluateAll } from '../src/pipeline/ingest.js';
import { defaultPreferences } from '../src/pipeline/preferences.js';
import { ghostStaleApplications } from '../src/pipeline/scheduler.js';
import type { RawJob } from '../src/types.js';

vi.mock('../src/pipeline/enrich.js', () => ({
  fetchDescription: vi.fn(async () => 'Join our team for a 4-month summer internship using TypeScript.'),
}));

const raw = (overrides: Partial<RawJob> = {}): RawJob => ({
  source: 'Simplify',
  title: 'Software Developer Intern',
  company: 'CAE',
  locations: ['Montreal, QC, Canada'],
  url: 'https://cae.wd3.myworkdayjobs.com/career/job/1',
  curated: true,
  ...overrides,
});

beforeEach(() => {
  useDatabase(openDatabase(':memory:'));
});

describe('ingest', () => {
  it('stores relevant jobs, enriches them and returns them once', async () => {
    const { added } = await ingest([raw(), raw({ url: 'https://x.com/2', locations: ['Toronto, ON'] })]);
    expect(added.map((j) => j.company)).toEqual(['CAE']);
    expect(listFresh()).toHaveLength(1);
    expect(listFresh()[0]!.description).toContain('TypeScript');
    expect((await ingest([raw()])).added).toEqual([]);
  });

  it('merges the same posting found by two sources', async () => {
    await ingest([raw()]);
    await ingest([raw({ source: 'SpeedyApply', title: 'Software Developer Intern - Summer 2027', url: 'https://cae.wd3.myworkdayjobs.com/career/job/1?utm_source=x' })]);
    const [job] = listFresh();
    expect(job!.sources).toEqual(['Simplify', 'SpeedyApply']);
  });

  it('hides postings once their source marks them closed', async () => {
    await ingest([raw()]);
    const { withdrawn } = await ingest([raw({ active: false })]);
    expect(withdrawn).toHaveLength(1);
    expect(listFresh()).toHaveLength(0);
  });

  it('withdraws a posting when another source reveals it is for a different term', async () => {
    await ingest([raw({ source: 'SpeedyApply' })]);
    expect(listFresh()).toHaveLength(1);
    const { withdrawn } = await ingest([raw({ terms: ['Summer 2028'] })]);
    expect(withdrawn.map((j) => j.filterReason)).toEqual(['Different term (Summer 2028)']);
    expect(listFresh()).toHaveLength(0);
  });

  it('keeps separate postings from the same source even when titles match', async () => {
    await ingest([raw(), raw({ url: 'https://cae.wd3.myworkdayjobs.com/career/job/2' })]);
    expect(listFresh()).toHaveLength(2);
  });

  it('does not merge with an old posting that has the same title', async () => {
    const year = 365 * 86_400_000;
    await ingest([raw({ terms: ['Summer 2026'], postedAt: Date.now() - year })]);
    await ingest([raw({ source: 'SpeedyApply', url: 'https://x.com/new', postedAt: Date.now() })]);
    expect(listFresh().map((j) => j.sources)).toEqual([['SpeedyApply']]);
  });

  it('runs concurrent ingests one after the other', async () => {
    await Promise.all([ingest([raw()]), ingest([raw({ source: 'Vansh', url: 'https://other.com/cae-1' })])]);
    expect(listFresh()).toHaveLength(1);
    expect(listFresh()[0]!.sources).toEqual(['Simplify', 'Vansh']);
  });

  it('re-filters everything when preferences change', async () => {
    await ingest([raw({ locations: ['Toronto, ON, Canada'] })]);
    expect(listFresh()).toHaveLength(0);
    savePreferences({ ...defaultPreferences, locations: ['Toronto'] });
    reevaluateAll();
    expect(listFresh()).toHaveLength(1);
  });
});

describe('board', () => {
  it('ghosts applications after the configured number of days, and only those', async () => {
    await ingest([raw(), raw({ url: 'https://x.com/2', title: 'Data Intern' }), raw({ url: 'https://x.com/3', title: 'QA Intern' })]);
    const [a, b, c] = listFresh();
    const longAgo = Date.now() - 31 * 86_400_000;
    setStatus(a!.id, 'applied', false, longAgo);
    setStatus(b!.id, 'applied');
    setStatus(c!.id, 'rejected', false, longAgo);

    expect(ghostStaleApplications()).toBe(1);
    expect(getJob(a!.id)!.status).toBe('ghosted');
    expect(getJob(b!.id)!.status).toBe('applied');
    expect(getJob(c!.id)!.status).toBe('rejected');
    expect(listBoard()).toHaveLength(3);
  });

  it('restarts the ghosting clock when moved back to applied', async () => {
    await ingest([raw()]);
    const [job] = listFresh();
    setStatus(job!.id, 'applied', false, Date.now() - 40 * 86_400_000);
    ghostStaleApplications();
    setStatus(job!.id, 'applied');
    expect(ghostStaleApplications()).toBe(0);
    expect(getJob(job!.id)!.status).toBe('applied');
  });
});
