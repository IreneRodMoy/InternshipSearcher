import { isFreshToday } from '../lib/format';
import type { Job } from '../types';

export function StatsBar({ fresh, board, now }: { fresh: Job[]; board: Job[]; now: number }) {
  const count = (status: Job['status']) => board.filter((job) => job.status === status).length;
  const applied = count('applied');
  const rejected = count('rejected');
  const accepted = count('accepted');
  const ghosted = count('ghosted');
  const sent = applied + rejected + accepted + ghosted;
  const heardBack = rejected + accepted;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = board.filter((job) => job.appliedAt && job.appliedAt > weekAgo).length;

  const stats = [
    { label: 'new today', value: fresh.filter((job) => isFreshToday(job, now)).length },
    { label: 'applications sent', value: sent },
    { label: 'sent this week', value: thisWeek },
    { label: 'heard back', value: sent ? `${Math.round((heardBack / sent) * 100)}%` : '—' },
    { label: accepted === 1 ? 'offer' : 'offers', value: accepted },
  ];

  return (
    <div className="stats-bar">
      {stats.map((stat) => (
        <div key={stat.label} className="stat">
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
