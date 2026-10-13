import type { Job } from '../types.js';

export function toPublicJob(job: Job) {
  const { description, dedupeKey, curated, terms, degrees, ...rest } = job;
  return { ...rest, hasDescription: Boolean(description) };
}

export type PublicJob = ReturnType<typeof toPublicJob>;
