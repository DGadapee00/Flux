import { createLabLoader } from '@flux/core';

const loaders = {
  limits: () => import('./limits.js'),
  secant: () => import('./secant.js'),
  rates: () => import('./rates.js'),
  box: () => import('./box.js'),
  riemann: () => import('./riemann.js'),
  accum: () => import('./accum.js'),
};

const labs = createLabLoader(loaders);

export const hasLab = labs.hasLab;
export const loadLab = labs.loadLab;
export const loadExamLabs = labs.loadExamLabs;
export const registerLabLoader = labs.registerLabLoader;
