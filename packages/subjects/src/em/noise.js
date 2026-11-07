/**
 * Thermal noise and the signal-to-noise ratio of a receiver (the satellite's Communications
 * subsystem).
 *
 * A resistor at temperature T can deliver noise power k_B T in every hertz of bandwidth, whatever
 * its resistance. A receiver is rated by its system noise temperature T_sys, so the noise in its
 * bandwidth B is N = k_B T_sys B. A signal of power S is read when S/N is large enough; per bit, at
 * rate R_b, E_b/N_0 = S/(k_B T_sys R_b). For binary phase-shift keying the bit error rate is
 * ½ erfc(√(E_b/N_0)).
 *
 * The second method makes the noise: seeded Gaussian samples with two-sided density k_B T/2 at a
 * sample rate of 8B, cut to the band by FFT, and their mean square measured over 32 records.
 */
export const K_B = 1.380649e-23; // J/K

export const dBm = (watts) => 10 * Math.log10(watts / 1e-3);
export const fromDBm = (d) => 1e-3 * 10 ** (d / 10);
export const dB = (ratio) => 10 * Math.log10(ratio);

/** The link's numbers in closed form. Pr in dBm, T in K, B and Rb in Hz. */
export function link({ Pr, T, B, Rb = B }) {
  const S = fromDBm(Pr);
  const N = K_B * T * B;
  const N0 = K_B * T;
  const snr = S / N;
  const ebn0 = S / (N0 * Rb);
  return { S, N, N0, snr, snrDB: dB(snr), ebn0, ebn0DB: dB(ebn0), noiseDBm: dBm(N), ber: 0.5 * erfc(Math.sqrt(ebn0)) };
}

const N_FFT = 4096;
const RECORDS = 32;

/** White noise of density k_B T, cut to bandwidth B by FFT; the measured power and one record. */
export function measureNoise({ T, B }, seed = 2026) {
  const fs = 8 * B;
  const sigma = Math.sqrt((K_B * T * fs) / 2);
  const rand = mulberry32(seed);
  const gauss = () => {
    const u = Math.max(rand(), 1e-300);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
  const K = Math.round((N_FFT * B) / fs); // bins inside the band, each side
  let sum = 0;
  let first = null;
  for (let r = 0; r < RECORDS; r++) {
    const re = new Float64Array(N_FFT);
    const im = new Float64Array(N_FFT);
    for (let i = 0; i < N_FFT; i++) re[i] = sigma * gauss();
    fft(re, im, false);
    for (let k = 0; k < N_FFT; k++) {
      const f = Math.min(k, N_FFT - k);
      if (f > K) {
        re[k] = 0;
        im[k] = 0;
      }
    }
    fft(re, im, true);
    let ms = 0;
    for (let i = 0; i < N_FFT; i++) ms += re[i] * re[i];
    sum += ms / N_FFT;
    if (!first) first = Array.from(re.subarray(0, 256));
  }
  return { power: sum / RECORDS, fs, bins: K, records: RECORDS, samples: first };
}

/** In-place radix-2 FFT; the inverse divides by N. */
export function fft(re, im, inverse) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const a = i + j;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < n; i++) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

/** erfc to about 1e-7 relative (Numerical Recipes' Chebyshev fit). */
export function erfc(x) {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
