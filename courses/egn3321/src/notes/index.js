/**
 * Unit 1 notes. The HTML is rewritten from Hibbeler's section list.
 * Math is \( \) and \[ \]. A dollar sign is not a delimiter in this file.
 */
export const NOTES = {
  u1: {
    exam: 'u1',
    title: 'Particle kinematics',
    chapters: '1, 12',
    file: 'u1-particle-kinematics.html',
    load: () => import('./content/u1-particle-kinematics.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Units and significant figures', lab: null, ch: ['1'], topics: ['units', 'sig-figs', 'homogeneity'] },
      { id: 's2', n: 2, title: 'Rectilinear motion', lab: 'rectilinear', ch: ['12'], topics: ['rectilinear', 'distance', 'separation'], home: true },
      { id: 's3', n: 3, title: 'Erratic graphs', lab: 'rectilinear', ch: ['12'], topics: ['erratic'] },
      { id: 's4', n: 4, title: 'Projectile motion', lab: null, ch: ['12'], topics: ['projectile'] },
      { id: 's5', n: 5, title: 'Normal and tangential components', lab: 'path-nt', ch: ['12'], topics: ['normal-tangential'], home: true },
      { id: 's6', n: 6, title: 'Relative motion, translating axes', lab: 'relative', ch: ['12'], topics: ['relative'], home: true },
      { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
};

export const notesForExam = (examId) => NOTES[examId] || null;

export const allNotes = () => Object.values(NOTES);

/** The section a practice problem draws on, by shared topics, then by lab. */
export function sectionForProblem(tpl) {
  const topics = new Set(tpl.topics || []);
  for (const set of allNotes()) {
    const named = set.sections.find((s) => s.problems?.includes(tpl.id));
    if (named) return { set, section: named };
    const inCh = set.sections.filter((s) => s.ch.includes(tpl.ch));
    if (!inCh.length) continue;
    const score = (s) => 10 * (s.topics || []).filter((t) => topics.has(t)).length + (s.lab && s.lab === tpl.lab ? 1 : 0);
    const best = inCh.reduce((a, s) => (score(s) > score(a) ? s : a), inCh[0]);
    return { set, section: best };
  }
  return null;
}
