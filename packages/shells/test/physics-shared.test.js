import assert from 'node:assert/strict';
import test from 'node:test';
import * as common from '../shared.js';
import * as engineering from '../engineering/shared.js';
import * as math from '../math/shared.js';
import * as physics from '../physics/shared.js';
import { sciHTML, sciText, sciTex, signedSci } from '../physics/format.js';
import { PLOT_COLORS, drawAxes, drawDot, setupCanvas } from '../physics/plot.js';

test('every shell exposes the one shared module', () => {
  const names = Object.keys(common);
  assert.ok(names.length >= 8, `only ${names.length} shared names`);
  for (const [label, shell] of Object.entries({ engineering, math, physics })) {
    for (const name of names) assert.equal(shell[name], common[name], `${label}.${name}`);
  }
});

test('sci formatters keep their output', () => {
  assert.equal(sciHTML(1234.5), '1.23×10<sup>3</sup>');
  assert.equal(sciTex(2.3e-4), String.raw`2.3\times 10^{-4}`);
  assert.equal(sciText(3.14e-7), '3.14 × 10⁻⁷');
  assert.equal(signedSci(-2.5e-5), '−2.5×10<sup>-5</sup>');
  assert.equal(sciHTML(1e-20), '0');
  assert.equal(sciHTML(Number.NaN), '—');
});

test('plot helpers are exported', () => {
  for (const fn of [setupCanvas, drawAxes, drawDot]) assert.equal(typeof fn, 'function');
  assert.equal(PLOT_COLORS.RED, '#FC6255');
  assert.equal(PLOT_COLORS.BLUE, '#58C4DD');
});
