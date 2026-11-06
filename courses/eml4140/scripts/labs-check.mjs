#!/usr/bin/env node
/**
 * Each lab, on every scenario: the closed form and the numeric second method agree.
 * Each lab has two to four predict-first prompts, and the lab's own numbers give `expect`.
 * A lab with `sweep(state)` has that slider moved end to end, and every stop must compute.
 * init and syncViews stay in the browser. This only calls recompute.
 */
import { choices, outcomes, run } from '@flux/shells/engineering/predict.js';
import { LAB_META } from '../src/data/catalog.js';
import { loadLab } from '../src/labs/load.js';
import { headlessCtx } from '../src/problems/simbridge.js';
import { mathProse } from '../src/ui/shared.js';

const LIMIT = {
};

const onlyAt = process.argv.indexOf('--only');
const ONLY = onlyAt >= 0 ? process.argv[onlyAt + 1] : '';

const fails = [];
let checks = 0;
let sweeps = 0;
let promptsChecked = 0;

function typeset(id, text) {
  if (mathProse(String(text ?? '')).includes('katex-error')) fails.push(`${id}: KaTeX cannot parse: ${text}`);
}

for (const id of Object.keys(LAB_META)) {
  if (ONLY && id !== ONLY) continue;
  const lab = await loadLab(id);
  // An application lab states its own limit; the older labs keep theirs in LIMIT.
  const limit = lab.gapLimit ?? LIMIT[id];
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
    if (!(computed.gap < limit)) fails.push(`${id}/${sc.id}: gap ${computed.gap} exceeds ${limit}`);
    for (const [key, value] of Object.entries(computed)) {
      if (typeof value === 'number' && !Number.isFinite(value)) fails.push(`${id}/${sc.id}: ${key} is ${value}`);
    }
    // A lab that names its main slider (the 2D application labs) is swept end to end.
    const range = lab.sweep?.(state);
    if (range) {
      const { key, lo, hi } = range;
      for (let i = 0; i <= 40; i++) {
        const st = structuredClone(state);
        st[key] = lo + (i / 40) * (hi - lo);
        const c = {};
        try {
          lab.recompute(st, c, headlessCtx());
        } catch (err) {
          fails.push(`${id}/${sc.id}: ${key} = ${st[key]} throws: ${err.message}`);
          break;
        }
        sweeps++;
        if (!(c.gap < limit)) fails.push(`${id}/${sc.id}: ${key} = ${st[key]} gives gap ${c.gap}`);
        for (const [k, v] of Object.entries(c)) if (typeof v === 'number' && !Number.isFinite(v)) fails.push(`${id}/${sc.id} at ${key} = ${st[key]}: ${k} is ${v}`);
      }
    }
  }

  const prompts = lab.predictions || [];
  if (prompts.length < 2 || prompts.length > 4) fails.push(`${id}: ${prompts.length} predictions; want 2 to 4`);
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
      if (!(computed.gap < limit)) fails.push(`${prompt.id}: after the change, gap ${computed.gap} exceeds ${limit}`);
    } catch (err) {
      fails.push(`${prompt.id}: ${err.message}`);
    }
  }
}

if (fails.length) {
  console.error(fails.join('\n'));
  process.exit(1);
}
console.log(`labs: ${checks} scenario(s) agree with the second method · ${sweeps} slider stops · ${promptsChecked} predictions match`);
