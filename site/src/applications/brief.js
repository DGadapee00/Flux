/**
 * Text for reviewing satellite work in a Claude Project. Flux teaches and refers; the review
 * happens in a fresh chat inside a Project, so the brief must stand on its own: the task, what it
 * depends on, the method, the checklist and the references, with room for the learner's numbers.
 *
 * `projectInstructions()` is set once on the Project. `reviewBrief()` is pasted into a new chat in
 * it, one subsystem at a time, with the learner's files attached.
 */

/** Plain text: no HTML, and TeX left as written. */
const lines = (list, mark = '-') => list.map((x, i) => `${mark === '1.' ? `${i + 1}.` : mark} ${x}`).join('\n');

export function projectInstructions() {
  return `You review engineering work for Flux, a study map that runs across a mechanical engineering degree. The current project is an educational model of a small satellite, built one subsystem at a time: orbit, power, structure, sensor payload, thermal control, attitude control, communications, then integration.

Each chat starts with a review brief from Flux: the task, the inputs it depends on, the expected method, a checklist and references. The student attaches their work: numbers, a report, CAD files or drawings.

How to review:
- Recompute every number you rely on by a second method before you agree with it. Show the second method.
- Check units and orders of magnitude at each step.
- Go through the checklist item by item: met, partly met or not met, with the reason.
- Rank the problems you find, most serious first, and say what to change.
- Say what is missing, not only what is wrong.
- Ask for anything the brief needs that the student has not given.
- This is a learning model. Do not treat it as flight qualification, and say where a real design would need tests, standards or analysis this one leaves out.
- Be direct and plain. No praise for its own sake.

End each review with the next concrete step.`;
}

/**
 * @param {any} recipe A component from map/applications/satellite.js, or the integration.
 * @param {{ byId: Record<string, { title: string }>, recipeById: Record<string, { title: string }>,
 *   standing?: (id: string) => string | null }} ctx
 */
export function reviewBrief(recipe, { byId, recipeById, standing = () => null }) {
  const integrated = recipe.id === 'satellite';
  const parts = [];
  parts.push(`# Review: ${recipe.title} (Build a satellite, Flux)`);
  parts.push(`${integrated ? 'The whole satellite' : recipe.part}. Goal: ${recipe.outcome}`);
  parts.push(`## The task\n${recipe.demonstrate}`);
  parts.push(`## What to hand in\n${recipe.deliverable}`);
  if (recipe.requires.length) {
    parts.push(`## Inputs from other subsystems\n${lines(recipe.requires.map((id) => `${recipeById[id].title}: use the numbers from that subsystem's reviewed work.`))}`);
  }
  if (recipe.interface) parts.push(`## What it passes on\n${recipe.interface}`);
  if (recipe.method?.length) parts.push(`## Method expected\n${lines(recipe.method, '1.')}`);
  if (recipe.checklist?.length) parts.push(`## Check it against\n${lines(recipe.checklist)}`);
  if (recipe.concepts?.length) {
    parts.push(`## Foundations\n${lines(recipe.concepts.map((id) => {
      const s = standing(id);
      return `${byId[id]?.title || id}${s ? ` (my standing in Flux: ${s})` : ''}`;
    }))}`);
  }
  if (recipe.references?.length) parts.push(`## References\n${lines(recipe.references.map((r) => `${r.title}: ${r.url}`))}`);
  if (recipe.gap) parts.push(`## Known limits of this step\n${recipe.gap}`);
  parts.push(`## My work\n[Paste your numbers, assumptions and checks here, and attach your files.]`);
  return parts.join('\n\n');
}
