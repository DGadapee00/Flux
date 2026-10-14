/**
 * Newton's law of gravitation, circular orbits, and escape.
 * GRAV is the gravitational constant. The nearby G in constants.js is g, the
 * surface field 9.81 m/s², and the two are not the same number.
 * Potential energy is zero at infinity.
 */

export const GRAV = 6.6743e-11;

/** Magnitude G m1 m2 / r². */
export function gravityForce(m1, m2, r) {
  return (GRAV * m1 * m2) / (r * r);
}

/** Field G M / r², the acceleration of a test mass. */
export function gravityField(M, r) {
  return (GRAV * M) / (r * r);
}

/** −G m1 m2 / r. */
export function gravityEnergy(m1, m2, r) {
  return (-GRAV * m1 * m2) / r;
}

/** Speed that makes the total energy zero. */
export function escapeSpeed(M, r) {
  return Math.sqrt((2 * GRAV * M) / r);
}

/** Speed of a circular orbit. */
export function circularOrbitSpeed(M, r) {
  return Math.sqrt((GRAV * M) / r);
}

/** Period of a circular orbit. */
export function circularOrbitPeriod(M, r) {
  return 2 * Math.PI * Math.sqrt((r * r * r) / (GRAV * M));
}

/** Mechanical energy of a circular orbit, −G M m / (2 r). */
export function circularOrbitEnergy(m, M, r) {
  return (-GRAV * M * m) / (2 * r);
}
