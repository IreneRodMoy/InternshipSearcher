import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, UnauthorizedError } from '../api';
import type { Job, Status } from '../types';

const visible = (job: Job) => job.status !== 'hidden' && (job.status !== 'new' || (job.active && job.relevant));

export function useJobs(options: { onUnauthorized: () => void; onNewJobs: (jobs: Job[]) => void }) {
  const [jobs, setJobs] = useState<Map<string, Job>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const callbacks = useRef(options);
  callbacks.current = options;

  const handleError = useCallback((err: unknown) => {
    if (err instanceof UnauthorizedError) callbacks.current.onUnauthorized();
    else setError((err as Error).message);
  }, []);

  const reload = useCallback(async () => {
    try {
      const { fresh, board } = await api.jobs();
      setJobs(new Map([...fresh, ...board].map((job) => [job.id, job])));
      setError(null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const upsert = useCallback((incoming: Job[]) => {
    setJobs((current) => {
      const next = new Map(current);
      for (const job of incoming) {
        if (visible(job)) next.set(job.id, job);
        else next.delete(job.id);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    void reload();
    const events = new EventSource('/api/events');
    events.addEventListener('jobs', (event) => {
      const { jobs: added, quiet } = JSON.parse(event.data) as { jobs: Job[]; quiet: boolean };
      upsert(added);
      if (!quiet) callbacks.current.onNewJobs(added);
    });
    events.addEventListener('job', (event) => upsert([JSON.parse(event.data) as Job]));
    events.addEventListener('refresh', () => void reload());
    events.addEventListener('open', () => void reload());
    return () => events.close();
  }, [reload, upsert]);

  const update = useCallback(
    async (id: string, changes: { status?: Status; notes?: string }) => {
      const previous = jobs.get(id);
      if (!previous) return;
      const now = Date.now();
      const optimistic: Job = {
        ...previous,
        ...changes,
        statusChangedAt: changes.status ? now : previous.statusChangedAt,
        appliedAt: changes.status === 'applied' ? now : previous.appliedAt,
      };
      upsert([optimistic]);
      try {
        upsert([await api.updateJob(id, changes)]);
      } catch (err) {
        upsert([previous]);
        handleError(err);
      }
    },
    [jobs, upsert, handleError],
  );

  const all = useMemo(() => [...jobs.values()], [jobs]);
  const fresh = useMemo(() => all.filter((job) => job.status === 'new'), [all]);
  const board = useMemo(() => all.filter((job) => job.status !== 'new'), [all]);

  return { fresh, board, all, loading, error, reload, update, upsert };
}
