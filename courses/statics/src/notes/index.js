export const NOTES = {
  u1: {
    exam: 'u1',
    title: 'Force vectors',
    file: 'u1.html',
    load: () => import('./content/u1.html?raw').then((m) => m.default),
    sections: [
      {
        id: 's1',
        n: 1,
        title: 'Components and the resultant',
        lab: 'vectors',
        ch: ['2'],
        topics: ['resultant'],
      },
      {
        id: 's2',
        n: 2,
        title: 'Direction in three dimensions',
        lab: 'vectors',
        ch: ['2'],
        topics: ['direction-angles', 'unit-vector'],
      },
      {
        id: 's3',
        n: 3,
        title: 'Projection and a lifting bridle',
        lab: 'bridle',
        ch: ['2'],
        topics: ['dot-product', 'unit-vector'],
      },
      { id: 's4', n: 4, title: 'Formula sheet', lab: null, ch: [], topics: [] },
    ],
  },
  u2: {
    exam: 'u2',
    title: 'Equilibrium and moments',
    file: 'u2.html',
    load: () => import('./content/u2.html?raw').then((m) => m.default),
    sections: [
      {
        id: 's1',
        n: 1,
        title: 'Particle equilibrium and the free-body diagram',
        lab: 'particle',
        ch: ['3'],
        topics: ['equilibrium'],
      },
      { id: 's2', n: 2, title: 'Three-dimensional equilibrium', lab: 'particle', ch: ['3'], topics: ['3d'] },
      {
        id: 's3',
        n: 3,
        title: 'Moments, couples and equivalent systems',
        lab: 'moments',
        ch: ['4'],
        topics: ['moments', 'couples', 'axis'],
      },
      { id: 's4', n: 4, title: 'The wall shelf', lab: 'shelf', ch: ['4'], topics: ['moments'] },
      { id: 's5', n: 5, title: 'Formula sheet', lab: null, ch: [], topics: [] },
    ],
  },
  u3: {
    exam: 'u3',
    title: 'Rigid bodies, trusses and machines',
    file: 'u3.html',
    load: () => import('./content/u3.html?raw').then((m) => m.default),
    sections: [
      {
        id: 's1',
        n: 1,
        title: 'Supports and rigid-body equilibrium',
        lab: 'reactions',
        ch: ['5'],
        topics: ['equilibrium', 'reactions', 'fixed-support', 'distributed-load'],
      },
      {
        id: 's2',
        n: 2,
        title: 'Trusses: joints, sections and stability',
        lab: 'truss',
        ch: ['6'],
        topics: ['trusses', 'method-of-joints', 'method-of-sections', 'zero-force'],
      },
      {
        id: 's3',
        n: 3,
        title: 'Frames and machines',
        lab: 'frame',
        ch: ['6'],
        topics: ['frames', 'two-force', 'machines'],
      },
      {
        id: 's4',
        n: 4,
        title: 'A sign gantry and a scissor jack',
        lab: 'gantry',
        ch: ['6'],
        topics: ['trusses', 'machines'],
      },
      { id: 's5', n: 5, title: 'Formula sheet', lab: null, ch: [], topics: [] },
    ],
  },
  u4: {
    exam: 'u4',
    title: 'Friction, internal loads and section geometry',
    file: 'u4.html',
    load: () => import('./content/u4.html?raw').then((m) => m.default),
    sections: [
      {
        id: 's1',
        n: 1,
        title: 'Static friction, impending motion and tipping',
        lab: 'friction',
        ch: ['8'],
        topics: ['friction', 'tipping', 'impending-motion'],
      },
      {
        id: 's2',
        n: 2,
        title: 'Belt friction and the bookcase',
        lab: 'bookcase',
        ch: ['8'],
        topics: ['friction', 'belt'],
      },
      {
        id: 's3',
        n: 3,
        title: 'Cuts, shear and bending moment',
        lab: 'beam',
        ch: ['7'],
        topics: ['internal-loads', 'shear-moment'],
      },
      {
        id: 's4',
        n: 4,
        title: 'Centroids, holes and Pappus',
        lab: 'sections',
        ch: ['9'],
        topics: ['centroids', 'holes', 'pappus'],
      },
      {
        id: 's5',
        n: 5,
        title: 'Area moments of inertia',
        lab: 'sections',
        ch: ['10'],
        topics: ['moment-of-inertia'],
      },
      { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [], topics: [] },
    ],
  },
};
export const notesForExam = (id) => NOTES[id] || null;
export const allNotes = () => Object.values(NOTES);
export function sectionForProblem(tpl) {
  const set = NOTES[tpl.exam];
  if (!set) return null;
  const sections = set.sections.filter((s) => s.ch.includes(tpl.ch));
  const score = (s) =>
    10 * s.topics.filter((t) => tpl.topics.includes(t)).length + (s.lab === tpl.lab ? 1 : 0);
  const section = sections.sort((a, b) => score(b) - score(a))[0];
  return section ? { set, section } : null;
}
