/**
 * Checks the step-through derivations (src/derive/):
 *   1. every step has exactly one right option, and every wrong one says why
 *   2. every line, option, unit check and piece of prose typesets in KaTeX
 *   3. run in the real lab, at its scenario and at several other setups, every line's numbers agree:
 *      both sides of an equation, or a formula and the lab's own value
 *   4. the overlay for each step's `show` key draws something
 */
import katex from 'katex';
import { DERIVATIONS } from '../src/derive/index.js';
import { agreesHeadless } from '../src/derive/agree.js';
import { loadLab } from '../src/labs/load.js';
import { headlessCtx, scenarioList } from '../src/problems/simbridge.js';

let failures = 0;
let lines = 0;
const fail = (who, msg) => {
  failures++;
  console.log(`FAIL ${who}: ${msg}`);
};

const typeset = (who, src, display) => {
  try {
    katex.renderToString(src, { displayMode: display, throwOnError: true });
  } catch (err) {
    fail(who, `TeX does not typeset: ${err.message.split('\n')[0]}`);
  }
};
/** Prose with $…$: typeset each piece of math. */
const prose = (who, s) => {
  const parts = String(s ?? '').split('$');
  if (parts.length % 2 === 0) fail(who, `unbalanced $ in "${s}"`);
  parts.forEach((p, i) => i % 2 && typeset(who, p, false));
};

/** Other setups each derivation is run at, beyond its scenario: the numbers must agree at all of them. */
const VARY = {
  rc: [
    (s) => Object.assign(s, { t: 0.3 * s.R * s.C1 }),
    (s) => Object.assign(s, { R: 4.7e4, C1: 2.2e-5, t: 2.5 * 4.7e4 * 2.2e-5 }),
    (s) => Object.assign(s, { E: 24, V0: 24, net: 'parallel', C1: 1e-5, C2: 3e-5, t: 1.7 * s.R * 4e-5 }),
    (s) => Object.assign(s, { net: 'series', C1: 1e-5, C2: 3e-5, t: 0.8 * s.R * 7.5e-6 }),
  ],
  biot: [
    (s) => s.kind === 'wire' && Object.assign(s, { L: 0.6, probe: { x: 0.2, y: 0.1, z: 0 } }),
    (s) => s.kind === 'wire' && Object.assign(s, { I: 5, L: 3, probe: { x: 0.05, y: -0.4, z: 0.03 } }),
    (s) => s.kind === 'loop' && Object.assign(s, { R: 0.4, I: 1.5, probe: { x: 0, y: 0.6, z: 0 } }),
    (s) => s.kind === 'loop' && Object.assign(s, { R: 0.1, probe: { x: 0, y: 0.02, z: 0 } }),
    (s) => s.kind === 'square' && Object.assign(s, { L: 1.5, I: 7 }),
    (s) => s.kind === 'square' && Object.assign(s, { L: 0.3, I: 0.5 }),
    (s) => s.kind === 'quarter' && Object.assign(s, { R: 0.1, I: 8 }),
    (s) => s.kind === 'quarter' && Object.assign(s, { R: 0.45, I: 1 }),
    (s) => s.kind === 'half' && Object.assign(s, { R: 0.1, I: 6 }),
    (s) => s.kind === 'hairpin' && Object.assign(s, { R: 0.35, I: 1.5 }),
    (s) => s.kind === 'sector' && Object.assign(s, { R: 0.08, L: 0.9, I: 5 }),
    (s) => s.kind === 'sector' && Object.assign(s, { R: 0.4, L: 0.3, I: 2 }),
    (s) => s.scenarioId === 'semis' && Object.assign(s, { R: 0.05, L: 0.6, I: 7 }),
    (s) => s.kind === 'wireloop' && Object.assign(s, { IL: 4.7746 }),
    (s) => s.kind === 'wireloop' && Object.assign(s, { I: 12, R: 0.1, L: 1.2, IL: -2 }),
    (s) => s.kind === 'rect' && Object.assign(s, { L: 2, R: 0.1, I: 4 }),
    (s) => s.kind === 'rect' && Object.assign(s, { L: 0.3, R: 0.45, I: 1 }),
    (s) => s.scenarioId === 'end' && Object.assign(s, { L: 2.5, I: 4, probe: { x: 0.05, y: 1.25, z: 0 } }),
    (s) => s.scenarioId === 'end' && Object.assign(s, { L: 0.4, probe: { x: 0.3, y: -0.2, z: 0 } }),
  ],
  ampere: [
    (s) => Object.assign(s, { r: 0.1 }),
    (s) => {
      s.wires[0].a = 0.42;
      s.wires[0].I = -4;
      s.r = 0.35;
    },
  ],
};

for (const d of DERIVATIONS) {
  const who = d.id;
  prose(`${who} goal`, d.goal);
  prose(`${who} done`, d.done);
  d.steps.forEach((st, k) => {
    const sw = `${who} step ${k + 1}`;
    prose(sw, st.ask);
    if (st.after) prose(sw, st.after);
    typeset(sw, st.line, true);
    if (st.units) typeset(sw, st.units, false);
    const ok = st.options.filter((o) => o.ok);
    if (ok.length !== 1) fail(sw, `${ok.length} right options, not 1`);
    for (const o of st.options) {
      if (o.tex) typeset(sw, o.tex, false);
      else prose(sw, o.text);
      if (!o.ok && !o.why) fail(sw, 'a wrong option with no reason why it is wrong');
      if (o.why) prose(sw, o.why);
    }
  });

  const lab = await loadLab(d.lab);
  if (!scenarioList(lab).some((sc) => sc.id === d.scenario)) {
    fail(who, `the ${d.lab} lab has no scenario "${d.scenario}"`);
    continue;
  }
  const setups = [null, ...(VARY[d.lab] || [])];
  let ran = 0;
  for (const [vi, vary] of setups.entries()) {
    const s = lab.defaultState();
    if (lab.applyScenario) lab.applyScenario(d.scenario, s);
    d.prepare?.(s);
    if (vary && vary(s) === false) continue;
    d.prepare?.(s);
    if (!d.applies(s)) {
      if (vi === 0) fail(who, `does not apply to its own scenario "${d.scenario}"`);
      continue;
    }
    const c = {};
    lab.recompute(s, c, headlessCtx());
    ran++;
    d.steps.forEach((st, k) => {
      let v;
      try {
        v = st.values(s, c);
      } catch (err) {
        fail(`${who} step ${k + 1} setup ${vi}`, `values() throws: ${err.message}`);
        return;
      }
      if (typeof v?.show !== 'string' || !v.show || /NaN|undefined|—/.test(v.show)) fail(`${who} step ${k + 1} setup ${vi}`, `shows "${v?.show}"`);
      for (const pair of v?.eq || []) {
        lines++;
        if (!pair.every(Number.isFinite) || !agreesHeadless([pair])) fail(`${who} step ${k + 1} setup ${vi}`, `${pair[0]} ≠ ${pair[1]} (${v.show})`);
      }
      if (st.show && d.overlay) {
        const prims = d.overlay(st.show, s, c);
        if (!prims.length) fail(`${who} step ${k + 1}`, `overlay "${st.show}" draws nothing`);
        for (const p of prims) {
          const pts = p.pts || [p.at];
          if (!pts.every((q) => q.length === 3 && q.every(Number.isFinite))) fail(`${who} step ${k + 1}`, `overlay "${st.show}" has a bad point`);
        }
      }
    });
  }
  if (ran < 2) fail(who, `ran at only ${ran} setup(s)`);
}

console.log(`derivations: ${DERIVATIONS.length} · ${DERIVATIONS.reduce((n, d) => n + d.steps.length, 0)} steps · ${lines} line values checked against the lab`);
if (failures) {
  console.log(`derive: ${failures} failure(s)`);
  process.exit(1);
}
console.log('derive: all checks passed');
