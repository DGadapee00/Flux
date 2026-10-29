import { createLabLoader } from '@flux/core';
import { PREDICTIONS } from './predictions.js';

const loaders = {
  cut: () => import('./cut.js'),
  'truss-stress': () => import('./truss-stress.js'),
  pins: () => import('./pins.js'),
  shackle: () => import('./shackle.js'),
  'tension-test': () => import('./tension-test.js'),
  poisson: () => import('./poisson.js'),
  brace: () => import('./brace.js'),
  axial: () => import('./axial.js'),
  indeterminate: () => import('./indeterminate.js'),
  rail: () => import('./rail.js'),
  strain3: () => import('./strain3.js'),
  vessel: () => import('./vessel.js'),
  tank: () => import('./tank.js'),
  mohr: () => import('./mohr.js'),
  combined: () => import('./combined.js'),
  hitch: () => import('./hitch.js'),
  diagrams: () => import('./diagrams.js'),
  flexure: () => import('./flexure.js'),
  joist: () => import('./joist.js'),
  shear: () => import('./shear.js'),
  nails: () => import('./nails.js'),
  header: () => import('./header.js'),
  curve: () => import('./curve.js'),
  propped: () => import('./propped.js'),
  shelf: () => import('./shelf.js'),
  torsion: () => import('./torsion.js'),
  twist: () => import('./twist.js'),
  motor: () => import('./motor.js'),
  castigliano: () => import('./castigliano.js'),
  drop: () => import('./drop.js'),
  buckling: () => import('./buckling.js'),
  column: () => import('./column.js'),
  bridle: () => import('./bridle.js'),
  crack: () => import('./crack.js'),
  gauges: () => import('./gauges.js'),
  fracture: () => import('./fracture.js'),
};

const labs = createLabLoader(loaders);

export const hasLab = labs.hasLab;

export async function loadLab(id) {
  const lab = await labs.loadLab(id);
  if (lab && !lab.predictions) lab.predictions = PREDICTIONS[id] || [];
  return lab;
}
export const loadExamLabs = labs.loadExamLabs;
export const registerLabLoader = labs.registerLabLoader;
