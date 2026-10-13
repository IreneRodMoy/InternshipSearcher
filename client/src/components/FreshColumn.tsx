import { useDroppable } from '@dnd-kit/core';
import { useMemo } from 'react';
import { useStoredState } from '../hooks/useStoredState';
import { isFreshToday } from '../lib/format';
import type { Job } from '../types';
import { Flower, Icon, Sparkle, Squiggle } from './Doodles';
import { DraggableJobCard } from './JobCard';

interface Filters {
  query: string;
  today: boolean;
  confirmed: boolean;
  strongMatch: boolean;
  sort: 'newest' | 'match';
}

const DEFAULT_FILTERS: Filters = { query: '', today: false, confirmed: false, strongMatch: false, sort: 'newest' };

interface FreshColumnProps {
  jobs: Job[];
  now: number;
  lastVisit: number;
  loading: boolean;
  termLabel: string;
  hasCv: boolean;
  onOpen: (job: Job) => void;
  onHide: (job: Job) => void;
}

export function FreshColumn({ jobs, now, lastVisit, loading, termLabel, hasCv, onOpen, onHide }: FreshColumnProps) {
  const [filters, setFilters] = useStoredState<Filters>('fresh-filters', DEFAULT_FILTERS);
  const { setNodeRef, isOver } = useDroppable({ id: 'new' });
  const toggle = (key: 'today' | 'confirmed' | 'strongMatch') => setFilters({ ...filters, [key]: !filters[key] });

  const visible = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return jobs
      .filter((job) => !query || [job.title, job.company, ...job.locations, ...job.sources].join(' ').toLowerCase().includes(query))
      .filter((job) => !filters.today || isFreshToday(job, now))
      .filter((job) => !filters.confirmed || job.termStatus === 'confirmed')
      .filter((job) => !filters.strongMatch || (job.match?.score ?? 0) >= 65)
      .sort((a, b) =>
        filters.sort === 'match'
          ? (b.match?.score ?? -1) - (a.match?.score ?? -1)
          : (b.postedAt ?? b.discoveredAt) - (a.postedAt ?? a.discoveredAt),
      );
  }, [jobs, filters, now]);

  const todayCount = jobs.filter((job) => isFreshToday(job, now)).length;

  return (
    <section ref={setNodeRef} className={`fresh-column${isOver ? ' is-over' : ''}`} aria-label="Fresh finds">
      <div className="fresh-column__header">
        <div>
          <h2>
            Fresh finds <Sparkle size={16} />
          </h2>
          <Squiggle width={110} />
        </div>
        <span className="count-bubble">{jobs.length}</span>
      </div>
      <p className="fresh-column__sub">
        {termLabel} · {todayCount} posted in the last 24h
      </p>

      <label className="search">
        <Icon name="search" size={16} />
        <input
          value={filters.query}
          onChange={(event) => setFilters({ ...filters, query: event.target.value })}
          placeholder="Search title, company, source…"
        />
      </label>

      <div className="chips">
        <button className={`chip${filters.today ? ' is-on' : ''}`} onClick={() => toggle('today')}>
          Last 24h
        </button>
        <button className={`chip${filters.confirmed ? ' is-on' : ''}`} onClick={() => toggle('confirmed')}>
          Term confirmed
        </button>
        <button
          className={`chip${filters.strongMatch ? ' is-on' : ''}`}
          onClick={() => toggle('strongMatch')}
          disabled={!hasCv}
          title={hasCv ? undefined : 'Upload your CV first'}
        >
          Good match
        </button>
        <button
          className="chip chip--sort"
          onClick={() => setFilters({ ...filters, sort: filters.sort === 'newest' ? 'match' : 'newest' })}
          disabled={!hasCv && filters.sort === 'newest'}
        >
          {filters.sort === 'newest' ? 'Newest first' : 'Best match first'}
        </button>
      </div>

      <div className="card-list">
        {loading && <div className="skeleton" />}
        {!loading && visible.length === 0 && (
          <div className="empty">
            <Flower size={46} />
            <p>{jobs.length ? 'Nothing matches these filters.' : 'No fresh postings right now. I keep looking every few minutes ✿'}</p>
          </div>
        )}
        {visible.map((job) => (
          <DraggableJobCard key={job.id} job={job} now={now} unseen={job.discoveredAt > lastVisit} onOpen={onOpen} onHide={onHide} />
        ))}
      </div>
    </section>
  );
}
