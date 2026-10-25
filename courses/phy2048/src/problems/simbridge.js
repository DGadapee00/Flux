/**
 * Load a problem instance into a lab's state slice. Used by the practice panel (browser) and by
 * scripts/problems-check.mjs (Node), so what the student sees is what the check ran.
 */

export function scenarioList(lab) {
  return typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
}

/**
 * Reset `slice` to the problem's base scenario, then let the template adjust it.
 * Returns the note to show under the problem, or ''.
 */
export function applyProblem(lab, slice, inst) {
  const sim = inst.tpl.sim;
  if (!sim) return '';
  const list = scenarioList(lab);
  const id = sim.scenario ?? list[0]?.id;
  if (id != null) lab.applyScenario(id, slice);
  slice.answerScreen = false;
  const note = sim.setup ? sim.setup(slice, inst.$) : '';
  slice.problemId = inst.tpl.id;
  slice.dirty = true;
  return typeof note === 'string' ? note : '';
}

/** A Node-safe ctx for lab.recompute (these labs touch nothing in it). */
export function headlessCtx() {
  return { clock: { elapsedTime: 0, getElapsedTime: () => 0 }, pool: {}, grid: {}, handle: {} };
}
