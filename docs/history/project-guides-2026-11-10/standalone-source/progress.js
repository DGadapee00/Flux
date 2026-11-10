import { browserStorage, createStore } from '@flux/core';
import { RECIPES, recipeById } from '@flux/map/applications/satellite.js';

export function applicationStore(storage = browserStorage()) {
  return createStore({ courseId: 'applications', storage, slots: [
    { name: 'satellite', version: 1, key: 'flux.applications.satellite.v1' },
  ] });
}

export function cleanProgress(raw) {
  return Object.fromEntries(RECIPES.map(({ id }) => {
    const r = raw?.[id];
    return [id, { studied: r?.studied === true, recorded: r?.recorded === true,
      evidence: typeof r?.evidence === 'string' ? r.evidence.slice(0, 2000) : '' }];
  }));
}

/** A recorded result is valid only while its foundations and every input remain valid. */
export function demonstrated(id, state) {
  const r = state[id];
  return Boolean(r?.recorded && r.evidence.trim() && (id === 'satellite' || r.studied)
    && recipeById[id].requires.every((dep) => demonstrated(dep, state)));
}

export function missingInputs(id, state) {
  return recipeById[id].requires.filter((dep) => !demonstrated(dep, state));
}

/** The recipe and every recipe that uses its numbers, directly or further along. */
export function dependents(id) {
  const affected = new Set([id]);
  for (let n = 0; n < RECIPES.length; n++) {
    for (const r of RECIPES) if (r.requires.some((dep) => affected.has(dep))) affected.add(r.id);
  }
  return affected;
}

/** The recorded demonstrations an edit to `id` would ask to be checked again, in recipe order. */
export function wouldClear(state, id) {
  const affected = dependents(id);
  return RECIPES.filter((r) => affected.has(r.id) && demonstrated(r.id, state)).map((r) => r.id);
}

/** Preserve the notes, but ask for a fresh check whenever an input changes. */
export function revise(state, id, change) {
  const next = cleanProgress(state);
  for (const key of dependents(id)) next[key].recorded = false;
  Object.assign(next[id], change);
  return next;
}

export function record(state, id) {
  if (missingInputs(id, state).length || !state[id].evidence.trim()
    || (id !== 'satellite' && !state[id].studied)) return state;
  return { ...state, [id]: { ...state[id], recorded: true } };
}
