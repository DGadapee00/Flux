import { createLabLoader } from '@flux/core';

const loaders = {
  pappus: () => import('./pappus.js'),
  reactions: () => import('./reactions.js'),
  bridle: () => import('./bridle.js'),
  shelf: () => import('./shelf.js'),
  gantry: () => import('./gantry.js'),
  jack: () => import('./jack.js'),
  bookcase: () => import('./bookcase.js'),

  vectors: () => import('./vectors.js'),
  particle: () => import('./particle.js'),
  moments: () => import('./moments.js'),
  truss: () => import('./truss.js'),
  frame: () => import('./frame.js'),
  beam: () => import('./beam.js'),
  friction: () => import('./friction.js'),
  sections: () => import('./sections.js'),
};

const labs = createLabLoader(loaders);

export const hasLab = labs.hasLab;
export const loadLab = labs.loadLab;
export const loadExamLabs = labs.loadExamLabs;
export const registerLabLoader = labs.registerLabLoader;
