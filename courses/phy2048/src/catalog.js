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
    labs: ['work-energy', 'work-path', 'track', 'energy-diagram', 'automotive-power'],
    coming: [],
  },
  {
    id: 'u5',
    n: 5,
    title: 'Momentum and collisions',
    chapters: ['9'],
    date: null,
    labs: ['impulse', 'collide', 'collide-2d', 'center-of-mass', 'rocket', 'crumple-zone', 'crash-reconstruction'],
    coming: [],
  },
  {
    id: 'u6',
    n: 6,
    title: 'Fixed-axis rotation',
    chapters: ['10'],
    date: null,
    labs: ['rotor', 'inertia', 'massive-pulley', 'helicopter-rotor'],
    coming: [],
  },
  {
    id: 'u7',
    n: 7,
    title: 'Rolling and angular momentum',
    chapters: ['11'],
    date: null,
    labs: ['rolling', 'particle-l', 'spinner', 'gyro', 'rover-wheel'],
    coming: [],
  },
  {
    id: 'u8',
    n: 8,
    title: 'Static equilibrium and elasticity',
    chapters: ['12'],
    date: null,
    labs: ['beam', 'ladder', 'stress-strain', 'car-balance'],
    coming: [],
  },
  {
    id: 'u9',
    n: 9,
    title: 'Gravitation',
    chapters: ['13'],
    date: null,
    labs: ['orbit', 'kepler', 'iss-orbit'],
    coming: [],
  },
  {
    id: 'u10',
    n: 10,
    title: 'Fluid mechanics',
    chapters: ['14'],
    date: null,
    labs: ['pressure-depth', 'buoyancy', 'bernoulli', 'brake-hydraulics', 'fire-hose'],
    coming: [],
  },
  {
    id: 'u11',
    n: 11,
    title: 'Oscillations',
    chapters: ['15'],
    date: null,
    labs: ['spring-mass', 'pendulum', 'resonance', 'skyscraper-damper'],
    coming: [],
  },
  {
    id: 'u12',
    n: 12,
    title: 'Waves',
    chapters: ['16'],
    date: null,
    labs: ['traveling-wave', 'standing-wave', 'guitar-string'],
    coming: [],
  },
  {
    id: 'u13',
    n: 13,
    title: 'Sound',
    chapters: ['17'],
    date: null,
    labs: ['intensity', 'pipe-modes', 'doppler', 'train-horn'],
    coming: [],
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
export const BANK_CHAPTERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17'];

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
  'work-energy': { id: 'work-energy', exam: 'u4', title: 'Work and energy' },
  'work-path': { id: 'work-path', exam: 'u4', title: 'Work along a path' },
  track: { id: 'track', exam: 'u4', title: 'Energy track' },
  'energy-diagram': { id: 'energy-diagram', exam: 'u4', title: 'Energy diagram' },
  'automotive-power': { id: 'automotive-power', exam: 'u4', title: 'Automotive power', app: true },
  impulse: { id: 'impulse', exam: 'u5', title: 'Impulse' },
  collide: { id: 'collide', exam: 'u5', title: 'Collisions' },
  'collide-2d': { id: 'collide-2d', exam: 'u5', title: 'Collisions in two dimensions' },
  'center-of-mass': { id: 'center-of-mass', exam: 'u5', title: 'Center of mass' },
  rocket: { id: 'rocket', exam: 'u5', title: 'Rocket' },
  'crumple-zone': { id: 'crumple-zone', exam: 'u5', title: 'Crumple zone', app: true },
  'crash-reconstruction': { id: 'crash-reconstruction', exam: 'u5', title: 'Crash reconstruction', app: true },
  rotor: { id: 'rotor', exam: 'u6', title: 'Rotor' },
  inertia: { id: 'inertia', exam: 'u6', title: 'Moment of inertia' },
  'massive-pulley': { id: 'massive-pulley', exam: 'u6', title: 'Massive pulley' },
  'helicopter-rotor': { id: 'helicopter-rotor', exam: 'u6', title: 'Helicopter rotor', app: true },
  rolling: { id: 'rolling', exam: 'u7', title: 'Rolling' },
  'particle-l': { id: 'particle-l', exam: 'u7', title: 'Angular momentum of a particle' },
  spinner: { id: 'spinner', exam: 'u7', title: 'Spinning stool' },
  gyro: { id: 'gyro', exam: 'u7', title: 'Gyroscope' },
  'rover-wheel': { id: 'rover-wheel', exam: 'u7', title: 'Rover wheel', app: true },
  beam: { id: 'beam', exam: 'u8', title: 'Beam' },
  ladder: { id: 'ladder', exam: 'u8', title: 'Ladder' },
  'stress-strain': { id: 'stress-strain', exam: 'u8', title: 'Stress and strain' },
  'car-balance': { id: 'car-balance', exam: 'u8', title: 'Car weight balance', app: true },
  orbit: { id: 'orbit', exam: 'u9', title: 'Orbit' },
  kepler: { id: 'kepler', exam: 'u9', title: "Kepler's laws" },
  'iss-orbit': { id: 'iss-orbit', exam: 'u9', title: 'ISS orbit', app: true },
  'pressure-depth': { id: 'pressure-depth', exam: 'u10', title: 'Pressure and depth' },
  buoyancy: { id: 'buoyancy', exam: 'u10', title: 'Buoyancy' },
  bernoulli: { id: 'bernoulli', exam: 'u10', title: 'Bernoulli' },
  'brake-hydraulics': { id: 'brake-hydraulics', exam: 'u10', title: 'Brake hydraulics', app: true },
  'fire-hose': { id: 'fire-hose', exam: 'u10', title: 'Fire hose', app: true },
  'spring-mass': { id: 'spring-mass', exam: 'u11', title: 'Spring and mass' },
  pendulum: { id: 'pendulum', exam: 'u11', title: 'Pendulum' },
  resonance: { id: 'resonance', exam: 'u11', title: 'Resonance' },
  'skyscraper-damper': { id: 'skyscraper-damper', exam: 'u11', title: 'Skyscraper damper', app: true },
  'traveling-wave': { id: 'traveling-wave', exam: 'u12', title: 'Traveling wave' },
  'standing-wave': { id: 'standing-wave', exam: 'u12', title: 'Standing wave' },
  'guitar-string': { id: 'guitar-string', exam: 'u12', title: 'Guitar string', app: true },
  intensity: { id: 'intensity', exam: 'u13', title: 'Intensity' },
  'pipe-modes': { id: 'pipe-modes', exam: 'u13', title: 'Pipe modes' },
  doppler: { id: 'doppler', exam: 'u13', title: 'Doppler effect' },
  'train-horn': { id: 'train-horn', exam: 'u13', title: 'Train horn', app: true },
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
