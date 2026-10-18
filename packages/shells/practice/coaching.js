/**
 * Staged coaching, folded into a course's templates. Copied from the reference course's src/problems/index.js.
 *
 * A course may keep its hint ladders and wrong-option explanations beside the bank, one file per
 * unit: `coaching[id] = { hints: [...], why: { partId: { optionValue: 'the misconception' } },
 * traps: { partId: [[($) => wrongValue, 'what the mistake was'], ...] } }`. They are folded into
 * the templates here, so the app and the course's checks see the same thing. A template's own hints
 * come first; coaching hints continue the ladder after them. A template's own `why` and `traps`
 * win over the coaching file's.
 */
export function foldCoaching(templates, coaching = {}) {
  for (const tpl of templates) {
    const c = coaching[tpl.id];
    if (!c) continue;
    if (c.hints) tpl.hints = [...(tpl.hints || []), ...c.hints];
    for (const [partId, whys] of Object.entries(c.why || {})) {
      const part = tpl.parts.find((p) => p.id === partId);
      if (!part || part.kind !== 'choice') continue;
      const add = (list) => list.map((o) => (whys[o.value] !== undefined && !o.why ? { ...o, why: whys[o.value] } : o));
      if (typeof part.options === 'function') {
        const base = part.options;
        part.options = ($) => add(base($));
      } else part.options = add(part.options);
    }
    for (const [partId, traps] of Object.entries(c.traps || {})) {
      const part = tpl.parts.find((p) => p.id === partId);
      if (!part || part.kind !== 'numeric') continue;
      part.traps = [...(part.traps || []), ...traps];
    }
  }
  return templates;
}

/** What a coaching file names that the bank does not have: ids, parts and options. For a course's checks. */
export function coachingProblems(templates, coaching = {}) {
  const errs = [];
  const byId = new Map(templates.map((t) => [t.id, t]));
  for (const [id, c] of Object.entries(coaching)) {
    const tpl = byId.get(id);
    if (!tpl) {
      errs.push(`coaching names ${id}, which is not in the bank`);
      continue;
    }
    for (const partId of Object.keys({ ...(c.why || {}), ...(c.traps || {}) })) {
      if (!tpl.parts.some((p) => p.id === partId)) errs.push(`${id}: coaching names part ${partId}, which it does not have`);
    }
  }
  return errs;
}
