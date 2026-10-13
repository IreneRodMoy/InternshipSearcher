import { describe, expect, it } from 'vitest';
import { buildProfile, scoreJob } from '../src/matching/score.js';

const cv = buildProfile(`
  Software Engineering student, Polytechnique Montréal (Bachelor's, expected 2029)
  Skills: Python, TypeScript, React, Node.js, SQL, Git, Docker, C++
  Languages: French, English
  Experience: Web developer intern at Startup — built REST APIs with Express
`);

describe('scoreJob', () => {
  it('detects skills and languages on the CV', () => {
    expect([...cv.skills]).toEqual(expect.arrayContaining(['Python', 'TypeScript', 'React', 'Node.js', 'SQL', 'C++', 'French']));
    expect(cv.speaksFrench).toBe(true);
  });

  it('rates an aligned web role above an unrelated embedded role', () => {
    const web = scoreJob(
      { title: 'Full Stack Developer Intern', description: 'Work with React, TypeScript and Node.js. Bilingual French/English is an asset. Open to bachelor students.' },
      cv,
    );
    const embedded = scoreJob(
      { title: 'Firmware Intern', description: 'Experience with FPGA, Verilog, RTOS and MATLAB required.' },
      cv,
    );
    expect(web.score).toBeGreaterThan(embedded.score);
    expect(web.matchedSkills).toEqual(expect.arrayContaining(['React', 'TypeScript', 'Node.js']));
    expect(embedded.missingSkills).toEqual(expect.arrayContaining(['FPGA', 'MATLAB']));
    expect(web.highlights).toContain('French is a plus and you have it');
  });

  it('falls back to the title when there is no description', () => {
    expect(scoreJob({ title: 'Software Developer Intern', description: null }, cv).basis).toBe('title');
  });
});
