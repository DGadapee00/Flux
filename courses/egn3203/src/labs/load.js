import { createLabLoader } from '@flux/core';
import { PREDICTIONS } from './predictions.js';

/** One entry per lab. Add each new lab here and in src/data/catalog.js (LAB_META). */
const loaders = {
  matrix: () => import('./matrix.js'),
  elimination: () => import('./elimination.js'),
  inverse: () => import('./inverse.js'),
  rank: () => import('./rank.js'),
  projection: () => import('./projection.js'),
  eigen: () => import('./eigen.js'),
  roundoff: () => import('./roundoff.js'),
  truncation: () => import('./truncation.js'),
  roots: () => import('./roots.js'),
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
