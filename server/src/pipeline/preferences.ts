import type { Preferences } from '../types.js';

export const defaultPreferences: Preferences = {
  season: 'Summer',
  year: 2027,
  locations: [
    'Montreal',
    'Montréal',
    'MTL',
    'Laval',
    'Longueuil',
    'Brossard',
    'Saint-Laurent',
    'St-Laurent',
    'Dorval',
    'Pointe-Claire',
    'Boucherville',
    'Mirabel',
  ],
  includeRemote: false,
  maxDurationMonths: 4,
  requireConfirmedTerm: false,
  extraKeywords: [],
  blockedKeywords: ['sales', 'account executive', 'recruiter', 'recruitment', 'human resources', 'marketing', 'accounting', 'nurse', 'warehouse', 'driver'],
  blockedCompanies: [],
  ghostAfterDays: 30,
  desktopNotifications: true,
};
