import { createLabLoader } from '@flux/core';
import { PREDICTIONS } from './predictions.js';

const loaders = {
  phase: () => import('./phase.js'),
  canner: () => import('./canner.js'),
  piston: () => import('./piston.js'),
  kettle: () => import('./kettle.js'),
  nozzle: () => import('./nozzle.js'),
  devices: () => import('./devices.js'),
  heater: () => import('./heater.js'),
  carnot: () => import('./carnot.js'),
  claims: () => import('./claims.js'),
  ac: () => import('./ac.js'),
  ts: () => import('./ts.js'),
  efficiency: () => import('./efficiency.js'),
  wall: () => import('./wall.js'),
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
