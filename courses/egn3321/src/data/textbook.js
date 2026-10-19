/**
 * Every textbook citation EGN 3321 shows, in one place (DECISIONS.md, D9, D21). Problems and notes
 * name a topic and ask this file for its citation, so changing books changes this file only.
 *
 * The text is R. C. Hibbeler, Engineering Mechanics: Dynamics. Nothing is copied from it: entries are
 * section numbers and titles, so a student can find the matching reading, and no example or problem
 * number is used (D9). The numbering is the one the 12th to 14th editions share. Units and
 * significant figures are cited from Hibbeler's Statics volume, which the Dynamics volume does not
 * repeat.
 *
 * The OCW programs (8.01SC, 2.003SC) are not textbooks. Notes link them as Another view, from
 * src/notes/another-view.js.
 *
 * `leftOut` marks the sections the course does not teach (CONVENTIONS.md, "Sections left out"). The
 * notes may name them to say so; no problem cites them.
 */

export const BOOKS = Object.freeze({
  dynamics: Object.freeze({
    short: 'Hibbeler',
    author: 'R. C. Hibbeler',
    title: 'Engineering Mechanics: Dynamics',
    publisher: 'Pearson',
    year: null,
    license: 'Copyrighted: cited by section, never copied (D9)',
    url: null,
  }),
  statics: Object.freeze({
    short: 'Hibbeler Statics',
    author: 'R. C. Hibbeler',
    title: 'Engineering Mechanics: Statics',
    publisher: 'Pearson',
    year: null,
    license: 'Copyrighted: cited by section, never copied (D9)',
    url: null,
  }),
});

/** topic → where to read about it. */
export const SECTIONS = Object.freeze({
  // Units (Statics volume)
  'units': { book: 'statics', section: '1.3', title: 'Units of Measurement' },
  'si': { book: 'statics', section: '1.4', title: 'The International System of Units' },
  'sig-figs': { book: 'statics', section: '1.5', title: 'Numerical Calculations' },

  // Chapter 12: Kinematics of a particle
  'rectilinear': { book: 'dynamics', section: '12.2', title: 'Rectilinear Kinematics: Continuous Motion' },
  'erratic': { book: 'dynamics', section: '12.3', title: 'Rectilinear Kinematics: Erratic Motion' },
  'curvilinear': { book: 'dynamics', section: '12.4', title: 'General Curvilinear Motion' },
  'components': { book: 'dynamics', section: '12.5', title: 'Curvilinear Motion: Rectangular Components' },
  'projectile': { book: 'dynamics', section: '12.6', title: 'Motion of a Projectile' },
  'normal-tangential': { book: 'dynamics', section: '12.7', title: 'Curvilinear Motion: Normal and Tangential Components' },
  'cylindrical-kinematics': { book: 'dynamics', section: '12.8', title: 'Curvilinear Motion: Cylindrical Components', leftOut: true },
  'dependent-motion': { book: 'dynamics', section: '12.9', title: 'Dependent Motion of Two Particles', leftOut: true },
  'relative-motion': { book: 'dynamics', section: '12.10', title: 'Relative Motion of Two Particles Using Translating Axes' },

  // Chapter 13: Force and acceleration
  'newton-laws': { book: 'dynamics', section: '13.1', title: 'Newton’s Laws of Motion' },
  'equation-of-motion': { book: 'dynamics', section: '13.2', title: 'The Equation of Motion' },
  'system-of-particles': { book: 'dynamics', section: '13.3', title: 'Equation of Motion for a System of Particles' },
  'rectangular-motion': { book: 'dynamics', section: '13.4', title: 'Equations of Motion: Rectangular Coordinates' },
  'normal-tangential-motion': { book: 'dynamics', section: '13.5', title: 'Equations of Motion: Normal and Tangential Coordinates' },
  'cylindrical-motion': { book: 'dynamics', section: '13.6', title: 'Equations of Motion: Cylindrical Coordinates', leftOut: true },
  'central-force': { book: 'dynamics', section: '13.7', title: 'Central-Force Motion and Space Mechanics', leftOut: true },

  // Chapter 14: Work and energy
  'work': { book: 'dynamics', section: '14.1', title: 'The Work of a Force' },
  'work-energy': { book: 'dynamics', section: '14.2', title: 'The Principle of Work and Energy' },
  'system-work-energy': { book: 'dynamics', section: '14.3', title: 'Principle of Work and Energy for a System of Particles' },
  'power': { book: 'dynamics', section: '14.4', title: 'Power and Efficiency' },
  'potential-energy': { book: 'dynamics', section: '14.5', title: 'Conservative Forces and Potential Energy' },
  'conservation-of-energy': { book: 'dynamics', section: '14.6', title: 'Conservation of Energy' },

  // Chapter 15: Impulse and momentum
  'impulse-momentum': { book: 'dynamics', section: '15.1', title: 'Principle of Linear Impulse and Momentum' },
  'system-impulse-momentum': { book: 'dynamics', section: '15.2', title: 'Principle of Linear Impulse and Momentum for a System of Particles' },
  'conservation-of-momentum': { book: 'dynamics', section: '15.3', title: 'Conservation of Linear Momentum for a System of Particles' },
  'impact': { book: 'dynamics', section: '15.4', title: 'Impact' },
  'angular-momentum': { book: 'dynamics', section: '15.5', title: 'Angular Momentum' },
  'moment-and-angular-momentum': { book: 'dynamics', section: '15.6', title: 'Relation Between the Moment of a Force and Angular Momentum' },
  'angular-impulse': { book: 'dynamics', section: '15.7', title: 'Angular Impulse and Momentum Principles' },
  'steady-flow': { book: 'dynamics', section: '15.8', title: 'Steady Flow of a Fluid Stream', leftOut: true },
  'variable-mass': { book: 'dynamics', section: '15.9', title: 'Propulsion with Variable Mass' },

  // Chapter 16: Planar kinematics of a rigid body
  'rigid-motion': { book: 'dynamics', section: '16.1', title: 'Planar Rigid-Body Motion' },
  'translation': { book: 'dynamics', section: '16.2', title: 'Translation' },
  'fixed-axis': { book: 'dynamics', section: '16.3', title: 'Rotation About a Fixed Axis' },
  'absolute-motion': { book: 'dynamics', section: '16.4', title: 'Absolute Motion Analysis' },
  'relative-velocity': { book: 'dynamics', section: '16.5', title: 'Relative-Motion Analysis: Velocity' },
  'instantaneous-center': { book: 'dynamics', section: '16.6', title: 'Instantaneous Center of Zero Velocity' },
  'relative-acceleration': { book: 'dynamics', section: '16.7', title: 'Relative-Motion Analysis: Acceleration' },
  'rotating-axes': { book: 'dynamics', section: '16.8', title: 'Relative-Motion Analysis Using Rotating Axes', leftOut: true },

  // Chapter 17: Planar kinetics of a rigid body
  'moment-of-inertia': { book: 'dynamics', section: '17.1', title: 'Mass Moment of Inertia' },
  'planar-equations': { book: 'dynamics', section: '17.2', title: 'Planar Kinetic Equations of Motion' },
  'rigid-translation': { book: 'dynamics', section: '17.3', title: 'Equations of Motion: Translation' },
  'rigid-fixed-axis': { book: 'dynamics', section: '17.4', title: 'Equations of Motion: Rotation About a Fixed Axis' },
  'general-plane-motion': { book: 'dynamics', section: '17.5', title: 'Equations of Motion: General Plane Motion' },

  // Chapter 18: Work and energy of a rigid body
  'rigid-kinetic-energy': { book: 'dynamics', section: '18.1', title: 'Kinetic Energy' },
  'rigid-work': { book: 'dynamics', section: '18.2', title: 'The Work of a Force' },
  'couple-work': { book: 'dynamics', section: '18.3', title: 'The Work of a Couple Moment' },
  'rigid-work-energy': { book: 'dynamics', section: '18.4', title: 'Principle of Work and Energy' },
  'rigid-conservation-of-energy': { book: 'dynamics', section: '18.5', title: 'Conservation of Energy' },
});

function entry(topic) {
  const e = SECTIONS[topic];
  if (!e) throw new Error(`textbook.js: no citation for the topic "${topic}"`);
  return e;
}

/** The short citation: "Hibbeler §15.4" or "Hibbeler Statics §1.4". */
export function cite(topic) {
  const e = entry(topic);
  return `${BOOKS[e.book].short} §${e.section}`;
}

/** The citation with its title: "Hibbeler §15.4, Impact". */
export function citeLong(topic) {
  return `${cite(topic)}, ${entry(topic).title}`;
}

/** Every section the map knows, as `{book short} §n.m`, for the checks. */
export function knownCitations({ taught = true } = {}) {
  return new Set(
    Object.values(SECTIONS)
      .filter((e) => !taught || !e.leftOut)
      .map((e) => `${BOOKS[e.book].short} §${e.section}`),
  );
}
