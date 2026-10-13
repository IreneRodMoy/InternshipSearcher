import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useJobs } from '../hooks/useJobs';
import { useNow } from '../hooks/useNow';
import { useSources } from '../hooks/useSources';
import { STATUS_LABELS } from '../lib/columns';
import type { CvSummary, Job, Preferences, Status } from '../types';
import { AddJobModal } from './AddJobModal';
import { Board } from './Board';
import { CvModal } from './CvModal';
import { BackgroundBlobs } from './Doodles';
import { FreshColumn } from './FreshColumn';
import { Header } from './Header';
import { JobCard } from './JobCard';
import { JobDrawer } from './JobDrawer';
import { SettingsModal } from './SettingsModal';
import { StatsBar } from './StatsBar';
import { Toasts, type Toast } from './Toasts';

type Dialog = 'cv' | 'settings' | 'add' | null;

function readLastVisit() {
  try {
    return Number(localStorage.getItem('last-visit')) || Date.now();
  } catch {
    return Date.now();
  }
}

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const now = useNow();
  const [lastVisit] = useState(readLastVisit);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [cv, setCv] = useState<CvSummary | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [dragged, setDragged] = useState<Job | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notificationsOn, setNotificationsOn] = useState(() => 'Notification' in window && Notification.permission === 'granted');
  const unread = useRef(0);
  const toastId = useRef(0);

  const toast = useCallback((message: string, action?: Toast['action']) => {
    const id = ++toastId.current;
    setToasts((current) => [...current.slice(-3), { id, message, action }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 7000);
  }, []);

  const onNewJobs = useCallback(
    (jobs: Job[]) => {
      const [first] = jobs;
      if (!first) return;
      toast(jobs.length === 1 ? `✿ New: ${first.title} at ${first.company}` : `✿ ${jobs.length} new internships just landed`);
      if (document.hidden) {
        unread.current += jobs.length;
        document.title = `(${unread.current}) InternshipSearcher`;
      }
      if (notificationsOn) {
        const notification = new Notification(jobs.length === 1 ? `New internship at ${first.company}` : `${jobs.length} new internships`, {
          body: jobs.slice(0, 3).map((j) => `${j.title} · ${j.company}`).join('\n'),
          icon: '/favicon.svg',
          tag: 'new-jobs',
        });
        notification.onclick = () => window.focus();
      }
    },
    [toast, notificationsOn],
  );

  const { fresh, board, all, loading, error, update, upsert } = useJobs({ onUnauthorized: onLogout, onNewJobs });
  const { sources, enabled, lastScan, scanning, scan, refresh } = useSources();

  useEffect(() => {
    api.settings().then(setPrefs, () => undefined);
    api.profile().then(({ cv }) => setCv(cv), () => undefined);
  }, []);

  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem('last-visit', String(Date.now()));
      } catch {
        return;
      }
    };
    const onVisibility = () => {
      if (document.hidden) save();
      else {
        unread.current = 0;
        document.title = 'InternshipSearcher';
      }
    };
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const move = useCallback(
    (job: Job, status: Status) => {
      if (job.status === status) return;
      void update(job.id, { status });
      if (status === 'hidden') toast(`Hid ${job.title}`, { label: 'Undo', run: () => void update(job.id, { status: job.status }) });
      else if (status === 'accepted') toast('🎉 Congratulations!! So proud of you');
    },
    [update, toast],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const onDragStart = (event: DragStartEvent) => setDragged((event.active.data.current?.job as Job) ?? null);
  const onDragEnd = (event: DragEndEvent) => {
    setDragged(null);
    const job = all.find((j) => j.id === event.active.id);
    if (job && event.over) move(job, event.over.id as Status);
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) return toast('This browser does not support desktop alerts');
    if (notificationsOn) return toast('Desktop alerts are on. Turn them off from your browser settings.');
    const permission = await Notification.requestPermission();
    setNotificationsOn(permission === 'granted');
    toast(permission === 'granted' ? "Desktop alerts on! I'll ping you when something new shows up" : 'Alerts were blocked by the browser');
  };

  const logout = async () => {
    await api.logout().catch(() => undefined);
    onLogout();
  };

  const openJob = openJobId ? all.find((job) => job.id === openJobId) : undefined;
  const termLabel = prefs ? `${prefs.season} ${prefs.year}` : '';

  return (
    <div className="app">
      <BackgroundBlobs />
      <Header
        now={now}
        lastScan={lastScan}
        scanning={scanning}
        sourceCount={enabled.length}
        hasCv={Boolean(cv)}
        notificationsOn={notificationsOn}
        onScan={() => void scan()}
        onAdd={() => setDialog('add')}
        onCv={() => setDialog('cv')}
        onSettings={() => {
          void refresh();
          setDialog('settings');
        }}
        onNotifications={() => void enableNotifications()}
        onLogout={() => void logout()}
      />
      <StatsBar fresh={fresh} board={board} now={now} />
      {error && <p className="banner">{error}</p>}

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragged(null)}>
        <main className="workspace">
          <FreshColumn
            jobs={fresh}
            now={now}
            lastVisit={lastVisit}
            loading={loading}
            termLabel={termLabel}
            hasCv={Boolean(cv)}
            onOpen={(job) => setOpenJobId(job.id)}
            onHide={(job) => move(job, 'hidden')}
          />
          <Board jobs={board} now={now} ghostAfterDays={prefs?.ghostAfterDays ?? 30} onOpen={(job) => setOpenJobId(job.id)} />
        </main>
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(.2,.8,.3,1)' }}>
          {dragged && <JobCard job={dragged} now={now} overlay />}
        </DragOverlay>
      </DndContext>

      {openJob && (
        <JobDrawer
          job={openJob}
          now={now}
          hasCv={Boolean(cv)}
          onClose={() => setOpenJobId(null)}
          onUpdate={(id, changes) => {
            if (changes.status) {
              move(openJob, changes.status);
              if (changes.status === 'hidden') setOpenJobId(null);
              else if (changes.status !== 'accepted') toast(`Moved to ${STATUS_LABELS[changes.status]}`);
            } else void update(id, changes);
          }}
          onUploadCv={() => setDialog('cv')}
        />
      )}
      {dialog === 'cv' && <CvModal cv={cv} onChange={setCv} onClose={() => setDialog(null)} />}
      {dialog === 'settings' && prefs && (
        <SettingsModal prefs={prefs} sources={sources} now={now} onSaved={setPrefs} onClose={() => setDialog(null)} />
      )}
      {dialog === 'add' && (
        <AddJobModal
          onAdded={(job) => {
            upsert([job]);
            toast(`Added ${job.title}`);
          }}
          onClose={() => setDialog(null)}
        />
      )}
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((t) => t.id !== id))} />
    </div>
  );
}
