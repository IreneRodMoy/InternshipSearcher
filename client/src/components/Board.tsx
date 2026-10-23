import { useDroppable } from '@dnd-kit/core';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { BOARD_COLUMNS, type ColumnConfig } from '../lib/columns';
import type { Job } from '../types';
import { ColumnIcon, Icon } from './Doodles';
import { DraggableJobCard } from './JobCard';

interface BoardProps {
  jobs: Job[];
  now: number;
  ghostAfterDays: number;
  onOpen: (job: Job) => void;
}

function BoardColumn({ column, jobs, now, ghostAfterDays, onOpen, searching }: { column: ColumnConfig; searching: boolean } & BoardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });
  return (
    <section ref={setNodeRef} className={`board-column${isOver ? ' is-over' : ''}`} style={{ '--accent': column.accent } as CSSProperties}>
      <header className="board-column__header">
        <ColumnIcon icon={column.icon} color={column.accent} />
        <div>
          <h2>{column.title}</h2>
          <p>{column.hint}</p>
        </div>
        <span className="count-bubble">{jobs.length}</span>
      </header>
      <div className="card-list">
        {jobs.length === 0 && <div className="drop-hint">{searching ? 'No matches here' : 'Drag cards here'}</div>}
        {jobs.map((job) => (
          <DraggableJobCard key={job.id} job={job} now={now} ghostAfterDays={ghostAfterDays} onOpen={onOpen} compact />
        ))}
      </div>
    </section>
  );
}

const matches = (job: Job, query: string) =>
  [job.title, job.company, job.notes, ...job.locations, ...job.sources].join(' ').toLowerCase().includes(query);

export function Board(props: BoardProps) {
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const search = query.trim().toLowerCase();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && /input|textarea|select/i.test(event.target.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visible = useMemo(() => (search ? props.jobs.filter((job) => matches(job, search)) : props.jobs), [props.jobs, search]);

  return (
    <div className="board-area">
      <div className="board-toolbar">
        <label className="search search--light">
          <Icon name="search" size={16} />
          <input
            ref={input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && setQuery('')}
            placeholder="Find an application by company, title or notes…  ( / )"
            aria-label="Search your applications"
          />
          {query && (
            <button className="icon-button small" onClick={() => setQuery('')} aria-label="Clear search">
              <Icon name="close" size={14} />
            </button>
          )}
        </label>
        {search && (
          <span className="board-toolbar__count">
            {visible.length} {visible.length === 1 ? 'match' : 'matches'}
          </span>
        )}
      </div>
      <div className="board">
        {BOARD_COLUMNS.map((column) => (
          <BoardColumn
            key={column.status}
            column={column}
            {...props}
            searching={Boolean(search)}
            jobs={visible
              .filter((job) => job.status === column.status)
              .sort((a, b) => (b.statusChangedAt ?? 0) - (a.statusChangedAt ?? 0))}
          />
        ))}
      </div>
    </div>
  );
}
