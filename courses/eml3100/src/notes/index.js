/**
 * Notes, one file per unit. Flux writes the text; citations come from src/data/textbook.js.
 * Math is \( \) and \[ \]. A dollar sign is not a delimiter in these files.
 */
export const NOTES = {
  u1: {
    exam: 'u1',
    title: 'Pure substances and ideal gases',
    chapters: '2, 3',
    file: 'u1-properties.html',
    load: () => import('./content/u1-properties.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Pure substances and phases', lab: 'phase', ch: ['2'], topics: ['phase'], home: true },
      { id: 's2', n: 2, title: 'The saturation dome', lab: 'phase', ch: ['2'], topics: ['quality'] },
      { id: 's3', n: 3, title: 'Reading property tables', lab: 'phase', ch: ['2'], topics: ['tables', 'interpolation', 'superheated'] },
      { id: 's4', n: 4, title: 'The ideal-gas law', lab: null, ch: ['3'], topics: ['ideal-gas', 'english'] },
      { id: 's5', n: 5, title: 'When is a gas ideal?', lab: 'phase', ch: ['3'], topics: ['compressibility'] },
      { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u2: {
    exam: 'u2',
    title: 'First law for closed systems',
    chapters: '4',
    file: 'u2-first-law.html',
    load: () => import('./content/u2-first-law.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Energy, heat and work', lab: null, ch: ['4'], topics: ['first-law'] },
      { id: 's2', n: 2, title: 'Boundary work', lab: 'piston', ch: ['4'], topics: ['boundary-work'], home: true },
      { id: 's3', n: 3, title: 'Polytropic processes', lab: 'piston', ch: ['4'], topics: ['polytropic'] },
      { id: 's4', n: 4, title: 'Internal energy and specific heats', lab: null, ch: ['4'], topics: ['specific-heats'] },
      { id: 's5', n: 5, title: 'The first law with steam', lab: 'piston', ch: ['4'], topics: ['first-law', 'superheated'] },
      { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u3: {
    exam: 'u3',
    title: 'Control volumes: mass and energy',
    chapters: '5',
    file: 'u3-control-volumes.html',
    load: () => import('./content/u3-control-volumes.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Control volumes and the mass balance', lab: 'nozzle', ch: ['5'], topics: ['mass-flow'] },
      { id: 's2', n: 2, title: 'The steady-flow energy equation', lab: 'devices', ch: ['5'], topics: ['control-volume'], home: true },
      { id: 's3', n: 3, title: 'Turbines and compressors', lab: 'devices', ch: ['5'], topics: ['turbine', 'compressor'] },
      { id: 's4', n: 4, title: 'Nozzles and diffusers', lab: 'nozzle', ch: ['5'], topics: ['nozzle', 'diffuser'] },
      { id: 's5', n: 5, title: 'Throttles', lab: 'devices', ch: ['5'], topics: ['throttle'] },
      { id: 's6', n: 6, title: 'Mixing chambers and heat exchangers', lab: 'devices', ch: ['5'], topics: ['mixing', 'heat-exchanger'] },
      { id: 's7', n: 7, title: 'Application: a tankless water heater', lab: 'heater', ch: ['5'], topics: ['english'] },
      { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u4: {
    exam: 'u4',
    title: 'Cycles and the second law',
    chapters: '6',
    file: 'u4-second-law.html',
    load: () => import('./content/u4-second-law.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Heat engines', lab: 'claims', ch: ['6'], topics: ['heat-engine', 'second-law'], home: true },
      { id: 's2', n: 2, title: 'Refrigerators and heat pumps', lab: 'carnot', ch: ['6'], topics: ['refrigerator'] },
      { id: 's3', n: 3, title: 'The Carnot limit', lab: 'carnot', ch: ['6'], topics: ['carnot', 'english'] },
      { id: 's4', n: 4, title: 'Reversible or impossible', lab: 'claims', ch: ['6'], topics: ['claim', 'second-law'] },
      { id: 's5', n: 5, title: 'The Brayton cycle', lab: 'carnot', ch: ['6'], topics: ['brayton'] },
      { id: 's6', n: 6, title: 'A unitary air conditioner', lab: 'ac', ch: ['6'], topics: ['refrigerator'] },
      { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u5: {
    exam: 'u5',
    title: 'Entropy',
    chapters: '6',
    file: 'u5-entropy.html',
    load: () => import('./content/u5-entropy.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'The ideal-gas change', lab: null, ch: ['6'], topics: ['entropy-gas'], home: true },
      { id: 's2', n: 2, title: 'An incompressible liquid', lab: 'ts', ch: ['6'], topics: ['entropy-liquid'] },
      { id: 's3', n: 3, title: 'Steam heated at constant pressure', lab: 'ts', ch: ['6'], topics: ['entropy-steam'] },
      { id: 's4', n: 4, title: 'A turbine', lab: 'efficiency', ch: ['6'], topics: ['turbine-efficiency'] },
      { id: 's5', n: 5, title: 'A compressor and a nozzle', lab: 'efficiency', ch: ['6'], topics: ['compressor-efficiency', 'nozzle-efficiency'] },
      { id: 's6', n: 6, title: 'Heat through a wall', lab: 'wall', ch: ['6'], topics: ['lost-work', 'english'] },
      { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
};

export const notesForExam = (examId) => NOTES[examId] || null;

export const allNotes = () => Object.values(NOTES);

/**
 * The section a practice problem draws on. An explicit `problems` list wins. Otherwise the best
 * shared topics in the unit the problem names, so two units can share a textbook chapter.
 */
export function sectionForProblem(tpl) {
  const topics = new Set(tpl.topics || []);
  const sets = allNotes();
  for (const set of sets) {
    const named = set.sections.find((s) => s.problems?.includes(tpl.id));
    if (named) return { set, section: named };
  }
  let best = null;
  let bestScore = -1;
  for (const set of sets) {
    for (const s of set.sections) {
      if (!s.ch.includes(tpl.ch)) continue;
      const score = 100 * (set.exam === tpl.exam ? 1 : 0)
        + 10 * (s.topics || []).filter((t) => topics.has(t)).length
        + (s.lab && s.lab === tpl.lab ? 1 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { set, section: s };
      }
    }
  }
  return best;
}
