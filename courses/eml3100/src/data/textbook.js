/**
 * Every textbook citation EML 3100 shows, in one place (DECISIONS.md, D13). Problems and notes name a
 * topic and ask this file for its citation, so changing books changes this file only.
 *
 * Flux writes its own text and tables. Nothing is copied from either book: these entries are
 * section numbers and titles, so a student can find the matching reading.
 *
 * Yan's section numbers are the BCcampus Pressbooks edition's (pressbooks.bccampus.ca/thermo1).
 * The LibreTexts copy of the same book numbers some sections one higher (its 2.5 is our 2.4).
 *
 * Topics past Yan's Chapter 6 (the Rankine and Brayton cycles, vapour-compression refrigeration)
 * have no source yet. They are cited by topic only, until one is chosen.
 */

export const BOOKS = Object.freeze({
  yan: Object.freeze({
    short: 'Yan',
    author: 'Claire Yu Yan',
    title: 'Introduction to Engineering Thermodynamics',
    publisher: 'BCcampus',
    year: 2022,
    license: 'CC BY-NC-SA 4.0',
    url: 'https://pressbooks.bccampus.ca/thermo1/',
  }),
  up2: Object.freeze({
    short: 'OpenStax UP2',
    author: 'Samuel J. Ling, Jeff Sanny and William Moebs',
    title: 'University Physics Volume 2',
    publisher: 'OpenStax',
    year: 2016,
    license: 'CC BY 4.0',
    url: 'https://openstax.org/books/university-physics-volume-2',
  }),
});

/**
 * topic → where to read about it. `section` is a numbered section, `chapter` a whole chapter when
 * no single section fits, and neither when the topic has no source yet.
 */
export const SECTIONS = Object.freeze({
  // Yan, Chapter 1: Basic Concepts and Definitions
  'thermodynamics': { book: 'yan', section: '1.1', title: 'What is thermodynamics about?' },
  'system': { book: 'yan', section: '1.2', title: 'System and surroundings' },
  'intensive-extensive': { book: 'yan', section: '1.3', title: 'Extensive and intensive properties' },
  'state-process-cycle': { book: 'yan', section: '1.4', title: 'State, process, and cycle' },

  // Yan, Chapter 2: Thermodynamic Properties of a Pure Substance
  'pure-substance': { book: 'yan', section: '2.1', title: 'Pure substance' },
  'properties': { book: 'yan', section: '2.2', title: 'Thermodynamic properties' },
  'phase-diagrams': { book: 'yan', section: '2.3', title: 'Phase diagrams' },
  'property-tables': { book: 'yan', section: '2.4', title: 'Thermodynamic tables' },
  'quality': { book: 'yan', section: '2.4', title: 'Thermodynamic tables' },
  'interpolation': { book: 'yan', section: '2.4', title: 'Thermodynamic tables' },

  // Yan, Chapter 3: Ideal and Real Gases
  'ideal-gas': { book: 'yan', section: '3.1', title: 'Ideal gas and ideal gas equation of state' },
  'compressibility': { book: 'yan', section: '3.2', title: 'Real gas and compressibility factor' },

  // Yan, Chapter 4: The First Law of Thermodynamics for Closed Systems
  'internal-energy': { book: 'yan', section: '4.1', title: 'Internal energy in a system' },
  'specific-heats': { book: 'yan', section: '4.1', title: 'Internal energy in a system' },
  'heat': { book: 'yan', section: '4.2', title: 'Heat transfer across a boundary' },
  'boundary-work': { book: 'yan', section: '4.3', title: 'Work' },
  'polytropic': { book: 'yan', section: '4.3', title: 'Work' },
  'first-law-closed': { book: 'yan', section: '4.4', title: 'The first law of thermodynamics for closed systems' },

  // Yan, Chapters 5 and 6, cited as chapters
  'control-volume': { book: 'yan', chapter: '5', title: 'The First Law of Thermodynamics for a Control Volume' },
  'second-law': { book: 'yan', chapter: '6', title: 'Entropy and the Second Law of Thermodynamics' },
  'entropy': { book: 'yan', chapter: '6', title: 'Entropy and the Second Law of Thermodynamics' },

  // OpenStax University Physics Volume 2, Chapters 1–4: the physics background
  'temperature': { book: 'up2', section: '1.2', title: 'Thermometers and Temperature Scales' },
  'thermal-equilibrium': { book: 'up2', section: '1.1', title: 'Temperature and Thermal Equilibrium' },
  'calorimetry': { book: 'up2', section: '1.4', title: 'Heat Transfer, Specific Heat, and Calorimetry' },
  'phase-change': { book: 'up2', section: '1.5', title: 'Phase Changes' },
  'kinetic-theory': { book: 'up2', section: '2.1', title: 'Molecular Model of an Ideal Gas' },
  'molecular-speeds': { book: 'up2', section: '2.2', title: 'Pressure, Temperature, and RMS Speed' },
  'equipartition': { book: 'up2', section: '2.3', title: 'Heat Capacity and Equipartition of Energy' },
  'work-heat-energy': { book: 'up2', section: '3.2', title: 'Work, Heat, and Internal Energy' },
  'first-law': { book: 'up2', section: '3.3', title: 'First Law of Thermodynamics' },
  'processes': { book: 'up2', section: '3.4', title: 'Thermodynamic Processes' },
  'ideal-gas-heat-capacities': { book: 'up2', section: '3.5', title: 'Heat Capacities of an Ideal Gas' },
  'adiabatic': { book: 'up2', section: '3.6', title: 'Adiabatic Processes for an Ideal Gas' },
  'heat-engines': { book: 'up2', section: '4.2', title: 'Heat Engines' },
  'refrigerators': { book: 'up2', section: '4.3', title: 'Refrigerators and Heat Pumps' },
  'carnot': { book: 'up2', section: '4.5', title: 'The Carnot Cycle' },

  // Past Yan's Chapter 6, no source chosen yet: cited by topic only
  'rankine': { title: 'The Rankine cycle' },
  'brayton': { title: 'The Brayton cycle' },
  'vapour-compression': { title: 'Vapour-compression refrigeration' },
});

function entry(topic) {
  const e = SECTIONS[topic];
  if (!e) throw new Error(`textbook.js: no citation for the topic "${topic}"`);
  return e;
}

/** The short citation: "Yan §2.4", "OpenStax UP2 §3.5", "Yan Ch 6", or the topic alone. */
export function cite(topic) {
  const e = entry(topic);
  if (!e.book) return e.title;
  const short = BOOKS[e.book].short;
  return e.section ? `${short} §${e.section}` : `${short} Ch ${e.chapter}`;
}

/** The citation with its title: "Yan §2.4, Thermodynamic tables". */
export function citeLong(topic) {
  const e = entry(topic);
  return e.book ? `${cite(topic)}, ${e.title}` : `${e.title} (no textbook chosen yet)`;
}
