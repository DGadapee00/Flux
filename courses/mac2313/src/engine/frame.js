/**
 * How the Cartesian scene is framed: how many Three.js units a problem unit is worth, and which
 * plane the 2D work happens in.
 *
 * Calc 3 has no metres. `upm` is scene units per problem unit. A problem's own numbers go into the
 * lab unchanged and the *view* adapts.
 *
 * Plane `'xyfloor'`: domain on the floor, labeled x (right) and y (depth), height z up.
 * That is the graph of z = f(x,y). `'xy'` stands the plane up; `'xz'` is the physics floor.
 */
export const DEFAULT_UPM = 1;

/** The number plane runs to ±GRID_HALF units; a fit puts the content inside ±FIT_UNITS of them. */
export const GRID_HALF = 7;
export const FIT_UNITS = 3.4;
export const FIT_MIN = 1.2;
export const FIT_MAX = 4.4;

let upm = DEFAULT_UPM;
let plane = 'xyfloor';

export const sceneScale = () => upm;
export const workPlane = () => plane;

export function setFrame(view) {
  upm = view && view.upm > 0 ? view.upm : DEFAULT_UPM;
  plane = view?.plane === 'xy' ? 'xy' : view?.plane === 'xz' ? 'xz' : 'xyfloor';
}

export function defaultView(planeId = 'xyfloor') {
  return { upm: DEFAULT_UPM, plane: planeId };
}

export function stepFor(view) {
  return 0.1 / (view && view.upm > 0 ? view.upm : DEFAULT_UPM);
}

/**
 * In-plane axes (state coordinates written on a drag) and the out-of-plane one.
 *
 * xyfloor is geometrically the xz floor (world y is up) but the state stores math y in `y`,
 * mapped to world z. The pointer has a special case for that mapping.
 */
export const PLANE_AXES = {
  xz: { axes: ['x', 'z'], off: 'y' },
  xy: { axes: ['x', 'y'], off: 'z' },
  xyfloor: { axes: ['x', 'y'], off: 'z' },
};

const NICE = [1, 2, 2.5, 5];

export function unitsPerTick(extent, fit = FIT_UNITS) {
  const want = Math.max(1e-12, extent) / fit;
  const dec = 10 ** Math.floor(Math.log10(want));
  for (const n of NICE) if (n * dec >= want * (1 - 1e-9)) return n * dec;
  return 10 * dec;
}

export function fitScale(extent, fit = FIT_UNITS) {
  return 1 / unitsPerTick(extent, fit);
}

export function snapStep(scale = upm) {
  return 1 / (2 * scale);
}

export function snapTo(v, step) {
  return step > 0 ? Math.round(v / step) * step : v;
}

const FIN = (v) => (Number.isFinite(v) ? Math.abs(v) : 0);

export function contentExtent(state) {
  let m = 0;
  if (state?.probe) m = Math.max(m, FIN(state.probe.x), FIN(state.probe.y), FIN(state.probe.z));
  m = Math.max(m, FIN(state?.xMin), FIN(state?.xMax), FIN(state?.yMin), FIN(state?.yMax));
  return m;
}

export function refit(state, { force = false, extent: given = 0 } = {}) {
  const view = state.view || defaultView();
  const extent = Math.max(given || 0, contentExtent(state));
  if (extent <= 0) return view;
  const drawn = extent * view.upm;
  if (!force && drawn >= FIT_MIN && drawn <= FIT_MAX) return view;
  return { ...view, upm: fitScale(extent) };
}

/** Tick labels: dimensionless problem units. */
export function lenLabel(u) {
  const a = Math.abs(u);
  if (a < 1e-12) return '0';
  if (a >= 100) return String(Number(u.toFixed(0)));
  if (a >= 10) return String(Number(u.toFixed(1)));
  if (a >= 0.01) return String(Number(u.toFixed(2)));
  return Number(u).toExponential(2);
}

export function coordUnit(scale = upm) {
  const square = 1 / scale;
  return { unit: '', per: 1, step: Number(((square / 2)).toPrecision(3)) };
}

/** Math (x, y, z=f) → world (x, z_up=f, y_depth=y) when the domain is on the floor. */
export function mathToWorld(x, y, z, u = upm) {
  if (plane === 'xy') return { x: x * u, y: y * u, z: z * u };
  // xz and xyfloor: y is up in the scene
  if (plane === 'xz') return { x: x * u, y: z * u, z: y * u };
  return { x: x * u, y: z * u, z: y * u };
}

export function worldToMath(wx, wy, wz, u = upm) {
  if (plane === 'xy') return { x: wx / u, y: wy / u, z: wz / u };
  return { x: wx / u, y: wz / u, z: wy / u };
}
