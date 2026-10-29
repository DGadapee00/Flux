/**
 * Dependent motion (Hibbeler §12.9) with forces (§13.4): a block A on a level table, tied by one
 * light rope over fixed pulleys to a load B that hangs from n rope segments of a movable block.
 *
 * The rope's length is fixed: s_A + n s_B = L, with s_A measured toward the pulley and s_B down.
 * Differentiate twice: v_A = n v_B and a_A = n a_B. One rope means one tension T everywhere.
 *
 *   A:  T − f = m_A a_A          B:  m_B g − n T = m_B a_B
 *
 * Eliminate T with a_A = n a_B: (m_B + n² m_A) a_B = m_B g − n f. The block counts n² times its
 * mass, because it moves n times as far and its force reaches B multiplied by n.
 * Friction f on A is static (as large as holding needs, up to μ_s m_A g) until the load can win,
 * then kinetic, μ_k m_A g, against the motion. Pure functions, SI.
 */
import { G } from './constants.js';

export function tackle({ mA, mB, n = 1, mus = 0, muk = 0, g = G }) {
  const holdT = (mB * g) / n;
  const cap = mus * mA * g;
  if (holdT <= cap + 1e-12) {
    return { aB: 0, aA: 0, T: holdT, f: holdT, regime: 'static', holds: true, mEff: mB + n * n * mA };
  }
  const f = Math.min(muk, mus || muk) * mA * g;
  const aB = (mB * g - n * f) / (mB + n * n * mA);
  const aA = n * aB;
  return { aB, aA, T: mA * aA + f, f, regime: 'kinetic', holds: false, mEff: mB + n * n * mA };
}

/**
 * The work–energy check over a drop h of the load from rest: the load's weight does m_B g h, friction
 * takes f (n h), and both bodies share the kinetic energy with v_A = n v_B.
 */
export function tackleSpeed({ mA, mB, n = 1, f = 0, g = G, h }) {
  const work = mB * g * h - f * n * h;
  if (!(work > 0)) return { vB: 0, vA: 0 };
  const vB = Math.sqrt((2 * work) / (mB + n * n * mA));
  return { vB, vA: n * vB };
}

/**
 * A second method that assumes no constraint: the rope is a stiff, slightly damped spring, and the two
 * bodies move under their own forces. The constraint appears as the rope's stretch stays tiny.
 * Returns the load's speed after time t from rest, with kinetic friction f on A.
 */
export function tackleStiffRope({ mA, mB, n = 1, f = 0, g = G, t, k = 2e6, steps = 40000 }) {
  const h = t / steps;
  const c = 2 * 0.2 * Math.sqrt(k * mB);
  let sA = 0;
  let sB = 0;
  let vA = 0;
  let vB = 0;
  // s_A toward the pulley and s_B down, both from rest: the rope stretches by n s_B − s_A.
  const acc = (sa, sb, va, vb) => {
    const T = Math.max(0, k * (n * sb - sa) + c * (n * vb - va));
    // Kinetic friction against A's motion; at rest, no more than the rope pulls.
    const fA = va > 1e-9 ? f : Math.min(T, f);
    return [(T - fA) / mA, (mB * g - n * T) / mB];
  };
  for (let i = 0; i < steps; i++) {
    const [a1, b1] = acc(sA, sB, vA, vB);
    const [a2, b2] = acc(sA + 0.5 * h * vA, sB + 0.5 * h * vB, vA + 0.5 * h * a1, vB + 0.5 * h * b1);
    const [a3, b3] = acc(sA + 0.5 * h * (vA + 0.5 * h * a1), sB + 0.5 * h * (vB + 0.5 * h * b1), vA + 0.5 * h * a2, vB + 0.5 * h * b2);
    const [a4, b4] = acc(sA + h * (vA + 0.5 * h * a2), sB + h * (vB + 0.5 * h * b2), vA + h * a3, vB + h * b3);
    sA += h * (vA + (h / 6) * (a1 + a2 + a3));
    sB += h * (vB + (h / 6) * (b1 + b2 + b3));
    vA += (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
    vB += (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4);
  }
  return { vB, vA, stretch: n * sB - sA };
}
