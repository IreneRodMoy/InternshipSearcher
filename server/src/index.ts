import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app.js';
import { config } from './config.js';
import { db } from './db/index.js';
import { startScheduler } from './pipeline/scheduler.js';

db();
const pidFile = path.join(config.dataDir, 'server.pid');
fs.writeFileSync(pidFile, String(process.pid));
process.on('exit', () => fs.rmSync(pidFile, { force: true }));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => process.exit(0));

createApp().listen(config.port, config.host, () => {
  console.log(`InternshipSearcher is running at http://localhost:${config.port}`);
  startScheduler();
});
