/** Cylinder with fixed volume V and k circular ends. V and r share a coherent length unit.
 * Eliminate h=V/(πr²), giving A(r)=2V/r+kπr². Positive A″ proves the stationary radius is the global minimum. */
export function cylinderDesign(V, r, k = 2) {
  if (!(V > 0 && r > 0 && (k === 1 || k === 2)))
    throw new RangeError('Positive volume/radius and one or two ends required');
  const h = V / (Math.PI * r * r),
    optR = Math.cbrt(V / (k * Math.PI)),
    minArea = 3 * k * Math.PI * optR * optR;
  const area = (2 * V) / r + k * Math.PI * r * r;
  return {
    h,
    area,
    optR,
    optH: k * optR,
    minArea,
    slope: (-2 * V) / (r * r) + 2 * k * Math.PI * r,
    curvature: (4 * V) / r ** 3 + 2 * k * Math.PI,
    excess: Math.max(0,100 * (area / minArea - 1)),
  };
}
