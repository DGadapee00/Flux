/**
 * An imager in orbit: what one pixel covers on the ground, and what the aperture can resolve. Our
 * own model, after MIT 16.851 Lecture 6.
 *
 * Looking straight down from height h through a telescope of focal length f, a pixel of pitch p covers
 * the ground sample distance GSD = h p / f, and N pixels cover a swath N h p / f. The aperture D
 * blurs every point into an Airy pattern whose first dark ring lies at sin θ = j₁ λ/(π D), with
 * j₁ = 3.8317… the first zero of the Bessel function J₁; two points closer than that are not resolved
 * (the Rayleigh criterion, θ ≈ 1.22 λ/D). On the ground that is h θ. The ratio Q = λ f/(D p)
 * compares the two: below about 2 the pixels are coarser than the optics; above it, smaller pixels
 * add no detail.
 *
 * Closed form: the Rayleigh angle from the tabulated zero j₁ = 3.8317059702. Second method: find the
 * zero itself, evaluating J₁ from its integral J₁(x) = (1/π)∫₀^π cos(τ − x sin τ) dτ by Simpson's rule
 * and bisecting between 3 and 4.5.
 */
export const J1_ZERO = 3.8317059702;

/** J₁(x) by its integral representation, Simpson's rule on n intervals. */
export function besselJ1(x, n = 400) {
  const h = Math.PI / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const t = i * h;
    s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * Math.cos(t - x * Math.sin(t));
  }
  return (s * h) / 3 / Math.PI;
}

/** The first zero of J₁ by bisection. */
export function firstZero(tol = 1e-13) {
  let lo = 3;
  let hi = 4.5;
  let flo = besselJ1(lo);
  while (hi - lo > tol) {
    const mid = (lo + hi) / 2;
    const fm = besselJ1(mid);
    if (Math.sign(fm) === Math.sign(flo)) {
      lo = mid;
      flo = fm;
    } else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Closed form. h in km, D in cm, f in mm, p in µm, λ in nm. Ground lengths in m. */
export function imagerClosed({ hkm, Dcm, fmm, pum, lamnm, N, bits }) {
  const h = hkm * 1e3;
  const D = Dcm / 100;
  const f = fmm / 1000;
  const p = pum * 1e-6;
  const lam = lamnm * 1e-9;
  const gsd = (h * p) / f;
  const theta = Math.asin((J1_ZERO * lam) / (Math.PI * D));
  const spot = h * Math.tan(theta);
  return {
    gsd,
    theta,
    spot,
    resolves: Math.max(gsd, spot),
    limit: spot > gsd ? 'optics' : 'pixels',
    Q: (lam * f) / (D * p),
    swath: (N * h * p) / f / 1000, // km
    fnum: f / D,
    imageMbit: (N * N * bits) / 1e6,
  };
}

/** Both methods: the Rayleigh spot from the tabulated zero and from the zero found numerically. */
export function imagerChecked(state) {
  const c = imagerClosed(state);
  const z = firstZero();
  const theta = Math.asin((z * state.lamnm * 1e-9) / (Math.PI * (state.Dcm / 100)));
  const spotNum = state.hkm * 1e3 * Math.tan(theta);
  return { ...c, zero: z, spotNum, gap: Math.abs(spotNum - c.spot) / c.spot };
}
