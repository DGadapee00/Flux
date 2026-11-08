import { createLabLoader } from '@flux/core';
import { PREDICTIONS } from './predictions.js';

/** One entry per lab. Add each new lab here and in src/data/catalog.js (LAB_META). */
const loaders = {
  bond: () => import('./bond.js'),
  crystal: () => import('./crystal.js'),
  vacancy: () => import('./vacancy.js'),
  diffusion: () => import('./diffusion.js'),
  slip: () => import('./slip.js'),
  lever: () => import('./lever.js'),
  xrd: () => import('./xrd.js'),
  grain: () => import('./grain.js'),
  jominy: () => import('./jominy.js'),
  griffith: () => import('./griffith.js'),
  paris: () => import('./paris.js'),
  creep: () => import('./creep.js'),
  chains: () => import('./chains.js'),
  pane: () => import('./pane.js'),
  couple: () => import('./couple.js'),
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
