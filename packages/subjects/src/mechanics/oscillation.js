/**
 * Simple harmonic motion: a spring, a simple pendulum, and a physical pendulum.
 * The pendulum formulas are the small-angle ones. Phase is in radians.
 */

import { G } from './constants.js';

/** ω = √(k/m). */
export function springOmega(mass, k) {
  return Math.sqrt(k / mass);
}

/** T = 2π √(m/k). */
export function springPeriod(mass, k) {
  return (2 * Math.PI) / springOmega(mass, k);
}

/** T = 2π √(L/g) for a simple pendulum. */
export function pendulumPeriod(length, g = G) {
  return 2 * Math.PI * Math.sqrt(length / g);
}

/**
 * T = 2π √(I / (m g d)). d is the distance from the pivot to the center of mass.
 */
export function physicalPendulumPeriod(I, mass, d, g = G) {
  return 2 * Math.PI * Math.sqrt(I / (mass * g * d));
}

/** x = A cos(ωt + φ), and the velocity and acceleration that go with it. */
export function shm({ A, omega, phi = 0, t }) {
  const phase = omega * t + phi;
  const x = A * Math.cos(phase);
  const vel = -A * omega * Math.sin(phase);
  return { x, v: vel, a: -omega * omega * x };
}

/** Total energy of a spring oscillator, (1/2) k A². */
export function shmEnergy(k, A) {
  return 0.5 * k * A * A;
}
