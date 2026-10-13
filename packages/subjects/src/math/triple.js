/**
 * Closed forms for triple-integral labs.
 */

export function closedBox(id, xa, xb, ya, yb, za, zb) {
  const dx = xb - xa;
  const dy = yb - ya;
  const dz = zb - za;
  if (id === 'one') return dx * dy * dz;
  if (id === 'x' || id === 'xonly') return 0.5 * (xb * xb - xa * xa) * dy * dz;
  if (id === 'z' || id === 'zonly') return dx * dy * 0.5 * (zb * zb - za * za);
  if (id === 'xyz') {
    const x1 = 0.5 * (xb * xb - xa * xa);
    const y1 = 0.5 * (yb * yb - ya * ya);
    const z1 = 0.5 * (zb * zb - za * za);
    return x1 * y1 * z1;
  }
  if (id === 'bowl') {
    const Ix2 = ((xb * xb * xb - xa * xa * xa) / 3) * dy * dz;
    const Iy2 = ((yb * yb * yb - ya * ya * ya) / 3) * dx * dz;
    const Iz2 = ((zb * zb * zb - za * za * za) / 3) * dx * dy;
    return Ix2 + Iy2 + Iz2;
  }
  return NaN;
}

export function closedCyl(id, R, z0, z1) {
  const H = z1 - z0;
  const area = Math.PI * R * R;
  if (id === 'one') return area * H;
  if (id === 'z' || id === 'zonly') return area * 0.5 * (z1 * z1 - z0 * z0);
  if (id === 'r2') return 0.5 * Math.PI * H * R * R * R * R;
  if (id === 'bowl') {
    const r2 = 0.5 * Math.PI * H * R * R * R * R;
    const z2 = area * ((z1 * z1 * z1 - z0 * z0 * z0) / 3);
    return r2 + z2;
  }
  return NaN;
}

export function closedBall(id, R) {
  if (id === 'one') return (4 / 3) * Math.PI * R * R * R;
  if (id === 'z' || id === 'zonly') return 0;
  if (id === 'bowl') return (4 / 5) * Math.PI * R * R * R * R * R;
  return NaN;
}

export function cartCyl(x, y, z) {
  const r = Math.hypot(x, y);
  let th = Math.atan2(y, x);
  if (th < 0) th += 2 * Math.PI;
  return { r, theta: r < 1e-15 ? NaN : th, z };
}

export function sphFromCart(x, y, z) {
  const rho = Math.hypot(x, y, z);
  const theta = cartCyl(x, y, z).theta;
  const phi = rho < 1e-15 ? NaN : Math.acos(Math.max(-1, Math.min(1, z / rho)));
  return { rho, phi, theta };
}

export function cartFromSph(rho, phi, theta) {
  const s = Math.sin(phi);
  return {
    x: rho * s * Math.cos(theta),
    y: rho * s * Math.sin(theta),
    z: rho * Math.cos(phi),
  };
}
