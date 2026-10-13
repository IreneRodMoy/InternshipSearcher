import { useDraggable } from '@dnd-kit/core';
import type { MouseEvent } from 'react';
import { avatarColor, daysSince, isFreshToday, primaryLocation, timeAgo } from '../lib/format';
import type { Job } from '../types';
import { Icon, MatchRing, Sparkle } from './Doodles';

interface JobCardProps {
  job: Job;
  now: number;
  unseen?: boolean;
  ghostAfterDays?: number;
  onOpen?: (job: Job) => void;
  onHide?: (job: Job) => void;
  overlay?: boolean;
  compact?: boolean;
}

export function JobCard({ job, now, unseen, ghostAfterDays = 30, onOpen, onHide, overlay, compact }: JobCardProps) {
  const appliedDays = daysSince(job.appliedAt, now);
  const stop = (event: MouseEvent) => event.stopPropagation();

  return (
    <article
      className={`job-card${overlay ? ' is-overlay' : ''}${compact ? ' is-compact' : ''}${job.active ? '' : ' is-closed'}`}
      onClick={() => onOpen?.(job)}
      onKeyDown={(event) => event.key === 'Enter' && onOpen?.(job)}
      tabIndex={0}
      aria-label={`${job.title} at ${job.company}`}
    >
      {unseen && <span className="unseen-dot" title="New since your last visit" />}
      <header className="job-card__header">
        <div className="avatar" style={{ background: avatarColor(job.company) }}>
          {job.company.trim().charAt(0).toUpperCase()}
        </div>
        <div className="job-card__heading">
          <h3>{job.title}</h3>
          <p>{job.company}</p>
        </div>
        <MatchRing score={job.match?.score ?? null} size={compact ? 36 : 42} />
      </header>

      <div className="job-card__meta">
        <span>
          <Icon name="pin" size={14} />
          {primaryLocation(job.locations)}
        </span>
        <span className={isFreshToday(job, now) ? 'is-hot' : undefined}>
          {isFreshToday(job, now) && <Sparkle size={11} color="var(--pink-500)" />}
          {timeAgo(job.postedAt ?? job.discoveredAt, now)}
        </span>
      </div>

      {!compact && (job.tags.length > 0 || !job.active || job.salary) && (
        <div className="tags">
          {!job.active && <span className="tag tag--muted">Closed</span>}
          {job.tags.map((tag) => (
            <span key={tag} className={`tag${tag === 'Term TBD' ? ' tag--soft' : ''}`}>
              {tag}
            </span>
          ))}
          {job.salary && <span className="tag tag--butter">{job.salary}</span>}
        </div>
      )}

      {compact && !job.active && <span className="tag tag--muted closed-tag">Closed</span>}

      {job.status === 'applied' && (
        <div className="ghost-meter" title={`Moves to Ghosted after ${ghostAfterDays} days without news`}>
          <div style={{ width: `${Math.min(100, (appliedDays / ghostAfterDays) * 100)}%` }} />
          <span>
            Day {appliedDays} of {ghostAfterDays}
          </span>
        </div>
      )}

      <footer className="job-card__footer">
        <span className="source">{job.sources.join(' · ')}</span>
        <div className="job-card__actions">
          {onHide && (
            <button className="icon-button small" onClick={(event) => (stop(event), onHide(job))} title="Not interested" aria-label="Not interested">
              <Icon name="eye-off" size={15} />
            </button>
          )}
          <a className="apply-link" href={job.url} target="_blank" rel="noreferrer noopener" onClick={stop} onPointerDown={stop}>
            Apply <Icon name="external" size={13} />
          </a>
        </div>
      </footer>
    </article>
  );
}

export function DraggableJobCard(props: JobCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.job.id, data: { job: props.job } });
  return (
    <div ref={setNodeRef} className={`draggable${isDragging ? ' is-dragging' : ''}`} {...attributes} {...listeners} tabIndex={-1}>
      <JobCard {...props} />
    </div>
  );
}
