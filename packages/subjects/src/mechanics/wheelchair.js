/**
 * A wheelchair rolling down a ramp (Hibbeler §18.2–18.5): a rigid frame and rider, carried on wheels
 * that roll without slipping. The 2010 ADA Standards for Accessible Design cap a ramp's running
 * slope at 1:12 (§405.2) and the rise of one run at 30 in (§405.6).
 *
 * Every wheel's centre moves at the chair's speed v, and it spins at ω = v/R. A wheel of mass m_w and
 * radius of gyration k about its axle carries ½ m_w v² + ½ m_w k² ω² = ½ (m_w + m_w k²/R²) v². So the
 * whole chair carries ½ m_eff v², with m_eff = m + Σ m_w k²/R², m the total mass.
 *
 * Down a ramp of rise H at angle θ (tan θ = slope), length L = H/sin θ, the weight does m g H and
 * rolling resistance, a force c m g cos θ along the ramp, does −c m g cos θ L. The contact forces of
 * wheels that roll without slipping do no work. From rest:
 *
 *   ½ m_eff v² = m g H − c m g cos θ · L.
 *
 * Pure functions, SI.
 */
import { G } from './constants.js';

/** The chair's effective mass: its total mass plus each wheel's I/R². Wheels: [{ n, m, R, k }]. */
export function effectiveMass(m, wheels) {
  return m + wheels.reduce((s, w) => s + (w.n * w.m * w.k * w.k) / (w.R * w.R), 0);
}

/** The run from rest to the foot of the ramp: speed, time, and where the energy went. */
export function rollDown({ m, wheels, H, slope, c = 0, g = G }) {
  const th = Math.atan(slope);
  const L = H / Math.sin(th);
  const mEff = effectiveMass(m, wheels);
  const drop = m * g * H;
  const lost = c * m * g * Math.cos(th) * L;
  const net = drop - lost;
  const v = net > 0 ? Math.sqrt((2 * net) / mEff) : 0;
  const a = (m * g * (Math.sin(th) - c * Math.cos(th))) / mEff;
  const spin = wheels.map((w) => ({ ...w, omega: v / w.R, T: 0.5 * w.n * w.m * w.k * w.k * (v / w.R) ** 2 }));
  return {
    th,
    L,
    mEff,
    drop,
    lost,
    v,
    a,
    t: a > 0 ? v / a : Infinity,
    Ttrans: 0.5 * m * v * v,
    Trot: spin.reduce((s, w) => s + w.T, 0),
    spin,
  };
}

/**
 * The second method: Newton and Euler on each wheel, stepped in time with RK4. A wheel's ground
 * friction f spins it, f R = I α with α = a/R, and holds the chair back by f; the chair then obeys
 * m a = m g sin θ − c m g cos θ − Σ f. Stepped from rest until the chair has travelled L.
 */
export function rollDownStepped({ m, wheels, H, slope, c = 0, g = G }, steps = 4000) {
  const th = Math.atan(slope);
  const L = H / Math.sin(th);
  // Σ f = a Σ n I/R², so a appears on both sides: solve the one linear equation at each step.
  const drag = wheels.reduce((s, w) => s + (w.n * w.m * w.k * w.k) / (w.R * w.R), 0);
  const acc = () => (m * g * (Math.sin(th) - c * Math.cos(th))) / (m + drag);
  if (!(acc() > 0)) return { v: 0, t: Infinity };
  let s = 0;
  let v = 0;
  let t = 0;
  const h = Math.sqrt((2 * L) / acc()) / steps;
  while (s < L) {
    const k1s = v;
    const k1v = acc();
    const k2s = v + 0.5 * h * k1v;
    const k2v = acc();
    const k3s = v + 0.5 * h * k2v;
    const k3v = acc();
    const k4s = v + h * k3v;
    const k4v = acc();
    const sNext = s + (h / 6) * (k1s + 2 * k2s + 2 * k3s + k4s);
    const vNext = v + (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    if (sNext >= L) {
      // The foot of the ramp falls inside this step: finish it at the exact distance.
      const a = k1v;
      const dt = (-v + Math.sqrt(v * v + 2 * a * (L - s))) / a;
      return { v: v + a * dt, t: t + dt };
    }
    s = sNext;
    v = vNext;
    t += h;
  }
  return { v, t };
}
