import { getJson, mapLimit, postJson } from '../lib/http.js';
import { compact, decodeEntities, htmlToText } from '../lib/text.js';
import type { RawJob } from '../types.js';
import { companies, type WorkdayBoard } from './companies.js';
import type { Source, SourceContext } from './types.js';

type BoardFetcher = (board: string, company: string) => Promise<RawJob[]>;

function atsSource(id: string, name: string, boards: Record<string, string>, fetchBoard: BoardFetcher): Source {
  return {
    id,
    name,
    intervalMinutes: 20,
    enabled: () => Object.keys(boards).length > 0,
    fetch: (ctx) =>
      collect(ctx, Object.entries(boards), ([, company]) => company, ([board, company]) => fetchBoard(board, company)),
  };
}

async function collect<T>(ctx: SourceContext, items: T[], label: (item: T) => string, fn: (item: T) => Promise<RawJob[]>) {
  let failures = 0;
  const results = await mapLimit(items, 4, async (item) => {
    try {
      return await fn(item);
    } catch (error) {
      failures++;
      ctx.warn(`${label(item)} (${(error as Error).message})`);
      return [];
    }
  });
  if (failures === items.length) throw new Error(`All ${items.length} boards failed to load`);
  return results.flat();
}

const looksLikeInternship = (title: string) => /intern|co-?op|stage|stagiaire|student|étudiant|etudiant/i.test(title);

interface GreenhouseJob {
  title: string;
  absolute_url: string;
  location?: { name: string };
  offices?: { name: string; location?: string }[];
  first_published?: string;
  updated_at: string;
  content?: string;
}

export const greenhouse = atsSource('greenhouse', 'Greenhouse', companies.greenhouse, async (board, company) => {
  const data = await getJson<{ jobs: GreenhouseJob[] }>(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
  return data.jobs
    .filter((j) => looksLikeInternship(j.title))
    .map((j) => ({
      source: 'Greenhouse',
      company,
      title: j.title,
      url: j.absolute_url,
      locations: [j.location?.name ?? '', ...(j.offices ?? []).map((o) => o.location ?? o.name)].filter(Boolean),
      postedAt: Date.parse(j.first_published ?? j.updated_at) || undefined,
      description: j.content ? htmlToText(decodeEntities(j.content)) : undefined,
    }));
});

interface LeverJob {
  text: string;
  hostedUrl: string;
  createdAt: number;
  categories: { location?: string; allLocations?: string[]; commitment?: string };
  descriptionPlain?: string;
  lists?: { text: string; content: string }[];
  additionalPlain?: string;
}

export const lever = atsSource('lever', 'Lever', companies.lever, async (board, company) => {
  const jobs = await getJson<LeverJob[]>(`https://api.lever.co/v0/postings/${board}?mode=json`);
  return jobs
    .filter((j) => looksLikeInternship(`${j.text} ${j.categories.commitment ?? ''}`))
    .map((j) => ({
      source: 'Lever',
      company,
      title: j.text,
      url: j.hostedUrl,
      locations: j.categories.allLocations?.length ? j.categories.allLocations : [j.categories.location ?? ''],
      postedAt: j.createdAt,
      description: compact(
        [j.descriptionPlain, ...(j.lists ?? []).map((l) => `${l.text}: ${htmlToText(l.content)}`), j.additionalPlain].join(' '),
      ),
    }));
});

interface AshbyJob {
  title: string;
  location: string;
  secondaryLocations?: { location: string }[];
  publishedAt: string;
  jobUrl: string;
  descriptionPlain?: string;
  employmentType?: string;
  isListed?: boolean;
}

export const ashby = atsSource('ashby', 'Ashby', companies.ashby, async (board, company) => {
  const data = await getJson<{ jobs: AshbyJob[] }>(`https://api.ashbyhq.com/posting-api/job-board/${board}`);
  return data.jobs
    .filter((j) => j.isListed !== false && (looksLikeInternship(j.title) || j.employmentType === 'Intern'))
    .map((j) => ({
      source: 'Ashby',
      company,
      title: j.title,
      url: j.jobUrl,
      locations: [j.location, ...(j.secondaryLocations ?? []).map((l) => l.location)],
      postedAt: Date.parse(j.publishedAt) || undefined,
      description: j.descriptionPlain,
    }));
});

interface SmartRecruitersPosting {
  id: string;
  name: string;
  releasedDate: string;
  location: { city?: string; region?: string; country?: string; remote?: boolean; fullLocation?: string };
}

export const smartRecruiters = atsSource('smartrecruiters', 'SmartRecruiters', companies.smartrecruiters, async (board, company) => {
  const seen = new Set<string>();
  const postings: SmartRecruitersPosting[] = [];
  for (const query of ['intern', 'stage', 'stagiaire']) {
    const data = await getJson<{ content: SmartRecruitersPosting[] }>(
      `https://api.smartrecruiters.com/v1/companies/${board}/postings?q=${query}&limit=100`,
    );
    for (const p of data.content) if (!seen.has(p.id) && seen.add(p.id)) postings.push(p);
  }
  return postings
    .filter((p) => looksLikeInternship(p.name))
    .map((p) => ({
      source: 'SmartRecruiters',
      company,
      title: p.name,
      url: `https://jobs.smartrecruiters.com/${board}/${p.id}`,
      locations: [
        p.location.fullLocation ?? [p.location.city, p.location.region, p.location.country].filter(Boolean).join(', '),
        p.location.remote ? 'Remote' : '',
      ].filter(Boolean),
      postedAt: Date.parse(p.releasedDate) || undefined,
    }));
});

interface WorkableJob {
  title: string;
  url: string;
  shortcode: string;
  city?: string;
  state?: string;
  country?: string;
  locations?: { city?: string; region?: string; country?: string }[];
  published_on?: string;
  description?: string;
}

export const workable = atsSource('workable', 'Workable', companies.workable, async (board, company) => {
  const data = await getJson<{ jobs: WorkableJob[] }>(`https://apply.workable.com/api/v1/widget/accounts/${board}?details=true`);
  return data.jobs
    .filter((j) => looksLikeInternship(j.title))
    .map((j) => ({
      source: 'Workable',
      company,
      title: j.title,
      url: j.url || `https://apply.workable.com/${board}/j/${j.shortcode}/`,
      locations: (j.locations?.length ? j.locations : [{ city: j.city, region: j.state, country: j.country }]).map((l) =>
        [l.city, l.region, l.country].filter(Boolean).join(', '),
      ),
      postedAt: j.published_on ? Date.parse(j.published_on) : undefined,
      description: j.description ? htmlToText(j.description) : undefined,
    }));
});

interface WorkdayPosting {
  title: string;
  externalPath: string;
  locationsText?: string;
  postedOn?: string;
}

interface WorkdayDetail {
  jobPostingInfo: {
    location?: string;
    additionalLocations?: string[];
    jobDescription?: string;
    startDate?: string;
  };
}

export function workdayApi(board: Pick<WorkdayBoard, 'host' | 'site'>) {
  return `https://${board.host}/wday/cxs/${board.host.split('.')[0]}/${board.site}`;
}

export function parseWorkdayPostedOn(text: string | undefined, now = Date.now()): number | undefined {
  if (!text) return undefined;
  if (/today/i.test(text)) return now;
  if (/yesterday/i.test(text)) return now - 86_400_000;
  const days = text.match(/(\d+)\+?\s*days?/i);
  return days ? now - Number(days[1]) * 86_400_000 : undefined;
}

export async function workdayDetail(apiBase: string, externalPath: string) {
  const { jobPostingInfo: info } = await getJson<WorkdayDetail>(`${apiBase}${externalPath}`);
  return {
    locations: [info.location, ...(info.additionalLocations ?? [])].filter((l): l is string => Boolean(l)),
    description: info.jobDescription ? htmlToText(info.jobDescription) : undefined,
  };
}

async function fetchWorkday(board: WorkdayBoard): Promise<RawJob[]> {
  const api = workdayApi(board);
  const postings = new Map<string, WorkdayPosting>();
  for (const searchText of ['intern montreal', 'stagiaire', 'co-op montreal']) {
    for (let offset = 0; offset < 60; offset += 20) {
      const page = await postJson<{ total: number; jobPostings: WorkdayPosting[] }>(`${api}/jobs`, {
        appliedFacets: {},
        limit: 20,
        offset,
        searchText,
      });
      page.jobPostings.forEach((p) => postings.set(p.externalPath, p));
      if (offset + 20 >= page.total) break;
    }
  }

  const candidates = [...postings.values()].filter((p) => looksLikeInternship(p.title));
  return mapLimit(candidates, 3, async (p) => {
    const multiple = !p.locationsText || /\d+\s+locations/i.test(p.locationsText);
    const detail = multiple ? await workdayDetail(api, p.externalPath).catch(() => undefined) : undefined;
    return {
      source: 'Workday',
      company: board.company,
      title: p.title,
      url: `https://${board.host}/en-US/${board.site}${p.externalPath}`,
      locations: detail?.locations.length ? detail.locations : [p.locationsText ?? ''],
      postedAt: parseWorkdayPostedOn(p.postedOn),
      description: detail?.description,
    };
  });
}

export const workday: Source = {
  id: 'workday',
  name: 'Workday',
  intervalMinutes: 30,
  enabled: () => companies.workday.length > 0,
  fetch: (ctx) => collect(ctx, companies.workday, (board) => board.company, fetchWorkday),
};
