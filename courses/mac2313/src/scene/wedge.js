import { mathToWorld } from '../engine/frame.js';
import { polMath, sphMath, polarRectCorners } from '../math/terms.js';

function pushTri(dst, a, b, c) {
  dst.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
}

function worldOf(p, u) {
  return mathToWorld(p.x, p.y, p.z, u);
}

/** Annular sector extruded from z0 to z1. Vertices are already in world space. */
export function annularPositions({ r0, r1, th0, th1, z0, z1, u, steps = 7 }) {
  const pos = [];
  const ring = (r, th, z) => worldOf(polMath(r, th, z), u);
  const N = Math.max(1, steps | 0);
  for (let i = 0; i < N; i++) {
    const tA = th0 + ((th1 - th0) * i) / N;
    const tB = th0 + ((th1 - th0) * (i + 1)) / N;
    const a0 = ring(r0, tA, z0);
    const b0 = ring(r1, tA, z0);
    const a1 = ring(r0, tB, z0);
    const b1 = ring(r1, tB, z0);
    const A0 = ring(r0, tA, z1);
    const B0 = ring(r1, tA, z1);
    const A1 = ring(r0, tB, z1);
    const B1 = ring(r1, tB, z1);
    pushTri(pos, a0, b0, b1);
    pushTri(pos, a0, b1, a1);
    pushTri(pos, A0, B1, B0);
    pushTri(pos, A0, A1, B1);
    pushTri(pos, b0, B0, B1);
    pushTri(pos, b0, B1, b1);
    pushTri(pos, a0, a1, A1);
    pushTri(pos, a0, A1, A0);
  }
  const cap = (th, outward) => {
    const c0 = ring(r0, th, z0);
    const c1 = ring(r1, th, z0);
    const C0 = ring(r0, th, z1);
    const C1 = ring(r1, th, z1);
    if (outward) {
      pushTri(pos, c0, C0, C1);
      pushTri(pos, c0, C1, c1);
    } else {
      pushTri(pos, c0, c1, C1);
      pushTri(pos, c0, C1, C0);
    }
  };
  cap(th0, false);
  cap(th1, true);
  return pos;
}

/** Rectangle of radial width dr and tangential width `tang`, extruded in z. */
export function polarRectPositions({ r, th, dr, tang, z0, z1, u }) {
  const corners = polarRectCorners({ r, th, dr, tang });
  const bot = corners.map((c) => mathToWorld(c.x, c.y, z0, u));
  const top = corners.map((c) => mathToWorld(c.x, c.y, z1, u));
  const pos = [];
  pushTri(pos, bot[0], bot[2], bot[1]);
  pushTri(pos, bot[0], bot[3], bot[2]);
  pushTri(pos, top[0], top[1], top[2]);
  pushTri(pos, top[0], top[2], top[3]);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    pushTri(pos, bot[i], bot[j], top[j]);
    pushTri(pos, bot[i], top[j], top[i]);
  }
  return pos;
}

export function arcSegments(r, th0, th1, z, u, steps = 10) {
  const flat = [];
  let prev = null;
  const N = Math.max(1, steps | 0);
  for (let i = 0; i <= N; i++) {
    const th = th0 + ((th1 - th0) * i) / N;
    const w = worldOf(polMath(r, th, z), u);
    if (prev) flat.push(prev.x, prev.y, prev.z, w.x, w.y, w.z);
    prev = w;
  }
  return flat;
}

export function mathSegment(x0, y0, z0, x1, y1, z1, u) {
  const a = mathToWorld(x0, y0, z0, u);
  const b = mathToWorld(x1, y1, z1, u);
  return [a.x, a.y, a.z, b.x, b.y, b.z];
}

/** Spherical volume element. φ is measured from +z. */
export function sphCellPositions({ rho0, rho1, phi0, phi1, th0, th1, u, n = 4 }) {
  const pos = [];
  const N = Math.max(1, n | 0);
  const P = (rho, phi, th) => worldOf(sphMath(rho, phi, th), u);
  const sheet = (sample) => {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const p00 = sample(i, j);
        const p10 = sample(i + 1, j);
        const p11 = sample(i + 1, j + 1);
        const p01 = sample(i, j + 1);
        pushTri(pos, p00, p10, p11);
        pushTri(pos, p00, p11, p01);
      }
    }
  };
  sheet((i, j) => P(rho0, phi0 + ((phi1 - phi0) * i) / N, th0 + ((th1 - th0) * j) / N));
  sheet((i, j) => P(rho1, phi0 + ((phi1 - phi0) * i) / N, th0 + ((th1 - th0) * j) / N));
  sheet((i, j) => P(rho0 + ((rho1 - rho0) * i) / N, phi0, th0 + ((th1 - th0) * j) / N));
  sheet((i, j) => P(rho0 + ((rho1 - rho0) * i) / N, phi1, th0 + ((th1 - th0) * j) / N));
  sheet((i, j) => P(rho0 + ((rho1 - rho0) * i) / N, phi0 + ((phi1 - phi0) * j) / N, th0));
  sheet((i, j) => P(rho0 + ((rho1 - rho0) * i) / N, phi0 + ((phi1 - phi0) * j) / N, th1));
  return pos;
}

export function repeatColor(vertexCount, color, dst) {
  for (let i = 0; i < vertexCount; i++) dst.push(color.r, color.g, color.b);
}
