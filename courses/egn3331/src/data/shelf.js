/**
 * A flat pine shelf. The dressed 1×12 is PS 20. The modulus is the Forest
 * Products Laboratory value for clear eastern white pine at 12% moisture,
 * from a bending test, so shear deflection is already in the number.
 * The span and the book load are a chosen example.
 */
import { M_PER_FT, M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import { proppedUniform, rectInertia, simpleUniformDeflection } from '@flux/subjects/mechanics/elastic.js';

export const SHELF_E_PSI = 1.24e6;
export const SHELF_B_IN = 11.25;
export const SHELF_H_IN = 0.75;
export const SHELF_SPAN_IN = 72;
export const SHELF_LOAD_PLF = 40;

export const SHELF_E = SHELF_E_PSI * PA_PER_PSI;

export const shelfLoad = (plf) => (plf * N_PER_LBF) / M_PER_FT;

export function shelfEI(bIn, hIn) {
  return SHELF_E * rectInertia(bIn * M_PER_IN, hIn * M_PER_IN);
}

/** Open span, SI. `drop` is downward. */
export function shelfOpen(spanIn, plf, bIn = SHELF_B_IN, hIn = SHELF_H_IN) {
  const L = spanIn * M_PER_IN;
  const w = shelfLoad(plf);
  const EI = shelfEI(bIn, hIn);
  const beam = simpleUniformDeflection(w, L, EI);
  return { ...beam, L, w, EI };
}

/** The same open span in inches and pounds, so the two unit systems can be compared. */
export function shelfOpenInches(spanIn, plf, bIn = SHELF_B_IN, hIn = SHELF_H_IN) {
  const w = plf / 12;
  const I = (bIn * hIn ** 3) / 12;
  return (5 * w * spanIn ** 4) / (384 * SHELF_E_PSI * I);
}

/**
 * A bracket at midspan. Symmetry makes each half a propped cantilever, fixed
 * against rotation at the center. End reactions are 3wL/16. The center carries 5wL/8.
 */
export function shelfBraced(spanIn, plf, bIn = SHELF_B_IN, hIn = SHELF_H_IN) {
  const L = spanIn * M_PER_IN;
  const w = shelfLoad(plf);
  const EI = shelfEI(bIn, hIn);
  const half = proppedUniform(w, L / 2, EI);
  const total = w * L;
  return {
    half,
    drop: half.drop,
    Rend: (3 / 16) * total,
    Rmid: (5 / 8) * total,
    L,
    w,
    EI,
  };
}

/** Propped half-span in inches, for the unit check. */
export function shelfBracedInches(spanIn, plf, bIn = SHELF_B_IN, hIn = SHELF_H_IN) {
  const w = plf / 12;
  const I = (bIn * hIn ** 3) / 12;
  return proppedUniform(w, spanIn / 2, SHELF_E_PSI * I).drop;
}
