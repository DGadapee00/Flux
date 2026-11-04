import assert from 'node:assert/strict';
import test from 'node:test';
import { integrate } from '../src/math/ode.js';
import { simpson } from '../src/math/quadrature.js';
import {
  exactCubic, factorQuadratic, homogeneousRatio, bernoulliSquare, twoTanks, building, linearDrag, quadraticDrag,
  secantForced, repeatedForced, thirdOrderSecant, cauchyEuler, reductionExample, higherOrder, basisFromRoots,
  wronskian, polyFromRoots, transformRules,
} from '../src/math/ode-methods.js';

const close = (a, b, tol = 1e-7) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const rk = (f, t0, y0, t1, n = 2000) => integrate(f, t0, y0, t1, n).end;

test('exact and integrating-factor level curves match the slope equation', () => {
  close(exactCubic.My(1.3), exactCubic.Nx(1.3), 0);
  close(exactCubic.solve(0, 1, 1.5), rk((x, y) => -exactCubic.M(x, y) / exactCubic.N(x, y), 0, 1, 1.5));
  // μ=x makes it exact: ∂(xM)/∂y = x M_y and ∂(xN)/∂x = N + x N_x agree everywhere.
  for (const [x, y] of [[2, 1], [0.7, -1.3]]) close(x * factorQuadratic.My(x, y), factorQuadratic.N(x, y) + x * factorQuadratic.Nx(x, y), 1e-12);
  assert.notEqual(factorQuadratic.My(2, 1), factorQuadratic.Nx(2, 1));
  close(factorQuadratic.solve(1, 1, 2), rk((x, y) => -factorQuadratic.M(x, y) / factorQuadratic.N(x, y), 1, 1, 2));
  close(factorQuadratic.solve(1, 1, 2), 0.179449471770337, 1e-9);
});

test('homogeneous and Bernoulli substitutions match RK4', () => {
  close(homogeneousRatio.solve(1, 1, 2), 2 * Math.sqrt(1 + 2 * Math.log(2)), 1e-12);
  close(homogeneousRatio.solve(1, 1, 2), rk(homogeneousRatio.f, 1, 1, 2));
  close(bernoulliSquare.solve(1, 1, 1.5), 1 / 0.75, 1e-12);
  close(bernoulliSquare.solve(1, 1, 1.5), rk(bernoulliSquare.f, 1, 1, 1.5));
  close(bernoulliSquare.pole(1, 1), 2, 0);
});

test('tanks, building and drag closed forms match RK4', () => {
  const tk = twoTanks(5, 100, 50, 20, 0, 12);
  const n = rk((t, [a, b]) => [-5 * a / 100, 5 * a / 100 - 5 * b / 50], 0, [20, 0], 12);
  close(tk.a, n[0]); close(tk.b, n[1]);
  close(tk.peak, Math.log(2) / 0.05, 1e-12);
  const eq = twoTanks(5, 50, 50, 20, 0, 3), ne = rk((t, [a, b]) => [-a / 10, a / 10 - b / 10], 0, [20, 0], 3);
  close(eq.b, ne[1]);
  const w = 2 * Math.PI / 24, bd = building(0.2, 10, 8, 2, w, 15, 30);
  close(bd.T, rk((t, T) => 0.2 * (10 - 8 * Math.cos(w * t) - T) + 2, 0, 15, 30, 4000));
  const ld = linearDrag(2, 0.5, 9.81, 0, 4), ln = rk((t, [x, v]) => [v, 9.81 - 0.5 * v / 2], 0, [0, 0], 4);
  close(ld.v, ln[1]); close(ld.x, ln[0]);
  const qd = quadraticDrag(80, 0.25, 9.81, 10, 6), qn = rk((t, [x, v]) => [v, 9.81 - 0.25 * v * v / 80], 0, [0, 10], 6);
  close(qd.v, qn[1]); close(qd.x, qn[0]);
});

test('variation of parameters closed forms match RK4', () => {
  const s = secantForced(1, -0.5, 1.2), sn = rk((t, [y, v]) => [v, 1 / Math.cos(t) - y], 0, [1, -0.5], 1.2, 4000);
  close(s.y, sn[0]); close(s.v, sn[1]);
  const r = repeatedForced(1, 2, 0, 2.5), rn = rk((t, [y, v]) => [v, Math.exp(t) / t + 2 * v - y], 1, [2, 0], 2.5, 4000);
  close(r.y, rn[0]); close(r.v, rn[1]);
  const th = thirdOrderSecant(1.1), tn = rk((t, [y, v, a]) => [v, a, 1 / Math.cos(t) - v], 0, [0, 0, 0], 1.1, 4000);
  close(th.y, tn[0]); close(th.v, tn[1]);
  // The kernel integral is a third route to the same particular solution.
  close(th.y, simpson((u) => (1 - Math.cos(1.1 - u)) / Math.cos(u), 0, 1.1));
});

test('Cauchy–Euler root cases and reduction of order match RK4 in x', () => {
  for (const [a, b] of [[-2, 2], [-1, 1], [1, 4]]) {
    const ce = cauchyEuler(a, b, 1, 1, 0.5, 3), n = rk((x, [y, v]) => [v, (-a * x * v - b * y) / (x * x)], 1, [1, 0.5], 3, 4000);
    close(ce.y, n[0]); close(ce.v, n[1]);
  }
  assert.equal(cauchyEuler(-2, 2, 1, 1, 0, 2).kind, 'distinct');
  assert.equal(cauchyEuler(-1, 1, 1, 1, 0, 2).kind, 'repeated');
  assert.equal(cauchyEuler(1, 4, 1, 1, 0, 2).kind, 'complex');
  const rd = reductionExample(1, 2, 1, 2.5), rn = rk((x, [y, v]) => [v, ((x + 1) * v - y) / x], 1, [2, 1], 2.5, 4000);
  close(rd.y, rn[0]); close(rd.v, rn[1]);
});

test('higher-order bases, Wronskians and annihilator trials', () => {
  const roots = [{ re: -1, m: 1 }, { re: -1, im: 2, m: 1 }];
  assert.deepEqual(polyFromRoots(roots), [1, 3, 7, 5]);
  const h = higherOrder(roots, [1, 0, 0], 2), n = rk((t, [y, v, a]) => [v, a, -3 * a - 7 * v - 5 * y], 0, [1, 0, 0], 2, 4000);
  close(h.y, n[0]); close(h.derivs[2], n[2]);
  // Abel: W(t)=W(0)e^(−a_{n−1}t).
  const B = basisFromRoots(roots);
  close(wronskian(B, 1.3), wronskian(B, 0) * Math.exp(-3 * 1.3), 1e-9);
  const four = higherOrder([{ re: 0, im: 1, m: 2 }], [0, 1, 0, 0], 3), fn = rk((t, [y, v, a, j]) => [v, a, j, -2 * a - y], 0, [0, 1, 0, 0], 3, 4000);
  close(four.y, fn[0]);
  // y‴+y′=2t+3e^(−t): the annihilator D²(D+1) gives y_p=t²−1.5e^(−t).
  const yp = (j, t) => [t * t - 1.5 * Math.exp(-t), 2 * t + 1.5 * Math.exp(-t), 2 - 1.5 * Math.exp(-t)][j];
  const an = higherOrder([{ re: 0, m: 1 }, { re: 0, im: 1, m: 1 }], [0, 0, 0], 2, yp);
  const ann = rk((t, [y, v, a]) => [v, a, 2 * t + 3 * Math.exp(-t) - v], 0, [0, 0, 0], 2, 4000);
  close(an.y, ann[0]);
});

test('transform rules match direct quadrature of the Laplace integral', () => {
  const cases = [['tsin', { b: 2 }, 1.5], ['tnexp', { n: 3, a: -0.5 }, 1], ['shiftcos', { a: -1, b: 3 }, 0.5], ['delayed', { c: 1 }, 2], ['square', { T: 2 }, 1]];
  for (const [id, p, s] of cases) {
    const r = transformRules[id], end = 60 / (s - r.abscissa(p)), cuts = [0, ...(r.breaks?.(p, end) || []).filter((x) => x < end), end];
    let num = 0;
    for (let i = 1; i < cuts.length; i++) num += simpson((t) => Math.exp(-s * t) * r.f(t, p), cuts[i - 1], cuts[i], 1e-11);
    close(r.F(s, p), num, 1e-6);
  }
});
