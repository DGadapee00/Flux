/**
 * The template as a student meets it: its own hints, `why` and `traps` plus the coaching entry's.
 * Nothing is mutated, and anything already folded in is not added again (hints by text, traps by
 * identity, `why` only where the option has none), so the count is the same either way.
 */
export function withCoaching(t, c) {
  if (!c) return t;
  const hints = [...(t.hints || [])];
  for (const h of c.hints || []) if (!hints.includes(h)) hints.push(h);
  const parts = (t.parts || []).map((p) => {
    if (p.kind === 'choice' && c.why?.[p.id]) {
      const whys = c.why[p.id];
      const add = (list) => list.map((o) => (whys[o.value] !== undefined && !o.why ? { ...o, why: whys[o.value] } : o));
      return { ...p, options: typeof p.options === 'function' ? ($) => add(p.options($)) : add(p.options) };
    }
    if (p.kind === 'numeric' && c.traps?.[p.id]) {
      const traps = [...(p.traps || [])];
      for (const x of c.traps[p.id]) if (!traps.includes(x)) traps.push(x);
      return { ...p, traps };
    }
    return p;
  });
  return { ...t, hints, parts };
}
