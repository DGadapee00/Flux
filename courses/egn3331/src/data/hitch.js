/**
 * CURT trailer ball 40004, from the CURT trailer-ball catalog.
 * 2 in ball, 1 in shank diameter, 2-1/8 in shank length, 0 rise, 6000 lb gross trailer weight.
 * The gross rating is not a tongue load. The flange height is not in the catalog, so the
 * moment arm used here is the ball radius.
 */
import { M_PER_IN } from '@flux/subjects/convert.js';

export const HITCH_D_IN = 1;
export const HITCH_BALL_IN = 2;
export const HITCH_LEN_IN = 2.125;
export const HITCH_GTW_LBF = 6000;
export const HITCH_D = HITCH_D_IN * M_PER_IN;
export const HITCH_ARM = (HITCH_BALL_IN / 2) * M_PER_IN;
