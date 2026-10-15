/**
 * Second method for the kinematics problems: integrate a constant acceleration
 * with the trapezoid rule. The library answers come from the closed forms.
 * For constant acceleration the trapezoid rule is exact, apart from roundoff.
 */

export function trap1D(x0, v0, a, t, n = 4000) {
  if (t === 0) return { x: x0, v: v0 };
  const dt = t / n;
  let x = x0;
  let v = v0;
  for (let i = 0; i < n; i++) {
    const next = v + a * dt;
    x += 0.5 * (v + next) * dt;
    v = next;
  }
  return { x, v };
}

/** Projectile in the vertical plane. +y is up. Does not call the library. */
export function trapFlight({ v0x, v0y, g, t, n = 4000 }) {
  if (t === 0) return { x: 0, y: 0, vx: v0x, vy: v0y, speed: Math.hypot(v0x, v0y) };
  const dt = t / n;
  let x = 0;
  let y = 0;
  let vx = v0x;
  let vy = v0y;
  for (let i = 0; i < n; i++) {
    const next = vy - g * dt;
    y += 0.5 * (vy + next) * dt;
    x += vx * dt;
    vy = next;
  }
  return { x, y, vx, vy, speed: Math.hypot(vx, vy) };
}
