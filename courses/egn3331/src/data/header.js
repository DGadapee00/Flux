/**
 * APA nailed box beam used as a garage-door header.
 * Form Z416T, revised February 2009: 24 in deep, cross section B, 15/32 in webs,
 * 18 ft span, 413 plf allowable (the table already includes a 15% snow increase).
 * The example load is 25 psf snow plus 10 psf dead on 20 ft trusses, so 350 plf,
 * plus the table's 13 plf beam weight.
 * Each flange is two dressed 2×4s stacked: 3.5 in wide and 3 in deep (PS 20).
 * Nails are 8d common, 0.131 in by 2.5 in, at 1.5 in on center on each side of
 * each flange lamination: four lines share the flange flow.
 */
import { M_PER_FT, M_PER_IN, N_PER_LBF } from '@flux/subjects/convert.js';
import { boxSection, fastenerForce, shearFlow } from '@flux/subjects/mechanics/materials.js';

export const HEADER_SPAN_FT = 18;
export const HEADER_ROOF_PLF = 350;
export const HEADER_WEIGHT_PLF = 13;
export const HEADER_LOAD_PLF = HEADER_ROOF_PLF + HEADER_WEIGHT_PLF;
export const HEADER_TABLE_PLF = 413;
export const HEADER_DEPTH_IN = 24;
export const HEADER_BF_IN = 3.5;
export const HEADER_TF_IN = 3;
export const HEADER_TW_IN = 15 / 32;
export const HEADER_NAIL_IN = 1.5;
export const HEADER_LINES = 4;

export const PLF_TO_NPM = N_PER_LBF / M_PER_FT;

export function headerBox() {
  return boxSection(
    HEADER_BF_IN * M_PER_IN,
    HEADER_TF_IN * M_PER_IN,
    HEADER_TW_IN * M_PER_IN,
    HEADER_DEPTH_IN * M_PER_IN,
  );
}

/** Nail force and flange flow at station x, from the left support of a simple span. */
export function headerNail(wNpm, L, x = 0) {
  const sec = headerBox();
  const V = wNpm * (L / 2 - x);
  const q = shearFlow(V, sec.Qf, sec.I);
  const nail = fastenerForce(q, HEADER_NAIL_IN * M_PER_IN, HEADER_LINES);
  return { V, q, nail, sec };
}

/** The same nail force in pounds, from inch-pound Q and I. */
export function headerInchForce(plf, spanFt) {
  const yf = HEADER_DEPTH_IN / 2 - HEADER_TF_IN / 2;
  const Af = HEADER_BF_IN * HEADER_TF_IN;
  const Q = Af * yf;
  const I = 2 * ((HEADER_BF_IN * HEADER_TF_IN ** 3) / 12 + Af * yf ** 2)
    + 2 * ((HEADER_TW_IN * HEADER_DEPTH_IN ** 3) / 12);
  const V = (plf * spanFt) / 2;
  const q = (V * Q) / I;
  return (q * HEADER_NAIL_IN) / HEADER_LINES;
}
