import * as cheerio from 'cheerio';
import { config } from '../config.js';
import { getText, sleep } from '../lib/http.js';
import { compact } from '../lib/text.js';
import type { RawJob } from '../types.js';
import type { Source } from './types.js';

const SEARCH_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';
const QUERIES = ['intern', 'stagiaire', 'software intern', 'co-op'];

const RELATIVE_UNITS: [RegExp, number][] = [
  [/minute/, 60_000],
  [/hour|heure/, 3_600_000],
  [/day|jour/, 86_400_000],
  [/week|semaine/, 604_800_000],
  [/month|mois/, 2_592_000_000],
];

export function parseRelativeTime(text: string, now = Date.now()): number | undefined {
  const lower = text.toLowerCase();
  if (/just now|à l'instant|moment/.test(lower)) return now;
  const amount = Number(lower.match(/\d+/)?.[0] ?? 1);
  const unit = RELATIVE_UNITS.find(([pattern]) => pattern.test(lower));
  return unit ? now - amount * unit[1] : undefined;
}

export function parseLinkedInCards(html: string, now = Date.now()): RawJob[] {
  const $ = cheerio.load(html);
  return $('li')
    .toArray()
    .flatMap((li) => {
      const card = $(li);
      const urn = card.find('[data-entity-urn]').attr('data-entity-urn') ?? '';
      const id = urn.match(/jobPosting:(\d+)/)?.[1];
      const title = compact(card.find('.base-search-card__title').text());
      const company = compact(card.find('.base-search-card__subtitle').text());
      if (!id || !title || !company) return [];
      const time = card.find('time');
      return [
        {
          source: 'LinkedIn',
          title,
          company,
          url: `https://www.linkedin.com/jobs/view/${id}`,
          locations: [compact(card.find('.job-search-card__location').text())],
          postedAt: parseRelativeTime(compact(time.text()), now) ?? (Date.parse(time.attr('datetime') ?? '') || undefined),
        },
      ];
    });
}

export function parseLinkedInDescription(html: string): string | undefined {
  const $ = cheerio.load(html);
  const text = compact($('.show-more-less-html__markup').text() || $('.description__text').text());
  return text || undefined;
}

export const linkedin: Source = {
  id: 'linkedin',
  name: 'LinkedIn',
  intervalMinutes: 10,
  enabled: () => config.linkedinEnabled,
  async fetch(ctx) {
    const location = ctx.prefs.locations[0] ?? 'Montreal';
    const jobs: RawJob[] = [];
    for (const keywords of QUERIES) {
      for (const start of [0, 25]) {
        const params = new URLSearchParams({
          keywords,
          location: `${location}, Quebec, Canada`,
          f_TPR: 'r604800',
          sortBy: 'DD',
          start: String(start),
        });
        try {
          const page = parseLinkedInCards(await getText(`${SEARCH_URL}?${params}`, { retries: 0 }));
          jobs.push(...page);
          if (page.length < 10) break;
        } catch (error) {
          ctx.warn(`"${keywords}": ${(error as Error).message}`);
          break;
        }
        await sleep(1500 + Math.random() * 1500);
      }
    }
    if (!jobs.length) throw new Error('LinkedIn returned no results (possibly rate limited)');
    return jobs;
  },
};
