/**
 * What a kilojoule of heat is worth (EML 3101, exergy).
 *
 * Heat Q drawn from a reservoir at T, with surroundings at T₀ = 283 K, can give at most the Carnot work
 *   X = Q(1 − T₀/T).
 * As T falls toward T₀ that work falls to zero: a kilojoule at 1500 K is worth 0.81 kJ of work, a
 * kilojoule at 320 K only 0.12. Heat from a stream that cools from T to T₀ as it gives it up is worth
 * less than heat at T throughout, since most of it leaves at lower temperatures:
 *   X = Q[1 − T₀ ln(T/T₀)/(T − T₀)].
 * Using high-temperature heat to warm a room at 295 K destroys the difference: X_destroyed = T₀S_gen.
 *
 * The second method runs a Carnot engine on each slice of the cooling stream and sums their work by
 * Simpson's rule.
 */

/** Surroundings on a winter day, 10 °C, and a room kept at 22 °C. */
export const T0 = 283.15;
export const ROOM = 295.15;

export function exergyClosed({ TK }) {
  const fr = 1 - T0 / TK;
  const fs = TK > T0 + 1e-9 ? 1 - (T0 * Math.log(TK / T0)) / (TK - T0) : 0;
  // 1 kJ from T delivered to a room at 22 °C: entropy generated and work lost.
  const sgen = 1 / ROOM - 1 / TK; // kJ/K per kJ
  return { fr, fs, sgen, destroyed: T0 * sgen, lostShare: TK > ROOM ? (T0 * sgen) / Math.max(1e-12, fr) : 0 };
}

export function exergyNumeric({ TK }, n = 400) {
  if (TK <= T0) return 0;
  const h = (TK - T0) / n;
  const f = (T) => 1 - T0 / T;
  let s = f(T0) + f(TK);
  for (let i = 1; i < n; i++) s += f(T0 + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3 / (TK - T0);
}

export function exergyChecked(state) {
  const cf = exergyClosed(state);
  const fsNum = exergyNumeric(state);
  return { ...cf, fsNum, gap: Math.abs(fsNum - cf.fs) };
}
