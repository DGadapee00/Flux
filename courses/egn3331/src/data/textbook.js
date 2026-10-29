/**
 * Every textbook citation EGN 3331 shows, in one place (DECISIONS.md, D14). Problems and notes name a
 * topic and ask this file for its citation, so changing books changes this file only.
 *
 * The text is David Roylance's Mechanics of Materials modules, published on MIT OpenCourseWare as
 * course 3.11 (Fall 1999). Flux writes its own text and figures. Nothing is copied: these entries are
 * section numbers and titles, so a student can find the matching reading.
 *
 * OpenCourseWare posts the modules as separate files without numbers. The numbers here are the
 * collected edition's (Engineering LibreTexts, "Mechanics of Materials (Roylance)"), which keeps
 * the modules in the same order and under the same titles.
 *
 * Topics the modules do not treat (bearing stress, the factor of safety, statically indeterminate
 * axial members, thermal stress, combined loading, column buckling) are cited by topic only, until a
 * source is chosen.
 */

export const BOOKS = Object.freeze({
  roylance: Object.freeze({
    short: 'Roylance',
    author: 'David Roylance',
    title: 'Mechanics of Materials',
    publisher: 'MIT OpenCourseWare, course 3.11',
    year: 1999,
    license: 'CC BY-NC-SA 4.0',
    url: 'https://ocw.mit.edu/courses/3-11-mechanics-of-materials-fall-1999/',
  }),
});

/**
 * topic → where to read about it. `section` is a numbered section, `chapter` a whole chapter when
 * no single section fits, and neither when the topic has no source yet.
 */
export const SECTIONS = Object.freeze({
  // Chapter 1: Tensile Response of Materials
  'stress': { book: 'roylance', section: '1.1', title: 'Introduction to Elastic Response' },
  'normal-stress': { book: 'roylance', section: '1.1', title: 'Introduction to Elastic Response' },
  'hooke': { book: 'roylance', section: '1.1', title: 'Introduction to Elastic Response' },
  'axial-deformation': { book: 'roylance', section: '1.1', title: 'Introduction to Elastic Response' },
  'stress-strain-curve': { book: 'roylance', section: '1.4', title: 'Stress-Strain Curves' },

  // Chapter 2: Simple Tensile and Shear Structures
  'trusses': { book: 'roylance', section: '2.1', title: 'Trusses' },
  'truss-deformation': { book: 'roylance', section: '2.1', title: 'Trusses' },
  'indeterminate-truss': { book: 'roylance', section: '2.1', title: 'Trusses' },
  'pressure-vessels': { book: 'roylance', section: '2.2', title: 'Pressure Vessels' },
  'poisson': { book: 'roylance', section: '2.2', title: 'Pressure Vessels' },
  'shear-stress': { book: 'roylance', section: '2.3', title: 'Shear and Torsion' },
  'torsion': { book: 'roylance', section: '2.3', title: 'Shear and Torsion' },

  // Chapter 3: General Concepts of Stress and Strain
  'strain': { book: 'roylance', section: '3.1', title: 'Kinematics' },
  'equilibrium': { book: 'roylance', section: '3.2', title: 'Equilibrium' },
  'inclined-plane': { book: 'roylance', section: '3.3', title: 'Tensor Transformations' },
  'stress-transformation': { book: 'roylance', section: '3.3', title: 'Tensor Transformations' },
  'mohr': { book: 'roylance', section: '3.3', title: 'Tensor Transformations' },
  'mohr-construction': { book: 'roylance', section: '3.3', title: 'Tensor Transformations' },
  'abs-max-shear': { book: 'roylance', section: '3.3', title: 'Tensor Transformations' },
  'strain-transformation': { book: 'roylance', section: '3.3', title: 'Tensor Transformations' },
  'strain-circle': { book: 'roylance', section: '3.3', title: 'Tensor Transformations' },
  'rosette': { book: 'roylance', section: '3.3', title: 'Tensor Transformations' },

  // Chapter 4: Bending
  'internal-loads': { book: 'roylance', section: '4.1', title: 'Shear and Bending Moment Diagrams' },
  'shear-moment': { book: 'roylance', section: '4.1', title: 'Shear and Bending Moment Diagrams' },
  'flexure': { book: 'roylance', section: '4.2', title: 'Stresses in Beams' },
  'transverse-shear': { book: 'roylance', section: '4.2', title: 'Stresses in Beams' },
  'shear-flow': { book: 'roylance', section: '4.2', title: 'Stresses in Beams' },
  'deflection': { book: 'roylance', section: '4.3', title: 'Beam Displacements' },

  // Chapter 5: General Stress Analysis
  'stress-concentration': { book: 'roylance', section: '5.1', title: 'Closed-Form Solutions' },

  // Chapter 6: Yield and Fracture
  'yield': { book: 'roylance', section: '6.1', title: 'Yield and Plastic Flow' },
  'creep': { book: 'roylance', section: '6.2', title: 'Dislocation Basis of Yield and Creep' },
  'fatigue': { book: 'roylance', section: '6.5', title: 'Fatigue' },

  // Not treated in the modules: cited by topic only
  'bearing': { title: 'Bearing stress' },
  'factor-of-safety': { title: 'Allowable stress and the factor of safety' },
  'statics-review': { title: 'Equilibrium of a deformable body' },
  'indeterminate-axial': { title: 'Statically indeterminate axial members' },
  'thermal-stress': { title: 'Thermal stress' },
  'combined-loading': { title: 'Combined loadings' },
  'brittle': { title: 'Brittle fracture criteria' },
  'buckling': { title: 'Buckling of columns' },
  'energy': { title: 'Strain energy and Castigliano\'s theorem' },
  'impact': { title: 'Impact loading' },
});

function entry(topic) {
  const e = SECTIONS[topic];
  if (!e) throw new Error(`textbook.js: no citation for the topic "${topic}"`);
  return e;
}

/** The short citation: "Roylance §2.1", "Roylance Ch 4", or the topic alone. */
export function cite(topic) {
  const e = entry(topic);
  if (!e.book) return e.title;
  const short = BOOKS[e.book].short;
  return e.section ? `${short} §${e.section}` : `${short} Ch ${e.chapter}`;
}

/** The citation with its title: "Roylance §2.1, Trusses". */
export function citeLong(topic) {
  const e = entry(topic);
  return e.book ? `${cite(topic)}, ${e.title}` : `${e.title} (no textbook chosen yet)`;
}
