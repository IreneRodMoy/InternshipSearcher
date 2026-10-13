import type { Preferences, RawJob } from '../types.js';

export interface SourceContext {
  prefs: Preferences;
  cursor: string | null;
  setCursor(value: string): void;
  warn(message: string): void;
}

export interface Source {
  id: string;
  name: string;
  intervalMinutes: number;
  enabled(): boolean;
  fetch(ctx: SourceContext): Promise<RawJob[] | 'unchanged'>;
}
