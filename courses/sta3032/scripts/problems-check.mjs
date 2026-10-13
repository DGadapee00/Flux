/**
 * The problem bank's self-check. For every template:
 *
 * 1. Each worked case (the notes' or a worksheet's numbers) reproduces its expected answers, and
 *    the grader accepts them typed as a student would.
 * 2. N seeded versions build, stay finite, and every choice answer is one of the options.
 * 3. The statement, labels, hints, steps and option feedback never show `undefined` or `NaN`,
 *    every `$…$` closes, and KaTeX parses every formula.
 * 4. The grader accepts the exact answer and every table-route answer (`alt`), and rejects the
 *    exact answer scaled by 1.1 wherever that is outside table precision. Each `alt` stays close
 *    to the exact value, so a wrong table route cannot slip in.
 * 5. Simulation twins: where a template has `twin`, the problem is simulated with the seeded
 *    generator and its answer must fall within 4 standard errors of the simulated estimate. This
 *    checks the formula by an independent route, the way FLUX checks a lab against a problem.
 * 6. The progress module's scheduling and set-picking still work.
 * 7. Named sets (the review sheet): every item exists, belongs to each unit the set is offered in,
 *    and has the worked case it names, so "the sheet's numbers" opens the sheet's question.
 *
 *   node scripts/problems-check.mjs [--samples 200] [--only c5.] [--list]
 */
import { PROBLEMS, CHAPTER_ORDER } from '../src/problems/index.js';
import { build, instance, render, expected, accepted, grade, choiceOptions, tolerance, seedForAttempt, caseIndex } from '../src/problems/engine.js';
import { createProgress, memoryStorage, pickSet, INTERVAL_DAYS } from '../src/problems/progress.js';
import { mathPieces, texError } from '../src/ui/shared.js';
import { SETS, sheetSeed } from '../src/problems/sets.js';
import { UNITS } from '../src/data/catalog.js';
import { createRng } from '../src/stats/rng.js';

const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : dflt;
};
const SAMPLES = Number(arg('--samples', 200));
const ONLY = arg('--only', '');
const LIST = process.argv.includes('--list');

let fails = 0;
const err = (id, msg) => {
  fails++;
  if (fails <= 60) console.log(`FAIL ${id}: ${msg}`);
};

const ids = new Set();
const bank = PROBLEMS.filter((t) => t.id.startsWith(ONLY));

/** Every string a version puts on screen, with where it came from. */
function strings(inst) {
  const r = render(inst);
  const out = [['text', r.text]];
  r.parts.forEach((p) => {
    if (p.label) out.push([`${p.id}.label`, p.label]);
    if (p.rubric) out.push([`${p.id}.rubric`, p.rubric]);
    (p.options || []).forEach((o) => {
      out.push([`${p.id}.option`, o.label]);
      if (o.why) out.push([`${p.id}.why`, o.why]);
    });
  });
  r.hints.forEach((h, i) => out.push([`hint ${i + 1}`, h]));
  r.steps.forEach((s, i) => out.push([`step ${i + 1}`, s]));
  return out;
}

function checkStrings(id, inst, where) {
  for (const [what, s] of strings(inst)) {
    if (typeof s !== 'string') {
      err(id, `${where} ${what} is ${typeof s}, not a string`);
      continue;
    }
    if (/undefined|NaN|\[object/.test(s)) err(id, `${where} ${what} shows "${s.match(/undefined|NaN|\[object/)[0]}": ${s.slice(0, 120)}`);
    for (const piece of mathPieces(s)) {
      if (piece.unclosed) err(id, `${where} ${what} has an unclosed $: ${s.slice(0, 120)}`);
      else {
        const e = texError(piece.src, piece.display);
        if (e) err(id, `${where} ${what}: KaTeX cannot parse "${piece.src.slice(0, 80)}": ${e.slice(0, 100)}`);
      }
    }
  }
}

/** How the grader should see a number typed by a student: 4 significant figures, or exact. */
const typed = (v, part) => (part.tol === 0 && typeof part.abs === 'number' && part.abs < 1e-6 ? String(Number(v.toPrecision(12))) : String(Number(v.toPrecision(7))));

function checkParts(id, inst, where) {
  const $ = inst.$;
  for (const p of inst.tpl.parts) {
    if (p.kind === 'numeric') {
      const all = accepted(p, $);
      const exact = all[0];
      if (!Number.isFinite(exact)) {
        err(id, `${where} part ${p.id} is not finite`);
        continue;
      }
      for (const v of all) {
        if (!grade(p, $, typed(v, p)).correct) err(id, `${where} part ${p.id}: the grader rejects its own accepted value ${v}`);
        // A table route is a rounding of the exact answer, never a different answer.
        const gap = Math.abs(v - exact);
        if (gap > Math.max(0.01 * Math.abs(exact), 0.006, 2 * tolerance(p, exact, $), p.altGap ? p.altGap($) : 0)) err(id, `${where} part ${p.id}: alt ${v} is far from the exact ${exact}`);
      }
      const wrong = exact * 1.1;
      const wrongGap = Math.abs(wrong - exact);
      if (exact !== 0 && all.every((v) => Math.abs(wrong - v) > 2 * tolerance(p, v, $)) && wrongGap > 2 * tolerance(p, exact, $)) {
        if (grade(p, $, String(wrong)).correct) err(id, `${where} part ${p.id}: accepts ${wrong}, 10% off the answer ${exact}`);
      }
      if (p.prob && (exact < -1e-12 || exact > 1 + 1e-12)) err(id, `${where} part ${p.id}: probability ${exact} outside [0, 1]`);
    } else if (p.kind === 'choice') {
      const want = expected(p, $);
      const vals = choiceOptions(p, $).map((o) => o.value);
      for (const w of [].concat(want)) if (!vals.includes(w)) err(id, `${where} part ${p.id}: answer ${JSON.stringify(w)} is not an option (${JSON.stringify(vals)})`);
      if (new Set(vals).size !== vals.length) err(id, `${where} part ${p.id}: duplicate option values`);
      if (!grade(p, $, want).correct) err(id, `${where} part ${p.id}: the grader rejects the right choice`);
    }
  }
}

let versions = 0;
let caseCount = 0;
let twins = 0;
for (const tpl of bank) {
  const id = tpl.id;
  if (ids.has(id)) err(id, 'duplicate id');
  ids.add(id);
  if (!CHAPTER_ORDER.includes(tpl.ch)) err(id, `unknown chapter ${tpl.ch}`);
  if (!tpl.title || !tpl.parts?.length || !tpl.text) err(id, 'missing title, parts or text');
  if (!tpl.hints?.length) err(id, 'no hints');
  if (!['numeric', 'conceptual'].includes(tpl.kind)) err(id, `kind ${tpl.kind}`);

  // 1. worked cases
  for (const c of tpl.cases) {
    caseCount++;
    let inst;
    try {
      inst = build(tpl, c.v);
    } catch (e) {
      err(id, `case ${c.src}: ${e.message}`);
      continue;
    }
    if (!tpl.valid(inst.$)) err(id, `case ${c.src} fails valid()`);
    for (const [pid, want] of Object.entries(c.want)) {
      const p = tpl.parts.find((q) => q.id === pid);
      if (!p) {
        err(id, `case ${c.src} names part ${pid}, which does not exist`);
        continue;
      }
      const g = grade(p, inst.$, p.kind === 'numeric' ? String(want) : want);
      if (!g.correct) err(id, `case ${c.src} part ${pid}: expected ${JSON.stringify(want)}, the problem says ${JSON.stringify(p.kind === 'numeric' ? accepted(p, inst.$) : expected(p, inst.$))}`);
    }
    checkParts(id, inst, `case ${c.src}`);
    checkStrings(id, inst, `case ${c.src}`);
  }

  // Every case is reachable: attempt k opens case k.
  tpl.cases.forEach((c, k) => {
    const seed = seedForAttempt(tpl, k);
    if (caseIndex(tpl, seed) !== k || JSON.stringify(instance(tpl, seed).values) !== JSON.stringify(c.v)) err(id, `attempt ${k + 1} does not open case ${c.src}`);
  });

  // 2–4. seeded versions
  for (let s = 1; s <= SAMPLES; s++) {
    let inst;
    try {
      inst = instance(tpl, s);
    } catch (e) {
      err(id, `seed ${s}: ${e.message}`);
      break;
    }
    versions++;
    checkParts(id, inst, `seed ${s}`);
    if (s <= 40) checkStrings(id, inst, `seed ${s}`);
  }

  // 5. simulation twin
  if (tpl.twin) {
    for (const seed of [0, 7, 19]) {
      const inst = instance(tpl, seed);
      const { part, draw, n = 40000 } = tpl.twin;
      const p = tpl.parts.find((q) => q.id === part);
      const r = createRng(`twin:${id}:${seed}`);
      let s1 = 0;
      let s2 = 0;
      for (let i = 0; i < n; i++) {
        const x = Number(draw(r, inst.$));
        s1 += x;
        s2 += x * x;
      }
      const m = s1 / n;
      const se = Math.sqrt(Math.max(0, s2 / n - m * m) / n);
      const want = p.get(inst.$);
      twins++;
      if (Math.abs(m - want) > 4 * se + 1e-9) err(id, `twin seed ${seed}: simulated ${m.toFixed(5)} ± ${se.toExponential(2)}, the problem says ${want}`);
    }
  }
  if (LIST) console.log(`${id.padEnd(34)} ch ${tpl.ch.padEnd(3)} ${tpl.kind.padEnd(11)} ${tpl.title}${tpl.twin ? '  [twin]' : ''}`);
}

// 6. progress and sets
{
  const p = createProgress(memoryStorage());
  const now = Date.now();
  const t = bank[0];
  if (t) {
    p.record(t.id, { correct: true, clean: true, now });
    if (p.get(t.id).box !== 1) err('progress', 'a clean solve should move to box 1');
    if (Math.abs(p.get(t.id).due - (now + INTERVAL_DAYS[1] * 864e5)) > 1) err('progress', 'wrong due time');
    p.record(t.id, { correct: false, now });
    if (p.get(t.id).box !== 0) err('progress', 'a miss should reset to box 0');
    const set = pickSet(bank, p, { n: 8, seed: 3 });
    if (!set.length || set.length > 8) err('pickSet', `picked ${set.length}`);
    if (set.filter((x) => x.kind === 'conceptual').length > 2) err('pickSet', 'more than a quarter conceptual');
    if (new Set(set.map((x) => x.id)).size !== set.length) err('pickSet', 'duplicates');

    // Massed repeats are not mastery: five clean solves a minute apart reach box 1, not box 5.
    const q = createProgress(memoryStorage());
    for (let k = 0; k < 5; k++) q.record(t.id, { correct: true, clean: true, now: now + k * 60e3 });
    if (q.get(t.id).box !== 1) err('progress', `massed clean solves reached box ${q.get(t.id).box}`);
    // Spaced ones are: solving each time it comes due climbs a box each time.
    const sp = createProgress(memoryStorage());
    let at = now;
    for (let k = 0; k < 4; k++) {
      sp.record(t.id, { correct: true, clean: true, now: at });
      at = sp.get(t.id).due + 1;
    }
    if (sp.get(t.id).box !== 4) err('progress', `spaced clean solves reached box ${sp.get(t.id).box}, not 4`);
    // Nothing is scheduled past the cap (the day before the exam).
    const cap = at + 2 * 864e5;
    sp.record(t.id, { correct: true, clean: true, now: at, cap });
    if (sp.get(t.id).due > cap) err('progress', 'a review was scheduled after the exam');
  }
}

// 7. named sets
if (!ONLY) {
  for (const set of SETS) {
    for (const u of set.units) if (!UNITS.some((x) => x.id === u)) err(`set ${set.id}`, `unknown unit ${u}`);
    for (const it of set.items) {
      const tpl = PROBLEMS.find((t) => t.id === it.id);
      if (!tpl) {
        err(`set ${set.id}`, `no problem ${it.id}`);
        continue;
      }
      for (const u of set.units) if (!UNITS.find((x) => x.id === u)?.chapters.includes(tpl.ch)) err(`set ${set.id}`, `${it.id} (Ch ${tpl.ch}) is not on the ${u} exam`);
      const seed = sheetSeed(it);
      if (seed == null) err(`set ${set.id}`, `${it.id} has no worked case "${it.src}"`);
      else if (caseIndex(tpl, seed) < 0 || tpl.cases[caseIndex(tpl, seed)].src !== it.src) err(`set ${set.id}`, `${it.id}: the sheet seed does not open "${it.src}"`);
    }
  }
}

const byCh = CHAPTER_ORDER.map((ch) => `${ch}:${bank.filter((t) => t.ch === ch).length}`).filter((s) => !s.endsWith(':0'));
console.log(`problems-check: ${bank.length} templates (${byCh.join(' ')}), ${caseCount} worked cases, ${versions} versions, ${twins} simulation twins, ${SETS.length} named set${SETS.length === 1 ? '' : 's'}${fails ? `, ${fails} FAILED` : ', all passed'}`);
process.exit(fails ? 1 : 0);
