/** A uniformly deck-loaded, flexible cable is parabolic. L is horizontal span,
 * d is sag below equal supports. y=4d x²/L² (arbitrary vertical origin).
 * Integrating sqrt(1+(8d x/L²)²) gives L/2 [sqrt(1+k²)+asinh(k)/k], k=4d/L.
 * No tension or strength is inferred from this geometric model. */
export function parabolicCable(L, d, n = 16) {
  if (!(Number.isFinite(L) && L > 0 && Number.isFinite(d) && d >= 0 && Number.isInteger(n) && n >= 2))
    throw new RangeError('Positive span, nonnegative sag and at least two segments required');
  const k = (4 * d) / L;
  const length =
    k < 1e-6 ? L * (1 + (k * k) / 6 - k ** 4 / 40) : (L / 2) * (Math.hypot(1, k) + Math.asinh(k) / k);
  const y = (x) => (4 * d * x * x) / (L * L);
  let polygon = 0;
  for (let i = 0; i < n; i++) {
    const a = -L / 2 + (i * L) / n,
      b = a + L / n;
    polygon += Math.hypot(b - a, y(b) - y(a));
  }
  return { length, polygon, error: Math.max(0, length - polygon), extra: length - L, slope: k };
}
