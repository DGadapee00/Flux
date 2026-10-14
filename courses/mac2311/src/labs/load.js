import { createLabLoader } from '@flux/core';

const loaders = {
  secant: () => import('./secant.js'),
  riemann: () => import('./riemann.js'),
};

const labs = createLabLoader(loaders);

export const hasLab = labs.hasLab;
export const loadLab = labs.loadLab;
export const loadExamLabs = labs.loadExamLabs;
export const registerLabLoader = labs.registerLabLoader;
