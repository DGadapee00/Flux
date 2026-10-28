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
