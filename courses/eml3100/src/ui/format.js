/** Four significant figures, the precision a property table prints. Exponents only below 10⁻⁴. */
export function fig(x) {
  if (!Number.isFinite(x)) return '—';
  if (Math.abs(x) < 1e-12) return '0';
  const ax = Math.abs(x);
  if (ax >= 1e-4 && ax < 1e6) return String(Number(x.toPrecision(4)));
  return x.toExponential(3);
}
