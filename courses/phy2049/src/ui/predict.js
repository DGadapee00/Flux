import { createPredict as createPhysicsPredict } from '@flux/shells/physics/predict.js';
import { predictionsFor } from '../data/predictions.js';
import { choices, cloneState, matchesExpect, outcomes, run } from '../engine/predict.js';
import { courseStore } from '../storage.js';

/** Predict first over this course's prompts and its storage. */
export function createPredict(api) {
  return createPhysicsPredict(api, {
    predictionsFor,
    // Resolved on each read and write, as the card did before it moved.
    store: {
      getItem: (key) => courseStore().getItem(key),
      setItem: (key, value) => courseStore().setItem(key, value),
    },
    run,
    outcomes,
    choices,
    matchesExpect,
    cloneState,
  });
}
