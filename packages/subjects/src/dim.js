/**
 * Dimensional analysis shared by the subject libraries. A dimension is the exponent
 * vector [M, L, T, I]. Each library passes its own unit table and the names it prints.
 */

export const ZERO = [0, 0, 0, 0];

export const dimMul = (a, b) => a.map((x, i) => x + b[i]);
export const dimDiv = (a, b) => a.map((x, i) => x - b[i]);
export const dimScale = (a, n) => a.map((x) => x * n);
const mul = dimMul;
const div = dimDiv;
const scale = dimScale;

export const dimEqual = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-9);
export const isDimensionless = (a) => dimEqual(a, ZERO);

const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁻': '-' };
const SUP_OUT = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '.': '·' };
const sup = (n) => [...String(n)].map((c) => SUP_OUT[c] ?? c).join('');

/**
 * @param {{ units: Record<string, number[]>, named: string[] }} tables
 */
export function createDim({ units, named }) {
  /**
   * "N·m²/C²" → [1, 3, -4, -2]. Understands ·, *, a space, /, parentheses, and exponents written
   * `^2` or `²`. A `/` divides by the one factor that follows it, so "N/(C·m²)" groups as written.
   * @param {unknown} src
   */
  function parseUnit(src) {
    const s = String(src ?? '')
      .replace(/[⁰¹²³⁴⁵⁶⁻]/g, (ch) => (ch === '⁻' ? '^-' : `^${SUP[ch]}`))
      .replace(/·|\*/g, ' ')
      .trim();
    if (!s) return ZERO;
    const toks = [...s.matchAll(/\s*([A-Za-zΩ]+(?:\^-?\d+(?:\.\d+)?)?|1|\(|\)|\/)/g)].map((m) => m[1]);
    if (!toks.length) throw new Error(`Unit "${src}": nothing to read`);
    let i = 0;

    function factor() {
      const t = toks[i++];
      if (t === undefined) throw new Error(`Unit "${src}": ends too early`);
      if (t === '(') {
        const d = group();
        if (toks[i++] !== ')') throw new Error(`Unit "${src}": missing )`);
        return d;
      }
      const m = /^([A-Za-zΩ]+|1)(?:\^(-?\d+(?:\.\d+)?))?$/.exec(t);
      if (!m) throw new Error(`Unit "${src}": cannot read "${t}"`);
      const base = units[m[1]];
      if (!base) throw new Error(`Unit "${src}": unknown unit "${m[1]}"`);
      return scale(base, m[2] ? Number(m[2]) : 1);
    }

    function group() {
      let dim = ZERO;
      let first = true;
      while (i < toks.length && toks[i] !== ')') {
        if (toks[i] === '/') {
          i++;
          dim = div(dim, factor());
        } else {
          dim = first ? factor() : mul(dim, factor());
        }
        first = false;
      }
      return dim;
    }

    const dim = group();
    if (i !== toks.length) throw new Error(`Unit "${src}": cannot read "${toks.slice(i).join(' ')}"`);
    return dim;
  }

  /** A dimension as the shortest readable unit: a named one when it fits, else kg·m²/(A·s³). */
  function formatDim(dim) {
    if (isDimensionless(dim)) return 'dimensionless';
    for (const name of named) {
      if (dimEqual(dim, parseUnit(name))) return name;
    }
    const names = ['kg', 'm', 's', 'A'];
    const top = [];
    const bottom = [];
    dim.forEach((e, idx) => {
      if (Math.abs(e) < 1e-9) return;
      const p = Math.abs(e) === 1 ? names[idx] : `${names[idx]}${sup(Math.abs(e))}`;
      (e > 0 ? top : bottom).push(p);
    });
    const num = top.join('·') || '1';
    return bottom.length ? `${num}/${bottom.length > 1 ? `(${bottom.join('·')})` : bottom[0]}` : num;
  }

  return { parseUnit, formatDim };
}
