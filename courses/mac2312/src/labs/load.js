import { createLabLoader } from '@flux/core';

const loaders = {
  solids: () => import('./solids.js'),
  taylor: () => import('./taylor.js'),
};

const labs = createLabLoader(loaders);

export const hasLab = labs.hasLab;
export const loadLab = labs.loadLab;
export const loadExamLabs = labs.loadExamLabs;
export const registerLabLoader = labs.registerLabLoader;
