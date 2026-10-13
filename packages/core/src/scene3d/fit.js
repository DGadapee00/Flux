/**
 * Same 1 / 2 / 2.5 / 5 × 10ⁿ step the math library uses. Duplicated here so core
 * does not import a subject. Courses pass their own fitScale into configureFrame.
 */
const NICE = [1, 2, 2.5, 5];

export function fitScale(extent, fit = 3.4) {
  const want = Math.max(1e-12, extent) / fit;
  const dec = 10 ** Math.floor(Math.log10(want));
  for (const n of NICE) if (n * dec >= want * (1 - 1e-9)) return 1 / (n * dec);
  return 1 / (10 * dec);
}
