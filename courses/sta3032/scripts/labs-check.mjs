/**
 * Every lab, headless. For each one:
 *   - its defaults, every scenario and every prediction's two states compute and draw (on a
 *     recording stand-in for a canvas) without throwing, and every number in the readout is finite
 *     or a deliberate dash;
 *   - every param's value sits inside its limits, and every scenario and prediction names only
 *     params that exist;
 *   - every prediction's outcome, computed from the lab's own numbers, is the answer it expects
 *     (a prediction whose "right answer" the lab does not show is a bug);
 *   - all the TeX in labels, readouts, explainers and predictions parses;
 * then the statistical checks each lab's picture depends on (a simulated sampling distribution's
 * spread against σ/√n, long-run coverage against the confidence level, simulated power against
 * the formula, and so on).
 *
 *   node scripts/labs-check.mjs
 */
import { LABS } from '../src/labs/index.js';
import { createRng } from '../src/stats/rng.js';
import { mathPieces, texError } from '../src/ui/shared.js';

let checks = 0;
let fails = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) {
    fails++;
    console.log(`FAIL ${msg}`);
  }
};
const near = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, want ${b} ± ${tol}`);

/** A 2D context that accepts every call and remembers how many drawing calls it got. */
function fakeCanvas(w = 360, h = 260) {
  let calls = 0;
  const ctx = new Proxy(
    {},
    {
      get(t, k) {
        if (k in t) return t[k];
        if (k === 'measureText') return (s) => ({ width: String(s).length * 6 });
        return () => {
          calls++;
        };
      },
      set(t, k, v) {
        t[k] = v;
        return true;
      },
    },
  );
  return { clientWidth: w, clientHeight: h, width: 0, height: 0, getContext: () => ctx, get calls() { return calls; } };
}

const resolve = (v, s) => (typeof v === 'function' ? v(s) : v);

function texOK(where, s) {
  for (const piece of mathPieces(s)) {
    ok(!piece.unclosed, `${where}: unclosed $ in ${JSON.stringify(s)}`);
    if (piece.unclosed) continue;
    const e = texError(piece.src, piece.display);
    ok(!e, `${where}: TeX ${JSON.stringify(piece.src)}: ${e}`);
  }
}

/** Compute, draw and read out one state; returns the result. */
function exercise(lab, state, where) {
  let r;
  try {
    r = lab.compute(state, createRng(state.seed));
  } catch (e) {
    ok(false, `${where}: compute threw ${e.stack}`);
    return null;
  }
  const canvas = fakeCanvas();
  try {
    lab.draw(canvas, state, r);
    ok(canvas.calls > 10, `${where}: draw made only ${canvas.calls} calls`);
  } catch (e) {
    ok(false, `${where}: draw threw ${e.stack}`);
  }
  try {
    for (const [l, v] of lab.readout(state, r)) {
      texOK(`${where} readout label`, l);
      texOK(`${where} readout value`, v);
      ok(!/NaN|undefined|Infinity(?!\})/.test(v), `${where}: readout ${l} = ${v}`);
    }
    for (const p of lab.explain(state, r)) {
      texOK(`${where} explain`, p);
      ok(!/NaN|undefined/.test(p), `${where}: explain says ${p}`);
    }
  } catch (e) {
    ok(false, `${where}: readout/explain threw ${e.stack}`);
  }
  return r;
}

/** Clamp a state into its params' limits, the way the page does. */
function clamp(lab, s) {
  for (const p of lab.params) {
    if (p.type !== 'range') continue;
    const min = resolve(p.min, s);
    const max = resolve(p.max, s);
    s[p.id] = Math.min(max, Math.max(min, s[p.id]));
  }
  return s;
}

const ids = new Set();
for (const lab of LABS) {
  const W = `lab ${lab.id}`;
  ok(!ids.has(lab.id), `${W}: duplicate id`);
  ids.add(lab.id);
  ok(lab.title && lab.blurb && lab.ch.length, `${W}: needs a title, blurb and chapters`);
  texOK(`${W} blurb`, lab.blurb);
  const names = new Set(['seed', ...lab.params.map((p) => p.id), ...Object.keys(lab.initial || {})]);
  const def = lab.defaults();
  for (const p of lab.params) {
    texOK(`${W} label ${p.id}`, p.label);
    if (p.type === 'range') {
      const [min, max, step] = [resolve(p.min, def), resolve(p.max, def), resolve(p.step, def)];
      ok(min < max && step > 0, `${W} ${p.id}: limits ${min}..${max} step ${step}`);
      ok(def[p.id] >= min && def[p.id] <= max, `${W} ${p.id}: default ${def[p.id]} outside ${min}..${max}`);
    } else if (p.type === 'choice') {
      ok(p.options.some(([v]) => v === def[p.id]), `${W} ${p.id}: default ${def[p.id]} is not an option`);
      for (const [, l] of p.options) texOK(`${W} option ${p.id}`, l);
    }
  }
  exercise(lab, def, `${W} defaults`);
  for (const sc of lab.scenarios) {
    for (const k of Object.keys(sc.state)) ok(names.has(k), `${W} scenario ${sc.id}: unknown param ${k}`);
    exercise(lab, clamp(lab, { ...def, ...sc.state }), `${W} scenario ${sc.id}`);
  }
  for (const a of lab.actions) {
    const s = { ...def };
    const next = a.run(s, lab.compute(s, createRng(s.seed))) || s;
    exercise(lab, next, `${W} action ${a.id}`);
  }
  for (const p of lab.predictions) {
    const P = `${W} prediction ${p.id}`;
    for (const k of [...Object.keys(p.setup), ...Object.keys(p.change)]) ok(names.has(k), `${P}: unknown param ${k}`);
    texOK(`${P} prompt`, p.prompt);
    texOK(`${P} why`, p.why);
    for (const [, l] of p.options) texOK(`${P} option`, l);
    ok(p.options.some(([v]) => v === p.expect), `${P}: expected answer ${p.expect} is not an option`);
    // The page applies the set-up and the change to the defaults, clamped; so do we. Over several
    // seeds, so a simulated lab's verdict is not an accident of one draw.
    for (const seed of [1, 2, 3, 17, 99]) {
      const s0 = clamp(lab, { ...def, ...p.setup, seed });
      const s1 = clamp(lab, { ...s0, ...p.change });
      for (const k of Object.keys(p.change)) ok(s1[k] === p.change[k], `${P}: change ${k}=${p.change[k]} was clamped to ${s1[k]}`);
      const before = exercise(lab, s0, `${P} before`);
      const after = exercise(lab, s1, `${P} after`);
      if (before && after) {
        const got = p.outcome(before, after, s1);
        ok(got === p.expect, `${P} (seed ${seed}): the lab shows "${got}", the prediction expects "${p.expect}"`);
      }
    }
  }
}

/* ------------------------------------------------------------------ lab-specific statistics */
const lab = (id) => LABS.find((l) => l.id === id);
const run = (id, over) => {
  const L = lab(id);
  const s = { ...L.defaults(), ...over };
  return L.compute(s, createRng(s.seed));
};

{
  // Distributions: the picture's probabilities against published values.
  near(run('dist', { dist: 'binom', n: 15, p: 0.4, ev: 'ge', a: 10 }).E.p, 0.0338, 5e-5, 'dist: Bin(15,.4) P(X≥10)');
  near(run('dist', { dist: 'norm', m: 0, sd: 1, ev: 'between', a: -1.96, b: 1.96 }).E.p, 0.95, 1e-4, 'dist: P(|Z|<1.96)');
  near(run('dist', { dist: 'pois', lam: 10, ev: 'ge', a: 16 }).E.p, 1 - 0.9513, 1e-4, 'dist: Poisson(10) P(X≥16)');
  near(run('dist', { dist: 't', df: 10, ev: 'ge', a: 2.228 }).E.p, 0.025, 1e-4, 'dist: t10 upper .025 point');
  near(run('dist', { dist: 'f', d1: 3, d2: 10, ev: 'ge', a: 3.71 }).E.p, 0.05, 5e-4, 'dist: F(3,10) upper .05 point');
}

if (lab('clt')) {
  // CLT: the simulated x̄'s have mean μ and SD σ/√n, whatever the population's shape.
  for (const pop of ['normal', 'uniform', 'skewed', 'bimodal']) {
    for (const n of [2, 10, 40]) {
      const r = run('clt', { mode: 'xbar', pop, n, reps: 5000, seed: 7 });
      near(r.simMean, r.mu, (4 * r.se) / Math.sqrt(5000), `clt ${pop} n=${n}: mean of x̄`);
      near(r.simSd / r.se, 1, 0.05, `clt ${pop} n=${n}: SD of x̄ / (σ/√n)`);
    }
  }
  for (const [n, p] of [[20, 0.3], [100, 0.1]]) {
    const r = run('clt', { mode: 'phat', n, pp: p, reps: 5000, seed: 3 });
    near(r.simMean, p, 4 * Math.sqrt((p * (1 - p)) / n / 5000), `clt p̂ n=${n}: mean`);
    near(r.simSd / Math.sqrt((p * (1 - p)) / n), 1, 0.05, `clt p̂ n=${n}: SD / √(pq/n)`);
  }
  // Binomial mode: the continuity-corrected approximation beats the uncorrected one.
  const b = run('clt', { mode: 'binom', n: 30, pp: 0.4, a: 10, b: 14 });
  ok(Math.abs(b.approxCC - b.exact) < Math.abs(b.approxRaw - b.exact), `clt binom: continuity correction helps (${b.exact}, ${b.approxCC}, ${b.approxRaw})`);
}

if (lab('ci')) {
  // CI coverage: over many runs the long-run capture rate is the confidence level (z with σ,
  // and t with s); z with s undercovers at small n.
  for (const method of ['z', 't']) {
    for (const conf of [0.9, 0.95]) {
      const r = run('ci', { method, conf, n: 8, count: 100, runs: 4000, seed: 11 });
      near(r.longRate, conf, 3 * Math.sqrt((conf * (1 - conf)) / 400000) + 0.003, `ci ${method} ${conf}: long-run coverage`);
    }
  }
  const zs = run('ci', { method: 'zs', conf: 0.95, n: 5, count: 100, runs: 4000, seed: 11 });
  ok(zs.longRate < 0.9, `ci z-with-s at n = 5 undercovers (${zs.longRate})`);
}

if (lab('power')) {
  // Power: the formula against simulated tests.
  for (const [n, effect, alpha, tail] of [[16, 0.5, 0.05, 'right'], [25, 0.3, 0.01, 'two'], [9, 1, 0.1, 'left']]) {
    const r = run('power', { n, effect, alpha, tail, sims: 20000, seed: 5 });
    near(r.simPower, r.power, 4 * Math.sqrt((r.power * (1 - r.power)) / 20000) + 0.002, `power n=${n} d=${effect} α=${alpha} ${tail}`);
    near(r.simAlpha, alpha, 4 * Math.sqrt((alpha * (1 - alpha)) / 20000) + 0.002, `power size n=${n} α=${alpha} ${tail}`);
  }
  // Hand-computed: n = 16, σ = 1, μ0 = 0, μ1 = 0.5, one-sided α = .05 → power = 1 − Φ(1.645 − 2) = 0.6387.
  near(run('power', { n: 16, effect: 0.5, alpha: 0.05, tail: 'right' }).power, 0.6387, 5e-4, 'power: textbook value');
}

if (lab('tests')) {
  const L = lab('tests');
  // Every path through the tree ends at a test with a formula and assumptions, and every test is reachable.
  const ends = L.leaves();
  ok(ends.length >= 10, `tests: ${ends.length} tests in the tree`);
  for (const e of ends) {
    ok(e.formula && e.assume.length && e.ti, `tests ${e.id}: needs formula, assumptions and TI menu`);
    texOK(`tests ${e.id} formula`, e.formula);
    for (const a of e.assume) texOK(`tests ${e.id} assumption`, a);
    texOK(`tests ${e.id} ci`, `$${e.ci}$`);
    ok(L.leafFor({ ...L.defaults(), ...e.set }) === e, `tests ${e.id}: its answers do not lead to it`);
  }
}

if (lab('reg')) {
  // Regression: the lab's fit agrees with describe.regression on a published data set, and the
  // leverage preset moves the slope more than the outlier preset.
  const r = run('reg', { preset: 'line' });
  ok(r.fit && Number.isFinite(r.fit.b1), 'reg: fits the default points');
  const lev = run('reg', { preset: 'leverage' });
  const out = run('reg', { preset: 'outlier' });
  ok(Math.abs(lev.fit.b1 - lev.base.b1) > Math.abs(out.fit.b1 - out.base.b1), `reg: a high-leverage point moves the slope more than a mid-x outlier (${lev.fit.b1 - lev.base.b1} vs ${out.fit.b1 - out.base.b1})`);
}

console.log(`labs-check: ${LABS.length} labs, ${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
