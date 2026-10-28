/**
 * A 1/2 in 6×19 independent wire rope core, from the cable data in the
 * Caltrans Falsework Manual, Appendix D, Example 18.
 * https://dot.ca.gov/-/media/dot-media/programs/engineering/documents/structureconstruction/falsework/fw-appendixd-ex18-a11y.pdf
 *
 * Metallic area 0.118 in², nominal strength 11.5 tons, weight 0.46 lb/ft.
 * The example prints 13.5×10⁶ psi and, in the same line, 12.2×10⁶ psi up to
 * 20% of ultimate. The hook loads in this unit stay under that 20%, so the
 * modulus used here is 12.2×10⁶ psi.
 *
 * The length, the hook load, and the drop are not in that example.
 */
import { M_PER_FT, M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import { impactDrop, impactInches } from '@flux/subjects/mechanics/strain-energy.js';

export const ROPE_A_IN2 = 0.118;
export const ROPE_E_PSI = 12.2e6;
export const ROPE_BREAK_LBF = 11.5 * 2000;
export const ROPE_W_PLF = 0.46;
export const ROPE_L_FT = 30;
export const ROPE_LOAD_LBF = 400;
export const ROPE_H_IN = 1;
export const ROPE_URL = 'https://dot.ca.gov/-/media/dot-media/programs/engineering/documents/structureconstruction/falsework/fw-appendixd-ex18-a11y.pdf';

/** Inch-pound impact. Does not build pascals first. */
export function ropeInches(loadLbf, lengthFt, dropIn) {
  return impactInches(loadLbf, lengthFt * 12, ROPE_A_IN2, ROPE_E_PSI, dropIn);
}

/** SI impact, plus the gap against the inch path and the mass-spring integration. */
export function ropeDrop(loadLbf, lengthFt, dropIn) {
  const si = impactDrop(
    loadLbf * N_PER_LBF,
    lengthFt * M_PER_FT,
    ROPE_A_IN2 * M_PER_IN * M_PER_IN,
    ROPE_E_PSI * PA_PER_PSI,
    dropIn * M_PER_IN,
  );
  const inch = ropeInches(loadLbf, lengthFt, dropIn);
  const stress = inch.stressPsi * PA_PER_PSI;
  const delta = inch.n * inch.deltaIn * M_PER_IN;
  const unitGap = Math.max(
    Math.abs(si.n - inch.n) / Math.max(inch.n, 1e-9),
    Math.abs(si.stress - stress) / Math.max(stress, 1),
    Math.abs(si.delta - delta) / Math.max(delta, 1e-12),
  );
  return { ...si, inch, gap: Math.max(si.gap, unitGap), fraction: inch.forceLbf / ROPE_BREAK_LBF };
}
