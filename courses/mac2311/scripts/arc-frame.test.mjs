import assert from 'node:assert/strict';
import test from 'node:test';
import { fitScale } from '@flux/subjects/math/scale.js';
import arc, { fitArcCamera, projectArc } from '../src/labs/arc.js';

function framed(kind, b) {
  const state = arc.defaultState();
  state.kind = kind;
  state.b = b;
  arc.recompute(state, {});
  state.view = { upm: fitScale(arc.extent(state)), plane: 'xy' };
  return state;
}

function assertInside(view, cam, x, y, u, label) {
  const p = projectArc(cam, x * u, y * u, view);
  assert.ok(p.px > view.left && p.px < view.width - view.right, `${label} x ${p.px.toFixed(1)}`);
  assert.ok(p.py > view.top && p.py < view.height - view.bottom, `${label} y ${p.py.toFixed(1)}`);
}

const phone = { width: 380, height: 780, top: 260, bottom: 310, left: 12, right: 12 };
const desk = { width: 1280, height: 800, top: 20, bottom: 120, left: 390, right: 330 };

function ends(kind, b) {
  const y = kind === 'line' ? b : b * b;
  return [
    [0, 0, 'start'],
    [b, y, 'end'],
  ];
}

for (const [kind, b] of [
  ['parabola', 1],
  ['parabola', 1.5],
  ['parabola', 2],
  ['line', 1.5],
  ['line', 2],
]) {
  test(`${kind} at b=${b} fits a 380px phone and a desktop window`, () => {
    const state = framed(kind, b);
    const u = state.view.upm;
    const mark = 0.04 * Math.max(1, b);
    for (const view of [phone, desk]) {
      const cam = fitArcCamera(state, view);
      assert.ok(cam.z >= 4.5 && cam.z <= 36, `camera distance ${cam.z}`);
      for (const [x, y, label] of ends(kind, b)) {
        assertInside(view, cam, x, y, u, label);
        assertInside(view, cam, x, y + mark, u, `${label} marker`);
      }
    }
  });
}
