/**
 * Class notes, one set per exam, kept as the HTML they were written in (src/notes/content/) and
 * read into the Notes panel (src/ui/notes.js). The course instructor has allowed the notes to be
 * included; see PROVENANCE.md.
 *
 * Each set lists its sections with the lab that shows them and the chapters whose practice problems
 * they prepare, so the three parts of the app point at each other: a section links to its lab and its
 * problems, a problem links back to the section it draws on, and a lab to the section it illustrates.
 *
 * `home: true` marks the section a lab's own "Notes" link opens, when that is not simply the first
 * section showing the lab.
 *
 * Adding a set: drop the file in content/, keep its sections as <section class="topic" id="…"> with
 * an <h2>, and add an entry here. Math is typeset from \( … \) and \[ … \] by KaTeX.
 */
export const NOTES = {
  e1: {
    exam: 'e1',
    title: 'Vectors, Charge and Force',
    chapters: 'V, 34–35',
    file: 'e1-vectors-charge-and-force.html',
    load: () => import('./content/e1-vectors-charge-and-force.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Components, magnitude and direction', lab: 'vectors', ch: ['V'], topics: ['vectors'] },
      { id: 's2', n: 2, title: 'Unit vectors and vector addition', lab: 'vectors', ch: ['V'], topics: ['vectors'] },
      { id: 's3', n: 3, title: 'The dot product', lab: 'vectors', ch: ['V'], topics: ['vectors', 'dot-product'] },
      { id: 's4', n: 4, title: 'The cross product', lab: 'vectors', ch: ['V'], topics: ['vectors', 'cross-product'] },
      { id: 's5', n: 5, title: 'Charge: quantized and conserved', lab: 'force', ch: ['34'], topics: ['charge', 'quantization', 'conservation'] },
      { id: 's6', n: 6, title: 'Conductors, insulators and contact charging', lab: 'force', ch: ['34'], topics: ['charge'] },
      { id: 's7', n: 7, title: 'Induction and polarization', lab: 'force', ch: ['34'], topics: ['charge', 'induction', 'polarization'] },
      { id: 's8', n: 8, title: "Coulomb's law", lab: 'force', ch: ['35'], topics: ['coulomb'], home: true },
      { id: 's9', n: 9, title: 'Superposition of forces', lab: 'force', ch: ['35'], topics: ['coulomb', 'superposition', 'vectors'] },
      { id: 's10', n: 10, title: 'Equilibrium points and comparing forces', lab: 'force', ch: ['35'], topics: ['coulomb', 'equilibrium', 'gravity', 'proportional-reasoning'] },
      { id: 's11', n: 11, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  e2: {
    exam: 'e2',
    title: 'Field and Flux',
    chapters: '36–37',
    file: 'e2-field-and-flux.html',
    load: () => import('./content/e2-field-and-flux.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Defining the electric field', lab: 'field', ch: ['36A'], topics: ['field-definition', 'kinematics'] },
      { id: 's2', n: 2, title: 'Point charges and superposition', lab: 'field', ch: ['36A'], topics: ['point-charge', 'superposition', 'vectors'] },
      { id: 's3', n: 3, title: 'Reading field lines', lab: 'field', ch: ['36A'], topics: ['field-lines'] },
      { id: 's4', n: 4, title: 'Equilibrium: balancing gravity with a field', lab: 'field', ch: ['36A'], topics: ['equilibrium'] },
      { id: 's5', n: 5, title: 'The dipole field on the perpendicular bisector', lab: 'field', ch: ['36A'], topics: ['dipole', 'superposition'] },
      { id: 's6', n: 6, title: 'Charge density', lab: 'integral', ch: ['36B'], topics: ['charge-density'] },
      { id: 's7', n: 7, title: 'The finite line charge, on and off its axis', lab: 'integral', ch: ['36B'], topics: ['continuous-distribution', 'integration'] },
      { id: 's8', n: 8, title: 'Ring and disk on the axis', lab: 'integral', ch: ['36B'], topics: ['continuous-distribution', 'integration'] },
      { id: 's9', n: 9, title: 'Semicircular arc at its center', lab: 'integral', ch: ['36B'], topics: ['continuous-distribution', 'integration'] },
      { id: 's10', n: 10, title: "Electric flux; zero flux vs. zero field", lab: 'gauss', ch: ['36C'], topics: ['flux', 'gauss'] },
      { id: 's11', n: 11, title: "Gauss's law and spherical symmetry", lab: 'gauss', ch: ['36C'], topics: ['gauss', 'spherical-symmetry'] },
      { id: 's12', n: 12, title: 'Cylindrical and planar symmetry', lab: 'gauss', ch: ['36C'], topics: ['gauss', 'cylindrical-symmetry', 'planar-symmetry'] },
      { id: 's13', n: 13, title: 'Conductors in equilibrium', lab: 'conductors', ch: ['37'], topics: ['conductors', 'field-lines'] },
      { id: 's14', n: 14, title: 'Cavities, induction, and shells', lab: 'conductors', ch: ['36C', '37'], topics: ['conductors', 'induction', 'gauss'] },
      { id: 's15', n: 15, title: 'Applications: clouds, rods, and cages', lab: 'conductors', ch: ['37'], topics: ['conductors', 'applications'] },
      { id: 's16', n: 16, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  e3: {
    exam: 'e3',
    title: 'Potential to Power',
    chapters: '38–42',
    file: 'e3-potential-to-power.html',
    load: () => import('./content/e3-potential-to-power.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Work and potential energy', lab: 'potential', ch: ['38'], topics: ['work'] },
      { id: 's2', n: 2, title: 'Potential energy of point charges', lab: 'potential', ch: ['38'], topics: ['potential-energy'] },
      { id: 's3', n: 3, title: 'Electric potential', lab: 'potential', ch: ['38'], topics: ['units'], problems: ['e3.38.uniform-dV', 'e3.38.uniform-path', 'e3.38.uniform-rank'], home: true },
      { id: 's4', n: 4, title: 'Potential from charges', lab: 'integral', ch: ['38', '39'], topics: ['superposition', 'continuous-distribution'], problems: ['e3.38.point-V', 'e3.39.deltaV-two-radii'] },
      { id: 's5', n: 5, title: 'Field from potential', lab: 'potential', ch: ['38'], topics: ['gradient', 'graphs'] },
      { id: 's6', n: 6, title: 'Equipotentials and conductors', lab: 'potential', ch: ['38', '39'], topics: ['equipotential', 'conductors'] },
      { id: 's7', n: 7, title: 'Energy conservation with charges', lab: 'potential', ch: ['38', '39'], topics: ['energy'] },
      { id: 's8', n: 8, title: 'Capacitance', lab: 'capacitor', ch: ['40'], topics: ['networks'] },
      { id: 's9', n: 9, title: 'Energy in the field', lab: 'capacitor', ch: ['40'], topics: ['energy'] },
      { id: 's10', n: 10, title: 'Dielectrics and breakdown', lab: 'capacitor', ch: ['40'], topics: ['dielectrics', 'breakdown'] },
      { id: 's11', n: 11, title: 'Current and current density', lab: 'ohm', ch: ['41'], topics: ['drift-velocity'] },
      { id: 's12', n: 12, title: "Resistance and Ohm's law", lab: 'ohm', ch: ['41'], topics: ['resistance', 'ohms-law', 'temperature', 'non-ohmic'], problems: ['e3.41.across-resistor'], home: true },
      // No `power` tag: every Ch 42 problem has it, which would pull the AC and safety ones here too.
      { id: 's13', n: 13, title: 'Electrical power', lab: 'power', ch: ['42'] },
      { id: 's14', n: 14, title: 'Alternating current', lab: 'power', ch: ['42'], topics: ['rms', 'ac'] },
      { id: 's15', n: 15, title: 'Household electricity and safety', lab: null, ch: ['42'], topics: ['safety', 'grounding'] },
      { id: 's16', n: 16, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  e4: {
    exam: 'e4',
    title: 'Charge in Motion',
    chapters: '43–47',
    file: 'e4-charge-in-motion.html',
    load: () => import('./content/e4-charge-in-motion.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'The two rules behind every circuit', lab: 'circuits', ch: ['43'], topics: ['circuits'] },
      { id: 's2', n: 2, title: 'Series and parallel, derived', lab: 'circuits', ch: ['43'], topics: ['series', 'parallel'] },
      { id: 's3', n: 3, title: 'Reducing networks', lab: 'circuits', ch: ['43'], topics: ['networks'] },
      { id: 's4', n: 4, title: "Kirchhoff's method in full", lab: 'circuits', ch: ['43', '44'], topics: ['kirchhoff'] },
      { id: 's5', n: 5, title: 'Real sources and combining them', lab: 'circuits', ch: ['44'], topics: ['emf'] },
      { id: 's6', n: 6, title: 'Capacitors in combination', lab: 'rc', ch: ['44'], topics: ['capacitance'] },
      { id: 's7', n: 7, title: 'RC circuits', lab: 'rc', ch: ['44'], topics: ['rc'], home: true },
      { id: 's8', n: 8, title: 'The magnetic force on a charge', lab: 'magforce', ch: ['46'], topics: ['right-hand-rule'] },
      { id: 's9', n: 9, title: 'How charges move in B', lab: 'magforce', ch: ['46'], topics: ['circular-motion', 'energy'], problems: ['e4.46.selector', 'e4.46.undeflected'] },
      { id: 's10', n: 10, title: 'Force on a current', lab: 'magforce', ch: ['46'], problems: ['e4.46.wire-force'] },
      { id: 's11', n: 11, title: 'Torque and the magnetic dipole', lab: 'magforce', ch: ['46'], topics: ['torque'] },
      { id: 's12', n: 12, title: 'Currents make fields: Biot–Savart', lab: 'biot', ch: ['47'], topics: ['biot-savart', 'superposition'] },
      { id: 's13', n: 13, title: 'Forces between currents', lab: 'magforce', ch: ['47'] },
      { id: 's14', n: 14, title: "Ampère's law", lab: 'ampere', ch: ['47'], topics: ['ampere', 'solenoid'] },
      { id: 's15', n: 15, title: 'Magnetism in matter', lab: 'biot', ch: ['45'], topics: ['magnetism'] },
      { id: 's16', n: 16, title: "Earth's field and applications", lab: null, ch: ['45'] },
      { id: 's17', n: 17, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  e5: {
    exam: 'e5',
    title: 'Induction to Resonance',
    chapters: '48–52',
    file: 'e5-induction-to-resonance.html',
    load: () => import('./content/e5-induction-to-resonance.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Magnetic flux', lab: 'faraday', ch: ['48'], topics: ['flux'] },
      { id: 's2', n: 2, title: "Faraday's law", lab: 'faraday', ch: ['48'], topics: ['faraday'], home: true },
      { id: 's3', n: 3, title: "Lenz's law", lab: 'faraday', ch: ['48'], topics: ['lenz'] },
      { id: 's4', n: 4, title: 'Motional emf and energy', lab: 'faraday', ch: ['48'], topics: ['motional-emf'] },
      { id: 's5', n: 5, title: 'Mutual inductance and transformers', lab: 'transformer', ch: ['49', '50'], topics: ['transformer'] },
      { id: 's6', n: 6, title: 'Self-inductance', lab: null, ch: ['49'], topics: ['inductance'] },
      { id: 's7', n: 7, title: 'Magnetic energy, RL and LC circuits', lab: null, ch: ['49'], topics: ['rl'], problems: ['e5.49.rl'] },
      { id: 's8', n: 8, title: 'Motors and back emf', lab: null, ch: ['50'], topics: ['motors'] },
      { id: 's9', n: 9, title: 'Generators', lab: 'faraday', ch: ['50'], topics: ['generator'] },
      { id: 's10', n: 10, title: 'Power plants, transmission and the home', lab: 'transformer', ch: ['50'], topics: ['transmission'], problems: ['e5.50.pole-transformer'] },
      { id: 's11', n: 11, title: 'Eddy currents', lab: null, ch: ['51'] },
      { id: 's12', n: 12, title: 'Sensors, speakers and the solar wind', lab: 'flowmeter', ch: ['51'], topics: ['applications'] },
      { id: 's13', n: 13, title: 'R, C and L in an AC circuit', lab: 'ac', ch: ['52'], topics: ['reactance'] },
      { id: 's14', n: 14, title: 'Series RLC circuits and phasors', lab: 'ac', ch: ['52'], topics: ['impedance', 'phasors'], home: true },
      { id: 's15', n: 15, title: 'Resonance, filters and matching', lab: 'ac', ch: ['52'], topics: ['resonance'] },
      { id: 's16', n: 16, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  e6: {
    exam: 'e6',
    title: 'Waves of Light',
    chapters: '53–57',
    file: 'e6-waves-of-light.html',
    load: () => import('./content/e6-waves-of-light.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Waves and their properties', lab: 'emwave', ch: ['53'], topics: ['em-waves'] },
      { id: 's2', n: 2, title: "Maxwell's equations and the speed of light", lab: 'emwave', ch: ['53'], problems: ['e6.53.f-from-lambda'] },
      { id: 's3', n: 3, title: 'Light-years and looking back in time', lab: null, ch: ['53'] },
      { id: 's4', n: 4, title: 'Photons', lab: 'emwave', ch: ['53'] },
      { id: 's5', n: 5, title: 'The Doppler shift for light', lab: 'radargun', ch: ['53'], topics: ['doppler'] },
      { id: 's6', n: 6, title: 'Momentum, radiation pressure and lasers', lab: 'solarsail', ch: ['53', '55'], topics: ['radiation-pressure'], problems: ['e6.55.pressure'] },
      { id: 's7', n: 7, title: 'The spectrum, band by band', lab: 'emwave', ch: ['54'], topics: ['spectrum'] },
      { id: 's8', n: 8, title: 'Radio waves and microwaves', lab: 'emwave', ch: ['54'] },
      { id: 's9', n: 9, title: 'Infrared and visible light', lab: 'emwave', ch: ['54'] },
      { id: 's10', n: 10, title: 'Ultraviolet, X-rays and gamma rays', lab: 'emwave', ch: ['54'] },
      { id: 's11', n: 11, title: 'E, B and the Poynting vector', lab: 'emwave', ch: ['53', '55'], topics: ['poynting'], problems: ['e6.53.B-from-E', 'e6.53.direction'], home: true },
      { id: 's12', n: 12, title: 'Intensity', lab: 'emwave', ch: ['55'], topics: ['intensity'] },
      { id: 's13', n: 13, title: 'Blackbody radiation', lab: null, ch: ['55'] },
      { id: 's14', n: 14, title: 'Sunlight at Earth', lab: null, ch: ['55'] },
      { id: 's15', n: 15, title: 'Polarized and unpolarized light', lab: 'polar', ch: ['56'] },
      { id: 's16', n: 16, title: "Malus's law and polarizer chains", lab: 'polar', ch: ['56'], topics: ['malus'], home: true },
      { id: 's17', n: 17, title: 'Polarization at work', lab: 'polar', ch: ['56'], problems: ['e6.56.brewster'] },
      { id: 's18', n: 18, title: 'Rays, wave fronts and sources', lab: null, ch: ['57'] },
      { id: 's19', n: 19, title: 'What light does at a surface', lab: null, ch: ['57'], topics: ['optics', 'index'] },
      { id: 's20', n: 20, title: 'The law of reflection', lab: null, ch: ['57'], topics: ['reflection'] },
      { id: 's21', n: 21, title: 'Absorption and scattering', lab: null, ch: ['57'] },
      { id: 's22', n: 22, title: 'Shadows', lab: null, ch: ['57'] },
      { id: 's23', n: 23, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
};

export const notesForExam = (examId) => NOTES[examId] || null;

/** Every set of notes, in exam order, for the "what is here" list. */
export const allNotes = () => Object.values(NOTES);

/**
 * The section a practice problem draws on, among those covering its chapter: the one sharing most of
 * its topics (the problem bank's own tags: 'rc', 'kirchhoff', 'torque'…), then the one showing its
 * lab, then the first. A section can also claim problems by id (`problems`) where the tags are too
 * broad to tell. Null when no notes cover the chapter.
 */
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

/**
 * The first section a lab illustrates, in the notes for the exam on screen only: a lab listed under
 * two exams is doing a different job in each (Integrals is ∫dE in Exam 2, ∫dV in Exam 3).
 */
export function sectionForLab(labId, examId) {
  const set = NOTES[examId];
  const mine = set?.sections.filter((s) => s.lab === labId) || [];
  // A section marked `home` is the lab's own topic ("Electric potential" for Potential), else the first.
  const hit = mine.find((s) => s.home) || mine[0];
  return hit ? { set, section: hit } : null;
}
