import { getCv } from '../db/profile.js';
import { buildProfile, type CandidateProfile } from './score.js';

let cached: { uploadedAt: number; profile: CandidateProfile } | null = null;

export function candidateProfile(): CandidateProfile | null {
  const cv = getCv();
  if (!cv) {
    cached = null;
    return null;
  }
  if (cached?.uploadedAt !== cv.uploadedAt) cached = { uploadedAt: cv.uploadedAt, profile: buildProfile(cv.text) };
  return cached.profile;
}
