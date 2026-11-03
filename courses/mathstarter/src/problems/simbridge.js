export function scenarioList(lab) {
  return typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
}

/** Reset the slice to the problem's scenario, then let the template write its numbers. */
export function applyProblem(lab, slice, inst) {
  const sim = inst.tpl.sim;
  if (!sim) return '';
  const list = scenarioList(lab);
  const id = sim.scenario ?? list[0]?.id;
  if (id != null && lab.applyScenario) lab.applyScenario(id, slice);
  const note = sim.setup ? sim.setup(slice, inst.$) : '';
  slice.problemId = inst.tpl.id;
  slice.dirty = true;
  return typeof note === 'string' ? note : '';
}

export function headlessCtx() {
  const view = { setVisible() {}, sync() {}, clear() {}, update() {} };
  return {
    clock: { elapsedTime: 0, getElapsedTime: () => 0 },
    pool: new Proxy({}, { get: () => () => view }),
    grid: {},
    handle: {},
  };
}
