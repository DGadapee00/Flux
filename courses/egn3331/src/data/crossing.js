/**
 * A car crossing a short steel bridge.
 *
 * 2024 Honda Civic LX sedan: curb weight 2,877 lb, wheelbase 107.7 in, weight distribution
 * 61% front, 39% rear (Honda Information Center, 2024 Civic Sedan specifications).
 *
 * W8×10 stringer: d = 7.89 in, bf = 3.94 in, tf = 0.205 in, tw = 0.170 in, Ix = 30.8 in⁴,
 * Sx = 7.81 in³ (AISC Steel Construction Manual, Table 1-1). E = 29,000 ksi (AISC).
 * Two stringers, one under each wheel line, so each carries half of each axle. The span and the
 * two-stringer layout are assumed.
 */
export const CAR_LB = 2877;
export const CAR_WB_IN = 107.7;
export const CAR_FRONT = 0.61;
export const W8 = { d: 7.89, bf: 3.94, tf: 0.205, tw: 0.17, Ix: 30.8, Sx: 7.81 };
export const STEEL_E_PSI = 29e6;

/** I of the W8×10 from its plates, fillets ignored: a check on the tabulated 30.8 in⁴. */
export const w8FromPlates = () => (W8.bf * W8.d ** 3 - (W8.bf - W8.tw) * (W8.d - 2 * W8.tf) ** 3) / 12;
