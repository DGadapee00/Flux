/**
 * Course map for EMA 3010 Materials Science, one entry per unit. `labs` are built; `coming` is the
 * rest of that unit, still to be written. Units follow the map's EMA 3010 path (map/paths/ema3010.js),
 * which follows MIT 3.091's recitations for the first half.
 */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Bonding and structure',
    chapters: '1',
    date: 'Unit 1',
    labs: ['bond', 'crystal', 'xrd'],
    coming: [],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Defects',
    chapters: '2',
    date: 'Unit 2',
    labs: ['vacancy', 'diffusion', 'slip', 'grain'],
    coming: [],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Phase diagrams',
    chapters: '3',
    date: 'Unit 3',
    labs: ['lever', 'jominy'],
    coming: ['Eutectics'],
  },
  {
    id: 'u4',
    n: 4,
    title: 'Failure',
    chapters: '4',
    date: 'Unit 4',
    labs: ['griffith', 'paris', 'creep'],
    coming: [],
  },
  {
    id: 'u5',
    n: 5,
    title: 'Polymers, glasses and corrosion',
    chapters: '5',
    date: 'Unit 5',
    labs: ['chains', 'pane', 'couple'],
    coming: [],
  },
];

export const LAB_META = {
  bond: { id: 'bond', exam: 'u1', title: 'Bond' },
  crystal: { id: 'crystal', exam: 'u1', title: 'Crystal' },
  vacancy: { id: 'vacancy', exam: 'u2', title: 'Vacancy' },
  diffusion: { id: 'diffusion', exam: 'u2', title: 'Diffusion' },
  slip: { id: 'slip', exam: 'u2', title: 'Slip' },
  lever: { id: 'lever', exam: 'u3', title: 'Lever' },
  xrd: { id: 'xrd', exam: 'u1', title: 'X-ray' },
  grain: { id: 'grain', exam: 'u2', title: 'Grain size' },
  jominy: { id: 'jominy', exam: 'u3', title: 'End quench' },
  griffith: { id: 'griffith', exam: 'u4', title: 'Crack' },
  paris: { id: 'paris', exam: 'u4', title: 'Fatigue' },
  creep: { id: 'creep', exam: 'u4', title: 'Creep' },
  chains: { id: 'chains', exam: 'u5', title: 'Chains' },
  pane: { id: 'pane', exam: 'u5', title: 'Glass' },
  couple: { id: 'couple', exam: 'u5', title: 'Galvanic' },
};

export const CHAPTER_TITLES = {
  1: 'Bonding and structure',
  2: 'Defects',
  3: 'Phase diagrams',
  4: 'Failure',
  5: 'Polymers, glasses and corrosion',
};

export function examById(id) {
  return EXAMS.find((e) => e.id === id) || EXAMS[0];
}

export function examForLab(labId) {
  const meta = LAB_META[labId];
  return meta ? examById(meta.exam) : EXAMS[0];
}

export function examIndex(id) {
  const i = EXAMS.findIndex((e) => e.id === id);
  return i < 0 ? 0 : i;
}

export function examLabel(exam) {
  return exam ? `Unit ${exam.n}` : 'Unit';
}
