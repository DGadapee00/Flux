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
      { id: 's6', n: 6, title: 'A rated shackle', lab: 'shackle', ch: ['1'], topics: ['shear-stress', 'english'] },
      { id: 's7', n: 7, title: 'Allowable stress and the factor of safety', lab: 'truss-stress', ch: ['1'], topics: ['factor-of-safety'] },
      { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
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
      { id: 's3', n: 3, title: 'How a truss joint moves', lab: null, ch: ['4'], topics: ['truss-deformation'] },
      { id: 's4', n: 4, title: 'A bar between two walls', lab: 'indeterminate', ch: ['4'], topics: ['indeterminate-axial'] },
      { id: 's5', n: 5, title: 'Three bars and one joint', lab: null, ch: ['4'], topics: ['indeterminate-truss'] },
      { id: 's6', n: 6, title: 'Thermal stress', lab: 'rail', ch: ['4'], topics: ['thermal-stress', 'english'] },
      { id: 's7', n: 7, title: 'A joint that must close', lab: 'rail', ch: ['4'], topics: ['gap'] },
      { id: 's8', n: 8, title: 'Stress at a hole', lab: null, ch: ['4'], topics: ['stress-concentration'] },
      { id: 's9', n: 9, title: 'Formula sheet', lab: null, ch: [] },
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
      { id: 's6', n: 6, title: 'Strain on a turned axis', lab: null, ch: ['10'], topics: ['strain-transformation'] },
      { id: 's7', n: 7, title: "Mohr's circle for strain", lab: null, ch: ['10'], topics: ['strain-circle'] },
      { id: 's8', n: 8, title: 'Strain rosettes', lab: null, ch: ['10'], topics: ['rosette'] },
      { id: 's9', n: 9, title: 'Formula sheet', lab: null, ch: [] },
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
      { id: 's2', n: 2, title: "Drawing Mohr's circle", lab: 'mohr', ch: ['9'], topics: ['mohr-construction'] },
      { id: 's3', n: 3, title: 'Principal stresses', lab: 'mohr', ch: ['9'], topics: ['mohr'] },
      { id: 's4', n: 4, title: 'The largest in-plane shear', lab: 'mohr', ch: ['9'], topics: ['max-shear'] },
      { id: 's5', n: 5, title: 'The largest shear of all', lab: 'mohr', ch: ['9'], topics: ['abs-max-shear'] },
      { id: 's6', n: 6, title: 'Bending and torque together', lab: 'combined', ch: ['9'], topics: ['combined-loading'] },
      { id: 's7', n: 7, title: 'A trailer-ball shank', lab: 'hitch', ch: ['9'], topics: ['combined-loading', 'english'] },
      { id: 's8', n: 8, title: 'Tresca and von Mises', lab: 'combined', ch: ['9'], topics: ['yield'] },
      { id: 's9', n: 9, title: 'Brittle fracture', lab: 'mohr', ch: ['9'], topics: ['brittle'] },
      { id: 's10', n: 10, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u6: {
    exam: 'u6',
    title: 'Bending',
    chapters: '6',
    file: 'u6-bending.html',
    load: () => import('./content/u6-bending.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Shear and moment by sections', lab: 'diagrams', ch: ['6'], topics: ['shear-moment'], home: true },
      { id: 's2', n: 2, title: 'How load, shear and moment are linked', lab: 'diagrams', ch: ['6'], topics: ['shear-moment', 'uniform', 'cantilever'] },
      { id: 's3', n: 3, title: 'Diagrams by areas and jumps', lab: 'diagrams', ch: ['6'], topics: ['graphical-method'] },
      { id: 's4', n: 4, title: 'Moment and curvature', lab: 'flexure', ch: ['6'], topics: ['curvature'] },
      { id: 's5', n: 5, title: 'The flexure formula', lab: 'flexure', ch: ['6'], topics: ['flexure'] },
      { id: 's6', n: 6, title: 'A neutral axis off the middle', lab: 'flexure', ch: ['6'], topics: ['flexure', 'tee'] },
      { id: 's7', n: 7, title: 'A floor joist', lab: 'joist', ch: ['6'], topics: ['flexure', 'english'] },
      { id: 's8', n: 8, title: 'A moment off the principal axes', lab: null, ch: ['6'], topics: ['unsymmetric-bending'] },
      { id: 's9', n: 9, title: 'Beams of two materials', lab: null, ch: ['6'], topics: ['composite'] },
      { id: 's10', n: 10, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u7: {
    exam: 'u7',
    title: 'Transverse shear',
    chapters: '7',
    file: 'u7-shear.html',
    load: () => import('./content/u7-shear.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'The shear formula', lab: 'shear', ch: ['7'], topics: ['transverse-shear'], home: true },
      { id: 's2', n: 2, title: 'How shear varies over the depth', lab: 'shear', ch: ['7'], topics: ['transverse-shear', 'profile'] },
      { id: 's3', n: 3, title: 'Where the web carries the shear', lab: 'shear', ch: ['7'], topics: ['transverse-shear', 'web'] },
      { id: 's4', n: 4, title: 'Shear flow and fasteners', lab: 'nails', ch: ['7'], topics: ['shear-flow'] },
      { id: 's5', n: 5, title: 'A garage header', lab: 'header', ch: ['7'], topics: ['shear-flow', 'english'] },
      { id: 's6', n: 6, title: 'Shear flow around a thin wall', lab: 'shear', ch: ['7'], topics: ['thin-wall-flow'] },
      { id: 's7', n: 7, title: 'The shear centre', lab: null, ch: ['7'], topics: ['shear-centre'] },
      { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u8: {
    exam: 'u8',
    title: 'Beam deflection',
    chapters: '12',
    file: 'u8-deflection.html',
    load: () => import('./content/u8-deflection.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Integrating the curvature', lab: 'curve', ch: ['12'], topics: ['deflection', 'cantilever'], home: true },
      { id: 's2', n: 2, title: 'Boundary conditions on a simple span', lab: 'curve', ch: ['12'], topics: ['deflection', 'uniform'] },
      { id: 's3', n: 3, title: 'Where the beam is lowest', lab: 'curve', ch: ['12'], topics: ['deflection', 'offset'] },
      { id: 's4', n: 4, title: 'One equation for the whole beam', lab: null, ch: ['12'], topics: ['discontinuity'] },
      { id: 's5', n: 5, title: 'Superposition from a table', lab: 'curve', ch: ['12'], topics: ['superposition'] },
      { id: 's6', n: 6, title: 'A redundant prop', lab: 'propped', ch: ['12'], topics: ['deflection', 'propped'] },
      { id: 's7', n: 7, title: 'Fixed ends and symmetry', lab: null, ch: ['12'], topics: ['fixed-ends'] },
      { id: 's8', n: 8, title: 'A pine shelf', lab: 'shelf', ch: ['12'], topics: ['deflection', 'english'] },
      { id: 's9', n: 9, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u9: {
    exam: 'u9',
    title: 'Torsion',
    chapters: '5',
    file: 'u9-torsion.html',
    load: () => import('./content/u9-torsion.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Twist of a circular shaft', lab: 'torsion', ch: ['5'], topics: ['torsion', 'solid'], home: true },
      { id: 's2', n: 2, title: 'Taking out the core', lab: 'torsion', ch: ['5'], topics: ['torsion', 'hollow'] },
      { id: 's3', n: 3, title: 'Power and gears', lab: 'twist', ch: ['5'], topics: ['torsion', 'power'] },
      { id: 's4', n: 4, title: 'Shafts in series, and held at both ends', lab: 'twist', ch: ['5'], topics: ['torsion', 'stepped', 'fixed'] },
      { id: 's5', n: 5, title: 'A motor shaft', lab: 'motor', ch: ['5'], topics: ['torsion', 'english'] },
      { id: 's6', n: 6, title: 'Thin-walled closed tubes', lab: null, ch: ['5'], topics: ['closed-tube'] },
      { id: 's7', n: 7, title: 'Shafts that are not round', lab: null, ch: ['5'], topics: ['noncircular'] },
      { id: 's8', n: 8, title: 'Stress raisers in shafts', lab: null, ch: ['5'], topics: ['shaft-kt'] },
      { id: 's9', n: 9, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u10: {
    exam: 'u10',
    title: 'Energy methods',
    chapters: '14',
    file: 'u10-energy.html',
    load: () => import('./content/u10-energy.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Strain energy in a bar', lab: 'castigliano', ch: ['14'], topics: ['energy', 'axial'], home: true },
      { id: 's2', n: 2, title: 'Energy in bending and torsion', lab: 'castigliano', ch: ['14'], topics: ['energy', 'bending', 'torsion'] },
      { id: 's3', n: 3, title: 'Castigliano and the dummy load', lab: 'castigliano', ch: ['14'], topics: ['energy', 'dummy', 'truss'] },
      { id: 's4', n: 4, title: 'Impact: a falling weight', lab: 'drop', ch: ['14'], topics: ['impact'] },
      { id: 's5', n: 5, title: 'A crane rope', lab: 'drop', ch: ['14'], topics: ['impact', 'english'] },
      { id: 's6', n: 6, title: 'Unit loads on a truss', lab: null, ch: ['14'], topics: ['unit-load', 'truss-unit'] },
      { id: 's7', n: 7, title: 'Unit loads on a beam', lab: 'castigliano', ch: ['14'], topics: ['unit-load', 'beam-unit'] },
      { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u11: {
    exam: 'u11',
    title: 'Buckling of columns',
    chapters: '13',
    file: 'u11-buckling.html',
    load: () => import('./content/u11-buckling.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Euler and effective length', lab: 'buckling', ch: ['13'], topics: ['buckling'], home: true, problems: ['u11.13.euler', 'u11.13.ends', 'u11.13.length'] },
      { id: 's2', n: 2, title: 'Weak axis and yield', lab: 'buckling', ch: ['13'], topics: ['buckling'], problems: ['u11.13.weak', 'u11.13.transition', 'u11.13.axis', 'u11.13.support'] },
      { id: 's3', n: 3, title: 'A basement column', lab: 'column', ch: ['13'], topics: ['buckling', 'english'], problems: ['u11.13.column'] },
      { id: 's4', n: 4, title: 'Formula sheet', lab: null, ch: [] },
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
