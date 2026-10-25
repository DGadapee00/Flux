/**
 * PHY 2048 course map, from OpenStax University Physics Volume 1 alone (DECISIONS.md, D33).
 * Thirteen units in the book's order (docs/course-plans/phy2048.md). `labs` are built, as logic
 * only for now; `coming` is the rest of the unit's labs, still to be written. Dates stay empty:
 * the course is for personal study. `BANK_CHAPTERS` lists the chapters that have problems.
 */

export const UNITS = [
  {
    id: 'u1',
    n: 1,
    title: 'Units, vectors and motion along a line',
    chapters: ['1', '2', '3'],
    date: null,
    labs: ['vectors', 'kinematics-graphs', 'stopping-distance'],
    coming: [],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Motion in two and three dimensions',
    chapters: ['4'],
    date: null,
    labs: ['projectile', 'circular-motion', 'relative-motion', 'wind-triangle'],
    coming: [],
  },
  {
    id: 'u3',
    n: 3,
    title: "Newton's laws and their applications",
    chapters: ['5', '6'],
    date: null,
    labs: ['incline', 'atwood', 'banked-curve', 'drag', 'elevator-scale', 'skydiver'],
    coming: [],
  },
  {
    id: 'u4',
    n: 4,
    title: 'Work, energy and power',
    chapters: ['7', '8'],
    date: null,
    labs: ['track'],
    coming: ['Work and energy', 'Work along a path', 'Energy diagram', 'Automotive power'],
  },
  {
    id: 'u5',
    n: 5,
    title: 'Momentum and collisions',
    chapters: ['9'],
    date: null,
    labs: ['collide'],
    coming: ['Impulse', 'Collisions in two dimensions', 'Center of mass', 'Rocket', 'Crumple zone', 'Crash reconstruction'],
  },
  {
    id: 'u6',
    n: 6,
    title: 'Fixed-axis rotation',
    chapters: ['10'],
    date: null,
    labs: ['rotor'],
    coming: ['Moment of inertia', 'Massive pulley', 'Helicopter rotor'],
  },
  {
    id: 'u7',
    n: 7,
    title: 'Rolling and angular momentum',
    chapters: ['11'],
    date: null,
    labs: [],
    coming: ['Rolling', 'Angular momentum of a particle', 'Spinning stool', 'Gyroscope', 'Rover wheel'],
  },
  {
    id: 'u8',
    n: 8,
    title: 'Static equilibrium and elasticity',
    chapters: ['12'],
    date: null,
    labs: [],
    coming: ['Beam', 'Ladder', 'Stress and strain', 'Car weight balance'],
  },
  {
    id: 'u9',
    n: 9,
    title: 'Gravitation',
    chapters: ['13'],
    date: null,
    labs: [],
    coming: ['Orbits', "Kepler's laws", 'ISS orbit'],
  },
  {
    id: 'u10',
    n: 10,
    title: 'Fluid mechanics',
    chapters: ['14'],
    date: null,
    labs: [],
    coming: ['Pressure and depth', 'Buoyancy', 'Bernoulli', 'Brake hydraulics', 'Fire hose'],
  },
  {
    id: 'u11',
    n: 11,
    title: 'Oscillations',
    chapters: ['15'],
    date: null,
    labs: [],
    coming: ['Spring and mass', 'Pendulum', 'Resonance', 'Skyscraper damper'],
  },
  {
    id: 'u12',
    n: 12,
    title: 'Waves',
    chapters: ['16'],
    date: null,
    labs: [],
    coming: ['Traveling wave', 'Standing wave', 'Guitar string'],
  },
  {
    id: 'u13',
    n: 13,
    title: 'Sound',
    chapters: ['17'],
    date: null,
    labs: [],
    coming: ['Intensity', 'Pipe modes', 'Doppler effect', 'Train horn'],
  },
];

export const CHAPTERS = {
  1: 'Units and measurement',
  2: 'Vectors',
  3: 'Motion along a straight line',
  4: 'Motion in two and three dimensions',
  5: "Newton's laws of motion",
  6: "Applications of Newton's laws",
  7: 'Work and kinetic energy',
  8: 'Potential energy and conservation of energy',
  9: 'Linear momentum and collisions',
  10: 'Fixed-axis rotation',
  11: 'Angular momentum',
  12: 'Static equilibrium and elasticity',
  13: 'Gravitation',
  14: 'Fluid mechanics',
  15: 'Oscillations',
  16: 'Waves',
  17: 'Sound',
};

/** Chapters whose problems are in the bank. */
export const BANK_CHAPTERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '15'];

export function unitForChapter(ch) {
  const id = String(ch);
  return UNITS.find((unit) => unit.chapters.includes(id)) || null;
}

export function unitById(id) {
  return UNITS.find((unit) => unit.id === id) || null;
}

/** The shell's names for these: a unit is what other courses call an exam. */
export const EXAMS = UNITS;

/** The labs built so far (logic only until each unit's scene is drawn). */
export const LAB_META = {
  vectors: { id: 'vectors', exam: 'u1', title: 'Vectors' },
  'stopping-distance': { id: 'stopping-distance', exam: 'u1', title: 'Stopping distance', app: true },
  'kinematics-graphs': { id: 'kinematics-graphs', exam: 'u1', title: 'Motion graphs' },
  projectile: { id: 'projectile', exam: 'u2', title: 'Projectile' },
  'circular-motion': { id: 'circular-motion', exam: 'u2', title: 'Circular motion' },
  'relative-motion': { id: 'relative-motion', exam: 'u2', title: 'Relative motion' },
  'wind-triangle': { id: 'wind-triangle', exam: 'u2', title: 'Wind triangle', app: true },
  incline: { id: 'incline', exam: 'u3', title: 'Incline' },
  atwood: { id: 'atwood', exam: 'u3', title: 'Atwood machine' },
  'banked-curve': { id: 'banked-curve', exam: 'u3', title: 'Banked curve' },
  drag: { id: 'drag', exam: 'u3', title: 'Drag' },
  'elevator-scale': { id: 'elevator-scale', exam: 'u3', title: 'Elevator scale', app: true },
  skydiver: { id: 'skydiver', exam: 'u3', title: 'Skydiver', app: true },
  track: { id: 'track', exam: 'u4', title: 'Track' },
  collide: { id: 'collide', exam: 'u5', title: 'Collisions' },
  rotor: { id: 'rotor', exam: 'u6', title: 'Rotor' },
};

export function examById(id) {
  return UNITS.find((unit) => unit.id === id) || UNITS[0];
}

export function examForLab(labId) {
  const meta = LAB_META[labId];
  return meta ? examById(meta.exam) : UNITS[0];
}

export function examIndex(id) {
  const i = UNITS.findIndex((unit) => unit.id === id);
  return i < 0 ? 0 : i;
}

export function examLabel(unit) {
  return unit ? `Unit ${unit.n}` : 'Unit';
}

/** "1–3" or "9" for a unit's chapters. */
export function chapterSpan(unit) {
  const c = unit.chapters;
  return c.length > 1 ? `${c[0]}–${c[c.length - 1]}` : c[0];
}

/** The picker's full line: "Unit 3 · Newton's laws and their applications · Ch 5–6". */
export function examLongLabel(unit) {
  return `${examLabel(unit)} · ${unit.title} · Ch ${chapterSpan(unit)}`;
}

/** A student opening the course with no link starts at the first unit. */
export function nextExam() {
  return UNITS[0];
}
