import { spawn } from 'node:child_process';
import notifier from 'node-notifier';
import { config } from './config.js';
import type { Job } from './types.js';

const siteUrl = () => `http://localhost:${config.port}`;

function openInBrowser(url: string) {
  const [command, args] =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]];
  spawn(command, args, { detached: true, stdio: 'ignore' }).unref();
}

notifier.on('click', () => openInBrowser(siteUrl()));

function summarize(jobs: Job[]) {
  const [first] = jobs;
  return {
    title: jobs.length === 1 ? `New internship at ${first!.company}` : `${jobs.length} new internships`,
    message: jobs
      .slice(0, 4)
      .map((j) => `${j.title} · ${j.company}`)
      .join('\n'),
  };
}

export function desktopNotification(title: string, message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    notifier.notify({ title, message, sound: true, wait: true }, (error) => (error ? reject(error) : resolve()));
    setTimeout(resolve, 3000);
  });
}

export async function notifyNewJobs(jobs: Job[], desktop: boolean) {
  if (!jobs.length) return;
  const { title, message } = summarize(jobs);
  await Promise.allSettled([
    desktop ? desktopNotification(title, message) : Promise.resolve(),
    pushNotification(title, message, jobs.length === 1 ? jobs[0]!.url : config.publicUrl),
  ]).then((results) =>
    results.forEach((r) => r.status === 'rejected' && console.warn('Notification failed:', (r.reason as Error).message)),
  );
}

async function pushNotification(title: string, message: string, click?: string) {
  if (!config.ntfyTopic) return;
  await fetch(config.ntfyServer, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ topic: config.ntfyTopic, title, message, tags: ['sparkles'], click }),
    signal: AbortSignal.timeout(10_000),
  });
}
