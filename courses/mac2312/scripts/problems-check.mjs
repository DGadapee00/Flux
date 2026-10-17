#!/usr/bin/env node
/**
 * Problem-bank check (no browser):
 *   node scripts/problems-check.mjs [--samples N] [--only idPrefix] [--list]
 *
 * For every template:
 *   1. worked cases reproduce their expected answers (the worksheet key where one exists)
 *   2. N seeded samples satisfy valid(), give finite answers, and give choice answers that are options
 *   3. text, labels, steps render without throwing or printing "undefined"/"NaN"
 *   4. symbolic keys equal get($); the grader accepts the key and rejects a perturbed one.
 *      A symbolic template's worked case names a formula, an equivalent rewrite, and a wrong answer.
 *      Problem text never prints a coefficient of 1 against a variable (`1x^{2}`).
 *      Every template has 50 versions, writes multiples of π in lowest terms, and has two or three
 *      hints. The first hint names the idea: it does not print the answer.
 *   5. sim agreement: load the instance into the real lab (applyProblem), run lab.recompute
 *      headless, and compare sim.read(...) with the problem's own answers
 */
import { PROBLEMS, CHAPTER_ORDER, CHAPTER_TITLES, problemsForExam } from '../src/problems/index.js';
import { createProgress, memoryStorage, pickSet, INTERVAL_DAYS } from '../src/problems/progress.js';
import { build, instance, render, expected, withinTol, evalSymbolic, gradeSymbolic, grade, parseNumber, exprToTex, countVersions } from '../src/problems/engine.js';
import { applyProblem, headlessCtx } from '../src/problems/simbridge.js';
import { mathProse } from '@flux/shells/math/shared.js';
import { loadLab } from '../src/labs/load.js';
import { LAB_META, EXAMS } from '../src/data/catalog.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const SAMPLES = Number(opt('--samples', 60));
const ONLY = opt('--only', '');

const errors = [];
const notes = [];
let simChecks = 0;
const err = (id, msg) => errors.push(`${id}: ${msg}`);

function gcdInt(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

/** A printed multiple of π whose fraction still has a common factor, such as 4π/2. */
function unreducedPi(text) {
  if (typeof text !== 'string') return null;
  const forms = [
    /(-?\d+)\s*\\pi\s*\/\s*(\d+)/g,
    /(-?\d+)\s*\/\s*(\d+)\s*\\pi/g,
    /\\d?frac\{(-?\d+)\\pi\}\{(\d+)\}/g,
  ];
  for (const re of forms) {
    for (const m of text.matchAll(re)) {
      const n = Math.abs(Number(m[1]));
      const d = Number(m[2]);
      if (d > 1 && gcdInt(n, d) > 1) return m[0];
    }
  }
  return null;
}

function symKey(part, $) {
  return typeof part.expr === 'function' ? part.expr($) : part.expr;
}

function checkRender(tpl, inst) {
  const r = render(inst);
  const strings = [r.text, ...r.parts.map((p) => `${p.label ?? ''} ${(p.options || []).map((o) => o.label).join(' ')} ${p.rubric ?? ''}`), ...r.steps, ...r.hints];
  const blob = strings.join('\n');
  if (/undefined|NaN|\[object/.test(blob)) err(tpl.id, `rendered text contains undefined/NaN:\n${blob.slice(0, 300)}`);
  // A formula key is typed input. Inside math it is shown through exprToTex, never with its `*`.
  for (const m of blob.matchAll(/\$([^$]+)\$/g)) if (m[1].includes('*')) err(tpl.id, `a formula key leaks into the math: ${m[0]}`);
  if (/[A-Za-z)]\^(\{1\}|1(?![0-9.]))/.test(r.text)) err(tpl.id, `write a first power without its exponent: ${r.text.slice(0, 160)}`);
  // The panel typesets `$…$` (src/ui/shared.js); KaTeX marks what it cannot parse instead of throwing.
  for (const s of strings) {
    const html = mathProse(s);
    if (html.includes('katex-error')) err(tpl.id, `KaTeX cannot parse this: ${s}`);
  }
}

function checkSecond(tpl, inst, label) {
  if (typeof tpl.second !== 'function') {
    err(tpl.id, 'no second opinion');
    return;
  }
  let alt;
  try {
    alt = tpl.second(inst.$);
  } catch (e) {
    err(tpl.id, `${label} second threw: ${e.message}`);
    return;
  }
  for (const part of tpl.parts) {
    if (!Object.prototype.hasOwnProperty.call(alt, part.id)) {
      err(tpl.id, `${label} second skips ${part.id}`);
      continue;
    }
    const got = alt[part.id];
    const want = part.kind === 'numeric' ? part.get(inst.$) : expected(part, inst.$);
    const ok =
      part.kind === 'numeric'
        ? withinTol(got, want, { ...part, abs: Math.max(part.abs ?? 0, 1e-4) })
        : JSON.stringify([].concat(got).sort()) === JSON.stringify([].concat(want).sort());
    if (!ok) err(tpl.id, `${label} second ${part.id}: ${JSON.stringify(got)} vs ${JSON.stringify(want)}`);
  }
}

function checkAnswers(tpl, inst, label) {
  for (const p of tpl.parts) {
    const want = expected(p, inst.$);
    if (p.kind === 'numeric' && !Number.isFinite(want)) err(tpl.id, `${label} part ${p.id} not finite (${JSON.stringify(inst.values)})`);
    if (p.kind === 'choice') {
      const opts = new Set(p.options.map((o) => o.value));
      for (const w of [].concat(want)) if (!opts.has(w)) err(tpl.id, `${label} part ${p.id} answer ${w} not among options (${JSON.stringify(inst.values)})`);
    }
    if (p.kind === 'symbolic') {
      const a = evalSymbolic(p, inst.$);
      const b = p.get(inst.$);
      if (!(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)))) err(tpl.id, `${label} symbolic ${p.id}: key gives ${a}, get() gives ${b}`);
    }
  }
}

async function checkSim(tpl, inst, label) {
  if (!tpl.sim) return;
  const lab = await loadLab(tpl.lab);
  if (!lab) return err(tpl.id, `unknown lab ${tpl.lab}`);
  const slice = lab.defaultState();
  applyProblem(lab, slice, inst);
  if (!tpl.sim.read) return;
  const computed = {};
  const ctx = headlessCtx();
  lab.recompute(slice, computed, ctx);
  const got = tpl.sim.read(computed, slice, inst.$);
  for (const [key, val] of Object.entries(got)) {
    simChecks++;
    if (key.startsWith('@')) {
      const [g, w] = val;
      if (!(Math.abs(g - w) <= Math.max(1e-3, 0.02 * Math.abs(w)))) err(tpl.id, `${label} sim ${key}: ${g} vs ${w} (${JSON.stringify(inst.values)})`);
      continue;
    }
    const part = tpl.parts.find((p) => p.id === key);
    if (!part) {
      err(tpl.id, `sim.read returned unknown part ${key}`);
      continue;
    }
    if (part.kind === 'choice') {
      const want = expected(part, inst.$);
      if (val !== want) err(tpl.id, `${label} sim ${key}: lab says ${val}, problem says ${want} (${JSON.stringify(inst.values)})`);
    } else {
      const want = part.get(inst.$);
      const p2 = { ...part, abs: (part.abs ?? 0) * (part.scale ?? 1) };
      if (!withinTol(val, want, p2)) err(tpl.id, `${label} sim ${key}: lab ${val.toPrecision(5)} vs problem ${want.toPrecision(5)} (${JSON.stringify(inst.values)})`);
    }
  }
}

/** A coefficient of 1 written against a variable: `1x^{2}` should be `x^{2}`. */
function leadingOne(text) {
  const m = /(?<![0-9.])1[xyz](?![0-9])/.exec(String(text));
  return m ? m[0] : null;
}

/**
 * The key bakes in the version's numbers. Template parameters are not symbols a student types.
 * The worked case gives the formula, one rewrite that must grade right, and one answer that must not.
 */
function checkSymbolicCases(tpl) {
  const symbolic = tpl.parts.filter((p) => p.kind === 'symbolic');
  if (!symbolic.length) return;
  const params = new Set(Object.keys(tpl.vars || {}));
  for (const part of symbolic) {
    for (const name of part.vars) {
      if (params.has(name)) err(tpl.id, `symbolic ${part.id}: ${name} is a template parameter, not a symbol the student types`);
    }
    let covered = false;
    for (const c of tpl.cases) {
      const formula = c.want?.[part.id];
      if (typeof formula !== 'string') continue;
      let inst;
      try {
        inst = build(tpl, c.v);
      } catch {
        continue;
      }
      const graded = gradeSymbolic(part, formula, inst.$);
      if (!graded.correct) {
        err(tpl.id, `symbolic ${part.id}: case ${c.src} formula ${JSON.stringify(formula)} grades wrong${graded.feedback ? ` (${graded.feedback})` : ''}`);
        continue;
      }
      const alts = [].concat(c.accept?.[part.id] ?? []).filter((s) => typeof s === 'string' && s);
      const bads = [].concat(c.reject?.[part.id] ?? []).filter((s) => typeof s === 'string' && s);
      if (!alts.length || !bads.length) continue;
      for (const alt of alts) {
        const g = gradeSymbolic(part, alt, inst.$);
        if (!g.correct) err(tpl.id, `symbolic ${part.id}: case ${c.src} rewrite ${JSON.stringify(alt)} grades wrong${g.feedback ? ` (${g.feedback})` : ''}`);
      }
      for (const bad of bads) {
        const g = gradeSymbolic(part, bad, inst.$);
        if (g.correct) err(tpl.id, `symbolic ${part.id}: case ${c.src} wrong answer ${JSON.stringify(bad)} grades right`);
        else if (/\+\s*C(?![A-Za-z0-9_])/.test(bad) && !/no \+C/.test(g.feedback || '')) {
          err(tpl.id, `symbolic ${part.id}: typing +C should say to drop the constant, not ${JSON.stringify(g.feedback)}`);
        }
      }
      covered = true;
    }
    if (!covered) err(tpl.id, `symbolic ${part.id}: needs a worked case with a formula, an equivalent rewrite, and a wrong answer`);
  }
}

/** Ways a number can be printed in prose: 3 and 4 significant figures, a small fraction, a fraction of π. */
function numberForms(v) {
  const forms = new Set();
  if (!Number.isFinite(v) || Math.abs(v) < 1e-9 || Math.abs(Math.abs(v) - 1) < 1e-9) return forms;
  for (const p of [3, 4]) forms.add(String(Number(v.toPrecision(p))));
  for (const [scale, tex] of [[1, ''], [Math.PI, '\\pi']]) {
    const q = v / scale;
    for (let d = 1; d <= 24; d++) {
      const n = Math.round(q * d);
      if (n === 0 || Math.abs(q * d - n) > 1e-9 || gcdInt(n, d) !== 1) continue;
      const an = Math.abs(n);
      const sign = n < 0 ? '-' : '';
      const top = tex ? (an === 1 ? tex : `${an}${tex}`) : String(an);
      if (d === 1) {
        if (tex) forms.add(`${sign}${top}`);
      } else {
        forms.add(`${sign}${top}/${d}`);
        forms.add(`${sign}\\frac{${top}}{${d}}`);
        forms.add(`${sign}\\dfrac{${top}}{${d}}`);
        forms.add(`${sign}\\tfrac{${top}}{${d}}`);
      }
      break;
    }
  }
  return forms;
}

/** Prose with exponents and subscripts removed, so the 2 in x^2 is not read as a number. */
function bareProse(s) {
  return String(s)
    .replace(/\^\{[^}]*\}|\^-?\d+(\.\d+)?|\^\\?[a-z]+/gi, '')
    .replace(/_\{[^}]*\}|_-?\d+|_[a-z]/gi, '')
    .replace(/\s+/g, '');
}

function printsNumber(prose, form) {
  const esc = form.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');
  return new RegExp(`(^|[^0-9.\\\\a-z])${esc}(?![0-9]|\\.[0-9])`, 'i').test(prose);
}

/** The answers a first hint states outright, for this version. Values the problem text already shows do not count. */
function hintLeaks(tpl, inst) {
  const r = render(inst);
  const first = bareProse(r.hints[0] ?? '');
  const text = bareProse(r.text);
  const out = [];
  for (const p of tpl.parts) {
    if (p.kind === 'numeric') {
      for (const f of numberForms(expected(p, inst.$))) {
        if (printsNumber(first, f) && !printsNumber(text, f)) {
          out.push(`${p.id}=${f}`);
          break;
        }
      }
    }
    if (p.kind === 'symbolic') {
      let tex = '';
      try {
        tex = bareProse(exprToTex(symKey(p, inst.$), p.vars, p.alias)).replace(/\\cdot|[{}\\]/g, '');
      } catch {
        /* an unparsable key is reported by the symbolic checks */
      }
      if (tex.length >= 4 && first.replace(/\\cdot|[{}\\]/g, '').includes(tex)) out.push(`${p.id}=${tex}`);
    }
  }
  return out;
}

/**
 * Two or three hints. The first names the idea and stops short: across the worked cases and the
 * seeded versions, it may not print an answer in more than a quarter of them.
 */
function checkHints(tpl) {
  const count = Array.isArray(tpl.hints) ? tpl.hints.length : 0;
  if (count < 2 || count > 3) err(tpl.id, `need 2 or 3 hints, have ${count}`);
  let tried = 0;
  let leaked = 0;
  let example = '';
  const look = (inst) => {
    tried++;
    const leaks = hintLeaks(tpl, inst);
    if (leaks.length) {
      leaked++;
      example ||= leaks.join(', ');
    }
  };
  for (const c of tpl.cases) {
    try {
      look(build(tpl, c.v));
    } catch {
      /* case build errors are reported with the worked cases */
    }
  }
  const n = Object.keys(tpl.vars).length ? 40 : 0;
  for (let seed = 1; seed <= n; seed++) {
    try {
      look(instance(tpl, seed));
    } catch {
      break;
    }
  }
  if (tried && leaked / tried > 0.25) err(tpl.id, `the first hint gives the answer away in ${leaked} of ${tried} versions (${example})`);
}

const seen = new Set();
const labsUsed = {};
for (const tpl of PROBLEMS) {
  if (ONLY && !tpl.id.startsWith(ONLY)) continue;
  if (seen.has(tpl.id)) err(tpl.id, 'duplicate id');
  seen.add(tpl.id);
  if (!EXAMS.some((e) => e.id === tpl.exam)) err(tpl.id, `unknown exam ${tpl.exam}`);
  if (tpl.lab && !LAB_META[tpl.lab]) err(tpl.id, `unknown lab ${tpl.lab}`);
  if (tpl.lab && LAB_META[tpl.lab] && LAB_META[tpl.lab].exam !== tpl.exam) notes.push(`${tpl.id}: lives in exam ${tpl.exam} but uses lab ${tpl.lab} (${LAB_META[tpl.lab].exam})`);
  if (!CHAPTER_ORDER.includes(tpl.ch)) err(tpl.id, `unknown chapter ${tpl.ch}`);
  if (!CHAPTER_TITLES[tpl.ch]) err(tpl.id, `chapter ${tpl.ch} has no title`);
  if (tpl.sim && !tpl.lab) err(tpl.id, 'sim without lab');
  if (!tpl.cases.length) err(tpl.id, 'no worked case');
  labsUsed[tpl.lab || '(none)'] = (labsUsed[tpl.lab || '(none)'] || 0) + 1;
  checkHints(tpl);
  let piBad = null;
  let oneBad = null;
  const versions = countVersions(tpl, {
    need: 50,
    onEach(values) {
      if (piBad && oneBad) return;
      try {
        const text = render(build(tpl, values)).text;
        if (!piBad) piBad = unreducedPi(text);
        if (!oneBad) oneBad = leadingOne(text);
      } catch {
        /* a version that will not build is already excluded from the count */
      }
    },
  });
  if (versions < 50) err(tpl.id, `${versions} distinct versions; need at least 50`);
  for (const c of tpl.cases) {
    if (piBad && oneBad) break;
    try {
      const text = render(build(tpl, c.v)).text;
      if (!piBad) piBad = unreducedPi(text);
      if (!oneBad) oneBad = leadingOne(text);
    } catch {
      /* case build errors are reported below */
    }
  }
  if (piBad) err(tpl.id, `write the multiple of π in lowest terms, not ${piBad}`);
  if (oneBad) err(tpl.id, `write a coefficient of 1 as the variable itself, not ${oneBad}`);
  checkSymbolicCases(tpl);

  // 1. worked cases
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
      const ok =
        part.kind === 'numeric'
          ? withinTol(got, want, { tol: 0.01, abs: Math.max(part.abs ?? 0, 1e-9) })
          : JSON.stringify([].concat(got).sort()) === JSON.stringify([].concat(want).sort());
      if (!ok) err(tpl.id, `case ${c.src} part ${pid}: got ${typeof got === 'number' ? got.toPrecision(5) : JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
      // the grader must accept the expected value as typed by a student
      if (part.kind === 'numeric' && !grade(part, inst.$, String(want)).correct && withinTol(got, want, { tol: 0.01, abs: part.abs ?? 0 })) {
        err(tpl.id, `case ${c.src} part ${pid}: grader rejects ${want}`);
      }
    }
    if (c.note) notes.push(`${tpl.id} [${c.src}] ${c.note}`);
    checkAnswers(tpl, inst, `case ${c.src}`);
    checkSecond(tpl, inst, `case ${c.src}`);
    checkRender(tpl, inst);
    try {
      await checkSim(tpl, inst, `case ${c.src}`);
    } catch (e) {
      err(tpl.id, `case ${c.src} sim threw: ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
    }
  }

  // 2–5. random samples
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
    if (seed <= 8) checkSecond(tpl, inst, `seed ${seed}`);
    try {
      checkRender(tpl, inst);
    } catch (e) {
      err(tpl.id, `render threw: ${e.message}`);
    }
    if (seed <= 3) {
      for (const p of tpl.parts.filter((q) => q.kind === 'symbolic')) {
        const key = symKey(p, inst.$);
        if (!gradeSymbolic(p, key, inst.$).correct) err(tpl.id, `grader rejects its own key for ${p.id}`);
        if (gradeSymbolic(p, `(${key})*1.1`, inst.$).correct) err(tpl.id, `grader accepts a wrong answer for ${p.id}`);
      }
    }
    try {
      await checkSim(tpl, inst, `seed ${seed}`);
    } catch (e) {
      err(tpl.id, `seed ${seed} sim threw: ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
      break;
    }
  }
}

// grader self-test
for (const [s, v] of [
  ['2.52e7', 2.52e7], ['2.52x10^7', 2.52e7], ['2.52 × 10^-7', 2.52e-7], ['−3', -3], ['1/2', 0.5], ['2.5×10⁻⁶', 2.5e-6],
  // students type units and spaces; the unit is ignored, never misread as part of the number
  ['2.5 A', 2.5], ['3.3e-5 C/m²', 3.3e-5], ['1.6 × 10^-19 C', 1.6e-19], ['5e13 electrons', 5e13], ['$20.25', 20.25], ['-30 °', -30],
]) {
  if (parseNumber(s) !== v) err('engine', `parseNumber(${s}) = ${parseNumber(s)}`);
}
if (!Number.isNaN(parseNumber('abc'))) err('engine', 'parseNumber accepts text');
{
  const angle = { kind: 'numeric', get: () => 330, scale: 1, tol: 0.005, abs: 0.6, wrap: 360, unit: '°' };
  if (!grade(angle, {}, '-30').correct) err('engine', 'wrapped angle: −30° should equal 330°');
  if (grade(angle, {}, '150').correct) err('engine', 'wrapped angle: 150° accepted for 330°');
  const plain = { kind: 'numeric', get: () => 2.5e-6, scale: 1, tol: 0.02, abs: 0, unit: 'C' };
  if (!/10\^3/.test(grade(plain, {}, '2.5e-3').feedback)) err('engine', 'power-of-ten feedback missing');
  if (!/sign/.test(grade(plain, {}, '-2.5e-6').feedback)) err('engine', 'wrong-sign feedback missing');
}

// practice progress: spaced review and set picking
{
  const p = createProgress(memoryStorage());
  const t0 = Date.parse('2026-09-01T12:00:00Z');
  const DAY = 864e5;
  let it = p.record('e2.36a.collinear', { correct: true, clean: true, now: t0 });
  if (it.box !== 1 || it.due !== t0 + INTERVAL_DAYS[1] * DAY) err('progress', `clean solve should move to box 1, due in ${INTERVAL_DAYS[1]} day(s)`);
  it = p.record('e2.36a.collinear', { correct: true, clean: true, now: t0 + DAY });
  if (it.box !== 2) err('progress', 'second clean solve should reach box 2');
  it = p.record('e2.36a.collinear', { correct: true, clean: false, hints: 1, now: t0 + 2 * DAY });
  if (it.box !== 1) err('progress', 'solving with help should drop one box');
  it = p.record('e2.36a.collinear', { correct: false, revealed: true, now: t0 + 3 * DAY });
  if (it.box !== 0 || p.status('e2.36a.collinear', t0 + 3 * DAY) !== 'missed') err('progress', 'a miss should reset to box 0 and show as missed');
  if (p.dueIds(['e2.36a.collinear', 'e2.36a.dipole'], t0 + 4 * DAY).join() !== 'e2.36a.collinear') err('progress', 'dueIds should list only seen, overdue problems');
  if (p.nextSeed('e2.36a.dipole') !== 0 || p.nextSeed('e2.36a.collinear') === 0) err('progress', 'first attempt uses the worksheet (seed 0), later ones fresh numbers');

  for (const exam of EXAMS.map((e) => e.id)) {
    const tpls = problemsForExam(exam);
    const n = Math.min(8, tpls.length);
    const a = pickSet(tpls, p, { n, seed: 42 });
    const b = pickSet(tpls, p, { n, seed: 42 });
    const chapters = new Set(tpls.map((t) => t.ch));
    if (a.length !== n) err('pickSet', `${exam}: picked ${a.length} of ${n}`);
    if (new Set(a.map((t) => t.id)).size !== a.length) err('pickSet', `${exam}: duplicate problem`);
    if (a.map((t) => t.id).join() !== b.map((t) => t.id).join()) err('pickSet', `${exam}: same seed gave different sets`);
    if (new Set(a.map((t) => t.ch)).size < Math.min(n, chapters.size)) err('pickSet', `${exam}: set skips chapters it had room for`);
    if (a.filter((t) => t.kind === 'conceptual').length > Math.max(1, Math.floor(n * 0.25))) err('pickSet', `${exam}: too many conceptual problems`);
  }
}

/*
 * Every reference formula must render. The practice panel typesets what the parser understood, so
 * an expression the emitter cannot handle would leave a student staring at a blank preview with no
 * way to tell whether their formula was read correctly.
 */
for (const tpl of PROBLEMS) {
  const sample = tpl.cases[0] ? build(tpl, tpl.cases[0].v) : instance(tpl, 1);
  for (const part of tpl.parts.filter((p) => p.kind === 'symbolic')) {
    const key = symKey(part, sample.$);
    const t = exprToTex(key, part.vars, part.alias);
    if (!t) err(tpl.id, `symbolic ${part.id}: "${key}" does not render to TeX`);
    else if (/undefined|NaN/.test(t)) err(tpl.id, `symbolic ${part.id}: TeX came out as "${t}"`);
  }
}

const byExam = {};
const byCh = {};
for (const p of PROBLEMS) {
  byExam[p.exam] = (byExam[p.exam] || 0) + 1;
  byCh[p.ch] = (byCh[p.ch] || 0) + 1;
}
console.log(`${seen.size} templates · ${PROBLEMS.reduce((a, p) => a + p.cases.length, 0)} worked cases · ${simChecks} sim comparisons`);
console.log('by exam:', Object.entries(byExam).map(([k, v]) => `${k}:${v}`).join('  '));
console.log('by chapter:', CHAPTER_ORDER.map((c) => `${c}:${byCh[c] || 0}`).join('  '));
if (args.includes('--list')) {
  console.log('by lab:', labsUsed);
  for (const n of notes) console.log('NOTE ', n);
}
for (const e of errors) console.log('FAIL ', e);
console.log(errors.length ? `${errors.length} failure(s)` : 'problems: all checks passed');
process.exit(errors.length ? 1 : 0);
