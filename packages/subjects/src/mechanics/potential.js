/**
 * Motion in one dimension read from a potential-energy curve U(x), for a body of mass m and fixed
 * total energy E. Where E ≥ U the body can be; where E = U it turns round; where dU/dx = 0 it can rest.
 * F = −dU/dx: the force points down the slope of U. SI units; U is any function of x.
 */

/** −dU/dx by a central difference. */
export function forceFrom(U, x, h = 1e-5) {
  return -(U(x + h) - U(x - h)) / (2 * h);
}

function bisect(f, a, b) {
  let lo = a;
  let hi = b;
  const flo = f(lo);
  for (let i = 0; i < 200; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (Math.sign(f(mid)) === Math.sign(flo)) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

/** Every x in [lo, hi] where f changes sign, found by scanning and bisection. */
function roots(f, lo, hi, n = 4000) {
  const out = [];
  let a = lo;
  let fa = f(a);
  for (let i = 1; i <= n; i += 1) {
    const b = lo + ((hi - lo) * i) / n;
    const fb = f(b);
    if (fa === 0) out.push(a);
    else if (fa * fb < 0) out.push(bisect(f, a, b));
    a = b;
    fa = fb;
  }
  return out;
}

/** The turning points: the x where U(x) = E. */
export const turningPoints = (U, E, lo, hi) => roots((x) => E - U(x), lo, hi);

/**
 * The equilibria: the x where dU/dx = 0. A minimum of U (d²U/dx² > 0) is stable: the force on either
 * side points back. A maximum is unstable.
 */
export function equilibria(U, lo, hi) {
  return roots((x) => forceFrom(U, x), lo, hi).map((x) => {
    const h = 1e-4;
    const curv = (U(x + h) - 2 * U(x) + U(x - h)) / (h * h);
    return { x, U: U(x), stable: curv > 0 };
  });
}

/** The allowed interval holding x0, between the turning points on either side, or null. */
export function wellAround(U, E, x0, lo, hi) {
  if (U(x0) > E) return null;
  const tps = turningPoints(U, E, lo, hi);
  const left = tps.filter((x) => x < x0);
  const right = tps.filter((x) => x > x0);
  return { a: left.length ? left[left.length - 1] : -Infinity, b: right.length ? right[0] : Infinity };
}

/**
 * The period of motion between turning points a and b: from ½mv² = E − U, v = √(2(E − U)/m), and
 * T = 2 ∫ dx / v. The integrand blows up at the ends, so substitute x = c + w sin φ (c the middle, w the
 * half-width): dx = w cos φ dφ, and near a turning point E − U ∝ cos²φ, which keeps the integrand finite.
 */
export function period(U, E, m, a, b, n = 2000) {
  const c = 0.5 * (a + b);
  const w = 0.5 * (b - a);
  const f = (phi) => {
    const x = c + w * Math.sin(phi);
    const ke = E - U(x);
    const cosw = w * Math.cos(phi);
    if (ke <= 0) return 0;
    return cosw / Math.sqrt((2 * ke) / m);
  };
  // Midpoint rule avoids the endpoints φ = ±π/2.
  const h = Math.PI / n;
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += f(-Math.PI / 2 + (i + 0.5) * h);
  return 2 * sum * h;
}

/**
 * The same motion stepped in time (velocity Verlet with a = F/m), from rest at x0, until it comes back
 * to rest: the second method for the period and the turning points.
 */
export function simulate(U, m, x0, { dt = 1e-4, tMax = 100 } = {}) {
  let x = x0;
  let v = 0;
  let a = forceFrom(U, x) / m;
  let t = 0;
  let lo = x;
  let hi = x;
  let vMax = 0;
  let returns = null;
  let prevV = 0;
  let turns = 0;
  while (t < tMax) {
    x += v * dt + 0.5 * a * dt * dt;
    const a2 = forceFrom(U, x) / m;
    v += 0.5 * (a + a2) * dt;
    a = a2;
    t += dt;
    lo = Math.min(lo, x);
    hi = Math.max(hi, x);
    vMax = Math.max(vMax, Math.abs(v));
    if (t > 2 * dt && prevV !== 0 && Math.sign(v) !== Math.sign(prevV)) {
      turns += 1;
      if (turns === 2) {
        // Interpolate the instant v crossed zero within the last step.
        returns = t - dt * (Math.abs(v) / (Math.abs(v) + Math.abs(prevV)));
        break;
      }
    }
    prevV = v;
  }
  return { period: returns, lo, hi, vMax };
}
