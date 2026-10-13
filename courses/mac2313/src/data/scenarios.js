import { SURFACES } from '../math/surfaces.js';
import { CURVES } from '../math/curves.js';

const DOMAIN = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
const PLANE = { xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 };

export const SCENARIOS = {
  limits: [
    { id: 'quad', name: 'x²', graphId: 'quad', x0: 0.6, h: 0.35, a: -2, b: 2, xMin: -2.5, xMax: 2.5, yMin: -0.4, yMax: 4.2 },
    { id: 'line', name: '2x + 1', graphId: 'line', x0: 0.5, h: 0.4, a: -1.5, b: 1.5, xMin: -2, xMax: 2, yMin: -2.2, yMax: 4.2 },
    { id: 'abs', name: '|x|  — not differentiable at 0', graphId: 'abs', x0: 0, h: 0.45, a: -2, b: 2, xMin: -2.5, xMax: 2.5, yMin: -0.3, yMax: 2.4 },
    { id: 'cube', name: 'x³  — f′=0 is not enough', graphId: 'cube', x0: 0, h: 0.4, a: -1.4, b: 1.4, xMin: -1.8, xMax: 1.8, yMin: -2.2, yMax: 2.2 },
    { id: 'hole', name: '(x²−1)/(x−1)  — hole at 1', graphId: 'hole', x0: 1, h: 0.35, a: -0.5, b: 2.5, xMin: -0.8, xMax: 2.8, yMin: -0.2, yMax: 3.6 },
    { id: 'squeeze', name: 'x² sin(1/x)', graphId: 'squeeze', x0: 0, h: 0.25, a: -1, b: 1, xMin: -1.3, xMax: 1.3, yMin: -1.2, yMax: 1.2 },
  ],
  riemann1: [
    { id: 'quad', name: 'x² on [0,1]', graphId: 'quad', a: 0, b: 1, n: 6, sample: 'mid', xMin: -0.2, xMax: 1.2, yMin: -0.2, yMax: 1.4 },
    { id: 'line', name: '2x+1 on [0,2]', graphId: 'line', a: 0, b: 2, n: 6, sample: 'mid', xMin: -0.2, xMax: 2.2, yMin: -0.2, yMax: 5.4 },
    { id: 'cube', name: 'x³ on [0,1]', graphId: 'cube', a: 0, b: 1, n: 6, sample: 'mid', xMin: -0.2, xMax: 1.2, yMin: -0.2, yMax: 1.4 },
    { id: 'abs', name: '|x| on [0,1]', graphId: 'abs', a: 0, b: 1, n: 6, sample: 'mid', xMin: -0.2, xMax: 1.2, yMin: -0.2, yMax: 1.4 },
    { id: 'semi', name: 'Semicircle  √(1−x²)', graphId: 'semi', a: -1, b: 1, n: 8, sample: 'mid', xMin: -1.3, xMax: 1.3, yMin: -0.2, yMax: 1.3 },
    { id: 'cube-neg', name: 'x³ on [−1,1]  — signed', graphId: 'cube', a: -1, b: 1, n: 8, sample: 'mid', xMin: -1.3, xMax: 1.3, yMin: -1.4, yMax: 1.4 },
  ],
  gradient: [
    { id: 'paraboloid', name: 'Paraboloid  x² + y²', surfaceId: 'paraboloid', params: { a: 1, b: 1, c: 0 }, probe: { x: 1, y: 0.6 }, theta: 0.4, ...DOMAIN },
    { id: 'saddle', name: 'Saddle  x² − y²', surfaceId: 'saddle', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.8, y: 0.5 }, theta: 0.7, ...DOMAIN },
    { id: 'plane', name: 'Plane  3x + 4y', surfaceId: 'plane', params: { a: 3, b: 4, c: 0 }, probe: { x: 0.4, y: -0.2 }, theta: 0, ...DOMAIN },
    { id: 'gaussian', name: 'Gaussian bump', surfaceId: 'gaussian', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.6, y: 0.3 }, theta: 1.1, ...DOMAIN },
    { id: 'xy', name: 'Product  xy', surfaceId: 'xy', params: { a: 1, b: 1, c: 0 }, probe: { x: 1, y: 1 }, theta: 0.5, ...DOMAIN },
    { id: 'bowl', name: 'Off-centre bowl', surfaceId: 'bowl', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.4, y: 0 }, theta: 0.2, ...DOMAIN },
  ],
  polar: [
    { id: 'q1', name: 'First quadrant', probe: { x: 1.2, y: 0.9 }, ...PLANE },
    { id: 'q2', name: 'Second quadrant', probe: { x: -1.1, y: 1.4 }, ...PLANE },
    { id: 'q3', name: 'Third quadrant', probe: { x: -1.3, y: -0.8 }, ...PLANE },
    { id: 'q4', name: 'Fourth quadrant', probe: { x: 1.5, y: -1.0 }, ...PLANE },
    { id: 'axis', name: 'On the x-axis', probe: { x: 1.6, y: 0 }, ...PLANE },
  ],
  parametric: [
    { id: 'circle', name: 'Unit circle', curveId: 'circle', ...{ xMin: -2, xMax: 2, yMin: -2, yMax: 2 } },
    { id: 'parabola', name: 'Parabola (t, t²)', curveId: 'parabola', ...{ xMin: -2, xMax: 2, yMin: -0.5, yMax: 2.5 } },
    { id: 'cubic', name: '(t², t³ − 3t)', curveId: 'cubic', ...{ xMin: -1, xMax: 5, yMin: -3, yMax: 3 } },
    { id: 'spiral', name: 'Spiral (t cos t, t sin t)', curveId: 'spiral', ...{ xMin: -7, xMax: 7, yMin: -7, yMax: 7 } },
  ],
  partials: [
    { id: 'paraboloid', name: 'Paraboloid  x² + y²', surfaceId: 'paraboloid', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.9, y: 0.6 }, ...DOMAIN },
    { id: 'saddle', name: 'Saddle  x² − y²', surfaceId: 'saddle', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.8, y: 0.5 }, ...DOMAIN },
    { id: 'xy', name: 'Product  xy', surfaceId: 'xy', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.9, y: 0.7 }, ...DOMAIN },
    { id: 'prod2', name: 'x² y  — mixed ≠ 0', surfaceId: 'prod2', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.8, y: 0.5 }, ...DOMAIN },
    { id: 'gaussian', name: 'Gaussian bump', surfaceId: 'gaussian', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.6, y: 0.4 }, ...DOMAIN },
    { id: 'cubic', name: 'Cubic  x³ + y³ − 3xy', surfaceId: 'cubic', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.7, y: 0.4 }, ...DOMAIN },
  ],
  chain: [
    { id: 'xy-circle', name: 'xy along the circle', mode: 'curve', surfaceId: 'xy', curveId: 'circle', params: { a: 1, b: 1, c: 0 }, ...DOMAIN },
    { id: 'para-parab', name: 'Paraboloid along (t, t²)', mode: 'curve', surfaceId: 'paraboloid', curveId: 'parabola', params: { a: 1, b: 1, c: 0 }, xMin: -2, xMax: 2, yMin: -0.5, yMax: 2.5 },
    { id: 'saddle-circle', name: 'Saddle along the circle', mode: 'curve', surfaceId: 'saddle', curveId: 'circle', params: { a: 1, b: 1, c: 0 }, ...DOMAIN },
    { id: 'gauss-circle', name: 'Gaussian along the circle', mode: 'curve', surfaceId: 'gaussian', curveId: 'circle', params: { a: 1, b: 1, c: 0 }, ...DOMAIN },
    { id: 'xy-polar', name: 'xy in polar (s, t)', mode: 'map', surfaceId: 'xy', innerId: 'polar', params: { a: 1, b: 1, c: 0 }, ...DOMAIN },
    { id: 'para-polar', name: 'Paraboloid in polar', mode: 'map', surfaceId: 'paraboloid', innerId: 'polar', params: { a: 1, b: 1, c: 0 }, ...DOMAIN },
    { id: 'xy-bilin', name: 'xy with (st², s²t)', mode: 'map', surfaceId: 'xy', innerId: 'bilinear', params: { a: 1, b: 1, c: 0 }, ...DOMAIN },
  ],
  riemann: [
    { id: 'para-sq', name: 'x² + y² on [0,1]²', surfaceId: 'paraboloid', params: { a: 1, b: 1, c: 0 }, n: 4, sample: 'mid', xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
    { id: 'one-sq', name: '1 on [0,1]²  — area', surfaceId: 'one', params: { a: 1, b: 1, c: 0 }, n: 4, sample: 'mid', xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
    { id: 'xy-rect', name: 'xy on [0,2]×[0,1]', surfaceId: 'xy', params: { a: 1, b: 1, c: 0 }, n: 4, sample: 'mid', xMin: 0, xMax: 2, yMin: 0, yMax: 1 },
    { id: 'plane', name: 'x + 2y on [0,1]²', surfaceId: 'plane', params: { a: 1, b: 2, c: 0 }, n: 4, sample: 'mid', xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
    { id: 'para-big', name: 'x² + y² on [0,2]²', surfaceId: 'paraboloid', params: { a: 1, b: 1, c: 0 }, n: 6, sample: 'mid', xMin: 0, xMax: 2, yMin: 0, yMax: 2 },
    { id: 'saddle', name: 'x² − y² on [−1,1]²  — signed', surfaceId: 'saddle', params: { a: 1, b: 1, c: 0 }, n: 6, sample: 'mid', xMin: -1, xMax: 1, yMin: -1, yMax: 1 },
  ],
  iterated: [
    { id: 'para-sq', name: 'x² + y² on [0,1]²', surfaceId: 'paraboloid', region: 'rect', params: { a: 1, b: 1, c: 0 }, order: 'xy', probe: { x: 0.4, y: 0.4 }, xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
    { id: 'xy-rect', name: 'xy on [0,2]×[0,1]', surfaceId: 'xy', region: 'rect', params: { a: 1, b: 1, c: 0 }, order: 'xy', probe: { x: 0.8, y: 0.4 }, xMin: 0, xMax: 2, yMin: 0, yMax: 1 },
    { id: 'disk-one', name: 'Area of the unit disk', surfaceId: 'one', region: 'disk', R: 1, params: { a: 1, b: 1, c: 0 }, order: 'xy', probe: { x: 0.3, y: 0 }, xMin: -1, xMax: 1, yMin: -1, yMax: 1 },
    { id: 'disk-para', name: 'x² + y² on the unit disk', surfaceId: 'paraboloid', region: 'disk', R: 1, params: { a: 1, b: 1, c: 0 }, order: 'xy', probe: { x: 0.3, y: 0 }, xMin: -1, xMax: 1, yMin: -1, yMax: 1 },
    { id: 'triangle', name: 'Triangle x+y≤1', surfaceId: 'one', region: 'triangle', params: { a: 1, b: 1, c: 0 }, order: 'xy', probe: { x: 0.3, y: 0.2 }, xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
    { id: 'triangle-xy', name: 'xy on the triangle', surfaceId: 'xy', region: 'triangle', params: { a: 1, b: 1, c: 0 }, order: 'xy', probe: { x: 0.3, y: 0.2 }, xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
  ],
  dpolar: [
    { id: 'area', name: 'Area of D_R  (f=1)', surfaceId: 'one', params: { a: 1, b: 1, c: 0 }, R: 1, n: 4 },
    { id: 'para', name: 'x² + y² on D_R', surfaceId: 'paraboloid', params: { a: 1, b: 1, c: 0 }, R: 1, n: 6 },
    { id: 'xy', name: 'xy on D_R  (odd → 0)', surfaceId: 'xy', params: { a: 1, b: 1, c: 0 }, R: 1.2, n: 6 },
    { id: 'gauss', name: 'Gaussian bump on D_R', surfaceId: 'gaussian', params: { a: 1, b: 1, c: 0 }, R: 1.4, n: 6 },
    { id: 'r2', name: 'Unit disk, R=1', surfaceId: 'one', params: { a: 1, b: 1, c: 0 }, R: 1, n: 8 },
  ],
  r3: [
    { id: 'ij', name: 'u along x, v along y', u: { x: 1.5, y: 0, z: 0 }, v: { x: 0, y: 1.5, z: 0 } },
    { id: 'ik', name: 'u along x, v along z', u: { x: 1.5, y: 0, z: 0 }, v: { x: 0, y: 0, z: 1.4 } },
    { id: 'generic', name: 'A generic pair', u: { x: 1.2, y: 0.7, z: 0.4 }, v: { x: 0.3, y: 1.1, z: 0.8 } },
    { id: 'obtuse', name: 'Obtuse angle', u: { x: 1.6, y: 0, z: 0 }, v: { x: -0.8, y: 1.2, z: 0.3 } },
    { id: 'parallel', name: 'Nearly parallel', u: { x: 1.4, y: 0.4, z: 0.2 }, v: { x: 1.1, y: 0.3, z: 0.15 } },
  ],
  space: [
    { id: 'helix', name: 'Helix (cos t, sin t, t/2)', curveId: 'helix' },
    { id: 'coil', name: '(t, 2 cos t, 2 sin t)', curveId: 'coil' },
    { id: 'cubic', name: '(t, t², t³)', curveId: 'cubic' },
    { id: 'line', name: 'Line (2t, t, 1−t)', curveId: 'line' },
  ],
  partials3: [
    { id: 'bowl', name: 'x² + y² + z²', fieldId: 'bowl', probe: { x: 0.8, y: 0.5, z: 0.6 }, xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
    { id: 'saddle3', name: 'x² + y² − z²  (saddle)', fieldId: 'saddle3', probe: { x: 0.6, y: 0.4, z: 0.5 }, xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
    { id: 'xyz', name: 'xyz', fieldId: 'xyz', probe: { x: 1, y: 0.8, z: 0.5 }, xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
    { id: 'prod', name: 'x² y z', fieldId: 'prod', probe: { x: 0.9, y: 0.6, z: 0.7 }, xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
    { id: 'linear', name: '2x − y + 3z', fieldId: 'linear', params: { a: 2, b: -1, c: 3 }, probe: { x: 0.4, y: -0.3, z: 0.5 }, xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
  ],
  triple: [
    { id: 'one', name: '1 on [0,1]³  — volume', fieldId: 'one', params: { a: 1, b: 1, c: 0 }, n: 4, xMin: 0, xMax: 1, yMin: 0, yMax: 1, zMin: 0, zMax: 1 },
    { id: 'xyz', name: 'xyz on [0,1]³', fieldId: 'xyz', params: { a: 1, b: 1, c: 0 }, n: 4, xMin: 0, xMax: 1, yMin: 0, yMax: 1, zMin: 0, zMax: 1 },
    { id: 'x', name: 'x on [0,2]×[0,1]×[0,1]', fieldId: 'xonly', params: { a: 1, b: 1, c: 0 }, n: 4, xMin: 0, xMax: 2, yMin: 0, yMax: 1, zMin: 0, zMax: 1 },
    { id: 'bowl', name: 'x²+y²+z² on [0,1]³', fieldId: 'bowl', params: { a: 1, b: 1, c: 0 }, n: 4, xMin: 0, xMax: 1, yMin: 0, yMax: 1, zMin: 0, zMax: 1 },
    { id: 'big', name: '1 on [0,2]³', fieldId: 'one', params: { a: 1, b: 1, c: 0 }, n: 4, xMin: 0, xMax: 2, yMin: 0, yMax: 2, zMin: 0, zMax: 2 },
  ],
  cyl: [
    { id: 'vol', name: 'Volume, R=1, z∈[0,1]', fieldId: 'one', params: { a: 1, b: 1, c: 0 }, R: 1, z0: 0, z1: 1 },
    { id: 'z', name: 'z on the cylinder', fieldId: 'zonly', params: { a: 1, b: 1, c: 0 }, R: 1, z0: 0, z1: 2 },
    { id: 'tall', name: 'Volume, R=1.2, H=1.5', fieldId: 'one', params: { a: 1, b: 1, c: 0 }, R: 1.2, z0: 0, z1: 1.5 },
    { id: 'r2', name: 'x²+y²+z² on the cylinder', fieldId: 'bowl', params: { a: 1, b: 1, c: 0 }, R: 1, z0: 0, z1: 1 },
  ],
  sph: [
    { id: 'vol', name: 'Unit ball  (volume)', fieldId: 'one', params: { a: 1, b: 1, c: 0 }, R: 1 },
    { id: 'r12', name: 'Ball of radius 1.2', fieldId: 'one', params: { a: 1, b: 1, c: 0 }, R: 1.2 },
    { id: 'bowl', name: 'x²+y²+z² on the unit ball', fieldId: 'bowl', params: { a: 1, b: 1, c: 0 }, R: 1 },
    { id: 'z', name: 'z on the ball  (odd → 0)', fieldId: 'zonly', params: { a: 1, b: 1, c: 0 }, R: 1 },
  ],
  extrema: [
    { id: 'paraboloid', name: 'Paraboloid — one min', surfaceId: 'paraboloid', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.8, y: 0.5 }, ...DOMAIN },
    { id: 'saddle', name: 'Saddle', surfaceId: 'saddle', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.7, y: 0.4 }, ...DOMAIN },
    { id: 'gaussian', name: 'Gaussian — one max', surfaceId: 'gaussian', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.5, y: 0.4 }, ...DOMAIN },
    { id: 'xy', name: 'Product xy — saddle', surfaceId: 'xy', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.6, y: 0.6 }, ...DOMAIN },
    { id: 'bowl', name: 'Off-centre bowl', surfaceId: 'bowl', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.2, y: 0.2 }, ...DOMAIN },
    { id: 'cubic', name: 'Cubic — min and saddle', surfaceId: 'cubic', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.4, y: 0.3 }, ...DOMAIN },
  ],
};

export function applyScenario(labId, id, state) {
  const list = SCENARIOS[labId] || [];
  const sc = list.find((s) => s.id === id) || list[0];
  if (!sc) return;
  state.scenarioId = sc.id;
  if (sc.surfaceId) state.surfaceId = sc.surfaceId;
  if (sc.curveId) state.curveId = sc.curveId;
  if (sc.params) state.params = { ...sc.params };
  if (sc.probe) state.probe = { x: sc.probe.x, y: sc.probe.y, z: sc.probe.z || 0 };
  if (sc.theta != null) state.theta = sc.theta;
  if (sc.mode != null) state.mode = sc.mode;
  if (sc.innerId) state.innerId = sc.innerId;
  if (sc.s != null) state.s = sc.s;
  if (sc.t != null) state.t = sc.t;
  if (sc.n != null) state.n = sc.n;
  if (sc.sample) state.sample = sc.sample;
  if (sc.order) state.order = sc.order;
  if (sc.R != null) state.R = sc.R;
  if (sc.region) state.region = sc.region;
  if (sc.u) state.u = { x: sc.u.x, y: sc.u.y, z: sc.u.z };
  if (sc.v) state.v = { x: sc.v.x, y: sc.v.y, z: sc.v.z };
  if (sc.fieldId) state.fieldId = sc.fieldId;
  if (sc.graphId) state.graphId = sc.graphId;
  if (sc.a != null) state.a = sc.a;
  if (sc.b != null) state.b = sc.b;
  if (sc.x0 != null) state.x0 = sc.x0;
  if (sc.h != null) state.h = sc.h;
  if (sc.z0 != null) state.z0 = sc.z0;
  if (sc.z1 != null) state.z1 = sc.z1;
  if (sc.zMin != null) state.zMin = sc.zMin;
  if (sc.zMax != null) state.zMax = sc.zMax;
  if (sc.xMin != null) state.xMin = sc.xMin;
  if (sc.xMax != null) state.xMax = sc.xMax;
  if (sc.yMin != null) state.yMin = sc.yMin;
  if (sc.yMax != null) state.yMax = sc.yMax;
}

export function surfaceName(id) {
  return SURFACES[id]?.name || id;
}

export function curveName(id) {
  return CURVES[id]?.name || id;
}
