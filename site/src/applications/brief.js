/**
 * Text for reviewing satellite work in a Claude Project. Flux teaches and refers; the review
 * happens in a fresh chat inside a Project, so the brief must stand on its own: the task, what it
 * depends on, the method, the checklist and the references, with room for the learner's numbers.
 *
 * `projectInstructions()` is set once on the Project. `reviewBrief()` is pasted into a new chat in
 * it, one subsystem at a time, with the learner's files attached.
 */

import { decisionsOf, optionById } from '@flux/map/applications/decisions/index.js';
import { conflicts, derive, formatValue } from '@flux/map/applications/decide.js';

/** Plain text: no HTML, and TeX left as written. */
const lines = (list, mark = '-') => list.map((x, i) => `${mark === '1.' ? `${i + 1}.` : mark} ${x}`).join('\n');

export function projectInstructions() {
  return `You review engineering work for Flux, a study map that runs across a mechanical engineering degree. The current project is an educational model of a small satellite, built one subsystem at a time: orbit, power, structure, sensor payload, thermal control, attitude control, communications, then integration.

Each chat starts with a review brief from Flux: the task, the inputs it depends on, the expected method, a checklist and references. The student attaches their work: numbers, a report, decision records, CAD files or drawings.

How to review:
- Recompute every number you rely on by a second method before you agree with it. Show the second method.
- Check units and orders of magnitude at each step.
- Go through the checklist item by item: met, partly met or not met, with the reason.
- Rank the problems you find, most serious first, and say what to change.
- Say what is missing, not only what is wrong.
- Ask for anything the brief needs that the student has not given.
- For a decision record (a choice of material, process, joint or finish): check that each driver is a requirement with a number, that each rejected option has a reason tied to a driver, that the choices for one subsystem agree with each other, and that the risk is named with the test or inspection that would find it. Say what an experienced engineer would have asked before choosing.
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
  const decisions = decisionsOf(recipe.id);
  if (decisions.length) {
    parts.push(`## Decisions to record\nAttach a five-line record for each: the choice, what drove it, what was rejected and why, the risk accepted, and what would change it.\n${lines(decisions.map((d) => d.question))}`);
  }
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

/** One option as a line of text: its figures with units, then the derived ones. */
function optionLine(decision, option, derived) {
  const cells = decision.columns.map((col) => {
    const v = option.values[col.id];
    if (col.kind === 'number') {
      const blank = v === null ? ` (${option.blank[col.id]})` : '';
      return `${col.label} ${formatValue(col, v)}${v === null ? '' : ` ${col.unit}`}${blank}`;
    }
    return `${col.label}: ${v}`;
  });
  const extra = (decision.derived || [])
    .filter((col) => derived[option.id][col.id] !== null)
    .map((col) => `${col.symbol} ${formatValue({ kind: 'number', dp: col.dp }, derived[option.id][col.id])}`);
  const numeric = decision.columns.every((c) => c.kind === 'number');
  return `${cells.join(numeric ? ', ' : '; ')}.${extra.length ? ` ${extra.join(', ')}.` : ''}`;
}

/**
 * A decision record to fill in and take to review: the question, what drives it, the options with
 * their figures, the learner's picks for the subsystem's other decisions, and five lines to write.
 * The facts are filled in; the reasons are the learner's to give. Flux keeps none of it.
 *
 * @param {any} decision A decision from map/applications/decisions/.
 * @param {{ recipe: { title: string, part?: string }, picks?: Record<string, string> }} ctx
 *   `picks` is `{ [decision id]: option id }`, as chosen on the page.
 */
export function decisionRecord(decision, { recipe, picks = {} }) {
  const mine = decision.options.find((o) => o.id === picks[decision.id]) || null;
  const siblings = decisionsOf(decision.subsystem);
  const derived = derive(decision);
  const parts = [];
  parts.push(`# Decision: ${decision.question} (Build a satellite, Flux)`);
  parts.push(`${recipe.title}${recipe.part ? `, ${recipe.part.toLowerCase()}` : ''}. One of ${siblings.length} choices made together: ${siblings.map((d) => d.title).join(', ')}.`);
  parts.push(`## What drives it\n${lines(decision.drivers)}`);
  parts.push(`## The options\n${lines(decision.options.map((o) => `${o.name}${o === mine ? ' (my pick)' : ''}: ${optionLine(decision, o, derived)}`))}`);

  const others = siblings.filter((d) => d.id !== decision.id);
  if (others.length) {
    const named = (d) => d.options.find((o) => o.id === picks[d.id])?.name || 'not chosen yet';
    let text = `## My other picks for ${recipe.title}\n${lines(others.map((d) => `${d.question}: ${named(d)}`))}`;
    if (mine) {
      for (const c of conflicts(picks).filter((x) => x.a === mine.id || x.b === mine.id)) {
        const other = optionById[c.a === mine.id ? c.b : c.a];
        text += `\nConflicts with my pick for "${other.decision.question}": ${other.option.name}. ${c.why}`;
      }
    }
    parts.push(text);
  }

  parts.push(`## My record\n1. I chose:${mine ? ` ${mine.name}` : ''}\n2. What drove it (the requirement, with its number):\n3. What I rejected, and why:\n4. The risk I accept, and how it would show:\n5. What would change my mind:`);
  parts.push(`## Check it against\n${lines([
    'Each driver is a requirement with a number, not a preference.',
    'Each rejected option has a reason tied to a driver.',
    'The pick agrees with the other choices for this subsystem.',
    'The risk is named, with the inspection or test that would find it.',
  ])}`);
  return parts.join('\n\n');
}
