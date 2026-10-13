import { Router } from 'express';
import { requireAuth } from '../auth/session.js';
import { subscribe } from '../events.js';
import { runAll, sourceStatuses } from '../pipeline/scheduler.js';
import { authRouter } from './auth.js';
import { jobsRouter } from './jobs.js';
import { profileRouter } from './profile.js';
import { settingsRouter } from './settings.js';

export const api = Router();

api.get('/health', (_req, res) => {
  res.json({ ok: true });
});
api.use('/auth', authRouter);

api.use(requireAuth);
api.use('/jobs', jobsRouter);
api.use('/profile', profileRouter);
api.use('/settings', settingsRouter);

api.get('/sources', (_req, res) => {
  res.json(sourceStatuses());
});

api.post('/scan', (_req, res) => {
  void runAll();
  res.status(202).json({ started: true });
});

api.get('/events', (_req, res) => {
  subscribe(res);
});
