/**
 * Predict first, without a page: run a lab's own recompute on copies of its state
 * and say what happened. The panel and labs-check both call this.
 */

const DEFAULT_FACTORS = [4, 2, 1, 0.5, 0.25];
const DEFAULT_TOL = 0.005;

export function cloneState(state) {
  return structuredClone(state);
}

export function measure(lab, state, watch) {
  const s = cloneState(state);
  const computed = {};
  lab.recompute(s, computed);
  return Object.fromEntries(watch.map((w) => [w.id, w.get(computed, s)]));
}

export function run(lab, state, prompt) {
  const before = measure(lab, state, prompt.watch);
  const next = cloneState(state);
  prompt.apply(next);
  const after = measure(lab, next, prompt.watch);
  return { before, after, next };
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b)) || Math.max(Math.abs(a), Math.abs(b)) < 1e-40;
}

/** One watched quantity, in the prompt's vocabulary. Null when no choice fits. */
export function outcome(prompt, w, before, after) {
  const tol = prompt.tol ?? DEFAULT_TOL;
  const mode = w.mode || prompt.mode;
  if (mode === 'bool') return !!after;
  const b = w.signed ? before : Math.abs(before);
  const a = w.signed ? after : Math.abs(after);
  if (mode === 'factor') {
    const factors = prompt.factors || DEFAULT_FACTORS;
    if (Math.abs(b) < 1e-40) return null;
    const ratio = a / b;
    let best = null;
    for (const f of factors) {
      const ok = f === 0
        ? Math.abs(ratio) < Math.max(tol, 1e-3)
        : Math.sign(ratio) === Math.sign(f) && Math.abs(Math.log(ratio / f)) <= Math.log(1 + Math.max(tol, 0.005));
      if (ok) best = f;
    }
    return best;
  }
  if (near(a, b, tol)) return 'same';
  return a > b ? 'bigger' : 'smaller';
}

export function outcomes(prompt, before, after) {
  return Object.fromEntries(prompt.watch.map((w) => [w.id, outcome(prompt, w, before[w.id], after[w.id])]));
}

export function choices(prompt, w) {
  const mode = w?.mode || prompt.mode;
  if (mode === 'bool') return [[true, 'Yes'], [false, 'No']];
  if (mode === 'factor') return (prompt.factors || DEFAULT_FACTORS).map((f) => [f, `×${f}`]);
  return [['bigger', 'Bigger'], ['same', 'Same'], ['smaller', 'Smaller']];
}

export function matchesExpect(prompt, got) {
  return prompt.watch.every((w) => got[w.id] === prompt.expect[w.id]);
}
