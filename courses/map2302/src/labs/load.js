import { createLabLoader } from '@flux/core';
import { PREDICTIONS } from './predictions.js';

/** One entry per lab. Add each new lab here and in src/data/catalog.js (LAB_META). */
const loaders = {
  'clock-pendulum': () => import('./clock-pendulum.js'),
  'limit-cycle': () => import('./limit-cycle.js'),
  linearize: () => import('./linearize.js'),
  'normal-modes': () => import('./normal-modes.js'),
  'phase-portrait': () => import('./phase-portrait.js'),
  'radio-tuner': () => import('./radio-tuner.js'),
  convolution: () => import('./convolution.js'),
  laplace: () => import('./laplace.js'),
  fourier: () => import('./fourier.js'),
  rlc: () => import('./rlc.js'),
  suspension: () => import('./suspension.js'),
  resonance: () => import('./resonance.js'),
  oscillator: () => import('./oscillator.js'),
  coffee: () => import('./coffee.js'),
  'first-order-response': () => import('./first-order-response.js'),
  'phase-line': () => import('./phase-line.js'),
  euler: () => import('./euler.js'),
  'slope-field': () => import('./slope-field.js'),
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
