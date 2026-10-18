/**
 * Faded worked examples (Renkl & Atkinson), for any course. Copied from the reference course's
 * src/problems/fading.js; the course's own `instance` and `render` are passed in.
 *
 * For someone new to a chapter, studying a worked example and then solving a problem like it teaches
 * more than solving cold. As they get problems right, the help is withdrawn a step at a time, from
 * the end (backward fading), until they work alone.
 *
 *   level 'example' — nothing in the chapter solved yet: a complete worked example of the same
 *                     template with different numbers, then the student's own problem.
 *   level 'faded'   — the first `shown` steps of the student's own solution are worked; the rest
 *                     are theirs. Each problem solved in the chapter hides one more step.
 *   null            — working alone: the chapter is under their belt, or this template is.
 *
 * "Solved" means right on the first check without hints, peeking or a missed principle. Only
 * numeric and derivation problems take part: a worked example of a multiple-choice question with
 * other numbers would all but give its answer away. A template with no `kind` counts as numeric
 * when it has a numeric or symbolic part.
 */

const GUIDED_KINDS = new Set(['numeric', 'derivation']);

export const guidedKind = (t) => GUIDED_KINDS.has(t.kind) || (!t.kind && (t.parts || []).some((p) => p.kind === 'numeric' || p.kind === 'symbolic'));

const solvedRight = (it) => !!it && ((it.clean || 0) > 0 || (it.gOk || 0) > 0);

export function createFading({ instance, render }) {
  /** How many of a chapter's working problems this student has solved right first time. */
  function chapterSkill(templates, progress, ch) {
    return templates.filter((t) => t.ch === ch && guidedKind(t) && solvedRight(progress.get(t.id))).length;
  }

  /** A different seed for the worked example, one whose numbers are not the student's. */
  function exampleSeed(tpl, seed) {
    const mine = JSON.stringify(instance(tpl, seed).$);
    for (let k = 1; k <= 12; k++) {
      const s = ((seed + 7919 * k) % 99991) + 1;
      try {
        if (JSON.stringify(instance(tpl, s).$) !== mine) return s;
      } catch {
        /* an invalid draw: try the next */
      }
    }
    return null;
  }

  /** What help this attempt gets. `again` marks "same problem, new numbers" right after its solution. */
  function guidanceFor(tpl, progress, { templates, seed, steps, again = false }) {
    if (again || !guidedKind(tpl) || !steps) return null;
    if (solvedRight(progress.get(tpl.id))) return null;
    const skill = chapterSkill(templates, progress, tpl.ch);
    if (skill === 0) {
      const ex = exampleSeed(tpl, seed);
      if (ex == null) return null;
      return { level: 'example', exampleSeed: ex, skill };
    }
    const shown = steps - skill;
    return shown >= 1 ? { level: 'faded', shown, of: steps, skill } : null;
  }

  /** The worked example itself: its statement and steps, with the example's own numbers. */
  function workedExample(tpl, seed) {
    const view = render(instance(tpl, seed));
    return { text: view.text, steps: view.steps };
  }

  return { chapterSkill, exampleSeed, guidanceFor, workedExample };
}
