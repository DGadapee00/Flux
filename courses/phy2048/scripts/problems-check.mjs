#!/usr/bin/env node
/**
 * Problem-bank check for PHY 2048 (no browser, no lab):
 *   node scripts/problems-check.mjs [--samples N] [--only idPrefix]
 *
 * For every template in the banked chapters:
 *   1. the worked case matches its key, and the grader accepts that key
 *   2. second() agrees with the library answer (a different method)
 *   3. seeded samples stay finite, and choice answers are options
 *   4. text, hints and steps typeset, with no undefined or NaN
 *   5. a symbolic key evaluates to get(), carries the stated units, and
 *      the grader rejects a perturbed expression
 */
import { createTex, mathPieces } from '@flux/core';
import { dimEqual, parseUnit } from '@flux/subjects/mechanics/units.js';
import { BANK_CHAPTERS, CHAPTERS, LAB_META, unitForChapter } from '../src/catalog.js';
import { PROBLEMS } from '../src/problems/index.js';
import {
  build, choiceOptions, dimensionOf, evalSymbolic, expected, grade, gradeSymbolic, instance, parseExpr, render, withinTol,
} from '../src/problems/engine.js';
import { loadLab } from '../src/labs/load.js';
import { applyProblem, headlessCtx } from '../src/problems/simbridge.js';

const { mathProse } = createTex();

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const SAMPLES = Number(opt('--samples', 40));
const ONLY = opt('--only', '');

const errors = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);

function agree(got, want) {
  if (typeof want === 'string') return got === want;
  const scale = Math.max(1, Math.abs(want));
  return Number.isFinite(got) && Math.abs(got - want) <= 1e-6 * scale;
}

function checkRender(tpl, inst) {
  const r = render(inst);
  const strings = [
    r.text,
    ...r.parts.map((p) => `${p.label ?? ''} ${(p.options || []).map((o) => o.label).join(' ')}`),
    ...r.steps,
    ...r.hints,
  ];
  const blob = strings.join('\n');
  if (/undefined|NaN|\[object/.test(blob)) err(tpl.id, `rendered text contains undefined/NaN:\n${blob.slice(0, 300)}`);
  for (const s of strings) {
    if (mathPieces(s).some((piece) => piece.unclosed)) err(tpl.id, `unclosed math: ${s}`);
    if (mathProse(s).includes('katex-error')) err(tpl.id, `KaTeX cannot parse this: ${s}`);
  }
}

function checkSecond(tpl, inst, label) {
  let got;
  try {
    got = tpl.second(inst.$);
  } catch (e) {
    err(tpl.id, `${label} second() threw: ${e.message}`);
    return;
  }
  for (const part of tpl.parts) {
    if (part.kind === 'symbolic') continue;
    if (!Object.hasOwn(got, part.id)) {
      err(tpl.id, `${label} second() has no ${part.id}`);
      continue;
    }
    const want = part.kind === 'numeric' ? part.get(inst.$) : expected(part, inst.$);
    if (!agree(got[part.id], want)) {
      err(tpl.id, `${label} second ${part.id}: ${got[part.id]} vs library ${want}`);
    }
  }
}

function checkSymbolic(tpl, inst) {
  for (const part of tpl.parts.filter((p) => p.kind === 'symbolic')) {
    const a = evalSymbolic(part, inst.$);
    const b = part.get(inst.$);
    if (!(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)))) {
      err(tpl.id, `symbolic ${part.id}: key gives ${a}, get() gives ${b}`);
    }
    if (!gradeSymbolic(part, part.expr).correct) err(tpl.id, `grader rejects its own key for ${part.id}`);
    if (gradeSymbolic(part, `(${part.expr})*1.1`).correct) err(tpl.id, `grader accepts a wrong answer for ${part.id}`);
    if (!part.unit || !part.units) {
      err(tpl.id, `symbolic ${part.id}: declare the symbol units and the answer unit`);
      continue;
    }
    try {
      const got = dimensionOf(parseExpr(part.expr, part.vars, part.alias), part.units);
      if (!dimEqual(got, parseUnit(part.unit))) err(tpl.id, `symbolic ${part.id}: units do not match ${part.unit}`);
    } catch (e) {
      err(tpl.id, `symbolic ${part.id}: units — ${e.message}`);
    }
  }
}

/** Units built to the standard. Their templates must meet the unit rules below; the others are reworked as their units are built. */
const STANDARD_UNITS = ['u1', 'u2', 'u3'];


/** The lab, set up as the problem sets it up, must show the answers the template computes. */
async function checkSim(tpl, inst, label) {
  if (!tpl.lab || !tpl.sim) return;
  const lab = await loadLab(tpl.lab);
  if (!lab) {
    err(tpl.id, `${label}: lab ${tpl.lab} does not load`);
    return;
  }
  const slice = lab.defaultState();
  const computed = {};
  try {
    applyProblem(lab, slice, inst);
    lab.recompute(slice, computed, headlessCtx());
  } catch (e) {
    err(tpl.id, `${label}: the lab throws on this setup: ${e.message}`);
    return;
  }
  if (!tpl.sim.read) return;
  for (const [id, shown] of Object.entries(tpl.sim.read(computed, slice))) {
    const part = tpl.parts.find((p) => p.id === id);
    if (!part) {
      err(tpl.id, `${label}: sim.read names ${id}, which is not a part`);
      continue;
    }
    const want = part.get(inst.$);
    if (!(Math.abs(shown - want) <= 0.02 * Math.max(1e-9, Math.abs(want)) + 1e-9)) {
      err(tpl.id, `${label}: the lab shows ${id} = ${shown}, the template says ${want}`);
    }
  }
}

/** Every trap must be a number a student could type, and must differ from the answer in some version. */
function checkTraps(tpl) {
  if (!STANDARD_UNITS.includes(tpl.exam)) return;
  for (const part of tpl.parts.filter((p) => p.kind === 'numeric' && p.traps?.length)) {
    part.traps.forEach(([get, why], i) => {
      let live = 0;
      for (let seed = 1; seed <= 40; seed += 1) {
        const inst = instance(tpl, seed);
        const value = get(inst.$);
        if (!Number.isFinite(value)) {
          err(tpl.id, `${part.id} trap ${i + 1} is not finite at seed ${seed}`);
          return;
        }
        const right = part.get(inst.$);
        if (Math.abs(value - right) > 0.02 * Math.max(Math.abs(right), 1e-9) + 1e-9) live += 1;
      }
      if (!live) err(tpl.id, `${part.id} trap ${i + 1} never differs from the answer, so it can never fire`);
      if (typeof why !== 'string' || why.length < 15) err(tpl.id, `${part.id} trap ${i + 1} has no explanation`);
    });
  }
}

const seen = new Set();
const counts = Object.fromEntries(BANK_CHAPTERS.map((ch) => [ch, 0]));

for (const tpl of PROBLEMS) {
  if (ONLY && !tpl.id.startsWith(ONLY)) continue;
  if (seen.has(tpl.id)) err(tpl.id, 'duplicate id');
  seen.add(tpl.id);
  if (!BANK_CHAPTERS.includes(tpl.ch)) err(tpl.id, `chapter ${tpl.ch} is outside this slice`);
  else counts[tpl.ch] += 1;
  if (!CHAPTERS[tpl.ch]) err(tpl.id, `chapter ${tpl.ch} has no title`);
  const unit = unitForChapter(tpl.ch);
  if (!unit || tpl.exam !== unit.id) err(tpl.id, `exam ${tpl.exam} does not own chapter ${tpl.ch}`);
  if (!/^OpenStax University Physics Vol\. 1 §\d+\.\d+$/.test(tpl.src)) err(tpl.id, `citation missing: ${tpl.src}`);
  const standard = STANDARD_UNITS.includes(tpl.exam);
  if (!!tpl.lab !== !!tpl.sim) err(tpl.id, 'a problem with a lab needs a sim, and a sim needs a lab');
  if (tpl.lab && !LAB_META[tpl.lab]) err(tpl.id, `lab ${tpl.lab} is not in the catalog`);
  if (tpl.lab && LAB_META[tpl.lab] && !unit?.labs.includes(tpl.lab)) err(tpl.id, `lab ${tpl.lab} is not one of ${unit?.id}'s labs`);
  if (standard && !Number.isInteger(tpl.level) || tpl.level < 1 || tpl.level > 3) err(tpl.id, `level ${tpl.level} is not 1, 2 or 3`);
  if (standard && !tpl.variety?.length && !Object.values(tpl.vars || {}).some((x) => x?.type === 'choice')) err(tpl.id, 'declare `variety`, or vary a choice variable');
  const cited = tpl.cases.filter((c) => /OpenStax University Physics Vol\. 1 §\d+\.\d+/.test(c.src));
  if (standard && !cited.length) err(tpl.id, 'no case cites an OpenStax section and example');
  if (typeof tpl.second !== 'function') err(tpl.id, 'missing second()');
  if (!tpl.hints?.length) err(tpl.id, 'missing hints');
  if (typeof tpl.steps !== 'function') err(tpl.id, 'missing steps');
  if (!tpl.cases?.length) err(tpl.id, 'no worked case');
  checkTraps(tpl);

  for (const c of tpl.cases) {
    let inst;
    try {
      inst = build(tpl, c.v);
    } catch (e) {
      err(tpl.id, `case ${c.src}: ${e.message}`);
      continue;
    }
    if (!tpl.valid(inst.$)) err(tpl.id, `case ${c.src} fails valid()`);
    for (const part of tpl.parts) {
      if (part.kind === 'symbolic') continue;
      if (!Object.hasOwn(c.want, part.id)) {
        err(tpl.id, `case ${c.src}: no key for ${part.id}`);
        continue;
      }
      const got = expected(part, inst.$);
      const want = c.want[part.id];
      const ok = part.kind === 'numeric'
        ? withinTol(got, want, part)
        : got === want;
      if (!ok) err(tpl.id, `case ${c.src} part ${part.id}: got ${got}, expected ${want}`);
      if (part.kind === 'numeric' && !grade(part, inst.$, String(want)).correct) {
        err(tpl.id, `case ${c.src} part ${part.id}: grader rejects ${want}`);
      }
    }
    checkSecond(tpl, inst, `case ${c.src.slice(0, 40)}`);
    await checkSim(tpl, inst, `case ${c.src.slice(0, 40)}`);
    checkSymbolic(tpl, inst);
    checkRender(tpl, inst);
  }

  const n = Object.keys(tpl.vars).length ? SAMPLES : 1;
  for (let seed = 1; seed <= n; seed++) {
    let inst;
    try {
      inst = instance(tpl, seed);
    } catch (e) {
      err(tpl.id, e.message);
      break;
    }
    for (const part of tpl.parts) {
      if (part.kind === 'numeric' && !Number.isFinite(part.get(inst.$))) {
        err(tpl.id, `seed ${seed} part ${part.id} not finite`);
      }
      if (part.kind === 'choice') {
        const want = expected(part, inst.$);
        const opts = new Set(choiceOptions(part, inst.$).map((o) => o.value));
        if (!opts.has(want)) err(tpl.id, `seed ${seed} part ${part.id} answer ${want} is not an option`);
      }
    }
    checkSecond(tpl, inst, `seed ${seed}`);
    await checkSim(tpl, inst, `seed ${seed}`);
    if (seed <= 2) checkSymbolic(tpl, inst);
    try {
      checkRender(tpl, inst);
    } catch (e) {
      err(tpl.id, `render threw: ${e.message}`);
    }
  }
}

for (const ch of BANK_CHAPTERS) {
  if (!ONLY && counts[ch] < 4) err(`ch${ch}`, `only ${counts[ch]} problems`);
}

if (errors.length) {
  console.error(`problems-check: ${errors.length} failed`);
  for (const line of errors) console.error('  ' + line);
  process.exit(1);
}

const byCh = BANK_CHAPTERS.map((ch) => `ch${ch}:${counts[ch]}`).join(' ');
console.log(`problems-check: ${PROBLEMS.length} templates (${byCh}), all passed`);
