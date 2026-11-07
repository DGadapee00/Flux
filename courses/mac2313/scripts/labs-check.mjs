#!/usr/bin/env node
/**
 * Each lab that states a `gapLimit`, on every scenario: its routes to the same number agree.
 * `recompute` returns `gap`, the largest disagreement between a closed form and a second method
 * (a numerical line integral, an area sum). A lab with `sweep(state)` has that slider moved end to
 * end on every scenario, and every stop must compute and agree.
 *
 * The labs imported from the earlier MAC 2313 app check their routes in the readout and in
 * src/math/selftest.js; they state no `gapLimit` yet, so this script lists them and passes over them.
 */
import { LAB_META } from '../src/data/catalog.js';
import { loadLab } from '../src/labs/load.js';
import { headlessCtx } from '../src/problems/simbridge.js';

const fails = [];
const skipped = [];
let checks = 0;
let sweeps = 0;

for (const id of Object.keys(LAB_META)) {
  const lab = await loadLab(id);
  const limit = lab.gapLimit;
  if (!(limit > 0)) {
    skipped.push(id);
    continue;
  }
  const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
  if (!list.length) fails.push(`${id}: no scenarios`);
  for (const sc of list) {
    const state = lab.defaultState();
    lab.applyScenario(sc.id, state);
    const run = (st, where) => {
      const c = {};
      try {
        lab.recompute(st, c, headlessCtx());
      } catch (err) {
        fails.push(`${id}/${where}: ${err.message}`);
        return;
      }
      if (!(c.gap < limit)) fails.push(`${id}/${where}: gap ${c.gap} exceeds ${limit}`);
      for (const [k, v] of Object.entries(c)) if (typeof v === 'number' && Number.isNaN(v)) fails.push(`${id}/${where}: ${k} is NaN`);
    };
    run(state, sc.id);
    checks++;
    const range = lab.sweep?.(state);
    if (range) {
      for (let i = 0; i <= 40; i++) {
        const st = structuredClone(state);
        st[range.key] = range.lo + (i / 40) * (range.hi - range.lo);
        run(st, `${sc.id} at ${range.key} = ${st[range.key].toFixed(3)}`);
        sweeps++;
      }
    }
  }
}

if (fails.length) {
  console.error(fails.join('\n'));
  process.exit(1);
}
console.log(`labs-check ok: ${checks} scenarios, ${sweeps} sweep stops; no gapLimit yet: ${skipped.join(', ')}`);
