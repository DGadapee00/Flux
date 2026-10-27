/**
 * Resistive sensors and the divider that reads them. Pure, SI units (ohms, volts, kelvin unless a
 * name says °C), no DOM.
 */

/**
 * A light-dependent resistor. Datasheets give its resistance at 10 lux, R₁₀, and its gamma, the log
 * of the ratio of resistances a decade of light apart: γ = log₁₀(R₁₀ / R₁₀₀). So on log–log axes the
 * resistance is a straight line, R = R₁₀ (E/10)^(−γ). In the dark that line would go to infinity; a
 * real cell levels off at its dark resistance, modelled as a resistance in parallel.
 */
export function ldrResistance({ r10, gamma, rdark }, lux) {
  if (lux <= 0) return rdark;
  const line = r10 * (lux / 10) ** -gamma;
  return 1 / (1 / line + 1 / rdark);
}

/** The light at which the LDR has resistance `r`: the inverse of `ldrResistance`. */
export function ldrLux({ r10, gamma, rdark }, r) {
  if (r >= rdark) return 0;
  const line = 1 / (1 / r - 1 / rdark);
  return 10 * (line / r10) ** (-1 / gamma);
}

/** Celsius to kelvin. */
export const K0 = 273.15;

/**
 * An NTC thermistor by its beta equation: R(T) = R₂₅ exp(B (1/T − 1/T₂₅)), T in kelvin. Above 25 °C
 * the resistance falls, below it rises.
 */
export function ntcResistance({ r25, beta }, tC) {
  return r25 * Math.exp(beta * (1 / (tC + K0) - 1 / (25 + K0)));
}

/** The temperature, in °C, at which the thermistor has resistance `r`. */
export function ntcTemp({ r25, beta }, r) {
  return 1 / (1 / (25 + K0) + Math.log(r / r25) / beta) - K0;
}

/** Two resistances in parallel; an infinite one is no resistor at all. */
export function par(a, b) {
  if (!Number.isFinite(a)) return b;
  if (!Number.isFinite(b)) return a;
  return (a * b) / (a + b);
}

/**
 * A divider: `top` from the supply to the output, `bottom` from the output to 0 V, and a `load` from
 * the output to 0 V (Infinity for none). The output, and the divider's Thévenin resistance, the
 * resistance a load sees looking back into the output: top and bottom in parallel.
 */
export function divider(vs, top, bottom, load = Infinity) {
  const lower = par(bottom, load);
  return { v: (vs * lower) / (top + lower), vOpen: (vs * bottom) / (top + bottom), rth: par(top, bottom) };
}

/**
 * The fixed resistor that gives the largest swing in a divider's output as a sensor goes from `ra`
 * to `rb`. The swing is v(rb) − v(ra) = Vs [R/(R + ra) − R/(R + rb)]; setting its derivative in R to
 * zero gives R² = ra·rb. The geometric mean, not the average.
 */
export function bestFixed(ra, rb) {
  return Math.sqrt(ra * rb);
}

/**
 * Millman's theorem: a node joined through conductances to fixed voltages settles at their
 * conductance-weighted average. `links` is [[volts, ohms], ...]. A second route to a node voltage.
 */
export function millman(links) {
  let num = 0;
  let den = 0;
  for (const [v, r] of links) {
    num += v / r;
    den += 1 / r;
  }
  return num / den;
}
