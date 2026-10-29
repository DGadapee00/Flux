/**
 * Sections for the shear labs. The rectangle and the I are round sizes chosen
 * so the two methods meet. The three boards are dressed 2×6s laid flat, 5.5 in by 1.5 in by PS 20.
 * The shear and the nail capacity are assumed.
 * The garage header lives in header.js and is the cited beam.
 */

import { M_PER_IN } from '@flux/subjects/convert.js';

export const RECT_B = 0.04;
export const RECT_H = 0.08;
export const RECT_V = 10e3;

export const EYE_BF = 0.12;
export const EYE_TF = 0.01;
export const EYE_TW = 0.006;
export const EYE_HW = 0.16;
export const EYE_V = 20e3;

export const BOARD_B = 5.5 * M_PER_IN;
export const BOARD_T = 1.5 * M_PER_IN;
export const BOARD_N = 3;
export const BOARD_V = 3e3;
export const BOARD_LINES = 2;
export const BOARD_F = 500;
