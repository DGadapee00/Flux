#!/usr/bin/env node
/**
 * Each Unit 1 lab, on every scenario: the closed form and the numeric second method agree.
 * init and syncViews stay in the browser. This only calls recompute.
 */
import { LAB_META } from '../src/data/catalog.js';
import { loadLab } from '../src/labs/load.js';
import { headlessCtx } from '../src/problems/simbridge.js';

const LIMIT = {
  rectilinear: 2e-3,
  'path-nt': 1e-3,
  relative: 1e-4,
  fma: 1e-6,
  curve: 1e-4,
  collar: 1e-6,
  paths: 1e-5,
  impulse: 1e-6,
  impact: 1e-9,
  rocket: 1e-4,
};

const fails = [];
let checks = 0;
for (const id of Object.keys(LAB_META)) {
  const lab = await loadLab(id);
  const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
  if (!list.length) fails.push(`${id}: no scenarios`);
  for (const sc of list) {
    const state = lab.defaultState();
    lab.applyScenario(sc.id, state);
    const computed = {};
    try {
      lab.recompute(state, computed, headlessCtx());
    } catch (err) {
      fails.push(`${id}/${sc.id}: ${err.message}`);
      continue;
    }
    checks++;
    if (!(computed.gap < LIMIT[id])) fails.push(`${id}/${sc.id}: gap ${computed.gap} exceeds ${LIMIT[id]}`);
    for (const [key, value] of Object.entries(computed)) {
      if (typeof value === 'number' && !Number.isFinite(value)) fails.push(`${id}/${sc.id}: ${key} is ${value}`);
    }
  }
}

if (fails.length) {
  console.error(fails.join('\n'));
  process.exit(1);
}
console.log(`labs: ${checks} scenario(s) agree with the second method`);
