import { describe, expect, it } from 'vitest';
import { canonicalUrl, dedupeKey, jobId } from '../src/pipeline/normalize.js';

describe('canonicalUrl', () => {
  it('drops tracking parameters and fragments', () => {
    expect(canonicalUrl('https://Jobs.Lever.co/acme/123/apply?utm_source=simplify&lever-source=x#top')).toBe('https://jobs.lever.co/acme/123');
    expect(canonicalUrl('https://acme.com/careers?gh_jid=42&gh_src=abc')).toBe('https://acme.com/careers?gh_jid=42');
    expect(canonicalUrl('https://ca.linkedin.com/jobs/view/1')).toBe('https://www.linkedin.com/jobs/view/1');
  });
});

describe('dedupeKey', () => {
  it('ignores term and city noise in titles', () => {
    const a = dedupeKey({ company: 'Lyft, Inc.', title: 'Software Engineer Intern - Backend', locations: ['Montreal, QC'] });
    const b = dedupeKey({ company: 'Lyft', title: 'Software Engineer Intern - Backend - Summer 2027 - Montreal', locations: ['Montréal, Canada'] });
    expect(a).toBe(b);
  });
});

describe('jobId', () => {
  it('recognises the same Greenhouse posting behind different career sites', () => {
    expect(jobId('https://epicgames.com/careers/jobs/6138140004?gh_jid=6138140004')).toBe(
      jobId('https://www.epicgames.com/site/careers/jobs/6138140004?gh_jid=6138140004'),
    );
    expect(jobId('https://job-boards.greenhouse.io/drweng/jobs/7991196')).toBe(jobId('https://boards.greenhouse.io/drweng/jobs/7991196'));
  });
});
