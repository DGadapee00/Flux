/** Thin-lens conjugates. From 1/f=1/u+1/v, v=fu/(u-f) and dv/du=-f²/(u-f)².
 * All distances share one unit. The sensitivity is dimensionless. */
export function focus(f, u) {
  if (!(f > 0 && u > f)) throw new RangeError('A real image needs u > f > 0');
  const v = f * u / (u - f);
  return { v, sensitivity: -f * f / (u - f) ** 2, magnification: -v / u };
}
