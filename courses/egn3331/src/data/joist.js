/**
 * A nominal 2×10 floor joist.
 *
 * Dressed size 1-1/2 in by 9-1/4 in, from the American Wood Council span tables
 * (2024) and the American Softwood Lumber Standard, PS 20.
 * Maximum span 14 ft 0 in: Southern Forest Products Association, Maximum Spans
 * for Southern Pine, Table 2 (1 June 2013). No. 2 grade, 16 in on center,
 * 40 psf live load, 10 psf dead load, deflection limited to the span over 360.
 * Those spans use SPIB Supplement No. 13 design values. The table does not
 * print the bending stress, and the span may be set by deflection.
 */
import { M_PER_FT, M_PER_IN, N_PER_LBF } from '@flux/subjects/convert.js';

export const JOIST_B_IN = 1.5;
export const JOIST_H_IN = 9.25;
export const JOIST_SPAN_FT = 14;
export const JOIST_SPACE_IN = 16;
export const JOIST_LIVE_PSF = 40;
export const JOIST_DEAD_PSF = 10;

export const JOIST_B = JOIST_B_IN * M_PER_IN;
export const JOIST_H = JOIST_H_IN * M_PER_IN;
export const JOIST_SPAN = JOIST_SPAN_FT * M_PER_FT;
export const JOIST_SPACE = JOIST_SPACE_IN * M_PER_IN;
export const PA_PER_PSF = N_PER_LBF / (M_PER_FT * M_PER_FT);
export const JOIST_LIVE = JOIST_LIVE_PSF * PA_PER_PSF;
export const JOIST_DEAD = JOIST_DEAD_PSF * PA_PER_PSF;

/** Force per length on one joist. Pressure times the tributary width. */
export const joistLine = (livePa, spaceM, deadPa = JOIST_DEAD) => (livePa + deadPa) * spaceM;
