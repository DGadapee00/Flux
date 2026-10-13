/** A line's two numbers agree within 1%: sums by slices come close to a closed form, not exactly. */
export const AGREE = 0.01;

export const agreesHeadless = (pairs) => pairs.every(([a, b]) => Math.abs(a - b) <= AGREE * Math.max(Math.abs(a), Math.abs(b), 1e-300));
