/**
 * A sum written the way it would be by hand: `2x^2 - y^2 + 3`, never `2x^2 + -1y^2 + 0`.
 *
 * `parts` is a list of [coefficient, TeX for the variable part]; an empty variable part is a bare
 * constant. Zero coefficients drop out entirely, a coefficient of ±1 in front of a variable loses
 * its 1, and a negative coefficient becomes a minus sign rather than a `+ -`.
 *
 * The labs title themselves with this, so a scenario whose constant term is 0 — which is every
 * scenario in the repo — does not read `f(x,y) = x + y + 0`.
 */
export function sumTex(parts) {
  let out = '';
  for (const [c, sym = ''] of parts) {
    if (!Number.isFinite(c) || c === 0) continue;
    const mag = Math.abs(c);
    const num = sym && mag === 1 ? '' : String(mag);
    if (!out) out += (c < 0 ? '-' : '') + num + sym;
    else out += ` ${c < 0 ? '-' : '+'} ${num}${sym}`;
  }
  return out || '0';
}
