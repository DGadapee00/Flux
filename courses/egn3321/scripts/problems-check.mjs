#!/usr/bin/env node
/**
 * Problem-bank check (no browser):
 *   node scripts/problems-check.mjs [--samples N] [--only idPrefix]
 *
 * For every template:
 *   1. worked cases reproduce their expected answers
 *   2. N seeded samples satisfy valid(), give finite answers, and give choice answers that are options
 *   3. text, labels, and steps render without "undefined"/"NaN" and without a KaTeX error
 *   4. symbolic keys equal get($); the grader accepts the key and rejects a perturbed one
 *   5. second() agrees with get() (numeric, 1e-4 relative) or with the choice answer
 *   6. sim agreement: applyProblem, recompute headless, compare sim.read with get()
 *
 * And the course standard (docs/COURSE-STANDARD.md, section 4):
 *   7. principle tags, where a template has them, name principles in src/problems/principles.js
 *   8. a `why` on every option of every choice part
 *   9. at least two traps per numeric template, each a value the grader rejects with its own
 *      message in at least 3 of 4 versions (a trap that lands on the answer teaches nothing)
 *  10. a third of each unit conceptual (the standard asks 25%), and 60% of the bank varied by structure
 */
import { dimEqual, formatDim, parseUnit } from '@flux/subjects/mechanics/units.js';
import { LAB_META, EXAMS } from '../src/data/catalog.js';
import { loadLab } from '../src/labs/load.js';
import { CHAPTER_ORDER, CHAPTER_TITLES, PROBLEMS, problemsForExam } from '../src/problems/index.js';
import {
  build,
  dimensionOf,
  evalSymbolic,
  expected,
  grade,
  gradeSymbolic,
  instance,
  parseExpr,
  parseNumber,
  render,
  withinTol,
} from '../src/problems/engine.js';
import { createProgress, memoryStorage, pickSet, INTERVAL_DAYS } from '../src/problems/progress.js';
import { applyProblem, headlessCtx } from '../src/problems/simbridge.js';
import { PRINCIPLES } from '../src/problems/principles.js';
import { mathProse } from '../src/ui/shared.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const SAMPLES = Number(opt('--samples', 24));
const ONLY = opt('--only', '');

const errors = [];
let simChecks = 0;
let secondChecks = 0;
const err = (id, msg) => errors.push(`${id}: ${msg}`);

function checkRender(tpl, inst) {
  const r = render(inst);
  const strings = [
    r.text,
    ...r.parts.map((p) => `${p.label ?? ''} ${(p.options || []).map((o) => o.label).join(' ')} ${p.rubric ?? ''}`),
    ...r.steps,
    ...r.hints,
  ];
  const blob = strings.join('\n');
  if (/undefined|NaN|\[object/.test(blob)) err(tpl.id, `rendered text contains undefined/NaN:\n${blob.slice(0, 300)}`);
  for (const s of strings) {
    if (mathProse(s).includes('katex-error')) err(tpl.id, `KaTeX cannot parse this: ${s}`);
  }
}

function checkAnswers(tpl, inst, label) {
  for (const p of tpl.parts) {
    const want = expected(p, inst.$);
    if (p.kind === 'numeric' && !Number.isFinite(want)) err(tpl.id, `${label} part ${p.id} not finite (${JSON.stringify(inst.values)})`);
    if (p.kind === 'choice') {
      const options = typeof p.options === 'function' ? p.options(inst.$) : p.options;
      const opts = new Set(options.map((o) => o.value));
      for (const w of [].concat(want)) if (!opts.has(w)) err(tpl.id, `${label} part ${p.id} answer ${w} not among options`);
    }
    if (p.kind === 'symbolic') {
      const a = evalSymbolic(p, inst.$);
      const b = p.get(inst.$);
      if (!(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)))) err(tpl.id, `${label} symbolic ${p.id}: key gives ${a}, get() gives ${b}`);
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

function checkSecond(tpl, inst, label) {
  if (typeof tpl.second !== 'function') {
    if (!tpl.sim) err(tpl.id, 'needs a second method or a lab');
    return;
  }
  let got;
  try {
    got = tpl.second(inst.$);
  } catch (e) {
    err(tpl.id, `${label} second() threw: ${e.message}`);
    return;
  }
  for (const part of tpl.parts) {
    if (part.kind === 'symbolic') continue;
    if (!(part.id in got)) {
      err(tpl.id, `${label} second() has no ${part.id}`);
      continue;
    }
    secondChecks++;
    const want = expected(part, inst.$);
    if (part.kind === 'choice') {
      if (got[part.id] !== want) err(tpl.id, `${label} second ${part.id}: ${got[part.id]} vs ${want}`);
    } else if (!Number.isFinite(got[part.id]) || Math.abs(got[part.id] - want) > 1e-4 * Math.max(1, Math.abs(want))) {
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
  if (!tpl.sim.read) return;
  const computed = {};
  lab.recompute(state, computed, headlessCtx());
  const got = tpl.sim.read(computed, state, inst.$);
  for (const [key, val] of Object.entries(got)) {
    simChecks++;
    const part = tpl.parts.find((p) => p.id === key);
    if (!part) {
      err(tpl.id, `sim.read returned unknown part ${key}`);
      continue;
    }
    const want = part.kind === 'choice' ? expected(part, inst.$) : part.get(inst.$);
    if (part.kind === 'choice') {
      if (val !== want) err(tpl.id, `${label} sim ${key}: lab says ${val}, problem says ${want}`);
    } else if (!withinTol(val, want, { ...part, abs: (part.abs ?? 0) * (part.scale ?? 1) })) {
      err(tpl.id, `${label} sim ${key}: lab ${val} vs problem ${want}`);
    }
  }
}

/** Every option of every choice part carries a `why`. */
function checkWhy(tpl, inst) {
  for (const p of tpl.parts.filter((q) => q.kind === 'choice')) {
    const opts = typeof p.options === 'function' ? p.options(inst.$) : p.options;
    for (const o of opts) if (!o.why) err(tpl.id, `option "${o.label ?? o.value}" of ${p.id} has no why`);
  }
}

/** Traps: at least two per numeric template, and each one fires with its own message. */
const trapStats = new Map();
function checkTraps(tpl, inst) {
  for (const p of tpl.parts.filter((q) => q.kind === 'numeric')) {
    for (const [fn, msg] of p.traps || []) {
      const key = `${tpl.id}:${p.id}:${msg}`;
      const st = trapStats.get(key) || { tried: 0, fired: 0 };
      st.tried++;
      const v = fn(inst.$) / (p.scale ?? 1);
      if (Number.isFinite(v)) {
        const r = grade(p, inst.$, String(v));
        if (!r.correct && r.feedback === (typeof msg === 'function' ? msg(inst.$) : msg)) st.fired++;
      }
      trapStats.set(key, st);
    }
  }
}

/** Varied by structure: it says what it varies, or a choice picks among configurations. */
const structural = (t) => (Array.isArray(t.variety) ? t.variety.length > 0 : !!t.variety) || Object.values(t.vars || {}).some((v) => v?.type === 'choice' && v.options?.some((o) => typeof o.value !== 'number'));
const conceptual = (t) => t.parts.length > 0 && t.parts.every((p) => p.kind === 'choice' || p.kind === 'self');

const seen = new Set();
for (const tpl of PROBLEMS) {
  if (ONLY && !tpl.id.startsWith(ONLY)) continue;
  if (seen.has(tpl.id)) err(tpl.id, 'duplicate id');
  seen.add(tpl.id);
  if (!EXAMS.some((e) => e.id === tpl.exam)) err(tpl.id, `unknown exam ${tpl.exam}`);
  if (tpl.lab && !LAB_META[tpl.lab]) err(tpl.id, `unknown lab ${tpl.lab}`);
  if (!CHAPTER_ORDER.includes(tpl.ch)) err(tpl.id, `unknown chapter ${tpl.ch}`);
  if (!CHAPTER_TITLES[tpl.ch]) err(tpl.id, `chapter ${tpl.ch} has no title`);
  if (tpl.sim && !tpl.lab) err(tpl.id, 'sim without lab');
  if (typeof tpl.second !== 'function' && !tpl.sim) err(tpl.id, 'no second method and no lab');
  if (!tpl.cases.length) err(tpl.id, 'no worked case');
  if (!tpl.title) err(tpl.id, 'no title for the practice list');
  if (!Array.isArray(tpl.hints) || tpl.hints.length < 2 || tpl.hints.length > 3) {
    err(tpl.id, `${tpl.hints?.length ?? 0} hints; want 2 or 3`);
  }
  if (tpl.level !== 1 && tpl.level !== 2 && tpl.level !== 3) err(tpl.id, `level ${tpl.level} is not 1, 2, or 3`);
  for (const pid of tpl.principles || []) if (!PRINCIPLES[pid]) err(tpl.id, `unknown principle ${pid}`);
  const numericParts = tpl.parts.filter((p) => p.kind === 'numeric');
  if (numericParts.length) {
    const n = numericParts.reduce((k, p) => k + (p.traps?.length || 0), 0);
    if (n < 2) err(tpl.id, `${n} trap(s) on its numeric parts; want at least 2`);
  }

  for (const c of tpl.cases) {
    let inst;
    try {
      inst = build(tpl, c.v);
    } catch (e) {
      err(tpl.id, `case ${c.src}: ${e.message}`);
      continue;
    }
    if (!tpl.valid(inst.$)) err(tpl.id, `case ${c.src} fails valid()`);
    for (const [pid, want] of Object.entries(c.want)) {
      const part = tpl.parts.find((p) => p.id === pid);
      if (!part) {
        err(tpl.id, `case ${c.src}: no part ${pid}`);
        continue;
      }
      const got = expected(part, inst.$);
      const ok = part.kind === 'numeric'
        ? withinTol(got, want, { tol: 0.01, abs: Math.max(part.abs ?? 0, 1e-9) })
        : JSON.stringify([].concat(got).sort()) === JSON.stringify([].concat(want).sort());
      if (!ok) err(tpl.id, `case ${c.src} part ${pid}: got ${typeof got === 'number' ? got.toPrecision(6) : JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
      if (part.kind === 'numeric' && !grade(part, inst.$, String(want)).correct) err(tpl.id, `case ${c.src} part ${pid}: grader rejects ${want}`);
    }
    checkAnswers(tpl, inst, `case ${c.src}`);
    checkRender(tpl, inst);
    checkSecond(tpl, inst, `case ${c.src}`);
    try {
      await checkSim(tpl, inst, `case ${c.src}`);
    } catch (e) {
      err(tpl.id, `case ${c.src} sim threw: ${e.message}`);
    }
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
    checkAnswers(tpl, inst, `seed ${seed}`);
    checkWhy(tpl, inst);
    checkTraps(tpl, inst);
    try {
      checkRender(tpl, inst);
    } catch (e) {
      err(tpl.id, `render threw: ${e.message}`);
    }
    if (seed <= 3) {
      for (const p of tpl.parts.filter((q) => q.kind === 'symbolic')) {
        if (!gradeSymbolic(p, p.expr).correct) err(tpl.id, `grader rejects its own key for ${p.id}`);
        if (gradeSymbolic(p, `(${p.expr})*1.1`).correct) err(tpl.id, `grader accepts a wrong answer for ${p.id}`);
      }
    }
    checkSecond(tpl, inst, `seed ${seed}`);
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
if (!ONLY) {
  for (const exam of EXAMS) {
    const tpls = problemsForExam(exam.id);
    const share = tpls.filter(conceptual).length / Math.max(1, tpls.length);
    if (share < 0.25) err(exam.id, `${Math.round(share * 100)}% conceptual; the standard asks at least 25%`);
  }
  const varied = PROBLEMS.filter(structural).length / PROBLEMS.length;
  if (varied < 0.6) err('bank', `${Math.round(varied * 100)}% of templates varied by structure; the standard asks 60%`);
}

for (const [s, v] of [
  ['222', 222],
  ['1.219 m', 1.219],
  ['−4', -4],
  ['1/2', 0.5],
  ['3.61 m/s', 3.61],
]) {
  if (parseNumber(s) !== v) err('engine', `parseNumber(${s}) = ${parseNumber(s)}`);
}

{
  const progress = createProgress(memoryStorage());
  const t0 = Date.parse('2026-09-01T12:00:00Z');
  const DAY = 864e5;
  let it = progress.record('u1.12.polynomial', { correct: true, clean: true, now: t0 });
  if (it.box !== 1 || it.due !== t0 + INTERVAL_DAYS[1] * DAY) err('progress', 'a clean solve should move to box 1');
  const tpls = problemsForExam('u1');
  const n = Math.min(8, tpls.length);
  const a = pickSet(tpls, progress, { n, seed: 42 });
  const b = pickSet(tpls, progress, { n, seed: 42 });
  if (a.length !== n) err('pickSet', `picked ${a.length} of ${n}`);
  if (new Set(a.map((t) => t.id)).size !== a.length) err('pickSet', 'duplicate problem');
  if (a.map((t) => t.id).join() !== b.map((t) => t.id).join()) err('pickSet', 'same seed gave different sets');
  if (new Set(a.map((t) => t.ch)).size < 2) err('pickSet', 'Unit 1 set skipped a chapter');
}

// D15: every unit has at least one worked case that reproduces a printed OCW answer, cited by course, term, set and problem.
for (const e of EXAMS) {
  const cited = PROBLEMS.some((t) => t.exam === e.id && t.cases.some((c) => /^MIT OCW 2\.003SC \(Fall 2011\), (Problem Set|Quiz) \d+, Problem \d+/.test(c.src)));
  if (!cited) err(e.id, 'no worked case cites an OCW problem (MIT OCW 2.003SC (Fall 2011), Problem Set n, Problem m)');
}

console.log(`${seen.size} templates · ${PROBLEMS.reduce((sum, p) => sum + p.cases.length, 0)} worked cases · ${secondChecks} second-method checks · ${simChecks} sim comparisons`);
for (const e of errors) console.log('FAIL ', e);
console.log(errors.length ? `${errors.length} failure(s)` : 'problems: all checks passed');
process.exit(errors.length ? 1 : 0);
