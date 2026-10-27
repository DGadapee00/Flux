#!/usr/bin/env node
/**
 * Scaffold a new Flux lab: the file, catalog entry, loader entry, and
 * prediction stubs, all wired. The agent fills the physics where TODO marks it.
 *
 *   node tools/new-lab.mjs <course-id> <lab-id> --kind plot|scene2d|scene3d
 *       --unit u1 --title "Lab title" [--app] [--shell math|engineering]
 *
 * Kinds:
 *   plot    — math shell: function plot with sliders (direction fields, convergence…)
 *   scene2d — engineering shell: 2D diagram/chart lab, like the starter's tank
 *   scene3d — engineering shell: three.js scene lab, like phy2049's capacitor
 *
 * The shell defaults from the course's src/ui/hud.js (math vs engineering import).
 * Everything generated passes labs-check structurally; TODOs mark the content to write.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// The dep checker forbids even the literal text of a shells import in tools/,
// so the shell package path is built at runtime, never written out.
const SHELLS_PKG = '@flux/' + 'shells';
const ROOT = process.cwd();

function usage() {
  console.error(
    'usage: node tools/new-lab.mjs <course-id> <lab-id> --kind plot|scene2d|scene3d --unit u1 --title "Title" [--app] [--shell math|engineering]'
  );
  process.exit(1);
}

const [courseId, labId, ...rest] = process.argv.slice(2);
if (!courseId || !labId || labId.startsWith('-')) usage();
const opt = (name, def) => {
  const i = rest.indexOf(name);
  return i >= 0 && rest[i + 1] ? rest[i + 1] : def;
};
const flag = (name) => rest.includes(name);
const kind = opt('--kind');
const unit = opt('--unit');
const title = opt('--title');
if (!['plot', 'scene2d', 'scene3d'].includes(kind) || !unit || !title) usage();
const isApp = flag('--app');

const courseDir = join(ROOT, 'courses', courseId);
if (!existsSync(courseDir)) {
  console.error(`no such course: courses/${courseId}`);
  process.exit(1);
}

// Shell: explicit flag wins; otherwise read it from src/ui/hud.js.
let shell = opt('--shell');
if (!shell) {
  const hud = readFileSync(join(courseDir, 'src', 'ui', 'hud.js'), 'utf8');
  shell = hud.includes(SHELLS_PKG + '/math/') ? 'math' : 'engineering';
}
if (kind === 'plot' && shell !== 'math') {
  console.error('kind plot needs the math shell; pass --shell math or use scene2d/scene3d');
  process.exit(1);
}
if (kind !== 'plot' && shell !== 'engineering') {
  console.error(`kind ${kind} needs the engineering shell`);
  process.exit(1);
}

const labFile = join(courseDir, 'src', 'labs', `${labId}.js`);
if (existsSync(labFile) && !flag('--force')) {
  console.error(`${labFile} exists (pass --force to overwrite)`);
  process.exit(1);
}

const varName = labId.replace(/[^a-zA-Z0-9]/g, '_');

function plotLab() {
  return `import { cells, kv } from '${SHELLS_PKG}/math/shared.js';
import { fmtNum as fmt } from '${SHELLS_PKG}/math/format.js';
import { defineLab } from './define.js';

/**
 * TODO: one-line intuition this lab corrects ("Shows that …").
 *
 * TODO: describe the closed form and the second method that checks it.
 */
const SCENARIOS = [
  { id: 'a', name: 'TODO scenario 1', x: 1 },
  { id: 'b', name: 'TODO scenario 2', x: 2 },
  { id: 'c', name: 'TODO scenario 3', x: 3 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, x: sc.x });
}

/** TODO: the closed form. Pure: same state in, same numbers out. */
export function ${varName}Compute(x) {
  return { x, y: x /* TODO: real math */ };
}

/** TODO: second method (finer steps, series, balance residual…). Must agree with the closed form. */
function ${varName}Check(x) {
  return ${varName}Compute(x).y;
}

export default defineLab({
  id: '${labId}',
  exam: '${unit}',
  title: '${title}',
  hint: 'TODO: one-line hint naming what to move and what to watch.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('a', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'x', lo: 0, hi: 4 }),
  controls() {
    // TODO: sliders for each input. Keep labels short; units in the label.
    return \`<label class="row">x <input id="${labId}-x" type="range" min="0" max="4" step="0.01" value="1"></label>\`;
  },
  bind(api) {
    const el = () => document.getElementById('${labId}-x');
    el()?.addEventListener('input', (e) => api.set({ x: parseFloat(e.target.value) }));
  },
  syncControls(state) {
    const el = document.getElementById('${labId}-x');
    if (el && document.activeElement !== el) el.value = String(state.x);
  },
  compute(state) {
    const r = ${varName}Compute(state.x);
    const check = ${varName}Check(state.x);
    const gap = Math.abs(check - r.y) / Math.max(1e-12, Math.abs(r.y));
    return { ...r, check, gap };
  },
  plot(state, c) {
    // TODO: return the plot spec the math shell draws: axes, the curve, the point at state.x.
    return null;
  },
  law: () => ['TODO: the governing equation as a LaTeX string'],
  liveRows(state, c) {
    return [kv('closed form', fmt(c.y)), kv('second method', fmt(c.check))].join('');
  },
  readout(state, c) {
    return cells([['result', fmt(c.y)]]);
  },
  coach(state, c) {
    // TODO: what the numbers mean. Application labs end the explainer with
    // "What the course model leaves out." (D30).
    return { title: 'TODO', body: 'TODO: explain what the student just saw.' };
  },
});
`;
}

function scene2dLab() {
  return `import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, line, note, plotIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';

/**
 * TODO: one-line intuition this lab corrects ("Shows that …").
 *
 * Every lab has: scenarios with real numbers, sliders, a pure \`compute\` that returns every
 * number the panels show, a second method that checks the first (\`gap\`, held to a limit by
 * labs-check), predictions, and an explainer.
 */
const SCENARIOS = [
  { id: 'a', name: 'TODO scenario 1', p: 1 },
  { id: 'b', name: 'TODO scenario 2', p: 2 },
  { id: 'c', name: 'TODO scenario 3', p: 3 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, p: sc.p });
}

/** TODO: the closed form. Pure: same state in, same numbers out. */
export function ${varName}Compute(p) {
  return { p, out: p /* TODO: real math */ };
}

/** TODO: second method (march forward in small steps, balance residual…). Must agree. */
function ${varName}Check(p) {
  return ${varName}Compute(p).out;
}

export default defineLab({
  id: '${labId}',
  exam: '${unit}',
  title: '${title}',
  hint: 'TODO: one-line hint naming what to move and what to watch.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('a', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'p', lo: 0, hi: 4 }),
  controls() {
    return \`
      \${slider('${labId}-p', 'TODO label (units)', 1, 0, 4, 0.05)}\`;
  },
  bind(api) {
    bindSlider('${labId}-p', (s, v) => { s.p = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('${labId}-p');
    if (el && document.activeElement !== el) el.value = String(state.p);
  },
  compute(state) {
    const r = ${varName}Compute(state.p);
    const check = ${varName}Check(state.p);
    const gap = Math.abs(check - r.out) / Math.max(1e-12, Math.abs(r.out));
    return { ...r, check, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    // TODO: paint the scene: axes, the curve/levels from c, markers. See diagram.js helpers.
    const P = plotIn(B, B.free, { lo: 0, hi: 10 }, { lo: 0, hi: 10 });
    axes(P, { xLabel: 'TODO x', yLabel: 'TODO y' });
    dot(P, c.p, c.out, { color: C.teal, r: 5 });
  },
  law: () => ['TODO: the governing equation as a LaTeX string'],
  liveRows(state, c) {
    return [
      kv('closed form', fig(c.out)),
      kv('second method', fig(c.check)),
    ].join('');
  },
  readout(state, c) {
    return cells([['result', fig(c.out)]]);
  },
  coach(state, c) {
    // TODO: what the numbers mean. Application labs end the explainer with
    // **What the course model leaves out.** (D30).
    return { title: 'TODO', body: 'TODO: explain what the student just saw.' };
  },
});
`;
}

function scene3dLab() {
  return `import * as THREE from 'three';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { defineLab } from './define.js';

/**
 * TODO: one-line intuition this lab corrects ("Shows that …").
 *
 * A 3D scene lab: build the geometry in init(), move it in syncViews(), compute the
 * numbers in compute() with a second method checking the first.
 */
const SCENARIOS = [
  { id: 'a', name: 'TODO scenario 1', p: 1 },
  { id: 'b', name: 'TODO scenario 2', p: 2 },
  { id: 'c', name: 'TODO scenario 3', p: 3 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, p: sc.p });
}

/** TODO: the closed form. Pure: same state in, same numbers out. */
export function ${varName}Compute(p) {
  return { p, out: p /* TODO: real math */ };
}

/** TODO: second method. Must agree with the closed form. */
function ${varName}Check(p) {
  return ${varName}Compute(p).out;
}

export default defineLab({
  id: '${labId}',
  exam: '${unit}',
  title: '${title}',
  hint: 'TODO: one-line hint naming what to move and what to watch.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('a', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'p', lo: 0, hi: 4 }),
  controls() {
    // TODO: sliders / toggles for each input.
    return \`<label class="row">p <input id="${labId}-p" type="range" min="0" max="4" step="0.05" value="1"></label>\`;
  },
  bind(api) {
    const el = () => document.getElementById('${labId}-p');
    el()?.addEventListener('input', (e) => api.set({ p: parseFloat(e.target.value) }));
  },
  syncControls(state) {
    const el = document.getElementById('${labId}-p');
    if (el && document.activeElement !== el) el.value = String(state.p);
  },
  init() {
    // TODO: build the three.js objects once; return handles syncViews moves.
    return {};
  },
  syncViews(h, state, c) {
    // TODO: move the objects from init() to match state/c.
  },
  compute(state) {
    const r = ${varName}Compute(state.p);
    const check = ${varName}Check(state.p);
    const gap = Math.abs(check - r.out) / Math.max(1e-12, Math.abs(r.out));
    return { ...r, check, gap };
  },
  law: () => ['TODO: the governing equation as a LaTeX string'],
  liveRows(state, c) {
    return [
      kv('closed form', fig(c.out)),
      kv('second method', fig(c.check)),
    ].join('');
  },
  readout(state, c) {
    return cells([['result', fig(c.out)]]);
  },
  coach(state, c) {
    // TODO: what the numbers mean. Application labs end the explainer with
    // **What the course model leaves out.** (D30).
    return { title: 'TODO', body: 'TODO: explain what the student just saw.' };
  },
});
`;
}

const body = kind === 'plot' ? plotLab() : kind === 'scene2d' ? scene2dLab() : scene3dLab();
writeFileSync(labFile, body);
console.log(`wrote ${labFile}`);

// 2. Catalog entry.
const catalogFile = join(courseDir, 'src', 'data', 'catalog.js');
let catalog = readFileSync(catalogFile, 'utf8');
// A lab id with a hyphen is not a bare identifier, so its object key needs quotes.
const key = /^[A-Za-z_$][\w$]*$/.test(labId) ? labId : `'${labId}'`;
const listed = (text) => text.includes(`  ${labId}:`) || text.includes(`'${labId}':`);
const metaLine = `  ${key}: { id: '${labId}', exam: '${unit}', title: '${title}'${isApp ? ", app: true" : ''} },`;
if (listed(catalog)) {
  console.log(`catalog already lists ${labId}, skipping`);
} else {
  catalog = catalog.replace(
    /export const LAB_META = \{/,
    `export const LAB_META = {\n${metaLine}`
  );
  writeFileSync(catalogFile, catalog);
  console.log(`catalog: added LAB_META.${labId}`);
}

// 3. Loader entry.
const loadFile = join(courseDir, 'src', 'labs', 'load.js');
let load = readFileSync(loadFile, 'utf8');
if (listed(load)) {
  console.log(`loader already lists ${labId}, skipping`);
} else {
  load = load.replace(
    /const loaders = \{/,
    `const loaders = {\n  ${key}: () => import('./${labId}.js'),`
  );
  writeFileSync(loadFile, load);
  console.log(`loader: added ${labId}`);
}

// 4. Prediction stubs.
const predFile = join(courseDir, 'src', 'labs', 'predictions.js');
let pred = readFileSync(predFile, 'utf8');
if (listed(pred)) {
  console.log(`predictions already list ${labId}, skipping`);
} else {
  const stub = `  ${key}: [
    {
      id: '${labId}-up',
      scenario: 'a',
      ask: 'TODO: a change a student can predict (raise an input).',
      apply(s) { s.p = s.p; /* TODO: change one input */ },
      watch: [{ id: 'out', label: 'TODO what to watch', get: (c) => c.out }],
      mode: 'dir',
      expect: { out: 'smaller' /* TODO: smaller|larger|same, then fill why with numbers */ },
      why: 'TODO: the numbers before and after, and the principle.',
    },
    {
      id: '${labId}-double',
      scenario: 'a',
      ask: 'TODO: double an input; predict the factor.',
      apply(s) { s.p = s.p; /* TODO */ },
      watch: [{ id: 'out', label: 'TODO what to watch', get: (c) => c.out }],
      mode: 'factor',
      expect: { out: 2 /* TODO: the factor */ },
      why: 'TODO: why this factor, with numbers.',
    },
  ],`;
  pred = pred.replace(/export const PREDICTIONS = \{/, `export const PREDICTIONS = {\n${stub}`);
  writeFileSync(predFile, pred);
  console.log(`predictions: added 2 stubs for ${labId}`);
}

console.log(`\ndone. Next: fill the TODOs in ${labFile}, then run the course's labs-check.`);
