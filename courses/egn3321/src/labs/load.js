import { createLabLoader } from '@flux/core';
import { PREDICTIONS } from './predictions.js';

const loaders = {
  rectilinear: () => import('./rectilinear.js'),
  'path-nt': () => import('./path-nt.js'),
  relative: () => import('./relative.js'),
  fma: () => import('./fma.js'),
  curve: () => import('./curve.js'),
  collar: () => import('./collar.js'),
  paths: () => import('./paths.js'),
  impulse: () => import('./impulse.js'),
  impact: () => import('./impact.js'),
  rocket: () => import('./rocket.js'),
  ic: () => import('./ic.js'),
  'slider-crank': () => import('./slider-crank.js'),
  rolling: () => import('./rolling.js'),
  inertia: () => import('./inertia.js'),
  pendulum: () => import('./pendulum.js'),
  'roll-slip': () => import('./roll-slip.js'),
  race: () => import('./race.js'),
  linkage: () => import('./linkage.js'),
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
