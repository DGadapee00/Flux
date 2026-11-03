import { PREDICTIONS } from './predictions.js';
import * as THREE from 'three';
import { defineLab as checkLab } from '@flux/core';

export { THREE };

export function defineLab(spec) {
  return checkLab({
    live: false,
    orbit: true,
    hint: '',
    keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
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
    predictions: PREDICTIONS[spec.id] || [],
    kind: 'scene3d',
  });
}
