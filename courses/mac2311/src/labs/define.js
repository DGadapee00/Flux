import { predictionsFor } from '../data/predictions.js';
import { LAB_META } from '../data/catalog.js';
import { defineLab as checkLab } from '@flux/core';
import { planeFit } from './camera.js';

/** A flat lab's camera: straight on, fitted to the content box. */
export function planeCamera(state) {
  return state?.view?.plane === 'xy' ? planeFit(state) : null;
}

export function defineLab(spec) {
  return checkLab({
    live: false,
    orbit: true,
    hint: '',
    keys: {},
    toggles: [],
    legend: null,
    defaultState: () => ({}),
    scenarios: [],
    controls: () => '',
    bind() {},
    syncControls() {},
    init: () => ({}),
    enter() {},
    exit() {},
    recompute() {},
    syncViews() {},
    tick: null,
    law: () => [],
    liveRows: () => '',
    readout: () => '',
    coach: () => ({ title: '', body: '' }),
    plot: () => null,
    pointer: null,
    ...spec,
    predictions: predictionsFor(spec.id),
    exam: LAB_META[spec.id]?.exam || spec.exam,
    kind: 'scene3d',
  });
}
