import { createLabLoader } from '@flux/core';

const loaders = {
  rectilinear: () => import('./rectilinear.js'),
  'path-nt': () => import('./path-nt.js'),
  relative: () => import('./relative.js'),
  fma: () => import('./fma.js'),
  curve: () => import('./curve.js'),
  collar: () => import('./collar.js'),
  paths: () => import('./paths.js'),
};

const labs = createLabLoader(loaders);

export const hasLab = labs.hasLab;
export const loadLab = labs.loadLab;
export const loadExamLabs = labs.loadExamLabs;
export const registerLabLoader = labs.registerLabLoader;
