import { sumTex } from './sumtex.js';

/**
 * Named f(x,y,z) for the R³ partials lab. Analytic first and mixed partials are route A.
 */

const P = (p) => ({ a: p?.a ?? 1, b: p?.b ?? 1, c: p?.c ?? 0 });


export const FIELDS3 = {
  one: {
    id: 'one',
    name: '1',
    tex: () => '1',
    f: () => 1,
    fx: () => 0,
    fy: () => 0,
    fz: () => 0,
    fxx: () => 0,
    fyy: () => 0,
    fzz: () => 0,
    fxy: () => 0,
    fxz: () => 0,
    fyz: () => 0,
  },
  xonly: {
    id: 'xonly',
    name: 'x',
    tex: () => 'x',
    f: (x) => x,
    fx: () => 1,
    fy: () => 0,
    fz: () => 0,
    fxx: () => 0,
    fyy: () => 0,
    fzz: () => 0,
    fxy: () => 0,
    fxz: () => 0,
    fyz: () => 0,
  },
  zonly: {
    id: 'zonly',
    name: 'z',
    tex: () => 'z',
    f: (x, y, z) => z,
    fx: () => 0,
    fy: () => 0,
    fz: () => 1,
    fxx: () => 0,
    fyy: () => 0,
    fzz: () => 0,
    fxy: () => 0,
    fxz: () => 0,
    fyz: () => 0,
  },
  linear: {
    id: 'linear',
    name: 'Linear  ax+by+cz',
    tex: (p) => sumTex([[P(p).a, 'x'], [P(p).b, 'y'], [P(p).c, 'z']]),
    f: (x, y, z, p) => {
      const { a, b, c } = P(p);
      return a * x + b * y + c * z;
    },
    fx: (x, y, z, p) => P(p).a,
    fy: (x, y, z, p) => P(p).b,
    fz: (x, y, z, p) => P(p).c,
    fxx: () => 0,
    fyy: () => 0,
    fzz: () => 0,
    fxy: () => 0,
    fxz: () => 0,
    fyz: () => 0,
  },
  bowl: {
    id: 'bowl',
    name: 'x² + y² + z²',
    tex: () => 'x^2 + y^2 + z^2',
    f: (x, y, z) => x * x + y * y + z * z,
    fx: (x) => 2 * x,
    fy: (x, y) => 2 * y,
    fz: (x, y, z) => 2 * z,
    fxx: () => 2,
    fyy: () => 2,
    fzz: () => 2,
    fxy: () => 0,
    fxz: () => 0,
    fyz: () => 0,
  },
  saddle3: {
    id: 'saddle3',
    name: 'x² + y² − z²',
    tex: () => 'x^2 + y^2 - z^2',
    f: (x, y, z) => x * x + y * y - z * z,
    fx: (x) => 2 * x,
    fy: (x, y) => 2 * y,
    fz: (x, y, z) => -2 * z,
    fxx: () => 2,
    fyy: () => 2,
    fzz: () => -2,
    fxy: () => 0,
    fxz: () => 0,
    fyz: () => 0,
  },
  xyz: {
    id: 'xyz',
    name: 'xyz',
    tex: () => 'xyz',
    f: (x, y, z) => x * y * z,
    fx: (x, y, z) => y * z,
    fy: (x, y, z) => x * z,
    fz: (x, y, z) => x * y,
    fxx: () => 0,
    fyy: () => 0,
    fzz: () => 0,
    fxy: (x, y, z) => z,
    fxz: (x, y, z) => y,
    fyz: (x) => x,
  },
  prod: {
    id: 'prod',
    name: 'x² y z',
    tex: () => 'x^2 y z',
    f: (x, y, z) => x * x * y * z,
    fx: (x, y, z) => 2 * x * y * z,
    fy: (x, y, z) => x * x * z,
    fz: (x, y, z) => x * x * y,
    fxx: (x, y, z) => 2 * y * z,
    fyy: () => 0,
    fzz: () => 0,
    fxy: (x, y, z) => 2 * x * z,
    fxz: (x, y, z) => 2 * x * y,
    fyz: (x) => x * x,
  },
};

export function fieldById(id) {
  return FIELDS3[id] || FIELDS3.bowl;
}

export function evalField(fld, x, y, z, params) {
  return {
    f: fld.f(x, y, z, params),
    fx: fld.fx(x, y, z, params),
    fy: fld.fy(x, y, z, params),
    fz: fld.fz(x, y, z, params),
    fxx: fld.fxx(x, y, z, params),
    fyy: fld.fyy(x, y, z, params),
    fzz: fld.fzz(x, y, z, params),
    fxy: fld.fxy(x, y, z, params),
    fxz: fld.fxz(x, y, z, params),
    fyz: fld.fyz(x, y, z, params),
  };
}
