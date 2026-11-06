import { createLabLoader } from '@flux/core';
import { PREDICTIONS } from './predictions.js';

/** One entry per lab. Add each new lab here and in src/data/catalog.js (LAB_META). */
const loaders = {
  fits: () => import('./fits.js'),
  stackup: () => import('./stackup.js'),
  position: () => import('./position.js'),
  capability: () => import('./capability.js'),
  decision: () => import('./decision.js'),
  intent: () => import('./intent.js'),
  verify: () => import('./verify.js'),
  bolted: () => import('./bolted.js'),
  mount: () => import('./mount.js'),
  bridge: () => import('./bridge.js'),
  sampling: () => import('./sampling.js'),
  valve: () => import('./valve.js'),
  board: () => import('./board.js'),
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
