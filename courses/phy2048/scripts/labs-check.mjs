#!/usr/bin/env node
/**
 * Headless check for the PHY 2048 labs (no browser, no scene):
 *   node scripts/labs-check.mjs
 *
 * For every lab named in the catalog:
 *   1. it is a scene3d lab, and its exam is the unit that lists it
 *   2. each scenario's recompute agrees with second(), a different method
 *   3. it has two to four predictions, and the lab's own numbers give `expect`
 *   4. the readout, the law, and the prediction prose typeset
 */
import { createTex, mathPieces } from '@flux/core';
import { UNITS } from '../src/catalog.js';
import { loadLab } from '../src/labs/load.js';
import { choices, outcomes, run } from '../src/labs/predict.js';

const { mathProse, tex } = createTex();
const errors = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);

function agree(got, want) {
  if (want === null || got === null) return want === got;
  if (typeof want === 'boolean') return got === want;
  const scale = Math.max(1, Math.abs(want));
  return Number.isFinite(got) && Math.abs(got - want) <= 1e-6 * scale;
}

function typeset(id, text) {
  const s = String(text ?? '');
  if (/undefined|NaN/.test(s)) err(id, `text contains undefined/NaN: ${s.slice(0, 160)}`);
  if (mathPieces(s).some((piece) => piece.unclosed)) err(id, `unclosed math: ${s.slice(0, 160)}`);
  if (mathProse(s).includes('katex-error')) err(id, `KaTeX cannot parse this: ${s.slice(0, 160)}`);
}

const listed = [];
for (const unit of UNITS) {
  for (const id of unit.labs) listed.push({ id, unit });
}

const seen = new Set();
for (const { id, unit } of listed) {
  if (seen.has(id)) err(id, 'listed in two units');
  seen.add(id);
  const lab = await loadLab(id);
  if (!lab) {
    err(id, 'catalog names a lab that does not load');
    continue;
  }
  if (lab.kind !== 'scene3d') err(id, `kind ${lab.kind}`);
  if (lab.exam !== unit.id) err(id, `exam ${lab.exam} is not unit ${unit.id}`);
  if (typeof lab.second !== 'function') err(id, 'missing second()');
  if (typeof lab.recompute !== 'function') err(id, 'missing recompute()');
  const scenarios = lab.scenarios || [];
  if (scenarios.length < 2) err(id, 'needs at least two scenarios');
  typeset(id, lab.hint);

  for (const sc of scenarios) {
    const state = lab.defaultState();
    lab.applyScenario(sc.id, state);
    const computed = {};
    try {
      lab.recompute(state, computed);
    } catch (e) {
      err(id, `scenario ${sc.id} recompute threw: ${e.message}`);
      continue;
    }
    let other;
    try {
      other = lab.second(state);
    } catch (e) {
      err(id, `scenario ${sc.id} second() threw: ${e.message}`);
      continue;
    }
    for (const [key, want] of Object.entries(other)) {
      if (!agree(computed[key], want)) err(id, `scenario ${sc.id} ${key}: ${computed[key]} vs second ${want}`);
    }
    for (const [label, value] of lab.readoutCells(state, computed)) {
      typeset(id, label);
      typeset(id, value);
    }
    for (const line of lab.law(state, computed)) {
      if (!line || /undefined|NaN/.test(line)) err(id, `law line is empty or has undefined: ${line}`);
      else if (tex(line).includes('katex-error')) err(id, `KaTeX cannot parse this law: ${line.slice(0, 160)}`);
    }
    const coach = lab.coach(state, computed);
    typeset(id, coach.title);
    const body = Array.isArray(coach.body) ? coach.body : [coach.body];
    for (const block of body) typeset(id, block);
  }

  const prompts = lab.predictions || [];
  if (prompts.length < 2 || prompts.length > 4) err(id, `${prompts.length} predictions; want 2 to 4`);
  for (const prompt of prompts) {
    const pid = prompt.id;
    if (!scenarios.some((sc) => sc.id === prompt.scenario)) err(pid, `no scenario ${prompt.scenario}`);
    const state = lab.defaultState();
    try {
      lab.applyScenario(prompt.scenario, state);
      const { before, after, next } = run(lab, state, prompt);
      const got = outcomes(prompt, before, after);
      for (const w of prompt.watch) {
        const mode = w.mode || prompt.mode;
        if (mode !== 'bool' && !(Number.isFinite(before[w.id]) && Number.isFinite(after[w.id]))) {
          err(pid, `${w.id}: not finite (${before[w.id]} → ${after[w.id]})`);
        }
        if (!(w.id in prompt.expect)) err(pid, `${w.id}: no expected outcome`);
        else if (!choices(prompt, w).some(([value]) => value === prompt.expect[w.id])) {
          err(pid, `${w.id}: expected ${prompt.expect[w.id]} is not a choice`);
        }
        if (got[w.id] !== prompt.expect[w.id]) {
          err(pid, `${w.id}: lab says ${got[w.id]} (${before[w.id]} → ${after[w.id]}), prompt expects ${prompt.expect[w.id]}`);
        }
      }
      const other = lab.second(next);
      const computed = {};
      lab.recompute(next, computed);
      for (const [key, want] of Object.entries(other)) {
        if (!agree(computed[key], want)) err(pid, `after the change, ${key}: ${computed[key]} vs second ${want}`);
      }
    } catch (e) {
      err(pid, e.message);
    }
    typeset(pid, prompt.ask);
    typeset(pid, prompt.why);
    for (const w of prompt.watch) typeset(pid, w.label);
  }
}

const launch = listed.find((row) => row.id === 'projectile');
if (!launch) err('projectile', 'the catalog must list the launch lab');
else {
  const lab = await loadLab('projectile');
  if (!lab || !/drag is left out/i.test(String(lab.hint ?? ''))) {
    err('projectile', 'the launch lab must say that drag is left out');
  }
}

if (errors.length) {
  console.error(`labs-check: ${errors.length} failed`);
  for (const line of errors) console.error('  ' + line);
  process.exit(1);
}
console.log(`labs-check: ${listed.length} labs, ${listed.length} passed`);
