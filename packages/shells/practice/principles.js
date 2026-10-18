/**
 * The principle step, for any course that names its principles.
 *
 * Copied from the reference course's src/problems/principle-step.js and made course-neutral: the course passes
 * its own PRINCIPLES, and optionally which ones get mistaken for which (`confused`) and which pairs
 * are too close to use as each other's distractor (`twins`). No DOM; the practice panel renders it.
 *
 * Experts file problems by principle, novices by surface (Chi, Feltovich & Glaser). Asking for the
 * principle first, and grading it, makes that choice a retrieval act of its own. A template's
 * secondary principles are never offered as distractors: they are also true of the problem.
 *
 * A principle is { name, statement, cue, family, conserved? }. A family named 'Tools' marks the
 * kit (vector algebra, unit conversion): those problems skip the step.
 */

/** The value the "not sure" option carries. It is graded like a wrong pick. */
export const UNSURE = '?';

/** A small seeded generator (mulberry32), so a version always offers the same four. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s) {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

/**
 * Attach each template's principle tags: `tags[id]` is [primary, ...secondary]. A template that
 * already carries `principles` keeps them.
 */
export function applyPrincipleTags(templates, tags = {}) {
  for (const t of templates) if (!Array.isArray(t.principles) || !t.principles.length) t.principles = tags[t.id] || [];
  return templates;
}

export const primaryOf = (tpl) => tpl.principles?.[0] || null;

/**
 * @param {object} spec
 * @param {Record<string, {name: string, statement: string, cue: string, family?: string, conserved?: string}>} spec.PRINCIPLES
 * @param {Record<string, string[]>} [spec.confused] Principles mistaken for each one, most tempting first.
 * @param {string[][]} [spec.twins] Pairs never used as each other's distractor.
 */
export function createPrincipleStep({ PRINCIPLES, confused = {}, twins = [] }) {
  const isTwin = (a, b) => twins.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const tool = (id) => PRINCIPLES[id]?.family === 'Tools';

  /** Whether a template gets the step: it names a known principle that is not a tool. */
  function asksPrinciple(tpl) {
    const p = primaryOf(tpl);
    return !!p && !!PRINCIPLES[p] && !tool(p) && Object.keys(PRINCIPLES).filter((id) => !tool(id)).length >= 4;
  }

  /** Four principle ids in a seeded order: the primary and three distractors. */
  function principleOptions(tpl, seed = 0) {
    const primary = primaryOf(tpl);
    const tags = new Set(tpl.principles);
    const rand = seeded((hashString(tpl.id) ^ Math.imul(seed, 2654435761)) >>> 0);
    const usable = (id) => !tags.has(id) && !isTwin(id, primary) && PRINCIPLES[id] && !tool(id);
    // The most tempting that aren't also true of this problem; one sometimes swapped for a less
    // obvious one so the same three don't always travel together.
    const near = (confused[primary] || []).filter(usable);
    const picks = near.slice(0, 3);
    if (near.length > 3 && rand() < 0.5) picks[2] = near[3 + Math.floor(rand() * (near.length - 3))];
    const family = PRINCIPLES[primary].family;
    const rest = Object.keys(PRINCIPLES).filter((id) => usable(id) && !picks.includes(id) && id !== primary);
    rest.sort((a, b) => (PRINCIPLES[b].family === family) - (PRINCIPLES[a].family === family) || rand() - 0.5);
    while (picks.length < 3 && rest.length) picks.push(rest.shift());
    const out = [primary, ...picks];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  const gradePrinciple = (tpl, pick) => pick === primaryOf(tpl);
  const pname = (id) => PRINCIPLES[id]?.name || id;

  return { PRINCIPLES, asksPrinciple, principleOptions, gradePrinciple, primaryOf, pname, UNSURE, isTool: tool };
}
