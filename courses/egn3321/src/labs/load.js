import { createLabLoader } from '@flux/core';
import { PREDICTIONS } from './predictions.js';

const loaders = {
  rectilinear: () => import('./rectilinear.js'),
  'path-nt': () => import('./path-nt.js'),
  polar: () => import('./polar.js'),
  relative: () => import('./relative.js'),
  fma: () => import('./fma.js'),
  pulleys: () => import('./pulleys.js'),
  drag: () => import('./drag.js'),
  curve: () => import('./curve.js'),
  collar: () => import('./collar.js'),
  paths: () => import('./paths.js'),
  impulse: () => import('./impulse.js'),
  impact: () => import('./impact.js'),
  rocket: () => import('./rocket.js'),
  ic: () => import('./ic.js'),
  'slider-crank': () => import('./slider-crank.js'),
  coriolis: () => import('./coriolis.js'),
  rolling: () => import('./rolling.js'),
  inertia: () => import('./inertia.js'),
  pendulum: () => import('./pendulum.js'),
  'roll-slip': () => import('./roll-slip.js'),
  race: () => import('./race.js'),
  linkage: () => import('./linkage.js'),
  spin: () => import('./spin.js'),
  strike: () => import('./strike.js'),
  // Application labs, one per unit: 2D labs on the plot stage (define2d.js), app: true.
  train: () => import('./train.js'),
  highway: () => import('./highway.js'),
  landing: () => import('./landing.js'),
  gearbox: () => import('./gearbox.js'),
  spinup: () => import('./spinup.js'),
  tipover: () => import('./tipover.js'),
  bat: () => import('./bat.js'),
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
