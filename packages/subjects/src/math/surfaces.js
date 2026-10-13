import { sumTex } from './sumtex.js';

/**
 * Named f(x,y) used by the Chapter 2 labs. Each surface carries analytic partials — route A —
 * so a lab never differentiates by hand inside a render function.
 *
 * Params default to a = b = 1, c = 0. Problems may overwrite them.
 */

const P = (p) => ({ a: p?.a ?? 1, b: p?.b ?? 1, c: p?.c ?? 0 });

export const SURFACES = {
  paraboloid: {
    id: 'paraboloid',
    name: 'Paraboloid',
    tex: (p) => sumTex([[P(p).a, 'x^2'], [P(p).b, 'y^2']]),
    f: (x, y, p) => {
      const { a, b } = P(p);
      return a * x * x + b * y * y;
    },
    fx: (x, y, p) => 2 * P(p).a * x,
    fy: (x, y, p) => 2 * P(p).b * y,
    fxx: (x, y, p) => 2 * P(p).a,
    fyy: (x, y, p) => 2 * P(p).b,
    fxy: () => 0,
    critical: () => [{ x: 0, y: 0 }],
  },
  saddle: {
    id: 'saddle',
    name: 'Saddle',
    tex: (p) => sumTex([[P(p).a, 'x^2'], [-P(p).b, 'y^2']]),
    f: (x, y, p) => {
      const { a, b } = P(p);
      return a * x * x - b * y * y;
    },
    fx: (x, y, p) => 2 * P(p).a * x,
    fy: (x, y, p) => -2 * P(p).b * y,
    fxx: (x, y, p) => 2 * P(p).a,
    fyy: (x, y, p) => -2 * P(p).b,
    fxy: () => 0,
    critical: () => [{ x: 0, y: 0 }],
  },
  plane: {
    id: 'plane',
    name: 'Plane',
    tex: (p) => sumTex([[P(p).a, 'x'], [P(p).b, 'y'], [P(p).c, '']]),
    f: (x, y, p) => {
      const { a, b, c } = P(p);
      return a * x + b * y + c;
    },
    fx: (x, y, p) => P(p).a,
    fy: (x, y, p) => P(p).b,
    fxx: () => 0,
    fyy: () => 0,
    fxy: () => 0,
    critical: () => [],
  },
  gaussian: {
    id: 'gaussian',
    name: 'Gaussian bump',
    tex: () => 'e^{-(x^2+y^2)}',
    f: (x, y) => Math.exp(-(x * x + y * y)),
    fx: (x, y) => -2 * x * Math.exp(-(x * x + y * y)),
    fy: (x, y) => -2 * y * Math.exp(-(x * x + y * y)),
    fxx: (x, y) => {
      const e = Math.exp(-(x * x + y * y));
      return e * (-2 + 4 * x * x);
    },
    fyy: (x, y) => {
      const e = Math.exp(-(x * x + y * y));
      return e * (-2 + 4 * y * y);
    },
    fxy: (x, y) => 4 * x * y * Math.exp(-(x * x + y * y)),
    critical: () => [{ x: 0, y: 0 }],
  },
  xy: {
    id: 'xy',
    name: 'Product $xy$',
    tex: (p) => sumTex([[P(p).a, 'xy']]),
    f: (x, y, p) => P(p).a * x * y,
    fx: (x, y, p) => P(p).a * y,
    fy: (x, y, p) => P(p).a * x,
    fxx: () => 0,
    fyy: () => 0,
    fxy: (x, y, p) => P(p).a,
    critical: () => [{ x: 0, y: 0 }],
  },
  bowl: {
    id: 'bowl',
    name: 'Off-centre bowl',
    tex: () => '(x-1)^2 + (y+\\tfrac12)^2',
    f: (x, y) => (x - 1) * (x - 1) + (y + 0.5) * (y + 0.5),
    fx: (x) => 2 * (x - 1),
    fy: (x, y) => 2 * (y + 0.5),
    fxx: () => 2,
    fyy: () => 2,
    fxy: () => 0,
    critical: () => [{ x: 1, y: -0.5 }],
  },
  cubic: {
    id: 'cubic',
    name: 'Cubic  x³ + y³ − 3xy',
    tex: () => 'x^3 + y^3 - 3xy',
    f: (x, y) => x * x * x + y * y * y - 3 * x * y,
    fx: (x, y) => 3 * x * x - 3 * y,
    fy: (x, y) => 3 * y * y - 3 * x,
    fxx: (x) => 6 * x,
    fyy: (x, y) => 6 * y,
    fxy: () => -3,
    critical: () => [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
  },
  one: {
    id: 'one',
    name: 'Constant 1',
    tex: () => '1',
    f: () => 1,
    fx: () => 0,
    fy: () => 0,
    fxx: () => 0,
    fyy: () => 0,
    fxy: () => 0,
    critical: () => [],
  },
  prod2: {
    id: 'prod2',
    name: 'x² y',
    tex: (p) => sumTex([[P(p).a, 'x^2 y']]),
    f: (x, y, p) => P(p).a * x * x * y,
    fx: (x, y, p) => 2 * P(p).a * x * y,
    fy: (x, y, p) => P(p).a * x * x,
    fxx: (x, y, p) => 2 * P(p).a * y,
    fyy: () => 0,
    fxy: (x, y, p) => 2 * P(p).a * x,
    critical: () => [],
  },
};


export function surfaceById(id) {
  return SURFACES[id] || SURFACES.paraboloid;
}

export function evalSurface(surf, x, y, params) {
  return {
    f: surf.f(x, y, params),
    fx: surf.fx(x, y, params),
    fy: surf.fy(x, y, params),
    fxx: surf.fxx(x, y, params),
    fyy: surf.fyy(x, y, params),
    fxy: surf.fxy(x, y, params),
  };
}
