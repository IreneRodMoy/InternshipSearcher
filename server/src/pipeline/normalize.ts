import { createHash } from 'node:crypto';
import type { RawJob } from '../types.js';
import { compact, decodeEntities, fold } from '../lib/text.js';

const TRACKING_PARAMS = /^(utm_.*|ref|refid|referrer|source|src|gh_src|lever-source.*|trk|trackingid|origin|iis|iisn|mode|from|lang|locale|_ga)$/i;

export function canonicalUrl(raw: string): string {
  try {
    const url = new URL(raw.trim());
    url.hash = '';
    url.hostname = url.hostname.toLowerCase().replace(/^[a-z]{2}\.linkedin\.com$/, 'www.linkedin.com');
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
    }
    url.pathname = url.pathname.replace(/\/(apply|application)\/?$/i, '').replace(/\/+$/, '') || '/';
    return url.toString();
  } catch {
    return raw.trim();
  }
}

function slug(text: string) {
  return fold(text)
    .replace(/\b(inc|ltd|llc|corp|corporation|limited|ltee|group|groupe|the)\b\.?/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function dedupeKey(job: Pick<RawJob, 'company' | 'title' | 'locations'>): string {
  const city = slug(job.locations[0] ?? '').split(' ')[0] ?? '';
  const title = slug(job.title)
    .replace(/\b(summer|ete|2026|2027|2028|intern(ship)?|stagiaire|stage|co op|coop)\b/g, ' ')
    .replace(city ? new RegExp(`\\b${city}\\b`, 'g') : /$^/, ' ');
  return [slug(job.company), compact(title), city].join('|');
}

function identity(url: string) {
  const greenhouseId = url.match(/[?&]gh_jid=(\d+)/)?.[1] ?? url.match(/greenhouse\.io\/[^/]+\/jobs\/(\d+)/)?.[1];
  return greenhouseId ? `greenhouse:${greenhouseId}` : canonicalUrl(url);
}

export function jobId(url: string): string {
  return createHash('sha1').update(identity(url)).digest('base64url').slice(0, 16);
}

export function cleanRaw(job: RawJob): RawJob {
  return {
    ...job,
    title: compact(decodeEntities(job.title)),
    company: compact(decodeEntities(job.company)),
    locations: job.locations.map((l) => compact(decodeEntities(l))).filter(Boolean),
    url: canonicalUrl(job.url),
  };
}
