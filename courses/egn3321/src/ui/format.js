/** Three significant figures, four when the first digit is 1. */
export function fig(x) {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const ax = Math.abs(x);
  const exp = Math.floor(Math.log10(ax) + 1e-12);
  const lead = Math.floor(ax / 10 ** exp + 1e-9);
  const n = lead === 1 ? 4 : 3;
  if (ax >= 0.01 && ax < 1e5) return String(Number(x.toPrecision(n)));
  return x.toExponential(n - 1);
}
