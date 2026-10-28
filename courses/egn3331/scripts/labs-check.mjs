#!/usr/bin/env node
/**
 * Each lab, on every scenario: the closed form and the second method agree (`gap`).
 * Each scenario's slider is swept end to end, and every stop must compute.
 * Each lab has two or three predict-first prompts, and the lab's own numbers give `expect`.
 * draw() stays in the browser (smoke.mjs). This only calls recompute.
 */
import { choices, outcomes, run } from '@flux/shells/engineering/predict.js';
import { LAB_META } from '../src/data/catalog.js';
import { loadLab } from '../src/labs/load.js';
import { mathProse } from '../src/ui/shared.js';

const LIMIT = {
  cut: 1e-9,
  'truss-stress': 1e-9,
  pins: 1e-12,
  'tension-test': 1e-6,
  poisson: 1e-9,
  brace: 1e-9,
  axial: 1e-8,
  indeterminate: 1e-12,
  rail: 1e-9,
};

const fails = [];
let checks = 0;
let sweeps = 0;
let promptsChecked = 0;

function typeset(id, text) {
  if (mathProse(String(text ?? '')).includes('katex-error')) fails.push(`${id}: KaTeX cannot parse: ${text}`);
}

function finite(id, computed) {
  for (const [key, value] of Object.entries(computed)) {
    if (typeof value === 'number' && !Number.isFinite(value)) fails.push(`${id}: ${key} is ${value}`);
  }
}

for (const id of Object.keys(LAB_META)) {
  const lab = await loadLab(id);
  if (lab.kind !== 'plot2d') fails.push(`${id}: kind ${lab.kind}, want plot2d`);
  const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
  if (!list.length) fails.push(`${id}: no scenarios`);
  for (const sc of list) {
    const state = lab.defaultState();
    lab.applyScenario(sc.id, state);
    const computed = {};
    try {
      lab.recompute(state, computed);
    } catch (err) {
      fails.push(`${id}/${sc.id}: ${err.message}`);
      continue;
    }
    checks++;
    if (!(computed.gap < LIMIT[id])) fails.push(`${id}/${sc.id}: gap ${computed.gap} exceeds ${LIMIT[id]}`);
    finite(`${id}/${sc.id}`, computed);

    // The slider, end to end.
    const range = lab.sweep?.(state);
    if (!range) {
      fails.push(`${id}/${sc.id}: no sweep() to say what the slider moves`);
      continue;
    }
    const { key, lo, hi, log } = range;
    for (let i = 0; i <= 40; i++) {
      const k = i / 40;
      const s = structuredClone(state);
      s[key] = log ? lo * (hi / lo) ** k : lo + k * (hi - lo);
      const c = {};
      try {
        lab.recompute(s, c);
      } catch (err) {
        fails.push(`${id}/${sc.id}: ${key} = ${s[key]} throws: ${err.message}`);
        break;
      }
      sweeps++;
      if (!(c.gap < LIMIT[id])) fails.push(`${id}/${sc.id}: ${key} = ${s[key]} gives gap ${c.gap}`);
      finite(`${id}/${sc.id} at ${key} = ${s[key]}`, c);
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
        const isBool = (w.mode || prompt.mode) === 'bool';
        const good = (x) => (isBool ? typeof x === 'boolean' : Number.isFinite(x));
        if (!(good(before[w.id]) && good(after[w.id]))) {
          fails.push(`${prompt.id}: ${w.id} is not ${isBool ? 'a boolean' : 'finite'} (${before[w.id]} → ${after[w.id]})`);
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
      lab.recompute(next, computed);
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
console.log(`labs: ${checks} scenario(s) agree with the second method · ${sweeps} slider stops computed · ${promptsChecked} predictions match`);
