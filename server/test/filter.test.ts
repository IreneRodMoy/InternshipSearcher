import { describe, expect, it } from 'vitest';
import { durationsIn, evaluate } from '../src/pipeline/filter.js';
import { defaultPreferences } from '../src/pipeline/preferences.js';
import type { RawJob } from '../src/types.js';

const job = (overrides: Partial<RawJob> = {}): RawJob => ({
  source: 'test',
  title: 'Software Developer Intern',
  company: 'Acme',
  locations: ['Montreal, QC, Canada'],
  url: 'https://example.com/jobs/1',
  ...overrides,
});

const prefs = defaultPreferences;

describe('evaluate', () => {
  it('keeps a Montreal software internship', () => {
    expect(evaluate(job(), prefs)).toMatchObject({ relevant: true, termStatus: 'unconfirmed' });
  });

  it('confirms the term from the title, in English or French', () => {
    expect(evaluate(job({ title: 'Software Engineer Intern - Summer 2027' }), prefs).termStatus).toBe('confirmed');
    expect(evaluate(job({ title: "Stagiaire développeur - l'été 2027" }), prefs).termStatus).toBe('confirmed');
    expect(evaluate(job({ description: 'This internship runs from May to August 2027.' }), prefs).termStatus).toBe('confirmed');
  });

  it('rejects other locations', () => {
    expect(evaluate(job({ locations: ['Toronto, ON, Canada'] }), prefs).reason).toBe('Outside your locations');
  });

  it('accepts accented and nearby locations', () => {
    expect(evaluate(job({ locations: ['Montréal, Canada'] }), prefs).relevant).toBe(true);
    expect(evaluate(job({ locations: ['Saint-Laurent, Quebec'] }), prefs).relevant).toBe(true);
  });

  it('only allows remote roles in Canada when enabled', () => {
    const remote = job({ locations: ['Remote - Canada'] });
    expect(evaluate(remote, prefs).relevant).toBe(false);
    expect(evaluate(remote, { ...prefs, includeRemote: true })).toMatchObject({ relevant: true, tags: expect.arrayContaining(['Remote']) });
    expect(evaluate(job({ locations: ['Remote in USA'] }), { ...prefs, includeRemote: true }).relevant).toBe(false);
  });

  it('rejects other terms', () => {
    expect(evaluate(job({ title: 'Software Intern - Fall 2026' }), prefs).reason).toBe('Different term (Fall 2026)');
    expect(evaluate(job({ terms: ['Winter 2027'] }), prefs).reason).toBe('Different term (Winter 2027)');
    expect(evaluate(job({ terms: ['Winter 2027', 'Summer 2027'] }), prefs).relevant).toBe(true);
  });

  it('rejects 8 and 12 month internships but keeps flexible ones', () => {
    expect(evaluate(job({ title: 'Software Intern (8 months)' }), prefs).reason).toBe('8-month term');
    expect(evaluate(job({ description: 'This is a 12-month internship starting in May.' }), prefs).reason).toBe('12-month term');
    expect(evaluate(job({ description: 'A 4 or 8 month internship.' }), prefs)).toMatchObject({ relevant: true, tags: expect.arrayContaining(['4 months']) });
    expect(evaluate(job({ description: 'Stage de 8 mois au sein de notre équipe.' }), prefs).relevant).toBe(false);
  });

  it('ignores month counts that are not about the internship length', () => {
    expect(evaluate(job({ description: 'You have 12 months of experience with React.' }), prefs).relevant).toBe(true);
  });

  it('rejects non-internships and graduate-level roles', () => {
    expect(evaluate(job({ title: 'Software Developer' }), prefs).reason).toBe('Not an internship');
    expect(evaluate(job({ title: 'Senior Software Engineer Intern' }), prefs).reason).toBe('Not for undergrads');
    expect(evaluate(job({ title: 'PhD Research Intern' }), prefs).reason).toBe('Not for undergrads');
    expect(evaluate(job({ degrees: ["Master's", 'PhD'] }), prefs).reason).toBe('Graduate degree required');
    expect(
      evaluate(job({ description: 'You are currently enrolled in a PhD program in computer science.' }), prefs).reason,
    ).toBe('Graduate degree required');
    expect(
      evaluate(job({ description: "Currently enrolled in a bachelor's or master's degree." }), prefs).relevant,
    ).toBe(true);
  });

  it('requires a tech role unless the source is curated', () => {
    expect(evaluate(job({ title: 'Event Planning Intern' }), prefs).reason).toBe('Not a tech role');
    expect(evaluate(job({ title: 'Event Planning Intern', curated: true }), prefs).relevant).toBe(true);
    expect(evaluate(job({ title: 'Stagiaire en intelligence artificielle' }), prefs).relevant).toBe(true);
  });

  it('respects blocked keywords and companies', () => {
    expect(evaluate(job({ title: 'Sales Engineering Intern' }), prefs).reason).toBe('Blocked keyword');
    expect(evaluate(job(), { ...prefs, blockedCompanies: ['acme'] }).reason).toBe('Blocked company');
  });

  it('skips closed postings', () => {
    expect(evaluate(job({ active: false }), prefs).reason).toBe('Posting closed');
  });

  it('can require a confirmed term', () => {
    expect(evaluate(job(), { ...prefs, requireConfirmedTerm: true }).reason).toBe('Term not confirmed');
  });

  it('follows a different target term', () => {
    const fall = { ...prefs, season: 'Fall' as const, year: 2027 };
    expect(evaluate(job({ title: 'Data Intern - Fall 2027' }), fall).termStatus).toBe('confirmed');
    expect(evaluate(job({ title: 'Data Intern - Summer 2027' }), fall).relevant).toBe(false);
  });
});

describe('durationsIn', () => {
  it('reads numbers and ranges', () => {
    expect(durationsIn('4-month internship', false)).toEqual([4]);
    expect(durationsIn('stage de 4 a 8 mois', true)).toEqual([4, 8]);
    expect(durationsIn('a four month co-op term', true)).toEqual([4]);
  });
});
