const loaders = {
  limits: () => import('./limits.js'),
  riemann1: () => import('./riemann1.js'),
  polar: () => import('./polar.js'),
  parametric: () => import('./parametric.js'),
  partials: () => import('./partials.js'),
  extrema: () => import('./extrema.js'),
  chain: () => import('./chain.js'),
  gradient: () => import('./gradient.js'),
  riemann: () => import('./riemann.js'),
  iterated: () => import('./iterated.js'),
  dpolar: () => import('./dpolar.js'),
  r3: () => import('./r3.js'),
  space: () => import('./space.js'),
  partials3: () => import('./partials3.js'),
  triple: () => import('./triple.js'),
  cyl: () => import('./cyl.js'),
  sph: () => import('./sph.js'),
};

const cache = new Map();

export function hasLab(id) {
  return !!loaders[id];
}

export async function loadLab(id) {
  if (cache.has(id)) return cache.get(id);
  const loader = loaders[id];
  if (!loader) return null;
  const mod = await loader();
  const lab = mod.default;
  cache.set(id, lab);
  return lab;
}

export function loadExamLabs(labIds) {
  return Promise.all(labIds.filter(hasLab).map(loadLab));
}

export function registerLabLoader(id, loader) {
  loaders[id] = loader;
}
