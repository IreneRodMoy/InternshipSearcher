import { describe, expect, it } from 'vitest';
import { parseWorkdayPostedOn } from '../src/sources/ats.js';
import { parseLinkedInCards, parseRelativeTime } from '../src/sources/linkedin.js';
import { parseAge, parseMarkdownTables } from '../src/sources/markdown-tables.js';
import { parseQuantList } from '../src/sources/quant-list.js';
import { descriptionFromHtml } from '../src/pipeline/enrich.js';

const NOW = Date.UTC(2026, 9, 13, 12);
const HOUR = 3_600_000;

describe('markdown tables', () => {
  it('parses html-flavoured rows and inherits the company from ↳ rows', () => {
    const markdown = [
      '| Company | Position | Location | Posting | Age |',
      '|---|---|---|---|---|',
      '| <a href="https://lyft.com"><strong>Lyft</strong></a> | Software Engineer Intern | Montréal, Canada +1 | <a href="https://example.com/a"><img src="x"/></a> | 3d |',
      '| ↳ | Data Intern | Montreal, QC</br>Toronto, ON | <a href="https://example.com/b"><img src="x"/></a> | 5h |',
      '| **[Closed Co](https://c.com)** | Old Intern | Montreal | 🔒 | 9d |',
    ].join('\n');
    const jobs = parseMarkdownTables(markdown, 'Speedy', NOW);
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({ company: 'Lyft', locations: ['Montréal, Canada'], url: 'https://example.com/a', postedAt: NOW - 72 * HOUR });
    expect(jobs[1]).toMatchObject({ company: 'Lyft', title: 'Data Intern', locations: ['Montreal, QC', 'Toronto, ON'] });
  });

  it('parses ages', () => {
    expect(parseAge('2mo', NOW)).toBe(NOW - 2 * 2_592_000_000);
    expect(parseAge('—', NOW)).toBeUndefined();
  });
});

describe('quant list', () => {
  it('reads open roles per company', () => {
    const markdown = `## Optiver\n**Locations**: Chicago, Montreal\n\n|Role|Links|\n|---|---|\n|SWE|[✅ C++](https://x.com/1)&nbsp;[❌ ](https://x.com/2)|\n`;
    expect(parseQuantList(markdown, 'NU')).toEqual([
      expect.objectContaining({ company: 'Optiver', title: 'Software Engineer Intern (C++)', locations: ['Chicago', 'Montreal'] }),
    ]);
  });
});

describe('linkedin', () => {
  it('parses guest search cards', () => {
    const html = `
      <li><div class="base-card" data-entity-urn="urn:li:jobPosting:4012345678">
        <a class="base-card__full-link" href="https://ca.linkedin.com/jobs/view/intern-4012345678?trk=x"></a>
        <h3 class="base-search-card__title"> Software Developer Intern </h3>
        <h4 class="base-search-card__subtitle"><a>Mirego</a></h4>
        <span class="job-search-card__location">Montreal, Quebec, Canada</span>
        <time class="job-search-card__listdate--new" datetime="2026-10-13">2 hours ago</time>
      </div></li>`;
    expect(parseLinkedInCards(html, NOW)).toEqual([
      {
        source: 'LinkedIn',
        title: 'Software Developer Intern',
        company: 'Mirego',
        url: 'https://www.linkedin.com/jobs/view/4012345678',
        locations: ['Montreal, Quebec, Canada'],
        postedAt: NOW - 2 * HOUR,
      },
    ]);
  });

  it('understands french relative times', () => {
    expect(parseRelativeTime('il y a 3 jours', NOW)).toBe(NOW - 72 * HOUR);
    expect(parseRelativeTime('Just now', NOW)).toBe(NOW);
  });
});

describe('workday', () => {
  it('parses posted dates', () => {
    expect(parseWorkdayPostedOn('Posted Today', NOW)).toBe(NOW);
    expect(parseWorkdayPostedOn('Posted 30+ Days Ago', NOW)).toBe(NOW - 30 * 24 * HOUR);
  });
});

describe('descriptionFromHtml', () => {
  it('prefers JobPosting structured data', () => {
    const html = `<script type="application/ld+json">{"@type":"JobPosting","description":"&lt;p&gt;Build things with React&lt;/p&gt;"}</script><body>nav</body>`;
    expect(descriptionFromHtml(html)).toBe('Build things with React');
  });
});
