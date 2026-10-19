/**
 * A course's principle tags, for the parts of the practice loop that use them: the deciding
 * principle shown with a solution, "what went wrong" after a miss, the weak-principle list, mixed
 * sets that lean toward weak principles, and grouping the list by principle.
 *
 * There is no "which principle decides this problem?" step before a problem: it was removed, and a
 * course does not supply one.
 *
 * A principle is { name, statement, cue, family, conserved? }. A family named 'Tools' marks the
 * kit (vector algebra, unit conversion).
 */

/**
 * Attach each template's principle tags: `tags[id]` is [primary, ...secondary]. A template that
 * already carries `principles` keeps them.
 */
export function applyPrincipleTags(templates, tags = {}) {
  for (const t of templates) if (!Array.isArray(t.principles) || !t.principles.length) t.principles = tags[t.id] || [];
  return templates;
}

export const primaryOf = (tpl) => tpl.principles?.[0] || null;

/** Whether a principle belongs to the 'Tools' family. */
export const isTool = (PRINCIPLES, id) => PRINCIPLES?.[id]?.family === 'Tools';
