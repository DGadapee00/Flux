import { createLabLoader } from '@flux/core';

const loaders = {
  limits: () => import('./limits.js'),
  riemann1: () => import('./riemann1.js'),
  polar: () => import('./polar.js'),
  parametric: () => import('./parametric.js'),
  partials: () => import('./partials.js'),
  extrema: () => import('./extrema.js'),
  chain: () => import('./chain.js'),
  gradient: () => import('./gradient.js'),
  riemann: () => import('./riemann.js'),
  iterated: () => import('./iterated.js'),
  dpolar: () => import('./dpolar.js'),
  r3: () => import('./r3.js'),
  space: () => import('./space.js'),
  partials3: () => import('./partials3.js'),
  triple: () => import('./triple.js'),
  cyl: () => import('./cyl.js'),
  sph: () => import('./sph.js'),
};

const labs = createLabLoader(loaders);

export const hasLab = labs.hasLab;
export const loadLab = labs.loadLab;
export const loadExamLabs = labs.loadExamLabs;
export const registerLabLoader = labs.registerLabLoader;
