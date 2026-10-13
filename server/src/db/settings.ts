import { defaultPreferences } from '../pipeline/preferences.js';
import type { Preferences } from '../types.js';
import { db } from './index.js';

export function getSetting<T>(key: string, fallback: T): T {
  const row = db().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? (JSON.parse(row.value) as T) : fallback;
}

export function setSetting(key: string, value: unknown) {
  db()
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value')
    .run(key, JSON.stringify(value));
}

export function getPreferences(): Preferences {
  return { ...defaultPreferences, ...getSetting<Partial<Preferences>>('preferences', {}) };
}

export function savePreferences(prefs: Preferences) {
  setSetting('preferences', prefs);
}
