import { getText } from '../lib/http.js';
import { compact } from '../lib/text.js';
import type { RawJob } from '../types.js';
import type { Source } from './types.js';

const ROLE_NAMES: Record<string, string> = {
  SWE: 'Software Engineer Intern',
  QD: 'Quant Developer Intern',
  QR: 'Quant Researcher Intern',
  QT: 'Quant Trader Intern',
  HW: 'Hardware Engineer Intern',
  FPGA: 'FPGA Engineer Intern',
  DS: 'Data Scientist Intern',
};

export function parseQuantList(markdown: string, source: string): RawJob[] {
  const jobs: RawJob[] = [];
  for (const section of markdown.split(/^## /m).slice(1)) {
    const company = compact(section.split('\n')[0] ?? '');
    const locations = (section.match(/\*\*Locations\*\*:\s*(.*)/)?.[1] ?? '').split(/,|\//).map(compact).filter(Boolean);
    for (const row of section.matchAll(/^\|([^|\n]+)\|(.+)\|\s*$/gm)) {
      const role = compact(row[1]!);
      if (!ROLE_NAMES[role] && !/intern/i.test(role)) continue;
      for (const link of row[2]!.matchAll(/\[(✅|🔒|❌)?\s*([^\]]*)\]\((https?:[^)\s]+)\)/g)) {
        if (link[1] !== '✅') continue;
        const flavor = compact(link[2] ?? '');
        jobs.push({
          source,
          company,
          title: `${ROLE_NAMES[role] ?? role}${flavor ? ` (${flavor})` : ''}`,
          url: link[3]!,
          locations,
          curated: true,
        });
      }
    }
  }
  return jobs;
}

export const quantList: Source = {
  id: 'northwestern-quant',
  name: 'Northwestern Fintech',
  intervalMinutes: 30,
  enabled: () => true,
  async fetch(ctx) {
    const markdown = await getText(
      `https://raw.githubusercontent.com/northwesternfintech/${ctx.prefs.year}QuantInternships/main/README.md`,
    );
    return parseQuantList(markdown, 'Northwestern Fintech');
  },
};
