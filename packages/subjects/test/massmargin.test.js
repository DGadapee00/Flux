/**
 * The mass budget's closed form against the binned convolution, and the convolution's chance of
 * exceeding the allocation against a seeded Monte Carlo draw of the Beta growths.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { GROWTH, growth, marginChecked, marginClosed, marginNumeric } from '../src/design/massmargin.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

const BUS = [['Structure', 1.6], ['Power', 2.0], ['Attitude control', 1.2], ['Radio', 0.5], ['Flight computer', 0.3], ['Harness', 0.6], ['Thermal', 0.3]];
const craft = (bus, payload, pay = 3) => [...BUS.map(([name, basic]) => ({ name, basic, maturity: bus })), { name: 'Payload', basic: pay, maturity: payload }];

/** Park–Miller with a fixed seed, so the draw is the same every run. */
function rng(seed) {
  let s = seed;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
}
/** Gamma(k, 1) by Marsaglia and Tsang, for k ≥ 1. */
function gamma(k, u) {
  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x;
    let v;
    do {
      x = Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const w = u();
    if (Math.log(w) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v;
  }
}

test('growth: the mean is the maturity’s, and α = 10 sets the spread', () => {
  for (const [m, mu] of Object.entries(GROWTH)) {
    const g = growth(m);
    close(g.a / (g.a + g.b), mu, 1e-12, `${m} mean`);
  }
  assert.ok(growth('new').sd > growth('catalog').sd, 'a newer design spreads wider');
});

test('budget: a flat 20% on 9.5 kg predicts 11.4 kg and leaves 0.6 kg under 12 kg', () => {
  const c = marginClosed(craft('catalog', 'new'), 0.2, 12);
  close(c.basic, 9.5, 1e-12, 'basic');
  close(c.predicted, 11.4, 1e-12, 'predicted');
  close(c.margin, 0.6, 1e-12, 'margin');
  close(c.mean, 6.5 * 1.05 + 3 * 1.3, 1e-12, 'expected finished mass');
});

test('closed form against the convolution, for every maturity mix', () => {
  for (const bus of Object.keys(GROWTH)) {
    for (const payload of Object.keys(GROWTH)) {
      const c = marginChecked(craft(bus, payload), 0.2, 12);
      assert.ok(c.gap < 1e-4, `${bus}/${payload}: gap ${c.gap}`);
    }
  }
});

test('the chance of exceeding: convolution against a seeded Monte Carlo draw', () => {
  for (const [bus, payload, pay] of [['new', 'new', 3], ['catalog', 'new', 4], ['modified', 'new', 3.5]]) {
    const items = craft(bus, payload, pay);
    const n = marginNumeric(items, 12, 0.004);
    const u = rng(20261115);
    const N = 100000;
    let over = 0;
    for (let i = 0; i < N; i++) {
      let m = 0;
      for (const it of items) {
        const g = growth(it.maturity);
        const x = gamma(g.a, u);
        const y = gamma(g.b, u);
        m += it.basic * (1 + x / (x + y));
      }
      if (m > 12) over++;
    }
    // Three standard errors of a proportion near one half is about 0.005.
    close(n.pExceed, over / N, 0.006, `${bus}/${payload} ${pay} kg`);
  }
});

test('the normal curve only estimates the skewed sum', () => {
  const c = marginChecked(craft('catalog', 'new', 4), 0.2, 12);
  assert.ok(Math.abs(c.pNormal - c.pExceed) > 0.01, `normal ${c.pNormal}, convolved ${c.pExceed}`);
});
