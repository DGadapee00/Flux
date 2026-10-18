import { createLabLoader } from '@flux/core';
import { PREDICTIONS } from './predictions.js';

const loaders = {
  phase: () => import('./phase.js'),
  piston: () => import('./piston.js'),
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
