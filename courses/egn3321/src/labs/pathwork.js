/**
 * Three paths between the same ends. Gravity and a spring are conservative.
 * Friction of magnitude μmg opposes the motion, so its work follows the length.
 */
import { G } from '@flux/subjects/mechanics/constants.js';
import { conservativeWork } from '@flux/subjects/mechanics/energy.js';
import { simpson } from '@flux/subjects/math/quadrature.js';

export function lineMotion(A, B) {
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  return (t) => ({ x: A[0] + t * dx, y: A[1] + t * dy, dx, dy });
}

export function cornerMotion(A, B) {
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  return (t) => {
    if (t <= 0.5) {
      const u = t / 0.5;
      return { x: A[0] + u * dx, y: A[1], dx: dx / 0.5, dy: 0 };
    }
    const u = (t - 0.5) / 0.5;
    return { x: B[0], y: A[1] + u * dy, dx: 0, dy: dy / 0.5 };
  };
}

export function archMotion(A, B, rise) {
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  return (t) => ({
    x: A[0] + t * dx,
    y: A[1] + t * dy + rise * Math.sin(Math.PI * t),
    dx,
    dy: dy + rise * Math.PI * Math.cos(Math.PI * t),
  });
}

function forces(spec, p, dx, dy) {
  const rx = p.x - spec.anchor[0];
  const ry = p.y - spec.anchor[1];
  const len = Math.hypot(rx, ry);
  const stretch = len - spec.rest;
  let sx = 0;
  let sy = 0;
  if (len > 1e-9) {
    const scale = (-spec.k * stretch) / len;
    sx = scale * rx;
    sy = scale * ry;
  }
  const speed = Math.hypot(dx, dy);
  let fx = 0;
  let fy = 0;
  if (speed > 1e-12 && spec.mu) {
    const mag = Math.abs(spec.mu) * spec.mass * spec.g;
    fx = (-mag * dx) / speed;
    fy = (-mag * dy) / speed;
  }
  return { x: sx + fx, y: -spec.mass * spec.g + sy + fy };
}

function integrate(spec, motion, pick, a, b) {
  return simpson((t) => {
    const p = motion(t);
    return pick(p, p.dx, p.dy);
  }, a, b, 1e-8);
}

function along(spec, motion, split) {
  const dot = (p, dx, dy) => {
    const F = forces(spec, p, dx, dy);
    return F.x * dx + F.y * dy;
  };
  const length = (p, dx, dy) => Math.hypot(dx, dy);
  if (split) {
    return {
      work: integrate(spec, motion, dot, 0, 0.5) + integrate(spec, motion, dot, 0.5, 1),
      length: integrate(spec, motion, length, 0, 0.5) + integrate(spec, motion, length, 0.5, 1),
    };
  }
  return {
    work: integrate(spec, motion, dot, 0, 1),
    length: integrate(spec, motion, length, 0, 1),
  };
}

/** Closed-form conservative work, and the line integral on each path. */
export function pathReport({ mass, k, mu = 0, rise = 0, ax, ay, bx, by, g = G, anchor = [0, 0], rest = 0 }) {
  const spec = { mass, k, mu, g, anchor, rest };
  const A = [ax, ay];
  const B = [bx, by];
  const potential = conservativeWork(spec, A, B);
  const motions = [
    ['line', lineMotion(A, B), false],
    ['corner', cornerMotion(A, B), true],
    ['arch', archMotion(A, B, rise), false],
  ];
  const out = { potential, workLine: 0, workCorner: 0, workArch: 0, frictionLine: 0, frictionCorner: 0, frictionArch: 0, gap: 0 };
  for (const [name, motion, split] of motions) {
    const row = along(spec, motion, split);
    const friction = -Math.abs(mu) * mass * g * row.length;
    const key = name[0].toUpperCase() + name.slice(1);
    out[`work${key}`] = row.work;
    out[`friction${key}`] = friction;
    const expect = potential + friction;
    out.gap = Math.max(out.gap, Math.abs(row.work - expect) / Math.max(1, Math.abs(expect)));
  }
  return out;
}
