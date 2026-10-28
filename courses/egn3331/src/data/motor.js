/**
 * Baldor EM3615T-5 nameplate, and the NEMA 184T shaft extension it is built on.
 * Catalog: 5 hp, 1750 rpm, shaft diameter 1.125 in.
 * https://www.baldor.com/catalog/EM3615T-5
 * NEMA MG 1 frame 184T: U = 1.125 in, usable extension N-W = 2.75 in.
 * https://datatool.pumps.org/piping-materials-iv/motor-frame-dimension-ref-tool
 *
 * The catalog does not name the shaft steel. E is the AISC value for steel.
 * Poisson's ratio is assumed, and stated wherever the modulus is used.
 */
import {
  FT_LBF_PER_S_PER_HP, M_PER_FT, M_PER_IN, N_PER_LBF, PA_PER_PSI,
} from '@flux/subjects/convert.js';
import { roundShaft, torqueFromHorsepower, torqueFromPower } from '@flux/subjects/mechanics/torsion.js';

export const MOTOR_HP = 5;
export const MOTOR_RPM = 1750;
export const MOTOR_D_IN = 1.125;
export const MOTOR_L_IN = 2.75;
export const MOTOR_E_KSI = 29000;
export const MOTOR_NU = 0.3;

export const HP_WATT = FT_LBF_PER_S_PER_HP * N_PER_LBF * M_PER_FT;

/** Shear modulus from the assumed E and ν, in pascals. */
export function motorG() {
  return (MOTOR_E_KSI * 1000 * PA_PER_PSI) / (2 * (1 + MOTOR_NU));
}

/**
 * Stress and angle in ksi and degrees, from lbf·in and inches.
 * This path does not build the pascal stress first.
 */
export function motorInches(hp, rpm, dIn = MOTOR_D_IN, lIn = MOTOR_L_IN) {
  const drive = torqueFromHorsepower(hp, rpm);
  const J = (Math.PI / 32) * dIn ** 4;
  const Gpsi = (MOTOR_E_KSI * 1000) / (2 * (1 + MOTOR_NU));
  const tauPsi = (drive.T_lbf_in * (dIn / 2)) / J;
  const phi = (drive.T_lbf_in * lIn) / (Gpsi * J);
  return { tauKsi: tauPsi / 1000, phiDeg: (phi * 180) / Math.PI, TLbfIn: drive.T_lbf_in };
}

/** The same shaft in SI. The gap is the inch path against this one, and watts against horsepower. */
export function motorShaft(hp, rpm, dIn = MOTOR_D_IN, lIn = MOTOR_L_IN) {
  const drive = torqueFromHorsepower(hp, rpm);
  const shaft = roundShaft(drive.T, lIn * M_PER_IN, motorG(), dIn * M_PER_IN, 0);
  const back = torqueFromPower(hp * HP_WATT, rpm).T;
  const inch = motorInches(hp, rpm, dIn, lIn);
  const tauInch = inch.tauKsi * 1000 * PA_PER_PSI;
  const phiInch = (inch.phiDeg * Math.PI) / 180;
  const gapT = Math.abs(back - drive.T) / Math.max(Math.abs(drive.T), 1);
  const gapTau = Math.abs(tauInch - shaft.tauMax) / Math.max(Math.abs(shaft.tauMax), 1);
  const gapPhi = Math.abs(phiInch - shaft.phi) / Math.max(Math.abs(shaft.phi), 1e-18);
  return { ...shaft, T: drive.T, gap: Math.max(shaft.gap, gapT, gapTau, gapPhi) };
}
