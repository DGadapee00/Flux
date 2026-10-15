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
  u2: {
    exam: 'u2',
    title: 'Force and acceleration',
    chapters: '13',
    file: 'u2-force-acceleration.html',
    load: () => import('./content/u2-force-acceleration.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Equations of motion', lab: 'fma', ch: ['13'], topics: ['newton'], home: true },
      { id: 's2', n: 2, title: 'Friction on an incline', lab: 'fma', ch: ['13'], topics: ['friction', 'incline'] },
      { id: 's3', n: 3, title: 'Connected bodies', lab: 'fma', ch: ['13'], topics: ['tension', 'pulley'] },
      { id: 's4', n: 4, title: 'Banked curve', lab: 'curve', ch: ['13'], topics: ['bank'], home: true },
      { id: 's5', n: 5, title: 'Vertical loop', lab: 'curve', ch: ['13'], topics: ['loop'] },
      { id: 's6', n: 6, title: 'Spring on a collar', lab: null, ch: ['13'], topics: ['spring'] },
      { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u3: {
    exam: 'u3',
    title: 'Work and energy',
    chapters: '14',
    file: 'u3-work-energy.html',
    load: () => import('./content/u3-work-energy.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Principle of work and energy', lab: 'collar', ch: ['14'], topics: ['energy'], home: true },
      { id: 's2', n: 2, title: 'Work of a spring', lab: 'collar', ch: ['14'], topics: ['spring'] },
      { id: 's3', n: 3, title: 'Friction on a slide', lab: 'collar', ch: ['14'], topics: ['friction'] },
      { id: 's4', n: 4, title: 'Power and efficiency', lab: null, ch: ['14'], topics: ['power'] },
      { id: 's5', n: 5, title: 'Path independence', lab: 'paths', ch: ['14'], topics: ['path'], home: true },
      { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u4: {
    exam: 'u4',
    title: 'Impulse and momentum',
    chapters: '15',
    file: 'u4-impulse-momentum.html',
    load: () => import('./content/u4-impulse-momentum.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Principle of linear impulse and momentum', lab: 'impulse', ch: ['15'], topics: ['impulse'], home: true },
      { id: 's2', n: 2, title: 'Conservation of momentum', lab: null, ch: ['15'], topics: ['conservation'] },
      { id: 's3', n: 3, title: 'Impact', lab: 'impact', ch: ['15'], topics: ['impact'], home: true },
      { id: 's4', n: 4, title: 'Oblique impact', lab: 'impact', ch: ['15'], topics: ['oblique', 'impact'] },
      { id: 's5', n: 5, title: 'Angular momentum', lab: null, ch: ['15'], topics: ['angular'] },
      { id: 's6', n: 6, title: 'A rocket', lab: 'rocket', ch: ['15'], topics: ['rocket'], home: true },
      { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u5: {
    exam: 'u5',
    title: 'Rigid-body kinematics',
    chapters: '16',
    file: 'u5-rigid-kinematics.html',
    load: () => import('./content/u5-rigid-kinematics.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Fixed-axis rotation', lab: null, ch: ['16'], topics: ['belt', 'gears'] },
      { id: 's2', n: 2, title: 'Absolute motion analysis', lab: 'slider-crank', ch: ['16'], topics: ['absolute'], home: true },
      { id: 's3', n: 3, title: 'Relative velocity', lab: null, ch: ['16'], topics: ['relative'] },
      { id: 's4', n: 4, title: 'Instantaneous centre', lab: 'ic', ch: ['16'], topics: ['ic'], home: true },
      { id: 's5', n: 5, title: 'Relative acceleration', lab: 'slider-crank', ch: ['16'], topics: ['acceleration'] },
      { id: 's6', n: 6, title: 'Rolling without slip', lab: 'rolling', ch: ['16'], topics: ['rolling'], home: true },
      { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u6: {
    exam: 'u6',
    title: 'Rigid-body kinetics',
    chapters: '17',
    file: 'u6-rigid-kinetics.html',
    load: () => import('./content/u6-rigid-kinetics.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Mass moment of inertia', lab: 'inertia', ch: ['17'], topics: ['inertia'], home: true },
      { id: 's2', n: 2, title: 'Composite bodies', lab: 'inertia', ch: ['17'], topics: ['composite'] },
      { id: 's3', n: 3, title: 'Translation', lab: null, ch: ['17'], topics: ['crate'] },
      { id: 's4', n: 4, title: 'Rotation about a fixed axis', lab: 'pendulum', ch: ['17'], topics: ['pin'], home: true },
      { id: 's5', n: 5, title: 'General plane motion', lab: 'roll-slip', ch: ['17'], topics: ['roll', 'slip'], home: true },
      { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u7: {
    exam: 'u7',
    title: 'Rigid-body energy',
    chapters: '18',
    file: 'u7-rigid-energy.html',
    load: () => import('./content/u7-rigid-energy.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Kinetic energy', lab: 'race', ch: ['18'], topics: ['energy'] },
      { id: 's2', n: 2, title: 'Work of a couple', lab: 'linkage', ch: ['18'], topics: ['couple', 'bar'] },
      { id: 's3', n: 3, title: 'Rolling without slip', lab: 'race', ch: ['18'], topics: ['race'], home: true },
      { id: 's4', n: 4, title: 'The instantaneous centre', lab: 'linkage', ch: ['18'], topics: ['linkage', 'spring'], home: true },
      { id: 's5', n: 5, title: 'Formula sheet', lab: null, ch: [] },
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
