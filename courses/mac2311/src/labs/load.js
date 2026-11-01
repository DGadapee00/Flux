import { createLabLoader } from '@flux/core';

const loaders = {
  technique: () => import('./technique.js'),
  bridge: () => import('./bridge.js'),
  spheroid: () => import('./spheroid.js'),
  barrel: () => import('./barrel.js'),
  can: () => import('./can.js'),
  focus: () => import('./focus.js'),
  solids: () => import('./solids.js'),
  numint: () => import('./numint.js'),
  arc: () => import('./arc.js'),
  parametric: () => import('./parametric.js'),
  polar: () => import('./polar.js'),
  improper: () => import('./improper.js'),
  taylor: () => import('./taylor.js'),
  series: () => import('./series.js'),

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
