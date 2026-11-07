import { createLabLoader } from '@flux/core';
import { PREDICTIONS } from './predictions.js';

/** One entry per lab. Add each new lab here and in src/data/catalog.js (LAB_META). */
const loaders = {
  kepler: () => import('./kepler.js'),
  noise: () => import('./noise.js'),
  link: () => import('./link.js'),
  attitude: () => import('./attitude.js'),
  spin: () => import('./spin.js'),
  pointing: () => import('./pointing.js'),
  shake: () => import('./shake.js'),
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
