/** Rotate r²/a²+z²/c²≤1 about z. Disk area is πa²(1−z²/c²).
 * The midpoint approximation uses uniform axial slices, not the rendered mesh. */
export function spheroid(a, c, n = 8) {
  if (!(a > 0 && c > 0 && Number.isInteger(n) && n >= 2))
    throw new RangeError('Positive axes and at least two slices required');
  const volume = (4 * Math.PI * a * a * c) / 3,
    dz = (2 * c) / n;
  let midpoint = 0;
  for (let i = 0; i < n; i++) {
    const z = -c + (i + 0.5) * dz;
    midpoint += Math.PI * a * a * (1 - (z * z) / (c * c)) * dz;
  }
  return { volume, midpoint, error: midpoint - volume };
}
