#!/usr/bin/env node
/**
 * Problem-bank check (no browser):
 *   node scripts/problems-check.mjs [--samples N] [--only idPrefix]
 *
 * For every template:
 *   1. worked cases reproduce their expected answers
 *   2. N seeded samples satisfy valid(), give finite answers, and give choice answers that are options
 *   3. text, labels, hints and steps render without "undefined"/"NaN" and without a KaTeX error
 *   4. second() agrees with the answer (numeric, 1e-4 relative) or with the choice answer
 *   5. sim agreement: applyProblem, recompute, compare sim.read with get()
 *   6. at least 50 distinct versions; 2 or 3 hints, the first one not printing an answer
 *   7. levels 1 to 3; `src` is a citation from src/data/textbook.js
 *   8. a part with `alt` accepts the exact value and the table value, each typed to four figures
 *      (no part uses `alt` yet; the check stays for the printed tables a later unit may quote)
 * And for the bank: every unit that has problems has one in English units.
 */
import { LAB_META, EXAMS } from '../src/data/catalog.js';
import { SECTIONS, cite } from '../src/data/textbook.js';
import { loadLab } from '../src/labs/load.js';
import { CHAPTER_ORDER, CHAPTER_TITLES, PROBLEMS, problemsForExam } from '../src/problems/index.js';
import {
  build, checkUnits, countVersions, dimensionOf, evalSymbolic, expected, grade, gradeSymbolic, instance, parseExpr, parseNumber, render,
  withinTol,
} from '../src/problems/engine.js';
import { dimEqual, formatDim, parseUnit } from '@flux/subjects/mechanics/units.js';
import { INTERVAL_DAYS, createProgress, memoryStorage, pickSet } from '../src/problems/progress.js';
import { applyProblem } from '../src/problems/simbridge.js';
import { mathProse } from '../src/ui/shared.js';
import { PRINCIPLES } from '../src/problems/principles.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const SAMPLES = Number(opt('--samples', 24));
const ONLY = opt('--only', '');
const MIN_VERSIONS = 50;
const CITATIONS = new Set(Object.keys(SECTIONS).map(cite));

const errors = [];
let simChecks = 0;
let secondChecks = 0;
let altChecks = 0;
const err = (id, msg) => errors.push(`${id}: ${msg}`);

function checkRender(tpl, inst) {
  const r = render(inst);
  const strings = [r.text, ...r.parts.map((p) => `${p.label ?? ''} ${(p.options || []).map((o) => o.label).join(' ')}`), ...r.steps, ...r.hints];
  const blob = strings.join('\n');
  if (/undefined|NaN|\[object/.test(blob)) err(tpl.id, `rendered text contains undefined/NaN:\n${blob.slice(0, 300)}`);
  for (const s of strings) if (mathProse(s).includes('katex-error')) err(tpl.id, `KaTeX cannot parse this: ${s}`);
}

function checkAnswers(tpl, inst, label) {
  for (const p of tpl.parts) {
    const want = expected(p, inst.$);
    if (p.kind === 'numeric' && !Number.isFinite(want)) err(tpl.id, `${label} part ${p.id} not finite (${JSON.stringify(inst.values)})`);
    if (p.kind === 'choice') {
      const opts = new Set(p.options.map((o) => o.value));
      for (const w of [].concat(want)) if (!opts.has(w)) err(tpl.id, `${label} part ${p.id} answer ${w} not among options`);
    }
    if (p.kind === 'symbolic') {
      const a = evalSymbolic(p, inst.$);
      const b = p.get(inst.$);
      if (!(Math.abs(a - b) <= 1e-9 * Math.max(1e-12, Math.abs(b)))) err(tpl.id, `${label} symbolic ${p.id}: key gives ${a}, get() gives ${b}`);
      if (p.unit && p.units) {
        try {
          const got = dimensionOf(parseExpr(p.expr, p.vars, p.alias), p.units);
          if (!dimEqual(got, parseUnit(p.unit))) err(tpl.id, `symbolic ${p.id}: the key is in ${formatDim(got)}, but the part says ${p.unit}`);
        } catch (e) {
          err(tpl.id, `symbolic ${p.id}: units — ${e.message}`);
        }
      }
    }
  }
}

/** Every option of a choice part says why: a wrong pick gets that note as its feedback. */
function checkWhy(tpl) {
  for (const p of tpl.parts.filter((q) => q.kind === 'choice')) {
    for (const o of p.options) if (!o.why) err(tpl.id, `option "${o.label ?? o.value}" of ${p.id} has no why`);
  }
}

/** Each trap must catch its own mistake, with its own message, in at least 3 of 4 versions. */
const trapStats = new Map();
function checkTraps(tpl, inst) {
  for (const p of tpl.parts.filter((q) => q.kind === 'numeric')) {
    for (const [fn, msg] of p.traps || []) {
      const key = `${tpl.id}:${p.id}:${msg}`;
      const st = trapStats.get(key) || { tried: 0, fired: 0 };
      st.tried++;
      const v = fn(inst.$);
      if (Number.isFinite(v)) {
        const r = grade(p, inst.$, String(v));
        if (!r.correct && r.feedback === msg) st.fired++;
      }
      trapStats.set(key, st);
    }
  }
}

/** Typed the way a student types a table answer: four significant figures. */
const typed = (v) => String(Number(v.toPrecision(4)));

function checkAlt(tpl, inst, label) {
  for (const p of tpl.parts.filter((q) => q.kind === 'numeric' && q.alt)) {
    const exact = expected(p, inst.$);
    const table = p.alt(inst.$);
    altChecks++;
    if (!Number.isFinite(table)) {
      err(tpl.id, `${label} alt ${p.id} is not finite`);
      continue;
    }
    if (!grade(p, inst.$, typed(exact)).correct) err(tpl.id, `${label} ${p.id}: the grader rejects the exact value ${typed(exact)}`);
    if (!grade(p, inst.$, typed(table)).correct) err(tpl.id, `${label} ${p.id}: the grader rejects the table value ${typed(table)}`);
    // The table value is an interpolation of the same data; a gap of more than 5% means a wrong row or unit.
    if (Math.abs(table - exact) > 0.05 * Math.abs(exact)) err(tpl.id, `${label} ${p.id}: table ${table} is far from exact ${exact}`);
  }
}

function checkSecond(tpl, inst, label) {
  if (typeof tpl.second !== 'function') return err(tpl.id, 'needs a second method');
  let got;
  try {
    got = tpl.second(inst.$);
  } catch (e) {
    return err(tpl.id, `${label} second() threw: ${e.message}`);
  }
  for (const part of tpl.parts) {
    // A symbolic key is checked against get() by value, in checkAnswers.
    if (part.kind === 'symbolic') continue;
    if (!(part.id in got)) {
      err(tpl.id, `${label} second() has no ${part.id}`);
      continue;
    }
    secondChecks++;
    const want = expected(part, inst.$);
    if (part.kind === 'choice') {
      if (got[part.id] !== want) err(tpl.id, `${label} second ${part.id}: ${got[part.id]} vs ${want}`);
    } else if (!Number.isFinite(got[part.id]) || Math.abs(got[part.id] - want) > 1e-4 * Math.max(1e-3, Math.abs(want))) {
      err(tpl.id, `${label} second ${part.id}: ${got[part.id]} vs ${want}`);
    }
  }
}

async function checkSim(tpl, inst, label) {
  if (!tpl.sim) return;
  const lab = await loadLab(tpl.lab);
  if (!lab) return err(tpl.id, `unknown lab ${tpl.lab}`);
  const state = lab.defaultState();
  applyProblem(lab, state, inst);
  const computed = {};
  lab.recompute(state, computed);
  const got = tpl.sim.read(computed, state, inst.$);
  for (const [key, val] of Object.entries(got)) {
    simChecks++;
    const part = tpl.parts.find((p) => p.id === key);
    if (!part) {
      err(tpl.id, `sim.read returned unknown part ${key}`);
      continue;
    }
    if (part.kind === 'choice') {
      const want = expected(part, inst.$);
      if (val !== want) err(tpl.id, `${label} sim ${key}: lab says ${val}, problem says ${want}`);
    } else {
      const want = part.get(inst.$);
      if (!withinTol(val, want, { tol: 1e-4, abs: 1e-9 })) err(tpl.id, `${label} sim ${key}: lab ${val} vs problem ${want}`);
    }
  }
}

/** Ways a number can be printed in prose: three to five significant figures. */
function numberForms(v) {
  const forms = new Set();
  if (!Number.isFinite(v) || Math.abs(v) < 1e-9) return forms;
  for (const p of [3, 4, 5]) forms.add(String(Number(v.toPrecision(p))));
  return forms;
}

const printsNumber = (prose, form) => new RegExp(`(^|[^0-9.])${form.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&')}(?![0-9]|\\.[0-9])`).test(prose);

/** The first hint may not print an answer the problem text does not already show, in over a quarter of versions. */
function checkHints(tpl) {
  const count = Array.isArray(tpl.hints) ? tpl.hints.length : 0;
  if (count < 2 || count > 3) err(tpl.id, `need 2 or 3 hints, have ${count}`);
  let tried = 0;
  let leaked = 0;
  let example = '';
  const look = (inst) => {
    tried++;
    const r = render(inst);
    const first = r.hints[0] ?? '';
    for (const p of tpl.parts) {
      if (p.kind !== 'numeric') continue;
      for (const f of numberForms(expected(p, inst.$))) {
        if (printsNumber(first, f) && !printsNumber(r.text, f)) {
          leaked++;
          example ||= `${p.id}=${f}`;
          return;
        }
      }
    }
  };
  for (const c of tpl.cases) look(build(tpl, c.v));
  for (let seed = 1; seed <= 40; seed++) look(instance(tpl, seed));
  if (leaked / tried > 0.25) err(tpl.id, `the first hint gives the answer away in ${leaked} of ${tried} versions (${example})`);
}

const seen = new Set();
const englishByUnit = {};
for (const tpl of PROBLEMS) {
  if (ONLY && !tpl.id.startsWith(ONLY)) continue;
  if (seen.has(tpl.id)) err(tpl.id, 'duplicate id');
  seen.add(tpl.id);
  if (!EXAMS.some((e) => e.id === tpl.exam)) err(tpl.id, `unknown exam ${tpl.exam}`);
  if (tpl.lab && !LAB_META[tpl.lab]) err(tpl.id, `unknown lab ${tpl.lab}`);
  if (!CHAPTER_ORDER.includes(tpl.ch)) err(tpl.id, `unknown chapter ${tpl.ch}`);
  if (!CHAPTER_TITLES[tpl.ch]) err(tpl.id, `chapter ${tpl.ch} has no title`);
  if (tpl.sim && !tpl.lab) err(tpl.id, 'sim without lab');
  if (!tpl.cases.length) err(tpl.id, 'no worked case');
  if (!tpl.title) err(tpl.id, 'no title for the practice list');
  if (![1, 2, 3].includes(tpl.level)) err(tpl.id, `level ${tpl.level} is not 1, 2, or 3`);
  if (!CITATIONS.has(tpl.src)) err(tpl.id, `src "${tpl.src}" is not a citation from textbook.js`);
  for (const c of tpl.cases) if (!CITATIONS.has(c.src)) err(tpl.id, `case src "${c.src}" is not a citation from textbook.js`);
  if ((tpl.topics || []).includes('english')) englishByUnit[tpl.exam] = (englishByUnit[tpl.exam] || 0) + 1;
  checkHints(tpl);
  checkWhy(tpl);
  if (!(tpl.principles || []).length) err(tpl.id, 'no principle tag');
  for (const pid of tpl.principles || []) if (!PRINCIPLES[pid]) err(tpl.id, `unknown principle ${pid}`);
  if (tpl.parts.some((p) => p.kind === 'numeric') && !tpl.parts.some((p) => (p.traps || []).length)) err(tpl.id, 'a numeric template needs traps');
  const versions = countVersions(tpl, { need: MIN_VERSIONS });
  if (versions < MIN_VERSIONS) err(tpl.id, `${versions} distinct versions; need at least ${MIN_VERSIONS}`);

  for (const c of tpl.cases) {
    let inst;
    try {
      inst = build(tpl, c.v);
    } catch (e) {
      err(tpl.id, `case ${c.src}: ${e.message}`);
      continue;
    }
    if (!tpl.valid(inst.$)) err(tpl.id, `case ${JSON.stringify(c.v)} fails valid()`);
    for (const [pid, want] of Object.entries(c.want)) {
      const part = tpl.parts.find((p) => p.id === pid);
      if (!part) {
        err(tpl.id, `case: no part ${pid}`);
        continue;
      }
      const got = expected(part, inst.$);
      const ok = part.kind === 'numeric' ? withinTol(got, want, { tol: 0.001, abs: 1e-9 }) : got === want;
      if (!ok) err(tpl.id, `case ${JSON.stringify(c.v)} part ${pid}: got ${typeof got === 'number' ? got.toPrecision(6) : got}, expected ${want}`);
      if (part.kind === 'numeric' && !grade(part, inst.$, String(want)).correct) err(tpl.id, `case part ${pid}: grader rejects ${want}`);
    }
    checkAnswers(tpl, inst, 'case');
    checkRender(tpl, inst);
    checkSecond(tpl, inst, 'case');
    checkAlt(tpl, inst, 'case');
    try {
      await checkSim(tpl, inst, 'case');
    } catch (e) {
      err(tpl.id, `case sim threw: ${e.message}`);
    }
  }

  for (let seed = 1; seed <= SAMPLES; seed++) {
    let inst;
    try {
      inst = instance(tpl, seed);
    } catch (e) {
      err(tpl.id, e.message);
      break;
    }
    checkAnswers(tpl, inst, `seed ${seed}`);
    checkTraps(tpl, inst);
    if (seed <= 3) {
      for (const p of tpl.parts.filter((q) => q.kind === 'symbolic')) {
        if (!gradeSymbolic(p, p.expr, inst.$).correct) err(tpl.id, `grader rejects its own key for ${p.id}`);
        if (gradeSymbolic(p, `(${p.expr})*1.1`, inst.$).correct) err(tpl.id, `grader accepts a wrong answer for ${p.id}`);
      }
    }
    try {
      checkRender(tpl, inst);
    } catch (e) {
      err(tpl.id, `render threw: ${e.message}`);
    }
    checkSecond(tpl, inst, `seed ${seed}`);
    checkAlt(tpl, inst, `seed ${seed}`);
    try {
      await checkSim(tpl, inst, `seed ${seed}`);
    } catch (e) {
      err(tpl.id, `seed ${seed} sim threw: ${e.message}`);
      break;
    }
  }
}

for (const [key, st] of trapStats) {
  if (st.fired < 0.75 * st.tried) err(key.split(':')[0], `trap "${key.split(':').slice(2).join(':')}" fires in ${st.fired} of ${st.tried} versions`);
}

if (!ONLY) for (const e of EXAMS) if (problemsForExam(e.id).length && !englishByUnit[e.id]) err(e.id, 'no problem in English units');

for (const [s, v] of [['63.7 MPa', 63.7], ['12.7 ksi', 12.7], ['−34.6', -34.6], ['1/2', 0.5], ['377 mm²', 377]]) {
  if (parseNumber(s) !== v) err('engine', `parseNumber(${s}) = ${parseNumber(s)}`);
}

{
  const progress = createProgress(memoryStorage());
  const t0 = Date.parse('2026-09-01T12:00:00Z');
  const DAY = 864e5;
  const it = progress.record('u1.1.avg-normal', { correct: true, clean: true, now: t0 });
  if (it.box !== 1 || it.due !== t0 + INTERVAL_DAYS[1] * DAY) err('progress', 'a clean solve should move to box 1');
  const tpls = problemsForExam('u1');
  const n = Math.min(6, tpls.length);
  const a = pickSet(tpls, progress, { n, seed: 42 });
  const b = pickSet(tpls, progress, { n, seed: 42 });
  if (a.length !== n) err('pickSet', `picked ${a.length} of ${n}`);
  if (a.map((t) => t.id).join() !== b.map((t) => t.id).join()) err('pickSet', 'same seed gave different sets');
}

console.log(`${seen.size} templates · ${PROBLEMS.reduce((sum, p) => sum + p.cases.length, 0)} worked cases · ${secondChecks} second-method checks · ${simChecks} sim comparisons · ${altChecks} table-value checks`);
for (const e of errors) console.log('FAIL ', e);
console.log(errors.length ? `${errors.length} failure(s)` : 'problems: all checks passed');
process.exit(errors.length ? 1 : 0);
