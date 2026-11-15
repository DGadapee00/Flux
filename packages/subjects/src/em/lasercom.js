/**
 * A laser downlink: a Gaussian beam from orbit falling on a ground telescope. Our own model.
 *
 * A beam leaving with waist radius w₀ spreads at the half-angle θ = λ/(π w₀) (Wikipedia, Gaussian
 * beam); here the waist is taken as half the transmit aperture. Far away, at range d, its radius is
 * w = θ d and its intensity across the beam is a two-dimensional normal with σ = w/2. A telescope of
 * radius r catches the share P₀(1 − e^{−2r²/w²}) when the beam is centred on it (Wikipedia, Gaussian
 * beam). Pointed off by an angle ε, the beam's centre lands s = ε d away, and the share caught is the
 * chance that an offset normal lands inside the aperture.
 *
 * Closed form: that chance as a Poisson-weighted series of gamma functions (pointingbudget.js).
 * Second method: the offset normal integrated over the aperture.
 */
import { insideClosed, insideNumeric } from '../mechanics/pointingbudget.js';

const H = 6.62607015e-34;
const C = 299792458;

/** λ in nm, Dt in mm, P in W, d in km, Dr in cm, ε in µrad, rate in Mbit/s. */
export function laserClosed({ lamnm, Dtmm, PW, dkm, Drcm, epsur, rateMbps }) {
  const lam = lamnm * 1e-9;
  const w0 = Dtmm / 2000;
  const theta = lam / (Math.PI * w0);
  const d = dkm * 1e3;
  const w = theta * d;
  const r = Drcm / 200;
  const s = epsur * 1e-6 * d;
  const centred = -Math.expm1((-2 * r * r) / (w * w));
  const share = insideClosed(s, w / 2, r);
  const Pr = PW * share;
  const photons = (Pr * lam) / (H * C);
  return {
    theta,
    w,
    s,
    centred,
    share,
    Pr,
    dBm: 10 * Math.log10(Pr / 1e-3),
    lossDB: share > 0 ? -10 * Math.log10(share / centred) : Infinity,
    photonsPerBit: photons / (rateMbps * 1e6),
    halfLoss: theta * Math.sqrt(Math.LN2 / 2), // pointing error that costs 3 dB, rad
  };
}

/** Both methods and their relative gap on the share caught. */
export function laserChecked(state) {
  const c = laserClosed(state);
  const num = insideNumeric(c.s, c.w / 2, state.Drcm / 200);
  const gap = c.share > 1e-30 ? Math.abs(num - c.share) / c.share : Math.abs(num);
  return { ...c, shareNum: num, gap };
}
