import type { Preferences, RawJob, Season, TermStatus, Verdict } from '../types.js';
import { fold, words } from '../lib/text.js';

const INTERNSHIP = words([
  'intern', 'interns', 'internship', 'internships', 'co-op', 'coop', 'stage', 'stagiaire', 'stagiaires',
  'summer student', 'student', 'etudiant', 'etudiante', 'apprenti', 'apprentie', 'trainee', 'placement', 'work term',
]);

const WRONG_LEVEL = words([
  'senior', 'sr', 'staff', 'principal', 'director', 'phd', 'ph.d', 'ph. d', 'doctoral', 'doctorat', 'postdoc',
  'postdoctoral', 'masters', "master's", 'master student', 'maitrise', 'mba', 'new grad', 'new graduate', 'high school',
  'secondaire', 'permanent',
]);

const TECH = words([
  'software', 'logiciel', 'logiciels', 'developer', 'developpeur', 'developpeuse', 'developpement', 'development', 'dev',
  'engineer', 'engineering', 'ingenieur', 'ingenieure', 'ingenierie', 'genie', 'programmer', 'programmeur', 'programming',
  'programmation', 'data', 'donnees', 'machine learning', 'apprentissage automatique', 'deep learning', 'artificial intelligence',
  'intelligence artificielle', 'genai', 'llm', 'nlp', 'computer vision', 'full stack', 'fullstack', 'front end', 'frontend',
  'back end', 'backend', 'web', 'mobile', 'ios', 'android', 'cloud', 'devops', 'mlops', 'sre', 'reliability', 'security',
  'securite', 'cyber', 'cybersecurity', 'cybersecurite', 'quality assurance', 'test', 'testing', 'tester', 'automation',
  'automatisation', 'informatique', 'technology', 'technologie', 'technologies', 'tech', 'technical', 'technique', 'research',
  'recherche', 'scientist', 'quant', 'quantitative', 'embedded', 'firmware', 'hardware', 'robotics', 'robotique',
  'game', 'gameplay', 'jeu', 'jeux', 'unreal', 'unity', 'graphics', 'rendering', 'analytics',
  'infrastructure', 'platform', 'plateforme', 'systems', 'systemes', 'network', 'networking', 'reseau', 'reseaux', 'database',
  'business intelligence', 'computer', 'computing', 'scripting', 'script', 'python', 'java', 'javascript', 'typescript', 'c++',
  'digital', 'numerique', 'product', 'produit', 'ux', 'ui', 'design technique', 'technical design', 'simulation', 'blockchain',
  'compiler', 'linux', 'api', 'integration', 'salesforce', 'sap', 'erp', 'rpa', 'solutions', 'it', 'ti', 'qa', 'ai', 'ia', 'ml',
  'bi', 'ar', 'vr', 'xr',
]);

const REMOTE = words(['remote', 'teletravail', 'a distance', 'anywhere', 'virtual', 'work from home', 'wfh']);
const CANADA = words(['canada', 'canadian', 'qc', 'quebec', 'ontario', 'toronto', 'vancouver', 'ottawa', 'calgary']);

const SEASON_WORDS: Record<Season, string[]> = {
  Summer: ['summer', 'ete', "l'ete", 'estival'],
  Fall: ['fall', 'autumn', 'automne'],
  Winter: ['winter', 'hiver'],
  Spring: ['spring', 'printemps'],
};

const SEASON_START: Record<Season, string[]> = {
  Summer: ['may', 'mai'],
  Fall: ['september', 'septembre', 'sept'],
  Winter: ['january', 'janvier', 'jan'],
  Spring: ['march', 'mars'],
};

const SEASONS = Object.keys(SEASON_WORDS) as Season[];

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, eight: 8, twelve: 12, sixteen: 16,
  un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, huit: 8, douze: 12, seize: 16,
};

const NUM = `(\\d{1,2}|${Object.keys(NUMBER_WORDS).join('|')})`;
const DURATION = new RegExp(`${NUM}(?:\\s*(?:-|–|to|a|or|ou|/)\\s*${NUM})?[\\s-]*(?:months?|mois|mo)(?![a-z])`, 'g');
const DURATION_CONTEXT = /intern|stage|co-?op|term|contrat|contract|placement|duration|duree|periode|period|position|poste|program/;
const LONG_TERM = words(['year-long', 'year long', 'one year', '1 year', '12 month', 'two consecutive terms', 'two work terms', 'double stage', 'double term']);

function termPattern(season: Season, year: number): RegExp {
  const yy = String(year).slice(2);
  const seasons = SEASON_WORDS[season].join('|');
  const starts = SEASON_START[season].join('|');
  return new RegExp(
    [
      `(?<![a-z])(?:${seasons})[\\s,'’-]*(?:term|session|semester|internship|stage|of|de|d'|l')?[\\s'’]*(?:${year}|${yy})(?!\\d)`,
      `${year}[\\s-]*(?:${seasons})(?![a-z])`,
      `(?<![a-z])(?:${starts})\\.?[\\s,]*(?:\\d{1,2}(?:st|nd|rd|th|er)?,?\\s*)?${year}`,
      `(?<![a-z])(?:${starts})[a-z]*\\.?\\s*(?:-|–|to|a|au|through|until|jusqu'?(?:a|au))\\s*[a-z]+\\.?\\s*${year}`,
    ].join('|'),
  );
}

function sourceTermMatches(term: string, season: Season, year: number) {
  return fold(term) === fold(`${season} ${year}`);
}

function otherTerms(prefs: Preferences) {
  const result: { label: string; pattern: RegExp }[] = [];
  for (const year of [prefs.year - 1, prefs.year, prefs.year + 1]) {
    for (const season of SEASONS) {
      if (season === prefs.season && year === prefs.year) continue;
      result.push({ label: `${season} ${year}`, pattern: termPattern(season, year) });
    }
  }
  return result;
}

function parseNumber(token: string | undefined) {
  if (!token) return undefined;
  return NUMBER_WORDS[token] ?? Number(token);
}

export function durationsIn(text: string, requireContext: boolean): number[] {
  const found: number[] = [];
  for (const match of text.matchAll(DURATION)) {
    if (requireContext) {
      const start = Math.max(0, match.index - 60);
      const context = text.slice(start, match.index + match[0].length + 60);
      if (!DURATION_CONTEXT.test(context)) continue;
      if (/experience|graduat|diplom/.test(context.slice(0, 80 + match[0].length))) continue;
    }
    for (const n of [parseNumber(match[1]), parseNumber(match[2])]) {
      if (n && n > 0 && n <= 24) found.push(n);
    }
  }
  return found;
}

export function matchesLocation(locations: string[], prefs: Preferences): 'local' | 'remote' | null {
  const wanted = words(prefs.locations);
  const folded = locations.map(fold);
  if (folded.some((l) => wanted.test(l))) return 'local';
  if (prefs.includeRemote && folded.some((l) => REMOTE.test(l) && CANADA.test(l))) return 'remote';
  return null;
}

function isTech(title: string, prefs: Preferences) {
  const folded = fold(title);
  return TECH.test(folded) || words(prefs.extraKeywords).test(folded);
}

function requiresGraduateDegree(description: string) {
  return description
    .split(/(?<=[.!?•\n])\s+/)
    .some(
      (sentence) =>
        /(currently|actively)?\s*(enrolled|pursuing|inscrit|candidate|student)[^.]{0,80}(ph\.?d|doctora|master|maitrise|graduate degree|graduate program|2e cycle|3e cycle)/.test(sentence) &&
        !/bachelor|undergrad|baccalaureat|bac\b|1er cycle|any level|all levels/.test(sentence),
    );
}

function reject(reason: string, termStatus: TermStatus = 'unconfirmed'): Verdict {
  return { relevant: false, reason, termStatus, tags: [] };
}

export function evaluate(job: RawJob, prefs: Preferences): Verdict {
  const title = fold(job.title);
  const description = fold(job.description ?? '');
  const company = fold(job.company);
  const tags: string[] = [];

  if (job.active === false) return reject('Posting closed');
  if (words(prefs.blockedCompanies).test(company)) return reject('Blocked company');

  const place = matchesLocation(job.locations, prefs);
  if (!place) return reject('Outside your locations');
  if (place === 'remote') tags.push('Remote');

  if (!INTERNSHIP.test(title) && !INTERNSHIP.test(fold(job.terms?.join(' ') ?? ''))) return reject('Not an internship');
  if (WRONG_LEVEL.test(title)) return reject('Not for undergrads');
  if (job.degrees?.length && !job.degrees.some((d) => /bachelor/i.test(d))) return reject('Graduate degree required');
  if (description && requiresGraduateDegree(description)) return reject('Graduate degree required');

  if (words(prefs.blockedKeywords).test(title)) return reject('Blocked keyword');
  if (!job.curated && !isTech(job.title, prefs)) return reject('Not a tech role');

  const target = termPattern(prefs.season, prefs.year);
  const targetLabel = `${prefs.season} ${prefs.year}`;
  const sourceTerms = (job.terms ?? []).filter((t) => /\d{4}/.test(t));
  let termStatus: TermStatus = 'unconfirmed';

  if (sourceTerms.some((t) => sourceTermMatches(t, prefs.season, prefs.year)) || target.test(title) || target.test(description)) {
    termStatus = 'confirmed';
  } else {
    if (sourceTerms.length) return reject(`Different term (${sourceTerms.join(', ')})`);
    const other = otherTerms(prefs).find(({ pattern }) => pattern.test(title));
    if (other) return reject(`Different term (${other.label})`);
    if (prefs.requireConfirmedTerm) return reject('Term not confirmed');
  }
  tags.push(termStatus === 'confirmed' ? targetLabel : 'Term TBD');

  const durations = [...durationsIn(title, false), ...durationsIn(description, true)];
  if (durations.length && !durations.some((d) => d <= prefs.maxDurationMonths)) {
    return reject(`${Math.min(...durations)}-month term`, termStatus);
  }
  if (!durations.length && (LONG_TERM.test(title) || LONG_TERM.test(description))) {
    return reject('Longer than one term', termStatus);
  }
  if (durations.some((d) => d <= prefs.maxDurationMonths)) tags.push(`${Math.max(...durations.filter((d) => d <= prefs.maxDurationMonths))} months`);

  if (/francais|french|bilingu/.test(description) || /stagiaire|developpeu|logiciel/.test(title)) tags.push('French');

  return { relevant: true, termStatus, tags };
}
