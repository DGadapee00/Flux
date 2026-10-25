import { createLabLoader } from '@flux/core';

const loaders = {
  vectors: () => import('./vectors.js'),
  'stopping-distance': () => import('./stopping-distance.js'),
  'kinematics-graphs': () => import('./kinematics-graphs.js'),
  projectile: () => import('./projectile.js'),
  'circular-motion': () => import('./circular-motion.js'),
  'relative-motion': () => import('./relative-motion.js'),
  'wind-triangle': () => import('./wind-triangle.js'),
  incline: () => import('./incline.js'),
  atwood: () => import('./atwood.js'),
  'banked-curve': () => import('./banked-curve.js'),
  drag: () => import('./drag.js'),
  'elevator-scale': () => import('./elevator-scale.js'),
  skydiver: () => import('./skydiver.js'),
  track: () => import('./track.js'),
  collide: () => import('./collide.js'),
  rotor: () => import('./rotor.js'),
};

const labs = createLabLoader(loaders);

export const hasLab = labs.hasLab;
export const loadLab = labs.loadLab;
export const loadExamLabs = labs.loadExamLabs;
export const registerLabLoader = labs.registerLabLoader;
