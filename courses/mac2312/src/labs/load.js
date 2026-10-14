import { createLabLoader } from '@flux/core';

const loaders = {
  solids: () => import('./solids.js'),
  numint: () => import('./numint.js'),
  improper: () => import('./improper.js'),
  taylor: () => import('./taylor.js'),
  series: () => import('./series.js'),
};

const labs = createLabLoader(loaders);

export const hasLab = labs.hasLab;
export const loadLab = labs.loadLab;
export const loadExamLabs = labs.loadExamLabs;
export const registerLabLoader = labs.registerLabLoader;
