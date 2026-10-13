import { configureFrame } from '@flux/core/scene3d/frame.js';
import { fitScale, metersPerUnit } from '@flux/subjects/math/scale.js';
import { UNITS_PER_METER } from '../physics/constants.js';

const FIN = (v) => (Number.isFinite(v) ? Math.abs(v) : 0);
const COORD = (p) => Math.max(FIN(p.x), FIN(p.y), FIN(p.z));

function lenLabel(m) {
  const a = Math.abs(m);
  if (a < 1e-12) return '0';
  const [unit, mul] = a >= 1 ? ['m', 1] : a >= 1e-2 ? ['cm', 100] : a >= 1e-5 ? ['mm', 1e3] : ['µm', 1e6];
  const v = m * mul;
  const digits = Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2;
  return `${Number(v.toFixed(digits))} ${unit}`;
}

function coordUnit(scale) {
  const square = 1 / scale;
  const [unit, per] = square >= 0.25 ? ['m', 1] : square >= 2.5e-3 ? ['cm', 100] : square >= 2.5e-5 ? ['mm', 1e3] : ['µm', 1e6];
  return { unit, per, step: Number(((square / 2) * per).toPrecision(3)) };
}

/** Largest coordinate, in meters, of everything the student can see and move, and of the marked points. */
function contentExtent(state) {
  let m = 0;
  for (const c of state?.charges || []) m = Math.max(m, COORD(c));
  if (state?.probe) m = Math.max(m, COORD(state.probe));
  if (state?.pathA && !state.hideA) m = Math.max(m, COORD(state.pathA));
  for (const p of state?.marks || []) m = Math.max(m, COORD(p));
  const surf = state?.surface;
  if (surf) m = Math.max(m, COORD(surf.origin || {}) + Math.max(surf.R || 0, (surf.L || 0) / 2));
  return m;
}

configureFrame({
  upm: UNITS_PER_METER,
  plane: 'xz',
  planes: ['xy', 'xz'],
  lenLabel,
  coordUnit,
  contentExtent,
  fitScale,
  gridScale: 8,
  nearLabels: true,
  hideOffPlane: false,
  labelStyle: 'physics',
});

export { metersPerUnit };

/** Softening radius, in meters: inside it the 1/r² singularity at a point charge is cut off. */
export function softenFor(view) {
  return 0.02 / (view && view.upm > 0 ? view.upm : UNITS_PER_METER);
}

/** Softening for the equipotential grid, which samples points right on top of a charge. */
export function contourSoftenFor(view) {
  return 0.35 / (view && view.upm > 0 ? view.upm : UNITS_PER_METER);
}

export * from '@flux/core/scene3d/frame.js';
