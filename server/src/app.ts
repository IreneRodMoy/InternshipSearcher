import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { rootDir } from './env.js';
import { api } from './routes/index.js';

const clientDist = path.join(rootDir, 'client/dist');

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
        },
      },
    }),
  );
  app.use((req, res, next) => {
    res.setHeader('x-robots-tag', 'noindex, nofollow');
    if (req.path === '/api/events') return next();
    compression()(req, res, next);
  });
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', api);

  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  });
  return app;
}
