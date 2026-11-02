/**
 * The map as a graph. Pure functions over a list of concepts, shared by the hub and the checks.
 */

/**
 * A cycle in `requires`, as the ids along it, or null when there is none.
 * Unknown ids are skipped here; the check reports them on their own.
 * @param {{ id: string, requires: string[] }[]} concepts
 * @returns {string[]|null}
 */
export function findCycle(concepts) {
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const state = new Map();
  const stack = [];
  function visit(id) {
    state.set(id, 'open');
    stack.push(id);
    for (const r of byId.get(id).requires || []) {
      if (!byId.has(r)) continue;
      if (state.get(r) === 'open') return [...stack.slice(stack.indexOf(r)), r];
      if (!state.has(r)) {
        const found = visit(r);
        if (found) return found;
      }
    }
    stack.pop();
    state.set(id, 'done');
    return null;
  }
  for (const c of concepts) {
    if (!state.has(c.id)) {
      const found = visit(c.id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * What each concept leads to, its depth (the longest chain of prerequisites under it, so every
 * arrow on the map points right) and the closure of a concept in either direction.
 * Call only on a map that has passed the check: no cycles, no unknown ids.
 * @template {{ id: string, requires: string[] }} C
 * @param {C[]} concepts
 */
export function buildGraph(concepts) {
  const byId = Object.fromEntries(concepts.map((c) => [c.id, c]));
  /** @type {Record<string, string[]>} */
  const leads = Object.fromEntries(concepts.map((c) => [c.id, []]));
  for (const c of concepts) for (const r of c.requires) leads[r].push(c.id);
  /** @type {Record<string, number>} */
  const depth = {};
  const d = (id) => {
    if (id in depth) return depth[id];
    const req = byId[id].requires;
    depth[id] = req.length ? 1 + Math.max(...req.map(d)) : 0;
    return depth[id];
  };
  concepts.forEach((c) => d(c.id));
  /**
   * @param {string} id
   * @param {'requires'|'leads'} key
   */
  function closure(id, key) {
    const next = key === 'requires' ? (x) => byId[x].requires : (x) => leads[x];
    const out = new Set();
    const st = [...next(id)];
    while (st.length) {
      const x = st.pop();
      if (!out.has(x)) {
        out.add(x);
        st.push(...next(x));
      }
    }
    return out;
  }
  return { byId, leads, depth, closure };
}
