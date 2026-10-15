/**
 * Seeded problem sampler, expression parser, and grader.
 *
 * Constants, glyphs, and dimension tables are arguments. A numeric part that carries `alt`,
 * `traps`, or `prob` is graded against every accepted value (exact, plus the alternates).
 * Any other numeric part is graded against one value, with a wrapped angle when `wrap` is set.
 * Typed-unit conversion runs only when the caller passed a unit table and the part names a unit.
 * Symbolic checks evaluate both expressions at the same seeded points.
 */

export const CASE_SEED = 1000000;

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const SUP_DIGIT = { '⁻': '-', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };

const FUNCS = {
  sqrt: Math.sqrt,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
  abs: Math.abs,
};

const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '^': (a, b) => Math.pow(a, b),
};

const clean = (x) => Number(x.toPrecision(12));

/** A uniform [0, 1) generator from a 32-bit seed. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a. A problem id plus a seed becomes the sampler's seed. */
export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Which worked case a seed names, or -1 for a generated version. Seed 0 is the first case. */
export function caseIndex(tpl, seed) {
  if (seed === 0) return tpl.cases.length ? 0 : -1;
  const i = seed - CASE_SEED;
  return i >= 0 && i < tpl.cases.length ? i : -1;
}

/** The seed for attempt k (0-based): the worked cases first, then a fresh draw. */
export function seedForAttempt(tpl, k, rand = Math.random) {
  if (k < tpl.cases.length) return k === 0 ? 0 : CASE_SEED + k;
  return 1 + Math.floor(rand() * 99999);
}

function articles(text) {
  return text.replace(/\b([Aa]) (\d[\d,]*)(?=[.\s-])/g, (m, a, num) => {
    const ip = num.replace(/,/g, '');
    const vowel = ip[0] === '8' || ((ip.length === 2 || ip.length === 5 || ip.length === 8) && /^1[18]/.test(ip));
    return vowel ? `${a}n ${num}` : m;
  });
}

function sciNotation(text) {
  return text.replace(/(^|[^\d.])(\d+(?:\.\d+)?) × 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (m, pre, mant, sup) => {
    let v = Number(mant);
    let e = Number([...sup].map((c) => SUP_DIGIT[c]).join(''));
    if (!(v > 0) || !Number.isFinite(e) || (v >= 1 && v < 10)) return m;
    while (v >= 10) {
      v /= 10;
      e++;
    }
    while (v < 1) {
      v *= 10;
      e--;
    }
    const exp = String(e).replace(/./g, (c) => SUP[c]);
    return `${pre}${Number(v.toPrecision(12))} × 10${exp}`;
  });
}

function capitalize(text) {
  return /^(a|an|the) [a-z]/.test(text) ? text[0].toUpperCase() + text.slice(1) : text;
}

function isTable(part) {
  return !!(part.prob || part.alt || Array.isArray(part.traps));
}

/**
 * @param {object} [options]
 * @param {Record<string, number>} [options.consts] Numeric constants the parser may use. `pi` is included when omitted.
 * @param {Record<string, string>} [options.greek] Glyph → identifier, longest match first.
 * @param {Record<string, string>} [options.glyph] Identifier → glyph for the symbol palette.
 * @param {Record<string, string>} [options.texSym] Identifier → TeX.
 * @param {object|null} [options.units] Dimension helpers: ZERO, CONST_DIMS, parseUnit, formatDim, dimEqual, isDimensionless, dimMul, dimDiv, dimScale.
 * @param {object|null} [options.typed] Prefix table for a number typed with a unit. Null skips conversion.
 * @param {{ figures?: number, lo?: number, hi?: number, tiny?: boolean, leadingOne?: boolean }} [options.sig]
 *        `leadingOne` prints one extra figure when the first significant digit is 1.
 * @param {'full'|'articles'|'none'} [options.prose]
 * @param {'sig'|'plain'} [options.steps] `plain` calls `steps($, T)` and is the values-only solution.
 * @param {boolean} [options.optionWhy] Include each option's `why` on the rendered part.
 * @param {boolean} [options.figure]
 * @param {boolean} [options.table]
 * @param {boolean} [options.probFlag] Copy `prob` onto each rendered part.
 * @param {boolean} [options.choiceNotes] Explain a wrong multi-select. Off leaves choice feedback empty.
 * @param {'unit'|'percent'} [options.numbers] Which parser `parseNumber` exports. Grading still picks from the part.
 * @param {boolean} [options.unitFn] A part's `unit` may be a function of the version.
 */
export function createEngine(options = {}) {
  const consts = { pi: Math.PI, ...options.consts };
  const greek = options.greek ?? { π: 'pi' };
  const glyph = options.glyph ?? { pi: 'π' };
  const texSym = options.texSym ?? { pi: '\\pi' };
  const units = options.units ?? null;
  const typed = options.typed ?? null;
  const sigOpt = { figures: 3, lo: 0.01, hi: 1e5, tiny: true, leadingOne: false, ...options.sig };
  const prose = options.prose ?? 'none';
  const stepsMode = options.steps ?? 'sig';
  const optionWhy = !!options.optionWhy;
  const showFigure = !!options.figure;
  const showTable = !!options.table;
  const showProb = !!options.probFlag;
  const choiceNotes = !!options.choiceNotes;
  const unitFn = !!options.unitFn;

  function sig(x, n) {
    const requested = n == null ? sigOpt.figures : n;
    const figs = n == null ? figuresFor(x, requested) : requested;
    if (!Number.isFinite(x)) return '—';
    if (x === 0 || (sigOpt.tiny && Math.abs(x) < 1e-300)) return '0';
    const a = Math.abs(x);
    if (a >= sigOpt.lo && a < sigOpt.hi) return String(Number(x.toPrecision(figs)));
    const [m, e] = x.toExponential(figs - 1).split('e');
    const exp = String(Number(e)).replace(/./g, (c) => SUP[c]);
    return `${Number(m)} × 10${exp}`;
  }

  /** One extra figure when the first significant digit is 1, and only for the default count. */
  function figuresFor(x, n) {
    if (!sigOpt.leadingOne || !Number.isFinite(x) || x === 0) return n;
    const exp = Math.floor(Math.log10(Math.abs(x)) + 1e-12);
    const lead = Math.floor(Math.abs(x) / 10 ** exp + 1e-9);
    return lead === 1 ? n + 1 : n;
  }

  function fmtPlain(v) {
    const s = String(clean(v));
    return s.includes('e') ? sig(v) : s;
  }

  function tidyProse(text) {
    if (typeof text !== 'string') return text;
    if (prose === 'none') return text;
    const withArticles = articles(text);
    if (prose === 'articles') return withArticles;
    return capitalize(sciNotation(withArticles));
  }

  function build(tpl, values) {
    const $ = {};
    const T = {};
    for (const [name, spec] of Object.entries(tpl.vars)) {
      const v = values[name];
      if (v === undefined) throw new Error(`${tpl.id}: missing value for ${name}`);
      if (spec.type === 'range') {
        $[name] = spec.si == null ? v : v * spec.si;
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

  function sampleValues(tpl, rand) {
    for (let tries = 0; tries < 4000; tries++) {
      const values = {};
      for (const [name, spec] of Object.entries(tpl.vars)) {
        if (spec.type === 'choice') {
          values[name] = spec.options[Math.floor(rand() * spec.options.length)].value;
        } else if (spec.type === 'data') {
          // Drawn after the ranges, so a sample of size n can see n.
        } else {
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
      if (tpl.sampleValid && !tpl.sampleValid(inst.$)) continue;
      if (tpl.parts.some((p) => p.get && !Number.isFinite(p.get(inst.$)))) continue;
      return values;
    }
    throw new Error(`${tpl.id}: could not satisfy valid() in 4000 tries`);
  }

  function instance(tpl, seed, { worksheet = false } = {}) {
    // A negative seed is case −(seed+1). Seed 0 and a worksheet open case 0.
    // CASE_SEED + i opens case i, which is how a bank walks its worked examples.
    let k = null;
    if (seed < 0) k = -seed - 1;
    else if (worksheet || seed === 0) k = 0;
    else {
      const i = seed - CASE_SEED;
      if (i >= 0 && i < tpl.cases.length) k = i;
    }
    if (k != null && tpl.cases[k]) return build(tpl, tpl.cases[k].v);
    return build(tpl, sampleValues(tpl, rng(hashSeed(`${tpl.id}:${seed}`))));
  }

  function choiceOptions(part, $) {
    return typeof part.options === 'function' ? part.options($) : part.options;
  }

  function unitOf(part, $) {
    return (typeof part.unit === 'function' ? part.unit($) : part.unit) ?? null;
  }

  function render(inst) {
    const { tpl, $, T } = inst;
    const text = tpl.text(T, $, sig);
    const out = {
      text: tidyProse(text),
      parts: tpl.parts.map((p) => {
        const row = {
          id: p.id,
          kind: p.kind,
          label: typeof p.label === 'function' ? p.label(T, $, sig) : p.label,
          unit: unitFn ? unitOf(p, $) : (p.unit ?? null),
        };
        if (showProb) row.prob = !!p.prob;
        row.options = p.options
          ? choiceOptions(p, $).map((o) => {
              const label = typeof o.label === 'function' ? o.label(T, $) : o.label;
              if (!optionWhy) return { value: o.value, label };
              const why = typeof o.why === 'function' ? o.why($) : o.why;
              return { value: o.value, label, why };
            })
          : undefined;
        row.multi = p.multi ?? false;
        row.rubric = p.rubric ?? null;
        return row;
      }),
      hints: tpl.hints,
      steps: stepsMode === 'plain' ? tpl.steps($, T) : tpl.steps($, sig, T),
    };
    if (showFigure) out.figure = tpl.figure ? tpl.figure($, T) : null;
    if (showTable) out.table = tpl.table ? tpl.table($, T) : null;
    return out;
  }

  function expected(part, $) {
    if (part.kind === 'numeric') return part.scale == null ? part.get($) : part.get($) / part.scale;
    if (part.kind === 'choice') return typeof part.correct === 'function' ? part.correct($) : part.correct;
    if (part.kind === 'symbolic') return part.expr;
    return null;
  }

  function accepted(part, $) {
    const out = [part.get($)];
    if (part.alt) for (const v of [].concat(part.alt($))) if (Number.isFinite(v)) out.push(v);
    return out;
  }

  function answers(inst) {
    return Object.fromEntries(inst.tpl.parts.map((p) => [p.id, expected(p, inst.$)]));
  }

  function normalizeNumber(input) {
    return String(input)
      .trim()
      .replace(/[−–]/g, '-')
      .replace(/,/g, '')
      .replace(/^\$/, '')
      .replace(/10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, m) => '10^' + [...m].map((c) => Object.keys(SUP).find((k) => SUP[k] === c)).join(''))
      .replace(/\s*[x×*·]\s*10\s*\^?\s*\(?\s*(-?\d+)\s*\)?/i, 'e$1');
  }

  function parseMeasure(input) {
    if (typeof input === 'number') return input;
    const s = normalizeNumber(input)
      .replace(/(\d|\.)\s*(?![eE][-+]?\d)[A-Za-zμµΩ°%$/·²³⁻\s()][^\d]*$/, '$1')
      .replace(/\s+/g, '');
    if (/^-?[\d.]+\/[\d.]+$/.test(s)) {
      const [a, b] = s.split('/').map(Number);
      return a / b;
    }
    const v = Number(s);
    return Number.isFinite(v) ? v : NaN;
  }

  /** 0.25, .25, 25%, 1/4, 1,250, and a trailing word. A trailing % is a fraction. */
  function parsePercent(input) {
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

  const parseNumber = options.numbers === 'percent' ? parsePercent : parseMeasure;

  function typedUnit(input) {
    if (typeof input === 'number') return '';
    const m = /^\s*[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?\s*(.*?)\s*$/.exec(normalizeNumber(input));
    return m ? m[1] : '';
  }

  function unitSymbol(sym) {
    for (const [name, dimName, f] of typed.special || []) {
      if (sym === name) return { dim: typed.parseUnit(dimName), f };
    }
    const exact = typed.bases[sym];
    if (exact) return { dim: typed.parseUnit(exact[0]), f: exact[1] };
    const pre = typed.prefix[sym[0]];
    const base = typed.bases[sym.slice(1)];
    if (pre && base && !(typed.noPrefix || []).includes(sym.slice(1))) return { dim: typed.parseUnit(base[0]), f: pre * base[1] };
    throw new Error(`unknown unit ${sym}`);
  }

  function unitFactor(src) {
    if (!typed) throw new Error('No typed-unit table');
    const s = String(src ?? '')
      .replace(/[⁰¹²³⁻]/g, (ch) => (ch === '⁻' ? '^-' : `^${{ '⁰': 0, '¹': 1, '²': 2, '³': 3 }[ch]}`))
      .replace(/·|\*/g, ' ')
      .trim();
    if (!s) return { dim: typed.ZERO, f: 1 };
    const toks = [...s.matchAll(/\s*([A-Za-zΩμµ°]+(?:\^-?\d+)?|\(|\)|\/)/g)].map((m) => m[1]);
    if (toks.join('').replace(/\s/g, '') !== s.replace(/\s/g, '')) throw new Error(`cannot read ${src}`);
    let dim = typed.ZERO;
    let f = 1;
    let sign = 1;
    for (const t of toks) {
      if (t === '/') {
        sign = -1;
        continue;
      }
      if (t === '(' || t === ')') continue;
      const [, sym, p] = /^([^\^]+)(?:\^(-?\d+))?$/.exec(t);
      const u = unitSymbol(sym);
      const e = sign * (p ? Number(p) : 1);
      dim = typed.dimMul(dim, typed.dimScale(u.dim, e));
      f *= u.f ** e;
    }
    return { dim, f };
  }

  function convertTyped(unit, want) {
    if (!typed || !unit || !want) return null;
    let a;
    let b;
    try {
      a = unitFactor(unit);
      b = unitFactor(want || '');
    } catch {
      return null;
    }
    if (!typed.dimEqual(a.dim, b.dim)) return { mismatch: true };
    return { factor: a.f / b.f };
  }

  function tolerance(part, want, $ = {}) {
    let abs = typeof part.abs === 'function' ? part.abs($) : part.abs ?? 0;
    if (part.prob && part.smallRel !== false && Math.abs(want) < 0.004) abs = Math.min(abs, Math.max(0.0001, 0.25 * Math.abs(want)));
    return Math.max(abs, (part.tol ?? 0) * Math.abs(want), 1e-12 * Math.abs(want));
  }

  function withinTol(got, want, part, $ = {}) {
    if (isTable(part)) return Math.abs(got - want) <= tolerance(part, want, $);
    let diff = got - want;
    if (part.wrap) diff = ((((diff + part.wrap / 2) % part.wrap) + part.wrap) % part.wrap) - part.wrap / 2;
    return Math.abs(diff) <= Math.max(part.abs ?? 0, (part.tol ?? 0.02) * Math.abs(want), 1e-12 * Math.abs(want));
  }

  function nearest(part, $, got) {
    let best = null;
    for (const v of accepted(part, $)) if (!best || Math.abs(got - v) < Math.abs(got - best)) best = v;
    return { value: best, ok: best !== null && withinTol(got, best, part, $) };
  }

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
    if (part.prob) return '';
    if (want !== 0 && near(Math.sqrt(Math.abs(want)))) return 'That is the square root of the answer. Was the variance asked for, not the standard deviation?';
    if (want > 0 && near(want * want)) return 'That is the square of the answer. Was the standard deviation asked for, not the variance?';
    if (near(-want) && want !== 0) return 'Right size, wrong sign.';
    return '';
  }

  function grade(part, $, input) {
    if (part.kind === 'numeric') {
      if (isTable(part)) {
        const got = parsePercent(input);
        if (!Number.isFinite(got)) return { correct: false, feedback: 'Enter a number, for example 0.3085, 12.5 or 3/8.' };
        const accept = accepted(part, $);
        if (accept.some((v) => withinTol(got, v, part, $))) return { correct: true, feedback: '' };
        return { correct: false, feedback: diagnose(part, $, got, accept[0]) };
      }
      const want = expected(part, $);
      let got = parseMeasure(input);
      if (!Number.isFinite(got)) return { correct: false, feedback: 'Enter a number, e.g. 2.5e-6 or 2.5×10^-6.' };
      const pu = unitOf(part, $);
      if (typed && (pu || part.wrap)) {
        const unit = typedUnit(input);
        const conv = convertTyped(unit, pu);
        if (conv?.mismatch) {
          return { correct: false, feedback: `${unit} doesn't measure the same thing as ${pu}. Check which quantity this part asks for.` };
        }
        if (conv) got *= conv.factor;
      }
      if (withinTol(got, want, part)) return { correct: true, feedback: '' };
      if (part.wrap) {
        const near = withinTol(got, want, { ...part, tol: 0, abs: 10 });
        return { correct: false, feedback: near ? 'Close — recheck your arithmetic.' : 'Check the quadrant: which signs do the components have?' };
      }
      if (withinTol(-got, want, part)) return { correct: false, feedback: 'Right size, wrong sign.' };
      if (want !== 0 && got !== 0) {
        const r = Math.log10(Math.abs(got / want));
        const k = Math.round(r);
        if (k !== 0 && Math.abs(r - k) < 0.01) {
          return { correct: false, feedback: pu ? `Off by 10^${k} — check unit prefixes (${pu}).` : `Off by a factor of 10^${k}.` };
        }
        const r2 = Math.abs(got / want);
        if (Math.abs(r2 - 2) < 0.02 || Math.abs(r2 - 0.5) < 0.01) return { correct: false, feedback: 'Off by a factor of 2.' };
      }
      return { correct: false, feedback: '' };
    }
    if (part.kind === 'choice') {
      const want = expected(part, $);
      if (!choiceNotes) {
        if (part.multi) {
          const a = [...(Array.isArray(input) ? input : [input])].sort();
          const b = [...(Array.isArray(want) ? want : [want])].sort();
          return { correct: a.length === b.length && a.every((x, i) => x === b[i]), feedback: '' };
        }
        return { correct: input === want, feedback: '' };
      }
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
    if (part.kind === 'symbolic') return gradeSymbolic(part, input);
    return { correct: !!input, feedback: '' };
  }

  function parseExpr(src, symbols = [], alias = {}) {
    let s = String(src).replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'sqrt');
    for (const [from, to] of Object.entries({ ...greek, ...alias }).sort((a, b) => b[0].length - a[0].length)) {
      s = s.split(from).join(` ${to} `);
    }
    const names = [...new Set([...symbols, ...Object.keys(consts), ...Object.keys(FUNCS)])].sort((a, b) => b.length - a.length);
    const toks = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) {
        i++;
      } else if (/[\d.]/.test(c)) {
        const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
        toks.push({ t: 'num', v: Number(m[0]) });
        i += m[0].length;
      } else if (/[A-Za-z_]/.test(c)) {
        const rest = s.slice(i);
        const hit = names.find((n) => rest.startsWith(n));
        if (!hit) throw new Error(`Unknown symbol near "${rest.slice(0, 6)}"`);
        toks.push({ t: FUNCS[hit] && /^\s*\(/.test(rest.slice(hit.length)) ? 'fn' : 'id', v: hit });
        i += hit.length;
      } else if ('+-*/^()'.includes(c)) {
        toks.push({ t: c });
        i++;
      } else {
        throw new Error(`Unexpected "${c}"`);
      }
    }
    const out = [];
    for (const tk of toks) {
      const prev = out[out.length - 1];
      const endsFactor = prev && (prev.t === 'num' || prev.t === 'id' || prev.t === ')');
      const startsFactor = tk.t === 'num' || tk.t === 'id' || tk.t === 'fn' || tk.t === '(';
      if (endsFactor && startsFactor) out.push({ t: '*' });
      out.push(tk);
    }
    let p = 0;
    const peek = () => out[p];
    const eat = (t) => {
      if (out[p]?.t !== t) throw new Error(`Expected ${t}`);
      return out[p++];
    };
    function expr() {
      let node = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        const op = out[p++].t;
        node = { t: 'op', op, l: node, r: term() };
      }
      return node;
    }
    function term() {
      let node = unary();
      while (peek() && (peek().t === '*' || peek().t === '/')) {
        const op = out[p++].t;
        node = { t: 'op', op, l: node, r: unary() };
      }
      return node;
    }
    function unary() {
      if (peek()?.t === '-') {
        p++;
        return { t: 'neg', x: unary() };
      }
      if (peek()?.t === '+') {
        p++;
        return unary();
      }
      return power();
    }
    function power() {
      const base = atom();
      if (peek()?.t === '^') {
        p++;
        return { t: 'op', op: '^', l: base, r: unary() };
      }
      return base;
    }
    function atom() {
      const tk = out[p++];
      if (!tk) throw new Error('Unexpected end');
      if (tk.t === 'num') return { t: 'num', v: tk.v };
      if (tk.t === 'id') {
        if (tk.v in consts && !symbols.includes(tk.v)) return { t: 'const', name: tk.v };
        return { t: 'sym', name: tk.v };
      }
      if (tk.t === 'fn') {
        eat('(');
        const a = expr();
        eat(')');
        return { t: 'fn', name: tk.v, arg: a };
      }
      if (tk.t === '(') {
        const e = expr();
        eat(')');
        return e;
      }
      throw new Error(`Unexpected ${tk.t}`);
    }
    const ast = expr();
    if (p !== out.length) throw new Error('Unexpected trailing input');
    return ast;
  }

  function texName(name) {
    if (texSym[name]) return texSym[name];
    const m = /^([A-Za-z]+)(\d+)$/.exec(name);
    return m ? `${m[1]}_{${m[2]}}` : name;
  }

  function astToTex(ast) {
    const P = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 4 };
    const wrap = (s, yes) => (yes ? `\\left(${s}\\right)` : s);
    const go = (n, need = 0) => {
      switch (n.t) {
        case 'num':
          return String(n.v);
        case 'const':
        case 'sym':
          return texName(n.name);
        case 'neg':
          return wrap(`-${go(n.x, 3)}`, need > 2);
        case 'fn':
          return n.name === 'sqrt' ? `\\sqrt{${go(n.arg)}}` : `\\operatorname{${n.name}}\\left(${go(n.arg)}\\right)`;
        case 'op': {
          if (n.op === '/') return `\\dfrac{${go(n.l)}}{${go(n.r)}}`;
          if (n.op === '^') return `${go(n.l, 5)}^{${go(n.r)}}`;
          const prec = P[n.op];
          const l = go(n.l, prec);
          const r = go(n.r, prec + 1);
          const body = n.op === '*' ? `${l}${/^[\d.]/.test(r) ? '\\cdot ' : '\\,'}${r}` : `${l} ${n.op} ${go(n.r, n.op === '-' ? 3 : prec + 1)}`;
          return wrap(body, need > prec);
        }
        default:
          return '';
      }
    };
    return go(ast);
  }

  function exprToTex(src, symbols = [], alias = {}) {
    try {
      return astToTex(parseExpr(src, symbols, alias));
    } catch {
      return null;
    }
  }

  function evalAst(ast, sc) {
    switch (ast.t) {
      case 'num':
        return ast.v;
      case 'const':
        return consts[ast.name];
      case 'sym':
        if (!(ast.name in sc)) throw new Error(`No value for ${ast.name}`);
        return sc[ast.name];
      case 'neg':
        return -evalAst(ast.x, sc);
      case 'fn':
        return FUNCS[ast.name](evalAst(ast.arg, sc));
      default:
        return OPS[ast.op](evalAst(ast.l, sc), evalAst(ast.r, sc));
    }
  }

  function compile(src, symbols = [], alias = {}) {
    const ast = parseExpr(src, symbols, alias);
    return (sc) => evalAst(ast, sc);
  }

  function dimensionOf(ast, declared) {
    if (!units) throw new Error('No dimension table');
    const walk = (n) => {
      switch (n.t) {
        case 'num':
          return units.ZERO;
        case 'const': {
          const d = units.CONST_DIMS[n.name];
          if (!d) throw new Error(`No units known for the constant ${n.name}`);
          return d;
        }
        case 'sym': {
          const u = declared[n.name];
          if (u === undefined) throw new Error(`No units declared for ${n.name}`);
          return typeof u === 'string' ? units.parseUnit(u) : u;
        }
        case 'neg':
          return walk(n.x);
        case 'fn': {
          const a = walk(n.arg);
          if (n.name === 'sqrt') return units.dimScale(a, 0.5);
          if (n.name === 'abs') return a;
          if (!units.isDimensionless(a)) throw new Error(`${n.name}() needs a plain number, but its argument is in ${units.formatDim(a)}`);
          return units.ZERO;
        }
        default: {
          if (n.op === '^') {
            let e;
            try {
              e = evalAst(n.r, {});
            } catch {
              throw new Error('An exponent has to be a number');
            }
            return units.dimScale(walk(n.l), e);
          }
          const a = walk(n.l);
          const b = walk(n.r);
          if (n.op === '*') return units.dimMul(a, b);
          if (n.op === '/') return units.dimDiv(a, b);
          if (!units.dimEqual(a, b)) throw new Error(`Cannot ${n.op === '+' ? 'add' : 'subtract'} ${units.formatDim(b)} and ${units.formatDim(a)}`);
          return a;
        }
      }
    };
    return walk(ast);
  }

  function checkUnits(input, part) {
    if (!units || !part.unit || !part.units) return null;
    let want;
    try {
      want = units.parseUnit(part.unit);
    } catch (e) {
      return { ok: false, text: e.message };
    }
    let got;
    try {
      got = dimensionOf(parseExpr(input, part.vars, part.alias), part.units);
    } catch (e) {
      return { ok: false, text: e.message };
    }
    if (units.dimEqual(got, want)) return { ok: true, text: part.unit };
    return { ok: false, text: units.formatDim(got), want: part.unit };
  }

  function gradeSymbolic(part, input) {
    let want;
    let got;
    try {
      want = compile(part.expr, part.vars, part.alias);
    } catch (e) {
      return { correct: false, feedback: `Bad answer key: ${e.message}` };
    }
    try {
      got = compile(input, part.vars, part.alias);
    } catch (e) {
      return { correct: false, feedback: e.message };
    }
    const r = rng(12345);
    const scopes = [];
    for (let n = 0; n < 8; n++) scopes.push(Object.fromEntries(part.vars.map((v) => [v, 0.3 + 2.7 * r()])));
    let sum = 0;
    const wants = [];
    for (const sc of scopes) {
      let a;
      try {
        a = want(sc);
      } catch (e) {
        return { correct: false, feedback: `Bad answer key: ${e.message}` };
      }
      wants.push(a);
      if (Number.isFinite(a)) sum += a * a;
    }
    const typical = Math.sqrt(sum / scopes.length);
    for (let n = 0; n < scopes.length; n++) {
      const a = wants[n];
      let b;
      try {
        b = got(scopes[n]);
      } catch (e) {
        return { correct: false, feedback: e.message };
      }
      if (!Number.isFinite(b)) return { correct: false, feedback: 'Expression is undefined for some values.' };
      const tol = 1e-6 * Math.max(Math.abs(a), typical);
      if (Math.abs(a - b) > tol) return { correct: false, feedback: '' };
    }
    return { correct: true, feedback: '' };
  }

  function evalSymbolic(part, $) {
    return compile(part.expr, part.vars, part.alias)($);
  }

  function evalAtScope(input, part, scope) {
    return compile(input, part.vars, part.alias)(scope);
  }

  return {
    rng,
    hashSeed,
    CASE_SEED,
    caseIndex,
    seedForAttempt,
    build,
    sampleValues,
    instance,
    sig,
    choiceOptions,
    unitOf,
    tidyProse,
    render,
    expected,
    accepted,
    answers,
    parseNumber,
    typedUnit,
    unitFactor,
    convertTyped,
    tolerance,
    withinTol,
    nearest,
    grade,
    parseExpr,
    GLYPH: glyph,
    astToTex,
    exprToTex,
    evalAst,
    compile,
    dimensionOf,
    checkUnits,
    gradeSymbolic,
    evalSymbolic,
    evalAtScope,
  };
}
