import { createApp } from './app.js';
import { config } from './config.js';
import { db } from './db/index.js';
import { startScheduler } from './pipeline/scheduler.js';

db();
createApp().listen(config.port, () => {
  console.log(`InternshipSearcher listening on http://localhost:${config.port}`);
  startScheduler();
});
