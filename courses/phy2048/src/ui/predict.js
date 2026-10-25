import { createPredict as createPhysicsPredict } from '@flux/shells/physics/predict.js';
import { choices, cloneState, matchesExpect, outcomes, run } from '../labs/predict.js';
import { courseStore } from '../storage.js';

/** Predict first over the prompts the open lab carries, and this course's storage. */
export function createPredict(api) {
  return createPhysicsPredict(api, {
    // A lab holds its own prompts; the card asks only about the lab on screen.
    predictionsFor: (labId) => {
      const lab = api.lab();
      return lab && lab.id === labId ? lab.predictions || [] : [];
    },
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
