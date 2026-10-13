import { config } from './config.js';
import type { Job } from './types.js';

export async function pushNotification(jobs: Job[]) {
  if (!config.ntfyTopic || !jobs.length) return;
  const [first] = jobs;
  const single = jobs.length === 1;
  try {
    await fetch(config.ntfyServer, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        topic: config.ntfyTopic,
        title: single ? `New internship at ${first!.company}` : `${jobs.length} new internships`,
        message: jobs
          .slice(0, 5)
          .map((j) => `• ${j.title} — ${j.company}`)
          .join('\n'),
        tags: ['sparkles'],
        click: single ? first!.url : config.publicUrl,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.warn('ntfy notification failed:', (error as Error).message);
  }
}
