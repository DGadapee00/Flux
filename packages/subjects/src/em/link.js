/**
 * The link budget of a satellite downlink, in watts and in decibels (the satellite's Communications
 * subsystem).
 *
 * Power P_t leaves an antenna of gain G_t and spreads over a sphere, so a dish of effective area A_e
 * at range d catches P_t G_t A_e/(4πd²). With A_e = G_r λ²/4π that is the Friis equation,
 *   P_r = P_t G_t G_r (λ/4πd)²,
 * and the last factor is the free-space path loss. A dish of diameter D and efficiency η has
 * G = η(πD/λ)². Against the receiver's noise density N_0 = k_B T_sys, a bit stream at R_b has
 *   E_b/N_0 = P_r/(k_B T_sys R_b),
 * and the link closes with margin when that exceeds what the modulation needs: about 10.5 dB for
 * one error in a million with binary phase-shift keying.
 *
 * The budget is computed twice: multiplying watts and ratios, and adding decibels term by term.
 */
import { K_B } from './noise.js';

export const C_LIGHT = 299792458; // m/s
export const BANDS = {
  uhf: { name: 'UHF, 437 MHz', f: 437e6 },
  s: { name: 'S band, 2.2 GHz', f: 2.2e9 },
  x: { name: 'X band, 8.4 GHz', f: 8.4e9 },
};
export const ETA = 0.55;
export const REQUIRED_DB = 10.5;

const dB = (x) => 10 * Math.log10(x);

export const dishGain = (D, lambda, eta = ETA) => eta * ((Math.PI * D) / lambda) ** 2;

/** Pt in W, GtdBi in dBi, Dr in m, d in m, T in K, Rb in bit/s. */
export function linkBudget({ band, Pt, GtdBi, Dr, d, T, Rb }) {
  const lambda = C_LIGHT / BANDS[band].f;
  // Route 1: watts and plain ratios.
  const Gt = 10 ** (GtdBi / 10);
  const Gr = dishGain(Dr, lambda);
  const path = (lambda / (4 * Math.PI * d)) ** 2;
  const Pr = Pt * Gt * Gr * path;
  const ebn0 = Pr / (K_B * T * Rb);
  // Route 2: decibels, term by term.
  const terms = {
    PtdBW: dB(Pt),
    Gt: GtdBi,
    loss: 20 * Math.log10((4 * Math.PI * d) / lambda),
    Gr: 10 * Math.log10(ETA) + 20 * Math.log10((Math.PI * Dr) / lambda),
  };
  const PrdBW = terms.PtdBW + terms.Gt - terms.loss + terms.Gr;
  const N0dBW = 10 * Math.log10(K_B) + 10 * Math.log10(T);
  const ebn0dB = PrdBW - N0dBW - 10 * Math.log10(Rb);
  const gap = Math.max(Math.abs(dB(Pr) - PrdBW), Math.abs(dB(ebn0) - ebn0dB)) / Math.max(1, Math.abs(PrdBW));
  return { lambda, Gr, Pr, ebn0, terms, PrdBW, N0dBW, ebn0dB, margin: ebn0dB - REQUIRED_DB, closes: ebn0dB >= REQUIRED_DB, gap };
}
