import * as cheerio from 'cheerio';
import { getJson, getText } from '../lib/http.js';
import { compact, decodeEntities, htmlToText } from '../lib/text.js';
import { workdayApi, workdayDetail } from '../sources/ats.js';
import { parseLinkedInDescription } from '../sources/linkedin.js';

const MAX_LENGTH = 20_000;

type Resolver = { pattern: RegExp; fetch: (match: RegExpMatchArray, url: string) => Promise<string | undefined> };

const resolvers: Resolver[] = [
  {
    pattern: /greenhouse\.io\/([^/]+)\/jobs\/(\d+)/,
    fetch: async ([, board, id]) => {
      const job = await getJson<{ content?: string }>(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${id}`);
      return job.content && htmlToText(decodeEntities(job.content));
    },
  },
  {
    pattern: /jobs\.lever\.co\/([^/]+)\/([0-9a-f-]{36})/,
    fetch: async ([, company, id]) => {
      const job = await getJson<{ descriptionPlain?: string; lists?: { text: string; content: string }[] }>(
        `https://api.lever.co/v0/postings/${company}/${id}`,
      );
      return compact([job.descriptionPlain, ...(job.lists ?? []).map((l) => `${l.text}: ${htmlToText(l.content)}`)].join(' '));
    },
  },
  {
    pattern: /jobs\.ashbyhq\.com\/([^/]+)\/([0-9a-f-]{36})/,
    fetch: async ([, board, id]) => {
      const data = await getJson<{ jobs: { id: string; descriptionPlain?: string }[] }>(
        `https://api.ashbyhq.com/posting-api/job-board/${board}`,
      );
      return data.jobs.find((j) => j.id === id)?.descriptionPlain;
    },
  },
  {
    pattern: /jobs\.smartrecruiters\.com\/([^/]+)\/(\d+)/,
    fetch: async ([, company, id]) => {
      const job = await getJson<{ jobAd?: { sections?: Record<string, { text?: string }> } }>(
        `https://api.smartrecruiters.com/v1/companies/${company}/postings/${id}`,
      );
      return htmlToText(Object.values(job.jobAd?.sections ?? {}).map((s) => s.text ?? '').join('\n'));
    },
  },
  {
    pattern: /https:\/\/([^/]+\.myworkdayjobs\.com)\/(?:[a-z]{2}-[A-Z]{2}\/)?([^/]+)(\/job\/.+)$/,
    fetch: async ([, host, site, path]) => (await workdayDetail(workdayApi({ host: host!, site: site! }), path!)).description,
  },
  {
    pattern: /linkedin\.com\/jobs\/view\/(?:[^/]*-)?(\d+)/,
    fetch: async ([, id]) => parseLinkedInDescription(await getText(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`)),
  },
];

export function descriptionFromHtml(html: string): string | undefined {
  const $ = cheerio.load(html);
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try {
      const data = JSON.parse($(script).text()) as unknown;
      const nodes = (Array.isArray(data) ? data : [data, ...((data as { '@graph'?: unknown[] })['@graph'] ?? [])]) as {
        '@type'?: string;
        description?: string;
      }[];
      const posting = nodes.find((n) => n?.['@type'] === 'JobPosting' && n.description);
      if (posting?.description) return htmlToText(decodeEntities(posting.description));
    } catch {
      continue;
    }
  }
  $('script, style, nav, header, footer, noscript, svg').remove();
  const main = compact($('main').text() || $('article').text() || $('body').text());
  return main.length > 200 ? main : undefined;
}

export async function fetchDescription(url: string): Promise<string | undefined> {
  const resolver = resolvers.map((r) => ({ r, match: url.match(r.pattern) })).find((x) => x.match);
  const text = resolver ? await resolver.r.fetch(resolver.match!, url) : descriptionFromHtml(await getText(url, { timeoutMs: 15_000 }));
  return text ? text.slice(0, MAX_LENGTH) : undefined;
}
