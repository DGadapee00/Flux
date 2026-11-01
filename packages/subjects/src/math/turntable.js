import { RAD_S_PER_RPM } from '../convert.js';
/** A marked point on an ideal rigid platter. r metres, RPM, t seconds, theta0 radians.
 * Velocity is the time derivative of (r cosθ,r sinθ), not the geometric slope.
 * Swept area includes multiplicity after more than one revolution. */
export function turntable(r, rpm, t, theta0 = 0) {
  if (!(
    Number.isFinite(r) &&
    r > 0 &&
    Number.isFinite(rpm) &&
    rpm > 0 &&
    Number.isFinite(t) &&
    t >= 0 &&
    Number.isFinite(theta0)
  ))
    throw new RangeError('Positive radius and speed; nonnegative time required');
  const omega = rpm * RAD_S_PER_RPM,
    theta = theta0 + omega * t,
    x = r * Math.cos(theta),
    y = r * Math.sin(theta),
    vx = -omega * y,
    vy = omega * x;
  return {
    omega,
    theta,
    x,
    y,
    vx,
    vy,
    speed: r * omega,
    period: (2 * Math.PI) / omega,
    distance: r * omega * t,
    area: (r * r * omega * t) / 2,
    slope: Math.abs(vx) < 1e-12 ? null : vy / vx,
  };
}
