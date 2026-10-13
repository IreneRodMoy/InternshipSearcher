import { Router } from 'express';
import { getJob, jobEvents, listBoard, listFresh, setStatus, updateJob } from '../db/jobs.js';
import { broadcast } from '../events.js';
import { addManualJob } from '../pipeline/ingest.js';
import { STATUSES, type Status } from '../types.js';
import { toPublicJob } from './serialize.js';

export const jobsRouter = Router();

const isStatus = (value: unknown): value is Status => STATUSES.includes(value as Status);
const text = (value: unknown, max = 500) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

jobsRouter.get('/', (_req, res) => {
  res.json({ fresh: listFresh().map(toPublicJob), board: listBoard().map(toPublicJob) });
});

jobsRouter.get('/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ ...toPublicJob(job), description: job.description, events: jobEvents(job.id) });
});

jobsRouter.patch('/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const { status, notes } = req.body ?? {};
  if (status !== undefined) {
    if (!isStatus(status)) return res.status(400).json({ error: 'Unknown status' });
    if (status !== job.status) setStatus(job.id, status);
  }
  if (typeof notes === 'string') updateJob(job.id, { notes: notes.slice(0, 10_000) });
  const updated = toPublicJob(getJob(job.id)!);
  broadcast('job', updated);
  res.json(updated);
});

jobsRouter.post('/', async (req, res) => {
  const input = {
    title: text(req.body?.title),
    company: text(req.body?.company),
    url: text(req.body?.url, 2000),
    location: text(req.body?.location) || 'Montreal, QC',
    notes: text(req.body?.notes, 10_000),
  };
  if (!input.title || !input.company || !/^https?:\/\//.test(input.url)) {
    return res.status(400).json({ error: 'Title, company and a valid link are required' });
  }
  const job = await addManualJob(input);
  const status = isStatus(req.body?.status) ? req.body.status : 'will_apply';
  if (job.status !== status) setStatus(job.id, status);
  const created = toPublicJob(getJob(job.id)!);
  broadcast('job', created);
  res.status(201).json(created);
});
