/**
 * PHY 2048 course map, from OpenStax University Physics Volume 1.
 * Dates stay empty: this is a review course. Five labs are logic only. The
 * scene is drawn after the physics shell moves. `BANK_CHAPTERS` lists the
 * chapters that have problems.
 */

export const UNITS = [
  {
    id: 'u1',
    n: 1,
    title: 'Vectors and kinematics',
    chapters: ['2', '3', '4'],
    date: null,
    labs: ['projectile'],
  },
  {
    id: 'u2',
    n: 2,
    title: "Newton's laws and friction",
    chapters: ['5', '6'],
    date: null,
    labs: ['incline'],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Work and energy',
    chapters: ['7', '8'],
    date: null,
    labs: ['track'],
  },
  {
    id: 'u4',
    n: 4,
    title: 'Momentum and collisions',
    chapters: ['9'],
    date: null,
    labs: ['collide'],
  },
  {
    id: 'u5',
    n: 5,
    title: 'Rotation, torque and angular momentum',
    chapters: ['10', '11'],
    date: null,
    labs: ['rotor'],
  },
  {
    id: 'u6',
    n: 6,
    title: 'Equilibrium',
    chapters: ['12'],
    date: null,
    labs: [],
  },
  {
    id: 'u7',
    n: 7,
    title: 'Gravitation',
    chapters: ['13'],
    date: null,
    labs: [],
  },
  {
    id: 'u8',
    n: 8,
    title: 'Oscillations',
    chapters: ['15'],
    date: null,
    labs: [],
  },
];

export const CHAPTERS = {
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
  15: 'Oscillations',
};

/** Chapters whose problems are in the bank. */
export const BANK_CHAPTERS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '15'];

export function unitForChapter(ch) {
  const id = String(ch);
  return UNITS.find((unit) => unit.chapters.includes(id)) || null;
}

export function unitById(id) {
  return UNITS.find((unit) => unit.id === id) || null;
}
