import { fold } from '../lib/text.js';
import type { Job, MatchResult } from '../types.js';
import { DOMAIN_TITLES, findSkills, type Domain } from './skills.js';

export interface CandidateProfile {
  text: string;
  folded: string;
  skills: Set<string>;
  domains: Map<Domain, number>;
  speaksFrench: boolean;
  hasExperience: boolean;
}

export function buildProfile(text: string): CandidateProfile {
  const folded = fold(text);
  const found = findSkills(text, folded);
  const domains = new Map<Domain, number>();
  for (const skill of found) domains.set(skill.domain, (domains.get(skill.domain) ?? 0) + 1);
  return {
    text,
    folded,
    skills: new Set(found.map((s) => s.name)),
    domains,
    speaksFrench: /francais|french|bilingu/.test(folded),
    hasExperience: /intern|stage|stagiaire|co-?op|experience professionnelle|work experience|developer at|developpeu/.test(folded),
  };
}

const IMPLIED_BY: Record<string, string[]> = {
  AI: ['Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'LLMs', 'NLP', 'Computer Vision'],
  'Machine Learning': ['Deep Learning', 'PyTorch', 'TensorFlow'],
  JavaScript: ['TypeScript', 'React', 'Angular', 'Vue', 'Node.js'],
  'HTML/CSS': ['React', 'Angular', 'Vue'],
  'REST APIs': ['Node.js', 'Django', 'Spring', 'GraphQL'],
};

function hasSkill(profile: CandidateProfile, skill: string) {
  return profile.skills.has(skill) || (IMPLIED_BY[skill] ?? []).some((other) => profile.skills.has(other));
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function labelFor(score: number) {
  if (score >= 80) return 'Great fit';
  if (score >= 65) return 'Good fit';
  if (score >= 45) return 'Worth a shot';
  return 'Long shot';
}

export function scoreJob(job: Pick<Job, 'title' | 'description'>, profile: CandidateProfile): MatchResult {
  const title = fold(job.title);
  const original = `${job.title}\n${job.description ?? ''}`;
  const description = fold(job.description ?? '');
  const jobSkills = findSkills(original, `${title}\n${description}`).filter((s) => s.name !== 'French');
  const highlights: string[] = [];
  const concerns: string[] = [];

  const matched = jobSkills.filter((s) => hasSkill(profile, s.name)).map((s) => s.name);
  const missing = jobSkills.filter((s) => !hasSkill(profile, s.name)).map((s) => s.name);
  const overlap = jobSkills.length ? clamp(matched.length / Math.min(jobSkills.length, 6), 0, 1) : 0.6;
  const skillScore = job.description ? overlap : 0.35 + 0.65 * overlap;

  const domains = DOMAIN_TITLES.filter(([, pattern]) => pattern.test(title)).map(([domain]) => domain);
  const domainScore = domains.length
    ? Math.max(...domains.map((d) => clamp((profile.domains.get(d) ?? 0) / 3, 0, 1)))
    : profile.domains.get('software')
      ? 0.85
      : 0.5;
  if (domains.length && domainScore >= 0.66) highlights.push(`Your CV leans into ${domains.join(' / ')} work`);
  if (domains.length && domainScore < 0.34) concerns.push(`Few ${domains.join(' / ')} keywords on your CV`);

  let level = 0.8;
  if (/bachelor|undergrad|baccalaureat|1er cycle|all levels|any year|first[- ]year|second[- ]year|2nd[- ]year/.test(description)) {
    level += 0.15;
    highlights.push('Open to undergrads');
  }
  if (/(3rd|third|4th|fourth|final|last)[- ]year|graduating in 2027|penultimate/.test(description)) {
    level -= 0.1;
    concerns.push('Prefers upper-year students');
  }
  if (/(preferred|asset|atout)[^.]{0,40}(master|ph\.?d|graduate)/.test(description)) {
    level -= 0.15;
    concerns.push('Graduate students preferred');
  }
  const wantsFrench = /francais|french|bilingu/.test(description);
  if (wantsFrench && profile.speaksFrench) {
    level += 0.1;
    highlights.push('French is a plus and you have it');
  } else if (wantsFrench) {
    level -= 0.2;
    concerns.push('Mentions French — not on your CV');
  }
  if (/previous (internship|experience)|prior (internship|experience)|stage anterieur/.test(description)) {
    if (profile.hasExperience) highlights.push('You already have internship experience');
    else {
      level -= 0.1;
      concerns.push('Asks for previous experience');
    }
  }
  if (matched.length >= 3) highlights.push(`${matched.length} skills overlap`);
  if (missing.length && missing.length >= matched.length) concerns.push(`Missing ${missing.slice(0, 3).join(', ')}`);

  const score = Math.round(100 * (0.5 * skillScore + 0.25 * domainScore + 0.25 * clamp(level, 0, 1)));
  const final = clamp(score - (job.description ? 0 : 5), 5, 97);
  return {
    score: final,
    label: labelFor(final),
    matchedSkills: matched,
    missingSkills: missing,
    highlights,
    concerns,
    basis: job.description ? 'description' : 'title',
  };
}
