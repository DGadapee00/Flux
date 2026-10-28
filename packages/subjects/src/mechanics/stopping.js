/**
 * A car stopping for an obstacle: AASHTO's stopping sight distance (Hibbeler §14.1–14.3).
 *
 * The driver sees the obstacle, reacts for t seconds at full speed, then brakes. Over the reaction
 * the car covers v t. Braking, the road's friction does negative work along the road, and on a
 * grade the weight does work too. With tan θ = G (up positive), f the braking friction, and the
 * principle of work and energy from v to rest:
 *
 *   −(f m g cos θ + m g sin θ) d = 0 − ½ m v²   ⇒   d = v² / (2 g (f cos θ + sin θ)).
 *
 * The mass cancels. AASHTO (A Policy on Geometric Design of Highways and Streets, 2011, §3.2.2)
 * writes f g as a = 11.2 ft/s², a rate 90% of drivers brake harder than, takes t = 2.5 s, and
 * works in mph and feet with cos θ ≈ 1 and sin θ ≈ G:
 *
 *   SSD = 1.47 V t + 1.075 V²/a on the level,   d_b = V² / (30 (a/32.2 + G)) on a grade.
 *
 * Pure functions, US units: ft, s, mph.
 */
import { G_FT } from './constants.js';

/** Feet per second in one mile per hour, exactly. */
export const FPS_PER_MPH = 5280 / 3600;

/** The reaction distance, the braking distance and their sum, in feet. */
export function stopDistance({ Vmph, t = 2.5, a = 11.2, grade = 0, g = G_FT }) {
  const v = Vmph * FPS_PER_MPH;
  const th = Math.atan(grade);
  // a is f g on the level; on the grade the normal force, and so the friction, falls with cos θ.
  const decel = a * Math.cos(th) + g * Math.sin(th);
  const reaction = v * t;
  const braking = decel > 0 ? (v * v) / (2 * decel) : Infinity;
  return { v, decel, reaction, braking, total: reaction + braking, tBrake: decel > 0 ? v / decel : Infinity };
}

/** AASHTO's level-road formula as printed, in feet. */
export const aashtoSSD = (Vmph, t = 2.5, a = 11.2) => 1.47 * Vmph * t + (1.075 * Vmph * Vmph) / a;

/** AASHTO's braking distance on a grade G (up positive), in feet. */
export const aashtoBrakingOnGrade = (Vmph, a = 11.2, G = 0) => (Vmph * Vmph) / (30 * (a / 32.2 + G));

/**
 * The second method: step the motion in time, with no energy used. Full speed for t, then a
 * constant deceleration until the speed reaches zero. Returns the distances in feet.
 */
export function stepStop({ Vmph, t = 2.5, a = 11.2, grade = 0, g = G_FT }, steps = 20000) {
  const th = Math.atan(grade);
  const decel = a * Math.cos(th) + g * Math.sin(th);
  let v = Vmph * FPS_PER_MPH;
  const reaction = v * t;
  if (!(decel > 0)) return { reaction, braking: Infinity, total: Infinity };
  const h = v / decel / steps;
  let x = 0;
  while (v > 0) {
    const v1 = v - decel * h;
    // The last step ends where the speed reaches zero, part way through.
    if (v1 <= 0) {
      x += (v * v) / (2 * decel);
      break;
    }
    x += 0.5 * (v + v1) * h;
    v = v1;
  }
  return { reaction, braking: x, total: reaction + x };
}
