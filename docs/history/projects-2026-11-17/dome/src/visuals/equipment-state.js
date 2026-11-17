/** Normalized teaching timelines, not machine recipes or material prediction models. */
export function clampProgress(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}
export function weldState(value) {
  const t = clampProgress(value);
  let phase, plunge, travel;
  if (t < .18) { phase = 'Ready'; plunge = 0; travel = 0; }
  else if (t < .32) { phase = 'Plunge'; plunge = (t - .18) / .14; travel = 0; }
  else if (t < .8) { phase = 'Traverse'; plunge = 1; travel = (t - .32) / .48; }
  else if (t < .96) { phase = 'Withdraw'; plunge = 1 - (t - .8) / .16; travel = 1; }
  else { phase = 'Review'; plunge = 0; travel = 1; }
  return { t, phase, plunge, travel, z: -1.45 + 2.9 * travel, rotating: t >= .18 && t < .96 };
}
const TENSILE = [[0,0],[.2,140],[.45,290],[1,320],[3,370],[6,420],[9,390],[11.8,340],[12,0]];
export function tensileState(value) {
  const t = clampProgress(value), strainPct = 12 * t;
  const i = TENSILE.findIndex(p => p[0] >= strainPct);
  const a = TENSILE[Math.max(0, i-1)], b = TENSILE[Math.max(0, i)];
  const stressMPa = a[0] === b[0] ? b[1] : a[1] + (b[1]-a[1]) * (strainPct-a[0]) / (b[0]-a[0]);
  return { t, strainPct, stressMPa, forceN: stressMPa * 48, broken: t >= .99, neck: Math.max(0, (t-.5)/.5), phase: t < .035 ? 'Elastic response' : t < .5 ? 'Plastic deformation' : t < .99 ? 'Necking' : 'Fracture' };
}
export function scanState(value, flaw = true) {
  const t = clampProgress(value), z = -1.45 + 2.9*t;
  const response = flaw ? Math.exp(-(((z-.25)/.32)**2)) : 0;
  return { t, z, response, phase: response > .25 ? 'Indication region' : 'Reference / background', echo: 8+70*response, backwall: 82-38*response };
}
export function proofState(value, permanent = false) {
  const t=clampProgress(value), loading=t <= .5, level=loading ? 2*t : 2*(1-t);
  const residual=permanent && !loading ? .16*(1-level) : 0;
  return { t, level, loading, deformation: .8*level+residual, residual, phase: loading ? 'Loading' : t < 1 ? 'Unloading' : permanent ? 'Residual deformation' : 'Returned to reference' };
}
export const SCENES = {
  dome: { title: 'Inside the tank dome', subtitle: 'Eight gores, one ring and a crown fitting', slider: 'Separate the assembly', start: 'Assembled', end: 'Exploded', note: 'Approximate oblate dome geometry. Wall and weld-land thicknesses are exaggerated for visibility.' },
  weld: { title: 'Friction stir welding', subtitle: 'A rotating shoulder and pin join the supported panel edges', slider: 'Weld cycle', start: 'Ready', end: 'Review', note: 'Representative conventional tool and backing anvil. Motion and joint thickness are exaggerated. This is not the NASA machine or a qualified procedure.' },
  material: { title: 'Tensile test frame', subtitle: 'Follow the specimen, grips and extensometer through a test', slider: 'Test progression', start: 'Unloaded', end: 'Fracture', note: 'Illustrative stress-strain response for a fictional 48 mm² specimen. Deformation is exaggerated; the curve is not a design allowable.' },
  panels: { title: 'Contour machining a formed panel', subtitle: 'A vertical spindle follows the curved skin and leaves the weld lands', slider: 'Toolpath progression', start: 'Stock', end: 'Machined', note: 'Representative contour-milling setup. Toolpath and stock removal are schematic; fixturing and cutting parameters require a separate process plan.' },
  inspection: { title: 'Phased array ultrasonic inspection', subtitle: 'Move the wedge probe and connect the sound path to its echoes', slider: 'Probe position along the seam', start: 'Scan start', end: 'Scan end', note: 'Simplified refracted paths and synthetic A-scan echoes. Geometry, coupling and calibration affect real signals. An echo alone does not establish flaw size or acceptance.' },
  proof: { title: 'Proof-test instrumentation', subtitle: 'Follow loading, unloading and the measured return', slider: 'Load / unload cycle', start: 'Before', end: 'After', note: 'Conceptual article and instrumentation only. The protective enclosure, detailed plumbing and test execution are outside this view. Readouts are fictional.' }
};
export function sceneForStation(id) {
  return ({ requirement:'dome', design:'dome', material:'material', panels:'panels', fitup:'weld', schedule:'weld', weld:'weld', inspection:'inspection', nonconformance:'weld', proof:'proof', acceptance:'dome' })[id] || 'dome';
}
