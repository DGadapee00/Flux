import { LAB_META } from '../data/catalog.js';
import * as THREE from 'three';
import { defineLab as checkLab } from '@flux/core';

const XY_CAMERA = { pos: new THREE.Vector3(0, 0, 14), target: new THREE.Vector3(0, 0, 0) };

export function planeCamera(state) {
  return state?.view?.plane === 'xy' ? XY_CAMERA : null;
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
    exam: LAB_META[spec.id]?.exam || spec.exam,
    kind: 'scene3d',
  });
}
