import { createLabLoader } from '@flux/core';

const loaders = {
  vectors: () => import('./vectors.js'),
  'stopping-distance': () => import('./stopping-distance.js'),
  'kinematics-graphs': () => import('./kinematics-graphs.js'),
  projectile: () => import('./projectile.js'),
  incline: () => import('./incline.js'),
  track: () => import('./track.js'),
  collide: () => import('./collide.js'),
  rotor: () => import('./rotor.js'),
};

const labs = createLabLoader(loaders);

export const hasLab = labs.hasLab;
export const loadLab = labs.loadLab;
export const loadExamLabs = labs.loadExamLabs;
export const registerLabLoader = labs.registerLabLoader;
