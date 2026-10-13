import { useState, type FormEvent } from 'react';
import { api } from '../api';
import type { Job, Status } from '../types';
import { Modal } from './Modal';

export function AddJobModal({ onAdded, onClose }: { onAdded: (job: Job) => void; onClose: () => void }) {
  const [form, setForm] = useState({ title: '', company: '', url: '', location: 'Montreal, QC', notes: '', status: 'will_apply' as Status });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      onAdded(await api.addJob(form));
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <Modal title="Add a job" onClose={onClose}>
      <p className="muted">Found something on Discord, Slack or a career fair? Save it here so it lives with the rest.</p>
      <form className="settings" onSubmit={submit}>
        <label className="field">
          <span>Link to the posting</span>
          <input type="url" required value={form.url} onChange={(event) => set('url', event.target.value)} placeholder="https://" />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Job title</span>
            <input required value={form.title} onChange={(event) => set('title', event.target.value)} />
          </label>
          <label className="field">
            <span>Company</span>
            <input required value={form.company} onChange={(event) => set('company', event.target.value)} />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Location</span>
            <input value={form.location} onChange={(event) => set('location', event.target.value)} />
          </label>
          <label className="field">
            <span>Put it in</span>
            <select value={form.status} onChange={(event) => set('status', event.target.value)}>
              <option value="new">Fresh finds</option>
              <option value="will_apply">Will apply</option>
              <option value="applied">Applied</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea rows={3} value={form.notes} onChange={(event) => set('notes', event.target.value)} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="button button--pink" disabled={saving}>
            {saving ? 'Saving…' : 'Add job'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
