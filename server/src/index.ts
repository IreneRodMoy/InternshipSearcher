import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app.js';
import { config } from './config.js';
import { db } from './db/index.js';
import { startScheduler } from './pipeline/scheduler.js';

const pidFile = path.join(config.dataDir, 'server.pid');

function removePidFile() {
  try {
    if (fs.readFileSync(pidFile, 'utf8') === String(process.pid)) fs.rmSync(pidFile);
  } catch {
    return;
  }
}

db();
createApp().listen(config.port, config.host, (error?: NodeJS.ErrnoException) => {
  if (error) {
    console.error(error.code === 'EADDRINUSE' ? `Port ${config.port} is already in use. Is InternshipSearcher already running?` : error);
    process.exit(1);
  }
  fs.writeFileSync(pidFile, String(process.pid));
  process.on('exit', removePidFile);
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => process.exit(0));
  console.log(`InternshipSearcher is running at http://localhost:${config.port}`);
  startScheduler();
});
