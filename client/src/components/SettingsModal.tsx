import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { timeAgo } from '../lib/format';
import type { Preferences, Season, SourceStatus } from '../types';
import { Modal } from './Modal';

interface SettingsModalProps {
  prefs: Preferences;
  sources: SourceStatus[];
  now: number;
  onSaved: (prefs: Preferences) => void;
  onClose: () => void;
}

const SEASONS: Season[] = ['Summer', 'Fall', 'Winter', 'Spring'];
const splitList = (value: string) => value.split(',').map((v) => v.trim()).filter(Boolean);

export function SettingsModal({ prefs, sources, now, onSaved, onClose }: SettingsModalProps) {
  const [draft, setDraft] = useState(prefs);
  const [lists, setLists] = useState({
    locations: prefs.locations.join(', '),
    extraKeywords: prefs.extraKeywords.join(', '),
    blockedKeywords: prefs.blockedKeywords.join(', '),
    blockedCompanies: prefs.blockedCompanies.join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Preferences>(key: K, value: Preferences[K]) => setDraft({ ...draft, [key]: value });
  const setList = (key: keyof typeof lists, value: string) => setLists({ ...lists, [key]: value });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = await api.saveSettings({
        ...draft,
        locations: splitList(lists.locations),
        extraKeywords: splitList(lists.extraKeywords),
        blockedKeywords: splitList(lists.blockedKeywords),
        blockedCompanies: splitList(lists.blockedCompanies),
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Preferences" onClose={onClose} wide>
      <form className="settings" onSubmit={submit}>
        <fieldset>
          <legend>What I'm looking for</legend>
          <div className="field-row">
            <label className="field">
              <span>Term</span>
              <select value={draft.season} onChange={(event) => set('season', event.target.value as Season)}>
                {SEASONS.map((season) => (
                  <option key={season}>{season}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Year</span>
              <input type="number" min={2024} max={2040} value={draft.year} onChange={(event) => set('year', Number(event.target.value))} />
            </label>
            <label className="field">
              <span>Max length (months)</span>
              <input
                type="number"
                min={1}
                max={16}
                value={draft.maxDurationMonths}
                onChange={(event) => set('maxDurationMonths', Number(event.target.value))}
              />
            </label>
          </div>
          <label className="field">
            <span>Locations (comma separated)</span>
            <input value={lists.locations} onChange={(event) => setList('locations', event.target.value)} />
          </label>
          <label className="toggle">
            <input type="checkbox" checked={draft.includeRemote} onChange={(event) => set('includeRemote', event.target.checked)} />
            <span>Also include remote internships open to people in Canada</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={draft.requireConfirmedTerm}
              onChange={(event) => set('requireConfirmedTerm', event.target.checked)}
            />
            <span>Hide postings that don't explicitly mention {draft.season.toLowerCase()} {draft.year}</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={draft.desktopNotifications}
              onChange={(event) => set('desktopNotifications', event.target.checked)}
            />
            <span>Show a desktop notification when a new internship is found, even if the site is closed</span>
          </label>
        </fieldset>

        <fieldset>
          <legend>Fine-tuning</legend>
          <label className="field">
            <span>Extra keywords that count as tech</span>
            <input value={lists.extraKeywords} onChange={(event) => setList('extraKeywords', event.target.value)} placeholder="e.g. bioinformatics, fintech" />
          </label>
          <label className="field">
            <span>Hide titles containing</span>
            <input value={lists.blockedKeywords} onChange={(event) => setList('blockedKeywords', event.target.value)} />
          </label>
          <label className="field">
            <span>Hide companies</span>
            <input value={lists.blockedCompanies} onChange={(event) => setList('blockedCompanies', event.target.value)} />
          </label>
          <label className="field field--inline">
            <span>Move applications to Ghosted after</span>
            <input
              type="number"
              min={7}
              max={120}
              value={draft.ghostAfterDays}
              onChange={(event) => set('ghostAfterDays', Number(event.target.value))}
            />
            <span>days</span>
          </label>
        </fieldset>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="button button--pink" disabled={saving}>
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
        </div>
      </form>

      <section className="sources">
        <h3>Sources</h3>
        <ul>
          {sources.map((source) => (
            <li key={source.id} className={source.enabled ? undefined : 'is-disabled'}>
              <span className={`status-dot ${!source.enabled ? 'off' : source.running ? 'running' : source.lastError ? 'warn' : 'ok'}`} />
              <div>
                <strong>{source.name}</strong>
                <span>
                  {!source.enabled
                    ? 'Disabled (add an API key to enable)'
                    : source.lastSuccessAt
                      ? `Checked ${timeAgo(source.lastSuccessAt, now)} · every ${source.intervalMinutes} min · ${source.found} postings read`
                      : source.running
                        ? 'First scan in progress…'
                        : 'Waiting for first scan'}
                </span>
                {source.enabled && source.lastError && <span className="source-error">{source.lastError}</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Modal>
  );
}
