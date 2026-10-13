/**
 * Scene frame shared by the 3D courses. A course calls `configureFrame` with its
 * default scale, the planes it uses, and the functions that label a tick and measure
 * how far the content reaches. Core does not name a unit.
 */
import { fitScale as defaultFit } from './fit.js';

export const GRID_HALF = 7;
export const FIT_UNITS = 3.4;
export const FIT_MIN = 1.2;
export const FIT_MAX = 4.4;

const FIN = (v) => (Number.isFinite(v) ? Math.abs(v) : 0);

let fallbackUpm = 1;
let fallbackPlane = 'xz';
let allowed = new Set(['xy', 'xz', 'xyfloor']);
let upm = fallbackUpm;
let plane = fallbackPlane;
let lenLabelFn = (u) => String(u);
let coordUnitFn = (scale) => ({ unit: '', per: 1, step: Number((1 / scale / 2).toPrecision(3)) });
let extentFn = (state) => {
  let m = 0;
  if (state?.probe) m = Math.max(m, FIN(state.probe.x), FIN(state.probe.y), FIN(state.probe.z));
  return m;
};
let fitScaleFn = defaultFit;
const grid = { scale: 1, nearLabels: false, hideOffPlane: false, labelStyle: 'physics', plane: 'xz' };

/**
 * @param {object} spec
 * @param {number} [spec.upm]
 * @param {string} [spec.plane]
 * @param {string[]} [spec.planes]
 * @param {(u: number) => string} [spec.lenLabel]
 * @param {(scale: number) => { unit: string, per: number, step: number }} [spec.coordUnit]
 * @param {(state: object) => number} [spec.contentExtent]
 * @param {(extent: number, fit?: number) => number} [spec.fitScale]
 * @param {number} [spec.gridScale]
 * @param {boolean} [spec.nearLabels]
 * @param {boolean} [spec.hideOffPlane]
 * @param {'physics'|'math'} [spec.labelStyle]
 */
export function configureFrame(spec = {}) {
  if (spec.upm > 0) fallbackUpm = spec.upm;
  if (spec.plane) fallbackPlane = spec.plane;
  if (spec.planes) allowed = new Set(spec.planes);
  if (spec.lenLabel) lenLabelFn = spec.lenLabel;
  if (spec.coordUnit) coordUnitFn = spec.coordUnit;
  if (spec.contentExtent) extentFn = spec.contentExtent;
  if (spec.fitScale) fitScaleFn = spec.fitScale;
  if (spec.gridScale > 0) grid.scale = spec.gridScale;
  if (spec.nearLabels != null) grid.nearLabels = spec.nearLabels;
  if (spec.hideOffPlane != null) grid.hideOffPlane = spec.hideOffPlane;
  if (spec.labelStyle) grid.labelStyle = spec.labelStyle;
  grid.plane = fallbackPlane;
  upm = fallbackUpm;
  plane = fallbackPlane;
}

export function gridSpec() {
  return { ...grid };
}

export const sceneScale = () => upm;
export const workPlane = () => plane;

export function setFrame(view) {
  upm = view && view.upm > 0 ? view.upm : fallbackUpm;
  plane = allowed.has(view?.plane) ? view.plane : fallbackPlane;
}

export function defaultView(planeId = fallbackPlane) {
  return { upm: fallbackUpm, plane: planeId };
}

export function stepFor(view) {
  return 0.1 / (view && view.upm > 0 ? view.upm : fallbackUpm);
}

export const PLANE_AXES = {
  xz: { axes: ['x', 'z'], off: 'y' },
  xy: { axes: ['x', 'y'], off: 'z' },
  xyfloor: { axes: ['x', 'y'], off: 'z' },
};

export function snapStep(scale = upm) {
  return 1 / (2 * scale);
}

export function snapTo(v, step) {
  return step > 0 ? Math.round(v / step) * step : v;
}

export function contentExtent(state) {
  return extentFn(state);
}

export function refit(state, { force = false, extent: given = 0 } = {}) {
  const view = state.view || defaultView();
  const extent = Math.max(given || 0, contentExtent(state));
  if (extent <= 0) return view;
  const drawn = extent * view.upm;
  if (!force && drawn >= FIT_MIN && drawn <= FIT_MAX) return view;
  return { ...view, upm: fitScaleFn(extent) };
}

export function lenLabel(u) {
  return lenLabelFn(u);
}

export function coordUnit(scale = upm) {
  return coordUnitFn(scale);
}

export function fitScale(extent, fit) {
  return fitScaleFn(extent, fit);
}

/** Math (x, y, z) → world. xyfloor and xz put y up; xy stands the plane up. */
export function mathToWorld(x, y, z, u = upm) {
  if (plane === 'xy') return { x: x * u, y: y * u, z: z * u };
  return { x: x * u, y: z * u, z: y * u };
}

export function worldToMath(wx, wy, wz, u = upm) {
  if (plane === 'xy') return { x: wx / u, y: wy / u, z: wz / u };
  return { x: wx / u, y: wz / u, z: wy / u };
}
