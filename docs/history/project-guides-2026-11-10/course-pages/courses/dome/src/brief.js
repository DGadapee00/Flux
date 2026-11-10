/**
 * Text for reviewing a traveler case in a Claude Project. Flux teaches and refers; the review
 * happens in a fresh chat inside a Project, so the brief must stand on its own: the part, the
 * station, the situation, what is known, the task and the rubric.
 *
 * `projectInstructions()` is set once on the Project. `caseBrief()` is pasted into a new chat in
 * it, one case at a time, with the learner's answer.
 */
import { lines } from '@flux/shells/project/page.js';

export function projectInstructions() {
  return `You review engineering work for Flux, a set of course apps for a mechanical engineering degree. The current project is a traveler: it follows one manufactured part, a friction stir welded propellant tank dome, through the shop, station by station, from the requirement to the proof test.

Each chat starts with a case brief from Flux: a shop-floor situation at one station, what is known, the task, a checklist and references. The student writes or attaches their answer.

How to review:
- Recompute every number you rely on by a second method before you agree with it. Show the second method.
- Check units and orders of magnitude at each step.
- Go through the checklist item by item: met, partly met or not met, with the reason.
- Check that the cause is tied to the evidence, that the disposition names the analysis, test or approval behind it, and that root cause and corrective action are kept apart from the fix to this part.
- Rank the problems you find, most serious first, and say what to change.
- Say what is missing, not only what is wrong.
- Say what an experienced weld or quality engineer would have asked first.
- Ask for anything the brief needs that the student has not given.
- This is a learning model. Do not treat it as a qualified procedure, and say where a real shop would need standards, tests or approvals this one leaves out.
- Be direct and plain. No praise for its own sake.

End each review with the next concrete step.`;
}

/**
 * A traveler case to take to review: the part, the station it happens at, the situation, what is
 * known, the task and the rubric. The dome as the learner set it goes in too, so the reviewer
 * judges the same numbers.
 *
 * @param {any} traveler The traveler (traveler.js).
 * @param {any} kase One of its cases.
 * @param {{ numbers: any }} ctx The dome's numbers, from domeNumbers().
 */
export function caseBrief(traveler, kase, { numbers }) {
  const station = traveler.stations.find((s) => s.id === kase.station);
  const land = numbers.seams.long;
  const three = (x) => String(Number(Number(x).toPrecision(3)));
  const refs = (kase.sources || []).map((id) => traveler.references.find((r) => r.id === id));
  const parts = [];
  parts.push(`# Case: ${kase.title} (${traveler.title}, Flux)`);
  parts.push(`A traveler case: a shop-floor situation to judge. Station: ${station.title}. ${station.what}`);
  parts.push(`## The part\n${traveler.why}\nThe dome as set on the page: design pressure ${three(numbers.inputs.pressureKPa)} kPa, ${three(numbers.inputs.diameterM)} m across. Its barrel seam land is ${three(land.landMm)} mm from pressure alone, sized so the weld does not ${land.governs === 'yield' ? 'yield at proof' : 'break at 1.4 times pressure'}. Proof pressure is ${three(numbers.proofKPa)} kPa.`);
  parts.push(`## The situation\n${kase.situation}`);
  parts.push(`## What is known\n${lines(kase.evidence)}`);
  parts.push(`## The task\n${kase.task}`);
  parts.push(`## Check it against\n${lines(kase.checklist)}`);
  if (refs.length) parts.push(`## References\n${lines(refs.map((r) => `${r.title}: ${r.url}`))}`);
  parts.push('## My answer\n[Write your reading of the situation, what you would check, your decision and what changes before the next part.]');
  return parts.join('\n\n');
}
