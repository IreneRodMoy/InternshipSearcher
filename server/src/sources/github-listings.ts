import { request } from '../lib/http.js';
import type { Source } from './types.js';

interface Listing {
  company_name: string;
  title: string;
  locations: string[];
  url: string;
  date_posted: number;
  active: boolean;
  is_visible?: boolean;
  terms?: string[];
  degrees?: string[];
  season?: string;
}

export function githubListings(options: { id: string; name: string; repo: (year: number) => string; branch: string }): Source {
  return {
    id: options.id,
    name: options.name,
    intervalMinutes: 5,
    enabled: () => true,
    async fetch(ctx) {
      const url = `https://raw.githubusercontent.com/${options.repo(ctx.prefs.year)}/${options.branch}/.github/scripts/listings.json`;
      const response = await request(url, {
        headers: ctx.cursor ? { 'if-none-match': ctx.cursor } : {},
        timeoutMs: 60_000,
      });
      if (response.status === 304) return 'unchanged';
      const listings = (await response.json()) as Listing[];
      const etag = response.headers.get('etag');
      if (etag) ctx.setCursor(etag);

      return listings
        .filter((l) => l.is_visible !== false && l.url && l.title)
        .map((l) => ({
          source: options.name,
          title: l.title,
          company: l.company_name,
          locations: l.locations ?? [],
          url: l.url,
          postedAt: l.date_posted ? l.date_posted * 1000 : undefined,
          terms: l.terms,
          degrees: l.degrees,
          active: l.active,
          curated: true,
        }));
    },
  };
}
