/**
 * The grid step a lab uses to frame a domain: the smallest 1 / 2 / 2.5 / 5 × 10ⁿ
 * that puts `extent` inside `fit` squares. `fit` defaults to 3.4, the shared fit width.
 */
const NICE = [1, 2, 2.5, 5];

export function unitsPerTick(extent, fit = 3.4) {
  const want = Math.max(1e-12, extent) / fit;
  const dec = 10 ** Math.floor(Math.log10(want));
  for (const n of NICE) if (n * dec >= want * (1 - 1e-9)) return n * dec;
  return 10 * dec;
}

/** Same step, under the name the metre scenes use. */
export const metersPerUnit = unitsPerTick;

export function fitScale(extent, fit = 3.4) {
  return 1 / unitsPerTick(extent, fit);
}
