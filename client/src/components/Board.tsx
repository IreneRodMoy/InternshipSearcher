import { useDroppable } from '@dnd-kit/core';
import type { CSSProperties } from 'react';
import { BOARD_COLUMNS, type ColumnConfig } from '../lib/columns';
import type { Job } from '../types';
import { ColumnIcon } from './Doodles';
import { DraggableJobCard } from './JobCard';

interface BoardProps {
  jobs: Job[];
  now: number;
  ghostAfterDays: number;
  onOpen: (job: Job) => void;
}

function BoardColumn({ column, jobs, now, ghostAfterDays, onOpen }: { column: ColumnConfig } & BoardProps) {
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
        {jobs.length === 0 && <div className="drop-hint">Drag cards here</div>}
        {jobs.map((job) => (
          <DraggableJobCard key={job.id} job={job} now={now} ghostAfterDays={ghostAfterDays} onOpen={onOpen} compact />
        ))}
      </div>
    </section>
  );
}

export function Board(props: BoardProps) {
  return (
    <div className="board">
      {BOARD_COLUMNS.map((column) => (
        <BoardColumn
          key={column.status}
          column={column}
          {...props}
          jobs={props.jobs
            .filter((job) => job.status === column.status)
            .sort((a, b) => (b.statusChangedAt ?? 0) - (a.statusChangedAt ?? 0))}
        />
      ))}
    </div>
  );
}
