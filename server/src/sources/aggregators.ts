import { config } from '../config.js';
import { getJson } from '../lib/http.js';
import type { RawJob } from '../types.js';
import type { Source } from './types.js';

interface JSearchJob {
  employer_name: string;
  job_title: string;
  job_apply_link: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote?: boolean;
  job_description?: string;
  job_posted_at_timestamp?: number;
  job_publisher?: string;
}

export const jsearch: Source = {
  id: 'jsearch',
  name: 'JSearch (Indeed, Glassdoor, LinkedIn…)',
  intervalMinutes: 240,
  enabled: () => Boolean(config.jsearchKey),
  async fetch(ctx) {
    const city = ctx.prefs.locations[0] ?? 'Montreal';
    const params = new URLSearchParams({
      query: `intern in ${city}, Canada`,
      page: '1',
      num_pages: '2',
      date_posted: 'week',
      country: 'ca',
    });
    const data = await getJson<{ data: JSearchJob[] }>(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: { 'x-rapidapi-key': config.jsearchKey!, 'x-rapidapi-host': 'jsearch.p.rapidapi.com' },
      timeoutMs: 40_000,
    });
    return data.data.map(
      (j): RawJob => ({
        source: j.job_publisher ? `${j.job_publisher} via JSearch` : 'JSearch',
        company: j.employer_name,
        title: j.job_title,
        url: j.job_apply_link,
        locations: [[j.job_city, j.job_state, j.job_country].filter(Boolean).join(', '), j.job_is_remote ? 'Remote, Canada' : ''],
        description: j.job_description,
        postedAt: j.job_posted_at_timestamp ? j.job_posted_at_timestamp * 1000 : undefined,
      }),
    );
  },
};

interface AdzunaJob {
  title: string;
  company: { display_name: string };
  location: { display_name: string; area?: string[] };
  redirect_url: string;
  created: string;
  description: string;
}

export const adzuna: Source = {
  id: 'adzuna',
  name: 'Adzuna',
  intervalMinutes: 60,
  enabled: () => Boolean(config.adzuna),
  async fetch(ctx) {
    const jobs: RawJob[] = [];
    for (const what of ['intern', 'stagiaire']) {
      const params = new URLSearchParams({
        app_id: config.adzuna!.appId,
        app_key: config.adzuna!.appKey,
        what,
        where: ctx.prefs.locations[0] ?? 'Montreal',
        max_days_old: '7',
        sort_by: 'date',
        results_per_page: '50',
      });
      const data = await getJson<{ results: AdzunaJob[] }>(`https://api.adzuna.com/v1/api/jobs/ca/search/1?${params}`);
      jobs.push(
        ...data.results.map((j) => ({
          source: 'Adzuna',
          company: j.company.display_name,
          title: j.title.replace(/<\/?strong>/g, ''),
          url: j.redirect_url,
          locations: [j.location.display_name, (j.location.area ?? []).join(', ')],
          description: j.description,
          postedAt: Date.parse(j.created) || undefined,
        })),
      );
    }
    return jobs;
  },
};
