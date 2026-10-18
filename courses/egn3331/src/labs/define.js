import { defineLab as checkLab } from '@flux/core';

/**
 * A lab here is a plot2d lab: `compute(state)` is pure and returns every number the panels show,
 * and `draw(canvas, state, result)` paints the diagram on the shell's plot stage. `recompute` is the
 * same computation, written into `computed` for the HUD, the problems and labs-check.
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
    ...spec,
    kind: 'plot2d',
  });
}
