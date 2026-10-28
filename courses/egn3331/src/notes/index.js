/**
 * Notes, one file per unit. Flux writes the text; citations come from src/data/textbook.js.
 * Math is \( \) and \[ \]. A dollar sign is not a delimiter in these files.
 */
export const NOTES = {
  u1: {
    exam: 'u1',
    title: 'Stress',
    chapters: '1',
    file: 'u1-stress.html',
    load: () => import('./content/u1-stress.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Internal loads', lab: null, ch: ['1'], topics: ['internal-loads'] },
      { id: 's2', n: 2, title: 'Average normal stress', lab: 'cut', ch: ['1'], topics: ['normal-stress', 'english'] },
      { id: 's3', n: 3, title: 'Stress on an inclined plane', lab: 'cut', ch: ['1'], topics: ['inclined-plane'], home: true },
      { id: 's4', n: 4, title: 'Stress in truss members', lab: 'truss-stress', ch: ['1'], topics: ['trusses'] },
      { id: 's5', n: 5, title: 'Shear and bearing in connections', lab: 'pins', ch: ['1'], topics: ['shear-stress', 'bearing'] },
      { id: 's6', n: 6, title: 'Allowable stress and the factor of safety', lab: 'truss-stress', ch: ['1'], topics: ['factor-of-safety'] },
      { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u2: {
    exam: 'u2',
    title: 'Strain and material behaviour',
    chapters: '2, 3',
    file: 'u2-strain.html',
    load: () => import('./content/u2-strain.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Strain', lab: 'tension-test', ch: ['2'], topics: ['strain'], home: true },
      { id: 's2', n: 2, title: "Hooke's law", lab: 'brace', ch: ['2'], topics: ['hooke', 'english'] },
      { id: 's3', n: 3, title: "Poisson's ratio", lab: 'poisson', ch: ['3'], topics: ['poisson'] },
      { id: 's4', n: 4, title: 'The tension curve', lab: 'tension-test', ch: ['3'], topics: ['stress-strain-curve', 'yield'] },
      { id: 's5', n: 5, title: 'Creep and fatigue', lab: null, ch: ['3'], topics: ['creep', 'fatigue'] },
      { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u3: {
    exam: 'u3',
    title: 'Axial load',
    chapters: '4',
    file: 'u3-axial.html',
    load: () => import('./content/u3-axial.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Elongation of a uniform bar', lab: 'axial', ch: ['4'], topics: ['axial-deformation'], home: true },
      { id: 's2', n: 2, title: 'Steps and tapers', lab: 'axial', ch: ['4'], topics: ['stepped', 'taper'] },
      { id: 's3', n: 3, title: 'A bar between two walls', lab: 'indeterminate', ch: ['4'], topics: ['indeterminate-axial'] },
      { id: 's4', n: 4, title: 'Thermal stress', lab: 'rail', ch: ['4'], topics: ['thermal-stress', 'english'] },
      { id: 's5', n: 5, title: 'A joint that must close', lab: 'rail', ch: ['4'], topics: ['gap'] },
      { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u4: {
    exam: 'u4',
    title: 'Multiaxial stress and pressure vessels',
    chapters: '8, 10',
    file: 'u4-vessels.html',
    load: () => import('./content/u4-vessels.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'A closed thin cylinder', lab: 'vessel', ch: ['8'], topics: ['pressure-vessels'], home: true },
      { id: 's2', n: 2, title: 'A thin sphere', lab: 'vessel', ch: ['8'], topics: ['sphere'] },
      { id: 's3', n: 3, title: 'A propane cylinder', lab: 'tank', ch: ['8'], topics: ['pressure-vessels', 'english'] },
      { id: 's4', n: 4, title: "Hooke's law in three directions", lab: 'strain3', ch: ['10'], topics: ['poisson'] },
      { id: 's5', n: 5, title: 'The stress a gauge does not name', lab: 'strain3', ch: ['10'], topics: ['hidden'] },
      { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u5: {
    exam: 'u5',
    title: 'Stress transformation and failure',
    chapters: '8, 9',
    file: 'u5-transform.html',
    load: () => import('./content/u5-transform.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Turning the element', lab: 'mohr', ch: ['9'], topics: ['stress-transformation'], home: true },
      { id: 's2', n: 2, title: 'Principal stresses', lab: 'mohr', ch: ['9'], topics: ['mohr'] },
      { id: 's3', n: 3, title: 'The largest in-plane shear', lab: 'mohr', ch: ['9'], topics: ['max-shear'] },
      { id: 's4', n: 4, title: 'Bending and torque together', lab: 'combined', ch: ['9'], topics: ['combined-loading'] },
      { id: 's5', n: 5, title: 'A trailer-ball shank', lab: 'hitch', ch: ['9'], topics: ['combined-loading', 'english'] },
      { id: 's6', n: 6, title: 'Tresca and von Mises', lab: 'combined', ch: ['9'], topics: ['yield'] },
      { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u6: {
    exam: 'u6',
    title: 'Bending',
    chapters: '6',
    file: 'u6-bending.html',
    load: () => import('./content/u6-bending.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'A point load', lab: 'diagrams', ch: ['6'], topics: ['shear-moment'], home: true },
      { id: 's2', n: 2, title: 'A uniform load', lab: 'diagrams', ch: ['6'], topics: ['shear-moment', 'uniform'] },
      { id: 's3', n: 3, title: 'A cantilever', lab: 'diagrams', ch: ['6'], topics: ['shear-moment', 'cantilever'] },
      { id: 's4', n: 4, title: 'A rectangular section', lab: 'flexure', ch: ['6'], topics: ['flexure'] },
      { id: 's5', n: 5, title: 'A tee', lab: 'flexure', ch: ['6'], topics: ['flexure', 'tee'] },
      { id: 's6', n: 6, title: 'A floor joist', lab: 'joist', ch: ['6'], topics: ['flexure', 'english'] },
      { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u7: {
    exam: 'u7',
    title: 'Transverse shear',
    chapters: '7',
    file: 'u7-shear.html',
    load: () => import('./content/u7-shear.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'A rectangle', lab: 'shear', ch: ['7'], topics: ['transverse-shear'], home: true },
      { id: 's2', n: 2, title: 'Up the parabola', lab: 'shear', ch: ['7'], topics: ['transverse-shear', 'profile'] },
      { id: 's3', n: 3, title: 'An I section', lab: 'shear', ch: ['7'], topics: ['transverse-shear', 'web'] },
      { id: 's4', n: 4, title: 'Nail spacing', lab: 'nails', ch: ['7'], topics: ['shear-flow'] },
      { id: 's5', n: 5, title: 'A garage header', lab: 'header', ch: ['7'], topics: ['shear-flow', 'english'] },
      { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
};

export const notesForExam = (examId) => NOTES[examId] || null;

export const allNotes = () => Object.values(NOTES);

/** The section a practice problem draws on, by shared topics, then by lab. */
export function sectionForProblem(tpl) {
  const topics = new Set(tpl.topics || []);
  const own = NOTES[tpl.exam];
  const sets = own ? [own, ...allNotes().filter((s) => s !== own)] : allNotes();
  for (const set of sets) {
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
