/**
 * Problem engine: seeded sampling, rendering and grading. No DOM, so the same code runs in the
 * browser and in scripts/problems-check.mjs. Adapted from FLUX's engine; the physics units are
 * gone, and grading knows about the printed tables.
 *
 * Table-aware grading. A numeric part names its exact answer (`get`) and, through `alt`, the other
 * answers a careful student can reach: the value read off Table A.3 after rounding z, the t on
 * either neighbouring df row, a quartile computed another way the notes allow. A typed answer is
 * right when it is within the part's tolerance of any of them. The tolerance itself matches what
 * the class writes down: probabilities to about 4 decimals, statistics to 2 or 3.
 */
import { mulberry32, hashSeed } from '../stats/rng.js';

export { hashSeed };
export const rng = mulberry32;

// ---------- building an instance ----------
const clean = (x) => Number(x.toPrecision(12));

export function build(tpl, values) {
  const $ = {};
  const T = {};
  for (const [name, spec] of Object.entries(tpl.vars)) {
    const v = values[name];
    if (v === undefined) throw new Error(`${tpl.id}: missing value for ${name}`);
    if (spec.type === 'range') {
      $[name] = v;
      T[name] = fmtPlain(v);
    } else if (spec.type === 'data') {
      $[name] = v;
      T[name] = spec.format ? spec.format(v) : v.join(', ');
    } else {
      const opt = spec.options.find((o) => o.value === v);
      if (!opt) throw new Error(`${tpl.id}: ${name}=${v} is not an option`);
      $[name] = v;
      T[name] = opt.label;
    }
  }
  Object.assign($, tpl.derive($));
  return { tpl, values, $, T };
}

export function sampleValues(tpl, rand) {
  for (let tries = 0; tries < 4000; tries++) {
    const values = {};
    // Ranges and choices first, then data sets, which may depend on them (a sample of size n).
    for (const [name, spec] of Object.entries(tpl.vars)) {
      if (spec.type === 'choice') {
        values[name] = spec.options[Math.floor(rand() * spec.options.length)].value;
      } else if (spec.type === 'range') {
        const steps = Math.round((spec.max - spec.min) / spec.step);
        let v;
        do v = clean(spec.min + spec.step * Math.floor(rand() * (steps + 1)));
        while (spec.exclude?.includes(v));
        values[name] = v;
      }
    }
    for (const [name, spec] of Object.entries(tpl.vars)) {
      if (spec.type === 'data') values[name] = spec.make(rand, values);
    }
    let inst;
    try {
      inst = build(tpl, values);
    } catch {
      continue;
    }
    if (!tpl.valid(inst.$)) continue;
    // Conditions only generated versions must meet (a worked case from the notes may break them).
    if (tpl.sampleValid && !tpl.sampleValid(inst.$)) continue;
    if (tpl.parts.some((p) => p.get && !Number.isFinite(p.get(inst.$)))) continue;
    return values;
  }
  throw new Error(`${tpl.id}: could not satisfy valid() in 4000 tries`);
}

/**
 * Seeds for the worked cases: 0 is the first case, CASE_SEED + i the i-th. A student's first
 * attempts walk through every case (the notes' own examples) before fresh numbers start.
 */
export const CASE_SEED = 1000000;

/** Which worked case a seed names, or -1 for a generated version. */
export function caseIndex(tpl, seed) {
  if (seed === 0) return tpl.cases.length ? 0 : -1;
  const i = seed - CASE_SEED;
  return i >= 0 && i < tpl.cases.length ? i : -1;
}

/** The seed for a student's attempt number k (0-based): the cases first, then fresh numbers. */
export function seedForAttempt(tpl, k, rand = Math.random) {
  if (k < tpl.cases.length) return k === 0 ? 0 : CASE_SEED + k;
  return 1 + Math.floor(rand() * 99999);
}

/** Instance from a seed: a worked case (see CASE_SEED) or a generated version. */
export function instance(tpl, seed, { worksheet = false } = {}) {
  const i = worksheet ? 0 : caseIndex(tpl, seed);
  if (i >= 0 && tpl.cases[i]) return build(tpl, tpl.cases[i].v);
  return build(tpl, sampleValues(tpl, rng(hashSeed(`${tpl.id}:${seed}`))));
}

// ---------- rendering ----------

function fmtPlain(v) {
  const s = String(clean(v));
  return s.includes('e') ? sig(v) : s;
}

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

/** 4 significant figures for prose; scientific (× 10ⁿ) outside [0.0001, 1e6). */
export function sig(x, n = 4) {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-4 && a < 1e6) return String(Number(x.toPrecision(n)));
  const [m, e] = x.toExponential(n - 1).split('e');
  return `${Number(m)} × 10${String(Number(e)).replace(/./g, (c) => SUP[c])}`;
}

export function choiceOptions(part, $) {
  return typeof part.options === 'function' ? part.options($) : part.options;
}

/** "a 8 hour shift" → "an 8 hour shift": eight, eleven, eighteen and eighty start with a vowel sound. */
function articles(text) {
  return text.replace(/\b([Aa]) (\d[\d,]*)(?=[.\s-])/g, (m, a, num) => {
    const ip = num.replace(/,/g, '');
    const vowel = ip[0] === '8' || ((ip.length === 2 || ip.length === 5 || ip.length === 8) && /^1[18]/.test(ip));
    return vowel ? `${a}n ${num}` : m;
  });
}

export const tidyProse = (text) => (typeof text === 'string' ? articles(text) : text);

export function render(inst) {
  const { tpl, $, T } = inst;
  return {
    text: tidyProse(tpl.text(T, $)),
    parts: tpl.parts.map((p) => ({
      id: p.id,
      kind: p.kind,
      label: typeof p.label === 'function' ? p.label(T, $) : p.label,
      unit: p.unit ?? null,
      prob: !!p.prob,
      options: p.options
        ? choiceOptions(p, $).map((o) => ({
            value: o.value,
            label: typeof o.label === 'function' ? o.label(T, $) : o.label,
            why: typeof o.why === 'function' ? o.why($) : o.why,
          }))
        : undefined,
      multi: p.multi ?? false,
      rubric: p.rubric ?? null,
    })),
    hints: tpl.hints,
    steps: tpl.steps($, T),
    figure: tpl.figure ? tpl.figure($, T) : null,
    table: tpl.table ? tpl.table($, T) : null,
  };
}

// ---------- answers ----------
export function expected(part, $) {
  if (part.kind === 'numeric') return part.get($);
  if (part.kind === 'choice') return typeof part.correct === 'function' ? part.correct($) : part.correct;
  return null;
}

/** Every value a numeric part accepts: the exact answer first, then the table routes. */
export function accepted(part, $) {
  const out = [part.get($)];
  if (part.alt) for (const v of [].concat(part.alt($))) if (Number.isFinite(v)) out.push(v);
  return out;
}

export function answers(inst) {
  return Object.fromEntries(inst.tpl.parts.map((p) => [p.id, expected(p, inst.$)]));
}

/** Accepts 0.25, .25, 25%, 1/4, 2.5e-3, 2.5×10^-3, −3, 1,250 and a trailing word ("12 minutes"). */
export function parseNumber(input) {
  if (typeof input === 'number') return input;
  let s = String(input)
    .trim()
    .replace(/[−–]/g, '-')
    .replace(/,(?=\d{3}\b)/g, '')
    .replace(/^\$/, '')
    .replace(/\s*[x×*·]\s*10\s*\^?\s*\(?\s*(-?\d+)\s*\)?/i, 'e$1');
  const pct = /%\s*$/.test(s);
  s = s.replace(/%\s*$/, '').replace(/(\d|\.)\s*[A-Za-z][A-Za-z\s]*$/, '$1').replace(/\s+/g, '');
  let v;
  if (/^-?[\d.]+\/[\d.]+$/.test(s)) {
    const [a, b] = s.split('/').map(Number);
    v = a / b;
  } else v = s === '' ? NaN : Number(s);
  if (!Number.isFinite(v)) return NaN;
  return pct ? v / 100 : v;
}

/**
 * How far off a typed value may be from one accepted value. `abs` may be a function of the version,
 * for answers whose precision is set by the problem's own numbers (a percentile to within
 * 0.005σ, the table's z precision).
 */
export function tolerance(part, want, $ = {}) {
  let abs = typeof part.abs === 'function' ? part.abs($) : part.abs ?? 0;
  // A small probability (a p-value of 0.0005) is read to its first significant figures, not to
  // ±0.001: otherwise a doubled or halved tail would pass. A quarter of the value, at least 0.0001.
  if (part.prob && part.smallRel !== false && Math.abs(want) < 0.004) abs = Math.min(abs, Math.max(0.0001, 0.25 * Math.abs(want)));
  return Math.max(abs, (part.tol ?? 0) * Math.abs(want), 1e-12 * Math.abs(want));
}

export function withinTol(got, want, part, $ = {}) {
  return Math.abs(got - want) <= tolerance(part, want, $);
}

/** The accepted value nearest a typed one, and whether it is close enough. */
export function nearest(part, $, got) {
  let best = null;
  for (const v of accepted(part, $)) if (!best || Math.abs(got - v) < Math.abs(got - best)) best = v;
  return { value: best, ok: best !== null && withinTol(got, best, part, $) };
}

/**
 * Grade one part. Returns { correct, feedback }.
 * input: string/number (numeric), value or array (choice), boolean (self).
 */
export function grade(part, $, input) {
  if (part.kind === 'numeric') {
    const got = parseNumber(input);
    if (!Number.isFinite(got)) return { correct: false, feedback: 'Enter a number, for example 0.3085, 12.5 or 3/8.' };
    const accept = accepted(part, $);
    if (accept.some((v) => withinTol(got, v, part, $))) return { correct: true, feedback: '' };
    return { correct: false, feedback: diagnose(part, $, got, accept[0]) };
  }
  if (part.kind === 'choice') {
    const want = expected(part, $);
    const opts = choiceOptions(part, $);
    const why = (v) => {
      const w = opts.find((o) => o.value === v)?.why;
      return typeof w === 'function' ? w($) : w || '';
    };
    if (part.multi) {
      const a = [...(Array.isArray(input) ? input : [input])].sort();
      const b = [...(Array.isArray(want) ? want : [want])].sort();
      const correct = a.length === b.length && a.every((x, i) => x === b[i]);
      if (correct) return { correct, feedback: '' };
      const wrong = a.filter((x) => !b.includes(x));
      const notes = wrong.map(why).filter(Boolean);
      const missing = b.some((x) => !a.includes(x));
      if (missing && !wrong.length) notes.push('Everything you ticked is true, but at least one more is too.');
      else if (missing) notes.push(notes.length ? 'And at least one true statement is not ticked.' : 'At least one tick is not true, and at least one true statement is not ticked.');
      return { correct, feedback: notes.join(' ') };
    }
    const correct = input === want;
    return { correct, feedback: correct ? '' : why(input) };
  }
  return { correct: !!input, feedback: '' };
}

/**
 * Why a wrong number is wrong, when the pattern is a common one: the complement of a probability,
 * a one-tail answer where two were asked (or the reverse), a percentage typed as a whole number,
 * σ where σ² was asked. A part can add its own through `traps`: [[valueFn, message], …].
 */
function diagnose(part, $, got, want) {
  const near = (v) => Number.isFinite(v) && withinTol(got, v, part, $);
  for (const [fn, msg] of part.traps || []) {
    const v = fn($);
    if (near(v)) return typeof msg === 'function' ? msg($) : msg;
  }
  if (part.prob) {
    if (got > 1 && got <= 100 && withinTol(got / 100, want, part, $)) return 'Write a probability as a decimal between 0 and 1, or add a % sign.';
    if (got < 0 || got > 1) return 'A probability is between 0 and 1.';
    if (near(1 - want)) return 'That is the complement. Check which side of the value the question asks about.';
    if (near(2 * want)) return 'That is twice the answer: one tail was asked for, not two.';
    if (near(want / 2)) return 'That is half the answer: this one counts both tails.';
  }
  if (part.prob) return ''; // the square and root slips below are about σ and σ², not probabilities
  if (want !== 0 && near(Math.sqrt(Math.abs(want)))) return 'That is the square root of the answer. Was the variance asked for, not the standard deviation?';
  if (want > 0 && near(want * want)) return 'That is the square of the answer. Was the standard deviation asked for, not the variance?';
  if (near(-want) && want !== 0) return 'Right size, wrong sign.';
  return '';
}
