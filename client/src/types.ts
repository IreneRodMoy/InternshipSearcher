export type Status = 'new' | 'will_apply' | 'applied' | 'rejected' | 'accepted' | 'ghosted' | 'hidden';
export type Season = 'Summer' | 'Fall' | 'Winter' | 'Spring';

export interface Match {
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
  title: string;
  company: string;
  locations: string[];
  url: string;
  sources: string[];
  salary: string | null;
  active: boolean;
  postedAt: number | null;
  discoveredAt: number;
  relevant: boolean;
  termStatus: 'confirmed' | 'unconfirmed' | null;
  tags: string[];
  status: Status;
  statusChangedAt: number | null;
  appliedAt: number | null;
  notes: string;
  match: Match | null;
  hasDescription: boolean;
}

export interface JobDetail extends Job {
  description: string | null;
  events: { status: Status; at: number; automatic: number }[];
}

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

export interface SourceStatus {
  id: string;
  name: string;
  enabled: boolean;
  running: boolean;
  intervalMinutes: number;
  lastRunAt: number | null;
  lastSuccessAt: number | null;
  lastError: string | null;
  found: number;
  added: number;
}

export interface CvSummary {
  fileName: string;
  uploadedAt: number;
  skills: string[];
  words: number;
}
