/**
 * What the symbols in each lab mean, and what they are measured in. The base-SI column is computed
 * from `unit` by the same parser that checks symbolic answers, so it cannot drift from the grader.
 */
import { parseUnit } from '@flux/subjects/mechanics/units.js';

export const QUANTITIES = {
  x: { sym: 'x', name: 'Position', unit: 'm', unitName: 'metre', from: 'x = x_0 + v_0 t + \\tfrac12 a t^2' },
  v: { sym: 'v', name: 'Speed or velocity', unit: 'm/s', unitName: '', from: 'v = \\dfrac{dx}{dt}' },
  a: { sym: 'a', name: 'Acceleration', unit: 'm/s^2', unitName: '', from: 'a = \\dfrac{dv}{dt}' },
  t: { sym: 't', name: 'Time', unit: 's', unitName: 'second', from: '' },
  m: { sym: 'm', name: 'Mass', unit: 'kg', unitName: 'kilogram', from: '' },
  g: { sym: 'g', name: 'Free-fall acceleration', unit: 'm/s^2', unitName: '', equals: '9.81', from: 'g = 9.81\\ \\mathrm{m/s^2}', constant: true },
  F: { sym: 'F', name: 'Force', unit: 'N', unitName: 'newton', equals: 'kg·m/s²', from: '\\sum \\vec F = m\\vec a' },
  N: { sym: 'N', name: 'Normal force', unit: 'N', unitName: 'newton', equals: '', from: 'N = mg\\cos\\theta' },
  mu: { sym: '\\mu', name: 'Coefficient of friction', unit: '', unitName: '', from: 'f = \\mu N' },
  theta: { sym: '\\theta', name: 'Angle', unit: 'rad', unitName: 'radian', from: '' },
  R: { sym: 'R', name: 'Range', unit: 'm', unitName: 'metre', from: 'R = \\dfrac{v_0^2 \\sin 2\\theta}{g}' },
  U: { sym: 'U', name: 'Potential energy', unit: 'J', unitName: 'joule', equals: 'N·m', from: 'U = mgh' },
  K: { sym: 'K', name: 'Kinetic energy', unit: 'J', unitName: 'joule', equals: 'N·m', from: 'K = \\tfrac12 m v^2' },
  p: { sym: 'p', name: 'Momentum', unit: 'kg*m/s', unitName: '', equals: 'N·s', from: '\\vec p = m\\vec v' },
  e: { sym: 'e', name: 'Restitution', unit: '', unitName: '', from: 'e = \\dfrac{v_{2}-v_{1}}{u_{1}-u_{2}}' },
  tau: { sym: '\\tau', name: 'Torque', unit: 'N*m', unitName: '', from: '\\tau = rF\\sin\\phi' },
  I: { sym: 'I', name: 'Moment of inertia', unit: 'kg*m^2', unitName: '', from: 'I = \\sum m_i r_i^2' },
  alpha: { sym: '\\alpha', name: 'Angular acceleration', unit: 'rad/s^2', unitName: '', from: '\\alpha = \\dfrac{\\tau}{I}' },
  r: { sym: 'r', name: 'Radius', unit: 'm', unitName: 'metre', from: '' },
  omega: { sym: '\\omega', name: 'Angular speed', unit: 'rad/s', unitName: '', from: '\\omega = \\dfrac{v}{r} = \\dfrac{2\\pi}{T}' },
  T: { sym: 'T', name: 'Period, one lap', unit: 's', unitName: 'second', from: 'T = \\dfrac{2\\pi r}{v}' },
  ac: { sym: 'a_c', name: 'Centripetal acceleration', unit: 'm/s^2', unitName: '', from: 'a_c = \\dfrac{v^2}{r} = \\omega^2 r' },
  aT: { sym: 'a_T', name: 'Tangential acceleration', unit: 'm/s^2', unitName: '', from: 'a_T = \\dfrac{dv}{dt}' },
  vrel: { sym: '\\vec v_{PG}', name: 'Velocity over the ground', unit: 'm/s', unitName: '', from: '\\vec v_{PG} = \\vec v_{PF} + \\vec v_{FG}' },
};

export const LAB_UNITS = {
  projectile: ['v', 'theta', 'x', 't', 'R', 'g'],
  'circular-motion': ['r', 'v', 'omega', 'T', 'ac', 'aT'],
  'relative-motion': ['vrel', 'theta', 't', 'x'],
  'wind-triangle': ['vrel', 'theta', 't'],
  incline: ['m', 'theta', 'mu', 'F', 'N', 'a', 'g'],
  track: ['m', 'x', 'U', 'K', 'v', 'g'],
  collide: ['m', 'v', 'p', 'e', 'K'],
  rotor: ['tau', 'I', 'alpha', 'a', 'm'],
};

const BASE = ['kg', 'm', 's', 'A'];
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).split('').map((ch) => SUP[ch] ?? ch).join('');

/** Always expand to base SI. */
export function baseUnits(unit) {
  if (!unit) return 'dimensionless';
  let dim;
  try {
    dim = parseUnit(unit);
  } catch {
    return '';
  }
  const parts = dim.map((e, i) => (e === 0 ? null : e === 1 ? BASE[i] : BASE[i] + sup(e))).filter(Boolean);
  return parts.length ? parts.join('·') : 'dimensionless';
}

const pretty = (u) => String(u).replace(/\*/g, '·').replace(/\^2/g, '²').replace(/\^3/g, '³');
const normalise = (u) => String(u).replace(/\s+/g, '').replace(/\*/g, '·').replace(/\^2/g, '²').replace(/\^3/g, '³');

/** The quantities for a lab, resolved and ready to render. */
export function unitsForLab(labId) {
  return (LAB_UNITS[labId] || []).map((id) => {
    const qty = QUANTITIES[id];
    const base = baseUnits(qty.unit);
    const same = base === normalise(qty.unit);
    const none = base === 'dimensionless';
    const unit = qty.unit ? pretty(qty.unit) : 'no unit';
    return {
      id,
      ...qty,
      unit,
      base: same || none ? '' : base,
      equals: qty.equals && pretty(qty.equals) !== unit ? qty.equals : '',
    };
  });
}
