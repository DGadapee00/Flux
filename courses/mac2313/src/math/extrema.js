/**
 * Hessian test (Merino Theorem 14).
 * D = f_xx f_yy − f_xy f_yx. With continuous mixed partials, f_xy = f_yx, so
 * D = f_xx f_yy − (f_xy)².
 *
 * D>0 and f_xx>0 → local min; D>0 and f_xx<0 → local max; D<0 → saddle; D=0 → inconclusive.
 */

export function hessian(fxx, fyy, fxy) {
  const D = fxx * fyy - fxy * fxy;
  let kind = 'inconclusive';
  if (D > 1e-12) {
    if (fxx > 1e-12) kind = 'min';
    else if (fxx < -1e-12) kind = 'max';
  } else if (D < -1e-12) kind = 'saddle';
  return { D, kind };
}

export function classify(surf, x, y, params) {
  const fx = surf.fx(x, y, params);
  const fy = surf.fy(x, y, params);
  const fxx = surf.fxx(x, y, params);
  const fyy = surf.fyy(x, y, params);
  const fxy = surf.fxy(x, y, params);
  const H = hessian(fxx, fyy, fxy);
  const gmag = Math.hypot(fx, fy);
  return {
    fx,
    fy,
    fxx,
    fyy,
    fxy,
    gmag,
    critical: gmag < 1e-8,
    ...H,
  };
}

export function kindLabel(kind) {
  if (kind === 'min') return 'local min';
  if (kind === 'max') return 'local max';
  if (kind === 'saddle') return 'saddle';
  return 'inconclusive';
}
