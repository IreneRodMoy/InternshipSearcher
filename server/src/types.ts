export const STATUSES = ['new', 'will_apply', 'applied', 'rejected', 'accepted', 'ghosted', 'hidden'] as const;
export type Status = (typeof STATUSES)[number];

export type Season = 'Summer' | 'Fall' | 'Winter' | 'Spring';

export interface Preferences {
  season: Season;
  year: number;
  locations: string[];
  includeRemote: boolean;
  maxDurationMonths: number;
  requireConfirmedTerm: boolean;
  extraKeywords: string[];
  blockedKeywords: string[];
  blockedCompanies: string[];
  ghostAfterDays: number;
  desktopNotifications: boolean;
}

export interface RawJob {
  source: string;
  title: string;
  company: string;
  locations: string[];
  url: string;
  postedAt?: number;
  description?: string;
  terms?: string[];
  degrees?: string[];
  salary?: string;
  active?: boolean;
  curated?: boolean;
}

export type TermStatus = 'confirmed' | 'unconfirmed';

export interface Verdict {
  relevant: boolean;
  reason?: string;
  termStatus: TermStatus;
  tags: string[];
}

export interface MatchResult {
  score: number;
  label: string;
  matchedSkills: string[];
  missingSkills: string[];
  highlights: string[];
  concerns: string[];
  basis: 'description' | 'title';
}

export interface Job {
  id: string;
  dedupeKey: string;
  title: string;
  company: string;
  locations: string[];
  url: string;
  sources: string[];
  description: string | null;
  terms: string[];
  degrees: string[];
  salary: string | null;
  curated: boolean;
  active: boolean;
  postedAt: number | null;
  discoveredAt: number;
  relevant: boolean;
  filterReason: string | null;
  termStatus: TermStatus | null;
  tags: string[];
  status: Status;
  statusChangedAt: number | null;
  appliedAt: number | null;
  notes: string;
  match: MatchResult | null;
  enrichedAt: number | null;
}
