/** Number formatters that name no quantity. A course's own fmt* functions build on these. */

export function sciHTML(x, digits = 2) {
  if (!Number.isFinite(x)) return '—';
  if (Math.abs(x) < 1e-18) return '0';
  const [m, e] = Number(x).toExponential(digits).split('e');
  const exp = Number(e);
  const mant = m.replace(/\.?0+$/, '');
  return `${mant}×10<sup>${exp}</sup>`;
}

/** Scientific notation as TeX, for prose that needs a number inside math: 2.3\times10^{-4}. */
export function sciTex(x, digits = 2) {
  if (!Number.isFinite(x)) return '-';
  if (Math.abs(x) < 1e-18) return '0';
  const [m, e] = Number(x).toExponential(digits).split('e');
  return `${Number(m)}\\times 10^{${Number(e)}}`;
}

const SUPS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

/** Plain-text scientific notation as a person writes it: 3.14 × 10⁻⁷, not 3.14e-7. */
export function sciText(x, digits = 2) {
  if (!Number.isFinite(x)) return '—';
  if (Math.abs(x) < 1e-18) return '0';
  const [m, e] = Number(x).toExponential(digits).split('e');
  return `${m} × 10${String(Number(e)).replace(/./g, (c) => SUPS[c])}`;
}

export function signedSci(x, digits = 2) {
  if (!Number.isFinite(x)) return '—';
  if (Math.abs(x) < 1e-18) return '0';
  const sign = x < 0 ? '−' : '';
  return sign + sciHTML(Math.abs(x), digits);
}
