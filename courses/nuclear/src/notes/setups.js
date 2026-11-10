export const SETUPS={u1:{s2:[{tag:'starting setup',lab:'binding',scenario:'base',read:c=>({"energy":[c.energy,27.944823111599998],"perNucleon":[c.perNucleon,6.9862057778999995],"massKg":[c.massKg,4.98161720676e-29]})}]},u2:{s2:[{tag:'starting setup',lab:'decay',scenario:'base',read:c=>({"remaining":[c.remaining,250],"activity":[c.activity,17.328679513998633],"lambda":[c.lambda,0.06931471805599453],"fraction":[c.fraction,0.25]})}]},u3:{s2:[{tag:'starting setup',lab:'attenuation',scenario:'base',read:c=>({"fraction":[c.fraction,0.36787944117144233],"transmitted":[c.transmitted,367.87944117144235],"halfValue":[c.halfValue,3.465735902799726]})}]},u4:{s2:[{tag:'starting setup',lab:'counting',scenario:'base',read:c=>({"rate":[c.rate,10],"sigma":[c.sigma,1.1832159566199232]})}]}};
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

