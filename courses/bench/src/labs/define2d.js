import { defineLab as checkLab } from '@flux/core';

/**
 * A 2D lab: the application labs are drawings and charts on the shell's plot stage, not three.js
 * scenes. `compute(state)` is pure and returns every number the panels show; `draw(canvas, state,
 * result)` paints. The scene hooks main.js calls on every lab are no-ops here.
 */
export function defineLab(spec) {
  return checkLab({
    live: false,
    orbit: false,
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
    syncViews() {},
    compute: () => ({}),
    draw() {},
    recompute(state, computed) {
      Object.assign(computed, this.compute(state));
    },
    tick: null,
    law: () => [],
    liveRows: () => '',
    readout: () => '',
    coach: () => ({ title: '', body: '' }),
    plot: () => null,
    pointer: null,
    app: true,
    ...spec,
    kind: 'plot2d',
  });
}
