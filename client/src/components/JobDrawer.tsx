import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { STATUS_LABELS } from '../lib/columns';
import { avatarColor, formatDate, timeAgo } from '../lib/format';
import type { Job, JobDetail, Status } from '../types';
import { Icon, MatchRing, Squiggle } from './Doodles';

interface JobDrawerProps {
  job: Job;
  now: number;
  hasCv: boolean;
  onClose: () => void;
  onUpdate: (id: string, changes: { status?: Status; notes?: string }) => void;
  onUploadCv: () => void;
}

const MOVABLE: Status[] = ['new', 'will_apply', 'applied', 'rejected', 'accepted', 'ghosted', 'hidden'];

export function JobDrawer({ job, now, hasCv, onClose, onUpdate, onUploadCv }: JobDrawerProps) {
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [notes, setNotes] = useState(job.notes);
  const [expanded, setExpanded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setNotes(job.notes);
    api.job(job.id).then((data) => !cancelled && setDetail(data), () => undefined);
    return () => {
      cancelled = true;
    };
  }, [job.id, job.status]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const changeNotes = (value: string) => {
    setNotes(value);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate(job.id, { notes: value }), 600);
  };

  const match = job.match;
  const description = detail?.description;

  return (
    <div className="overlay overlay--drawer" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={job.title}>
        <button className="icon-button drawer__close" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>

        <div className="drawer__hero">
          <div className="avatar avatar--large" style={{ background: avatarColor(job.company) }}>
            {job.company.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="drawer__company">{job.company}</p>
            <h2>{job.title}</h2>
            <Squiggle width={140} />
          </div>
        </div>

        <dl className="facts">
          <div>
            <dt>Location</dt>
            <dd>{job.locations.join(' · ') || 'TBD'}</dd>
          </div>
          <div>
            <dt>Posted</dt>
            <dd>{job.postedAt ? `${formatDate(job.postedAt)} (${timeAgo(job.postedAt, now)})` : 'Unknown'}</dd>
          </div>
          <div>
            <dt>Found by</dt>
            <dd>{job.sources.join(', ')}</dd>
          </div>
          {job.salary && (
            <div>
              <dt>Pay</dt>
              <dd>{job.salary}</dd>
            </div>
          )}
        </dl>

        <div className="drawer__actions">
          <a className="button button--pink" href={job.url} target="_blank" rel="noreferrer noopener">
            Open application <Icon name="external" size={15} />
          </a>
          <label className="select">
            <span>Column</span>
            <select value={job.status} onChange={(event) => onUpdate(job.id, { status: event.target.value as Status })}>
              {MOVABLE.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <section className="panel match-panel">
          <h3>Match score</h3>
          {match ? (
            <>
              <div className="match-panel__summary">
                <MatchRing score={match.score} size={64} />
                <div>
                  <strong>{match.label}</strong>
                  <p>
                    {match.basis === 'title'
                      ? 'Based on the title only, since the full description was not available.'
                      : 'Based on the full description compared to your CV.'}
                  </p>
                </div>
              </div>
              {match.matchedSkills.length > 0 && (
                <div className="skill-row">
                  <span className="skill-row__label">You have</span>
                  {match.matchedSkills.map((skill) => (
                    <span key={skill} className="tag">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              {match.missingSkills.length > 0 && (
                <div className="skill-row">
                  <span className="skill-row__label">They mention</span>
                  {match.missingSkills.map((skill) => (
                    <span key={skill} className="tag tag--outline">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              <ul className="insights">
                {match.highlights.map((h) => (
                  <li key={h} className="is-good">
                    {h}
                  </li>
                ))}
                {match.concerns.map((c) => (
                  <li key={c} className="is-meh">
                    {c}
                  </li>
                ))}
              </ul>
              <p className="fineprint">A keyword estimate of how well your CV lines up with this posting. It can't predict an interview, so use it to decide which ones to apply to first.</p>
            </>
          ) : (
            <p className="muted">
              {hasCv ? 'Match scores are only computed for relevant postings.' : 'Upload your CV to get a match score for every posting.'}{' '}
              {!hasCv && (
                <button className="link-button" onClick={onUploadCv}>
                  Upload CV
                </button>
              )}
            </p>
          )}
        </section>

        <section className="panel">
          <h3>Notes</h3>
          <textarea
            value={notes}
            onChange={(event) => changeNotes(event.target.value)}
            placeholder="Referral contact, interview dates, questions to ask…"
            rows={4}
          />
        </section>

        {detail && detail.events.length > 0 && (
          <section className="panel">
            <h3>Timeline</h3>
            <ol className="timeline">
              <li>
                <span>Found</span>
                <time>{formatDate(job.discoveredAt)}</time>
              </li>
              {detail.events.map((event) => (
                <li key={`${event.status}-${event.at}`}>
                  <span>
                    {STATUS_LABELS[event.status]}
                    {event.automatic ? ' (automatic)' : ''}
                  </span>
                  <time>{formatDate(event.at)}</time>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="panel">
          <h3>Description</h3>
          {!detail && <div className="skeleton skeleton--text" />}
          {detail && !description && <p className="muted">No description could be fetched. Open the posting to read it.</p>}
          {description && (
            <>
              <p className={`description${expanded ? ' is-expanded' : ''}`}>{description}</p>
              {description.length > 900 && (
                <button className="link-button" onClick={() => setExpanded(!expanded)}>
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </>
          )}
        </section>
      </aside>
    </div>
  );
}
