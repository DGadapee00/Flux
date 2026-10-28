/**
 * A 20 lb propane cylinder used as the application lab.
 * Manchester Tank model 10504: 12.2 in outside diameter, DOT-4BA240.
 * 49 CFR 178.51: for an outside diameter over 6 in, the minimum wall is 0.078 in.
 * The 240 in the specification name is the service pressure in psig.
 * The thickness here is that minimum, not a measured wall.
 */
import { M_PER_IN, PA_PER_PSI } from '@flux/subjects/convert.js';

export const TANK_OD_IN = 12.2;
export const TANK_T_IN = 0.078;
export const TANK_P_PSI = 240;
export const TANK_R = (TANK_OD_IN / 2 - TANK_T_IN) * M_PER_IN;
export const TANK_T = TANK_T_IN * M_PER_IN;
export const TANK_P = TANK_P_PSI * PA_PER_PSI;
