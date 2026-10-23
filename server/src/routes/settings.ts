import { Router } from 'express';
import { getPreferences, savePreferences } from '../db/settings.js';
import { broadcast } from '../events.js';
import { reevaluateAll } from '../pipeline/ingest.js';
import type { Preferences, Season } from '../types.js';

export const settingsRouter = Router();

const SEASONS: Season[] = ['Summer', 'Fall', 'Winter', 'Spring'];

const list = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean).slice(0, 100)
    : [];

const between = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

function parsePreferences(body: Record<string, unknown>, current: Preferences): Preferences {
  return {
    season: SEASONS.includes(body.season as Season) ? (body.season as Season) : current.season,
    year: between(body.year, 2024, 2040, current.year),
    locations: list(body.locations).length ? list(body.locations) : current.locations,
    includeRemote: Boolean(body.includeRemote),
    maxDurationMonths: between(body.maxDurationMonths, 1, 16, current.maxDurationMonths),
    requireConfirmedTerm: Boolean(body.requireConfirmedTerm),
    extraKeywords: list(body.extraKeywords),
    blockedKeywords: list(body.blockedKeywords),
    blockedCompanies: list(body.blockedCompanies),
    ghostAfterDays: between(body.ghostAfterDays, 7, 120, current.ghostAfterDays),
    desktopNotifications: typeof body.desktopNotifications === 'boolean' ? body.desktopNotifications : current.desktopNotifications,
  };
}

settingsRouter.get('/', (_req, res) => {
  res.json(getPreferences());
});

settingsRouter.put('/', (req, res) => {
  const prefs = parsePreferences(req.body ?? {}, getPreferences());
  savePreferences(prefs);
  reevaluateAll();
  broadcast('refresh', { reason: 'settings' });
  res.json(prefs);
});
