import { adzuna, jsearch } from './aggregators.js';
import { ashby, greenhouse, lever, smartRecruiters, workable, workday } from './ats.js';
import { githubListings } from './github-listings.js';
import { linkedin } from './linkedin.js';
import { markdownSource } from './markdown-tables.js';
import { quantList } from './quant-list.js';
import type { Source } from './types.js';

export const sources: Source[] = [
  githubListings({
    id: 'simplify',
    name: 'Simplify',
    repo: (year) => `SimplifyJobs/Summer${year}-Internships`,
    branch: 'dev',
  }),
  githubListings({
    id: 'vansh-ouckah',
    name: 'Vansh & Ouckah',
    repo: (year) => `vanshb03/Summer${year}-Internships`,
    branch: 'dev',
  }),
  markdownSource({
    id: 'speedyapply',
    name: 'SpeedyApply',
    files: (year) => [
      `speedyapply/${year}-SWE-College-Jobs/main/INTERN_INTL.md`,
      `speedyapply/${year}-AI-College-Jobs/main/INTERN_INTL.md`,
    ],
  }),
  quantList,
  linkedin,
  greenhouse,
  lever,
  ashby,
  smartRecruiters,
  workable,
  workday,
  jsearch,
  adzuna,
];
