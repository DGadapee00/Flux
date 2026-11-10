export const SETUPS={u1:{s2:[{tag:'starting setup',lab:'packet',scenario:'base',read:c=>({"dk":[c.dk,1],"dp":[c.dp,1.0545718176461564e-25],"meanMomentum":[c.meanMomentum,5.272859088230783e-25],"norm":[c.norm,0.9999999999999996],"uncertainty":[c.uncertainty,0.5]})}]},u2:{s2:[{tag:'starting setup',lab:'well',scenario:'base',read:c=>({"energy":[c.energy,0.37603016210487256],"nodes":[c.nodes,0],"norm":[c.norm,0.9999999999999994],"numericEnergy":[c.numericEnergy,0.37603008836858925]})}]},u3:{s2:[{tag:'starting setup',lab:'tunnel',scenario:'base',read:c=>({"transmission":[c.transmission,0.044467432341893424],"reflection":[c.reflection,0.9555325676581066],"kappa":[c.kappa,8.873585926187875],"numericTransmission":[c.numericTransmission,0.04446743234189344]})}]},u4:{s2:[{tag:'starting setup',lab:'spin',scenario:'base',read:c=>({"plus":[c.plus,0.7500000000000001],"minus":[c.minus,0.2499999999999999],"projection":[c.projection,0.5000000000000002]})}]}};
/** An example's tag as the notes write it, without "Worked example · ". */
export function exampleTag(tagText) {
  return tagText.replace(/^\s*Worked examples?\s*(·\s*)?/, '').trim();
}

/** Index of each tag's setup, or −1 when that example has no lab setup. */
export function matchExamples(exam, sectionId, tags) {
  const list = setupsFor(exam, sectionId);
  let untagged = -1;
  return tags.map((raw) => {
    const tag = exampleTag(raw);
    if (!tag) untagged++;
    return list.findIndex((ex) => (tag ? ex.tag === tag : ex.tag == null && ex.n === untagged));
  });
}

export function setupsFor(exam, sectionId) {
  return SETUPS[exam]?.[sectionId] || [];
}

/** Reset the slice to the example's scenario, then write its numbers. */
export function applyExample(lab, slice, ex) {
  const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
  const id = ex.scenario ?? list[0]?.id;
  if (id != null && lab.applyScenario) lab.applyScenario(id, slice);
  ex.setup?.(slice);
  slice.dirty = true;
}

