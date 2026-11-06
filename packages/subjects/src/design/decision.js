/**
 * A weighted decision matrix with requirements. Our own method, in the form design courses teach it.
 *
 * Requirements are pass or fail: a concept that misses one is out, whatever its score. The rest are
 * scored on each criterion from 1 (worst of the field) to 5 (best), by a straight line between them,
 * and ranked by the weighted mean score. The sensitivity asks how far one weight can move, the others
 * held, before the leader changes. With weights w and score differences d between the leader and a
 * rival, the leader stays ahead while Σ wᵢdᵢ > 0, which is linear in each weight, so the crossover is
 * w_k* = −Σ_{i≠k} wᵢdᵢ / d_k. The second method finds the same points by scanning and bisection.
 */

/**
 * @param {{ id: string, values: Record<string, number> }[]} concepts
 * @param {{ id: string, better: 'lower' | 'higher' }[]} criteria
 * @param {{ id: string, criterion: string, max?: number, min?: number }[]} requirements
 * @param {Record<string, number>} weights
 */
export function scoreConcepts(concepts, criteria, requirements, weights) {
  const fails = Object.fromEntries(concepts.map((c) => [c.id, requirements.filter((r) => {
    const v = c.values[r.criterion];
    return (r.max != null && v > r.max) || (r.min != null && v < r.min);
  }).map((r) => r.criterion)]));
  const live = concepts.filter((c) => fails[c.id].length === 0);
  const pool = live.length ? live : concepts;
  const scores = {};
  for (const c of concepts) scores[c.id] = {};
  for (const k of criteria) {
    const vals = pool.map((c) => c.values[k.id]);
    const best = k.better === 'lower' ? Math.min(...vals) : Math.max(...vals);
    const worst = k.better === 'lower' ? Math.max(...vals) : Math.min(...vals);
    for (const c of concepts) {
      const v = c.values[k.id];
      const s = best === worst ? 3 : 1 + (4 * (worst - v)) / (worst - best);
      scores[c.id][k.id] = Math.max(1, Math.min(5, s));
    }
  }
  const W = criteria.reduce((a, k) => a + (weights[k.id] || 0), 0);
  const totals = {};
  for (const c of concepts) {
    totals[c.id] = W > 0 ? criteria.reduce((a, k) => a + (weights[k.id] || 0) * scores[c.id][k.id], 0) / W : 0;
  }
  const ranked = live.map((c) => c.id).sort((a, b) => totals[b] - totals[a]);
  return { fails, scores, totals, ranked, leader: ranked[0] ?? null };
}

/**
 * How far weight k can move (others held, within [0, hi]) with the leader unchanged: closed form.
 * Returns { lo, hi } or null when there is no rival.
 */
export function weightRange(result, criteria, weights, k, cap = 10) {
  const L = result.leader;
  const rivals = result.ranked.filter((id) => id !== L);
  let lo = 0;
  let hi = cap;
  for (const j of rivals) {
    const d = Object.fromEntries(criteria.map((c) => [c.id, result.scores[L][c.id] - result.scores[j][c.id]]));
    const rest = criteria.reduce((a, c) => a + (c.id === k ? 0 : (weights[c.id] || 0) * d[c.id]), 0);
    if (Math.abs(d[k]) < 1e-12) {
      if (rest < 0) return { lo: NaN, hi: NaN };
      continue;
    }
    const w = -rest / d[k];
    if (d[k] > 0) lo = Math.max(lo, w);
    else hi = Math.min(hi, w);
  }
  return { lo, hi };
}

/** The same range by recomputing the ranking along a scan of weight k, then bisecting each change. */
export function weightRangeNumeric(rescore, weights, k, leader, cap = 10, steps = 400) {
  const leads = (w) => rescore({ ...weights, [k]: w }).leader === leader;
  const edge = (a, b) => {
    // a leads, b does not.
    for (let i = 0; i < 60; i++) {
      const m = (a + b) / 2;
      if (leads(m)) a = m;
      else b = m;
    }
    return (a + b) / 2;
  };
  const w0 = weights[k] || 0;
  let lo = 0;
  let hi = cap;
  const h = cap / steps;
  let prev = w0;
  for (let w = w0 - h; w >= -1e-12; w -= h) {
    if (!leads(Math.max(w, 0))) {
      lo = edge(prev, Math.max(w, 0));
      break;
    }
    prev = Math.max(w, 0);
  }
  prev = w0;
  for (let w = w0 + h; w <= cap + 1e-12; w += h) {
    if (!leads(Math.min(w, cap))) {
      hi = edge(prev, Math.min(w, cap));
      break;
    }
    prev = Math.min(w, cap);
  }
  return { lo, hi };
}
