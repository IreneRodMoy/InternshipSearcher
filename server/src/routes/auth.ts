import { Router } from 'express';
import { clearSession, createSession, isAuthenticated, loginRateLimit, passwordMatches } from '../auth/session.js';

export const authRouter = Router();

authRouter.get('/me', (req, res) => {
  res.json({ authenticated: isAuthenticated(req) });
});

authRouter.post('/login', loginRateLimit, (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!passwordMatches(password)) return res.status(401).json({ error: 'Wrong password' });
  createSession(res);
  res.json({ authenticated: true });
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ authenticated: false });
});
