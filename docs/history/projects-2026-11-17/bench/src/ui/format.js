/** Three significant figures, four when the first digit is 1. */
export function fig(x) {
  if (!Number.isFinite(x)) return '—';
  // Roundoff at a dead centre or an intersection is not a speed a student should read.
  if (Math.abs(x) < 1e-8) return '0';
  const ax = Math.abs(x);
  const exp = Math.floor(Math.log10(ax) + 1e-12);
  const lead = Math.floor(ax / 10 ** exp + 1e-9);
  const n = lead === 1 ? 4 : 3;
  if (ax >= 0.01 && ax < 1e5) return String(Number(x.toPrecision(n)));
  return x.toExponential(n - 1);
}

/** A value with an SI prefix and the figures above: 1.56 mA, 2.2 kΩ, 10 MΩ. */
export function si(x, unit) {
  if (!Number.isFinite(x)) return '—';
  if (Math.abs(x) < 1e-12) return `0 ${unit}`;
  const P = [[1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n']];
  const a = Math.abs(x);
  const [f, p] = P.find(([v]) => a >= v * 0.9995) || P[P.length - 1];
  return `${fig(x / f)} ${p}${unit}`;
}
