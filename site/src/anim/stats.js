/**
 * Seeded normal samples, their histogram, and the normal curve that should
 * settle over the bars. The seed is fixed so the picture and the tests agree.
 */

const SEED = 20261013;
const N = 80;
const MEAN = 0;
const SD = 1;
const X0 = -3;
const X1 = 3;
const BINS = 12;

/**
 * @param {number} seed
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {() => number} rand
 */
function normalSample(rand) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Standard normal density.
 * @param {number} x
 */
export function normalPdf(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function statsScene() {
  const rand = mulberry32(SEED);
  const samples = [];
  for (let i = 0; i < N; i += 1) samples.push(MEAN + SD * normalSample(rand));
  const width = (X1 - X0) / BINS;
  const counts = Array(BINS).fill(0);
  for (const sample of samples) {
    const index = Math.floor((sample - X0) / width);
    if (index >= 0 && index < BINS) counts[index] += 1;
  }
  const curve = [];
  const steps = 64;
  for (let i = 0; i <= steps; i += 1) {
    const x = X0 + ((X1 - X0) * i) / steps;
    curve.push({ x, y: N * width * normalPdf((x - MEAN) / SD) / SD });
  }
  return { samples, counts, width, x0: X0, x1: X1, curve, n: N };
}
