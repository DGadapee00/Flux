#!/usr/bin/env node
/**
 * Each lab, on every scenario: the closed form and the numeric second method agree.
 * Each lab has two or three predict-first prompts, and the lab's own numbers give `expect`.
 * init and syncViews stay in the browser. This only calls recompute.
 */
import { choices, outcomes, run } from '@flux/shells/engineering/predict.js';
import { LAB_META } from '../src/data/catalog.js';
import { loadLab } from '../src/labs/load.js';
import { headlessCtx } from '../src/problems/simbridge.js';
import { mathProse } from '../src/ui/shared.js';

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
  ic: 1e-4,
  'slider-crank': 1e-4,
  rolling: 1e-4,
  inertia: 1e-4,
  pendulum: 1e-6,
  'roll-slip': 1e-6,
  race: 1e-6,
  linkage: 1e-4,
};

const fails = [];
let checks = 0;
let promptsChecked = 0;

function typeset(id, text) {
  if (mathProse(String(text ?? '')).includes('katex-error')) fails.push(`${id}: KaTeX cannot parse: ${text}`);
}

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

  const prompts = lab.predictions || [];
  if (prompts.length < 2 || prompts.length > 3) fails.push(`${id}: ${prompts.length} predictions; want 2 or 3`);
  const seen = new Set();
  for (const prompt of prompts) {
    promptsChecked++;
    if (!prompt.id || seen.has(prompt.id)) fails.push(`${id}: prediction id ${prompt.id || '(missing)'} is missing or repeated`);
    seen.add(prompt.id);
    if (!list.some((sc) => sc.id === prompt.scenario)) fails.push(`${prompt.id}: no scenario ${prompt.scenario}`);
    if (!prompt.watch?.length) fails.push(`${prompt.id}: nothing to watch`);
    typeset(prompt.id, prompt.ask);
    typeset(prompt.id, prompt.why);
    for (const w of prompt.watch || []) typeset(prompt.id, w.label);
    const state = lab.defaultState();
    try {
      lab.applyScenario(prompt.scenario, state);
      const { before, after, next } = run(lab, state, prompt);
      const got = outcomes(prompt, before, after);
      for (const w of prompt.watch) {
        const mode = w.mode || prompt.mode;
        if (mode !== 'bool' && !(Number.isFinite(before[w.id]) && Number.isFinite(after[w.id]))) {
          fails.push(`${prompt.id}: ${w.id} is not finite (${before[w.id]} → ${after[w.id]})`);
        }
        if (!(w.id in prompt.expect)) fails.push(`${prompt.id}: ${w.id} has no expected outcome`);
        else if (!choices(prompt, w).some(([value]) => value === prompt.expect[w.id])) {
          fails.push(`${prompt.id}: expected ${prompt.expect[w.id]} for ${w.id} is not a choice`);
        }
        if (got[w.id] !== prompt.expect[w.id]) {
          fails.push(`${prompt.id}: ${w.id} lab says ${got[w.id]} (${before[w.id]} → ${after[w.id]}), prompt expects ${prompt.expect[w.id]}`);
        }
      }
      const computed = {};
      lab.recompute(next, computed, headlessCtx());
      if (!(computed.gap < LIMIT[id])) fails.push(`${prompt.id}: after the change, gap ${computed.gap} exceeds ${LIMIT[id]}`);
    } catch (err) {
      fails.push(`${prompt.id}: ${err.message}`);
    }
  }
}

if (fails.length) {
  console.error(fails.join('\n'));
  process.exit(1);
}
console.log(`labs: ${checks} scenario(s) agree with the second method · ${promptsChecked} predictions match`);
