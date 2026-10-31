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
  'work-energy': () => import('./work-energy.js'),
  'work-path': () => import('./work-path.js'),
  track: () => import('./track.js'),
  'energy-diagram': () => import('./energy-diagram.js'),
  'automotive-power': () => import('./automotive-power.js'),
  impulse: () => import('./impulse.js'),
  collide: () => import('./collide.js'),
  'collide-2d': () => import('./collide-2d.js'),
  'center-of-mass': () => import('./center-of-mass.js'),
  rocket: () => import('./rocket.js'),
  'crumple-zone': () => import('./crumple-zone.js'),
  'crash-reconstruction': () => import('./crash-reconstruction.js'),
  rotor: () => import('./rotor.js'),
  inertia: () => import('./inertia.js'),
  'massive-pulley': () => import('./massive-pulley.js'),
  'helicopter-rotor': () => import('./helicopter-rotor.js'),
  rolling: () => import('./rolling.js'),
  'particle-l': () => import('./particle-l.js'),
  spinner: () => import('./spinner.js'),
  gyro: () => import('./gyro.js'),
  'rover-wheel': () => import('./rover-wheel.js'),
  beam: () => import('./beam.js'),
  ladder: () => import('./ladder.js'),
  'stress-strain': () => import('./stress-strain.js'),
  'car-balance': () => import('./car-balance.js'),
};

const labs = createLabLoader(loaders);

export const hasLab = labs.hasLab;
export const loadLab = labs.loadLab;
export const loadExamLabs = labs.loadExamLabs;
export const registerLabLoader = labs.registerLabLoader;
