import { createLabLoader } from '@flux/core';
import { PREDICTIONS } from './predictions.js';

/** One entry per lab. Add each new lab here and in src/data/catalog.js (LAB_META). */
const loaders = {
  rod: () => import('./rod.js'),
  resistance: () => import('./resistance.js'),
  radiation: () => import('./radiation.js'),
  viewfactor: () => import('./viewfactor.js'),
  thermal: () => import('./thermal.js'),
  nusselt: () => import('./nusselt.js'),
  fin: () => import('./fin.js'),
  quench: () => import('./quench.js'),
  touch: () => import('./touch.js'),
  grid: () => import('./grid.js'),
  shield: () => import('./shield.js'),
  tube: () => import('./tube.js'),
  plume: () => import('./plume.js'),
  boil: () => import('./boil.js'),
  exchanger: () => import('./exchanger.js'),
  wetbulb: () => import('./wetbulb.js'),
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
