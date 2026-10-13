import { getText } from '../lib/http.js';
import { compact, decodeEntities } from '../lib/text.js';
import type { RawJob } from '../types.js';
import type { Source } from './types.js';

const AGE_UNITS: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000, mo: 2_592_000_000 };

function cellText(cell: string) {
  return compact(decodeEntities(cell.replace(/<[^>]+>/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '')));
}

function firstLink(cell: string) {
  return cell.match(/href="(https?:[^"]+)"/)?.[1] ?? cell.match(/\]\((https?:[^)\s]+)\)/)?.[1];
}

export function parseAge(age: string, now = Date.now()): number | undefined {
  const match = age.trim().match(/^(\d+)\s*(mo|m|h|d|w)/i);
  if (!match) return undefined;
  return now - Number(match[1]) * AGE_UNITS[match[2]!.toLowerCase()]!;
}

export function parseMarkdownTables(markdown: string, source: string, now = Date.now()): RawJob[] {
  const jobs: RawJob[] = [];
  let header: string[] | null = null;
  let lastCompany = '';

  for (const line of markdown.split('\n')) {
    if (!line.trim().startsWith('|')) {
      header = null;
      continue;
    }
    const cells = line.trim().replace(/^\||\|$/g, '').split('|');
    if (!header) {
      header = cells.map((c) => cellText(c).toLowerCase());
      continue;
    }
    if (cells.every((c) => /^\s*:?-{2,}:?\s*$/.test(c))) continue;

    const column = (...names: string[]) => {
      const index = header!.findIndex((h) => names.some((n) => h.includes(n)));
      return index >= 0 ? cells[index] ?? '' : '';
    };
    const companyCell = cellText(column('company'));
    const company = companyCell === '↳' || !companyCell ? lastCompany : companyCell;
    lastCompany = company;
    const title = cellText(column('position', 'role', 'title'));
    const linkCell = column('posting', 'application', 'apply', 'link');
    const url = firstLink(linkCell);
    if (!company || !title || !url || linkCell.includes('🔒')) continue;

    const locationCell = column('location');
    jobs.push({
      source,
      company,
      title,
      url,
      locations: locationCell
        .split(/<\/?br\s*\/?>|<\/?details>|<\/?summary>|;|\n/)
        .map(cellText)
        .filter((l) => l && !/^\d+ locations?$/i.test(l))
        .map((l) => l.replace(/\s*\+\d+$/, '')),
      postedAt: parseAge(cellText(column('age', 'date')), now),
      salary: cellText(column('salary')) || undefined,
      curated: true,
    });
  }
  return jobs;
}

export function markdownSource(options: { id: string; name: string; files: (year: number) => string[] }): Source {
  return {
    id: options.id,
    name: options.name,
    intervalMinutes: 10,
    enabled: () => true,
    async fetch(ctx) {
      const pages = await Promise.all(options.files(ctx.prefs.year).map((file) => getText(`https://raw.githubusercontent.com/${file}`)));
      return pages.flatMap((page) => parseMarkdownTables(page, options.name));
    },
  };
}
