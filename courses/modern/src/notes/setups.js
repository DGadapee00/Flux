export const SETUPS={u1:{s2:[{tag:'starting setup',lab:'relativity',scenario:'base',read:c=>({"gamma":[c.gamma,1.25],"time":[c.time,2.5],"contracted":[c.contracted,0.8]})}]},u2:{s2:[{tag:'starting setup',lab:'photoelectric',scenario:'base',read:c=>({"energy":[c.energy,4.132806614440009],"kinetic":[c.kinetic,1.7328066144400087],"stopping":[c.stopping,1.7328066144400087],"cutoff":[c.cutoff,516.6008268050011]})}]},u3:{s2:[{tag:'starting setup',lab:'matter-wave',scenario:'base',read:c=>({"wavelength":[c.wavelength,0.12264259653234232],"speed":[c.speed,5930969.580731296],"momentum":[c.momentum,5.4027477706349975e-24]})}]},u4:{s2:[{tag:'starting setup',lab:'hydrogen',scenario:'base',read:c=>({"photon":[c.photon,1.8896796004158334],"wavelength":[c.wavelength,656.1122764193301],"upperEnergy":[c.upperEnergy,-1.5117436803326667],"lowerEnergy":[c.lowerEnergy,-3.4014232807485]})}]}};
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

