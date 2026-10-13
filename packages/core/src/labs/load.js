/**
 * Load a lab module the first time it is opened, then keep it.
 * The course passes the map of id → `() => import('./lab.js')`.
 * @param {Record<string, () => Promise<{ default: unknown }>>} [initial]
 */
export function createLabLoader(initial = {}) {
  const loaders = { ...initial };
  const cache = new Map();

  function hasLab(id) {
    return !!loaders[id];
  }

  async function loadLab(id) {
    if (cache.has(id)) return cache.get(id);
    const loader = loaders[id];
    if (!loader) return null;
    const mod = await loader();
    const lab = mod.default;
    cache.set(id, lab);
    return lab;
  }

  function loadExamLabs(labIds) {
    return Promise.all(labIds.filter(hasLab).map(loadLab));
  }

  function registerLabLoader(id, loader) {
    loaders[id] = loader;
  }

  return { hasLab, loadLab, loadExamLabs, registerLabLoader };
}
