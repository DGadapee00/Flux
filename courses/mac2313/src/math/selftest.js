/**
 * Independent checks for the Calc 3 math layer. Nothing is compared against itself:
 * analytic partials vs central differences, ∇f·û vs the difference quotient, steepest-ascent
 * angle vs a 720-step sweep, Fubini order swap, polar-with-Jacobian vs Cartesian.
 *
 * Run: node src/math/selftest.js
 */
import { add, sub, dot, cross, len, normalize, proj, det2, det3 } from './vec.js';
import { dfdx, dfdy, d2fdx2, d2fdy2, d2fdxdy, gradNumeric, dirQuotient, df1Slack } from './ndiff.js';
import { agreeTo, quotientNoise } from './agree.js';
import { simpson, integral2, integralPolar, integralTypeI, integralTypeII, integral3, integralCyl, integralCylCart, integralSph, integralSphCart } from './quadrature.js';
import { SURFACES, evalSurface } from './surfaces.js';
import { directional, steepestAngle, steepestSweep, wrapPi, unitize, dirFromAngle } from './gradient.js';
import { toPolar, toCart, rHat, thetaHat, wrapTau } from './polar.js';
import { CURVES, evalCurve, polylineLength } from './curves.js';
import { hessian, classify } from './extrema.js';
import { chainAlong, gQuotient, chainMap, hQuotientS, hQuotientT, INNERS } from './chain.js';
import { riemannRect, riemannPolar, riemann1d, riemann3 } from './riemann.js';
import {
  rectCell,
  rectPartial,
  barPartial,
  polarCell,
  polarPartial,
  polarArea,
  boxCell,
  boxPartial,
  sphMath,
  polMath,
  sphVolume,
  polarRectCorners,
} from './terms.js';
import { setFrame, mathToWorld } from '../engine/frame.js';
import { GRAPHS, graphPolyline, graphSpeed } from './graphs1.js';
import { df1, df1left, df1right } from './ndiff.js';
import { closedBox, closedCyl, closedBall } from './triple.js';
import { closedRect, closedDisk, closedTriangle, diskTypeI, diskTypeII, triangleBounds } from './double.js';
import { polarizeDot, paraArea } from './r3.js';
import { SPACE_CURVES, evalSpace, polylineLength3 } from './space.js';
import { FIELDS3, evalField } from './fields3.js';
import { dfdx3, dfdy3, dfdz3, d2fdxdy3, d2fdydx3, gradNumeric3 } from './ndiff.js';

let failed = 0;
let passed = 0;

function approx(a, b, tol, name) {
  const scaleB = b !== 0 ? Math.abs(b) : 1;
  const good = Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol * scaleB;
  if (good) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        got ${a}  expected ${b}  rel ${Math.abs(a - b) / scaleB}`);
  }
}

function absApprox(a, b, tol, name) {
  const good = Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
  if (good) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        got ${a}  expected ${b}  abs ${Math.abs(a - b)}`);
  }
}

function ok(cond, name) {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
  }
}

console.log('vec');
{
  const a = { x: 3, y: 4, z: 0 };
  const b = { x: 1, y: 0, z: 0 };
  approx(len(a), 5, 1e-12, '||(3,4,0)|| = 5');
  approx(dot(a, b), 3, 1e-12, '(3,4)·(1,0) = 3');
  const n = normalize(a);
  approx(n.x, 0.6, 1e-12, 'unit x');
  approx(n.y, 0.8, 1e-12, 'unit y');
  const p = proj(a, b);
  approx(p.x, 3, 1e-12, 'proj onto e1, x');
  absApprox(p.y, 0, 1e-12, 'proj onto e1, y');
  const c = cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
  approx(c.z, 1, 1e-12, 'e1 × e2 = e3');
  approx(det2(1, 2, 3, 4), -2, 1e-12, 'det2');
  approx(det3([[1, 0, 0], [0, 1, 0], [0, 0, 1]]), 1, 1e-12, 'det3 I');
  const s = add(a, sub(b, a));
  approx(s.x, b.x, 1e-12, 'add/sub inverse');
}

console.log('partials vs finite differences');
{
  const f = (x, y) => x * x * y + y * y * y;
  const fx = (x, y) => 2 * x * y;
  const fy = (x, y) => x * x + 3 * y * y;
  for (const [x, y] of [
    [1, 2],
    [0.3, -0.7],
    [-1.2, 0.4],
  ]) {
    approx(dfdx(f, x, y), fx(x, y), 1e-6, `fx(${x},${y}) numeric`);
    approx(dfdy(f, x, y), fy(x, y), 1e-6, `fy(${x},${y}) numeric`);
    const g = gradNumeric(f, x, y);
    approx(g.x, fx(x, y), 1e-6, `grad.x (${x},${y})`);
    approx(g.y, fy(x, y), 1e-6, `grad.y (${x},${y})`);
  }
}

console.log('Schwarz mixed partials');
{
  // f = sin(x y) + x^2 y  — mixed partials are analytic and continuous.
  const f = (x, y) => Math.sin(x * y) + x * x * y;
  const x = 0.4;
  const y = -0.6;
  const mixed = Math.cos(x * y) - x * y * Math.sin(x * y) + 2 * x;
  approx(d2fdxdy(f, x, y), mixed, 2e-4, 'd2f/dxdy analytic');
  approx(d2fdx2(f, x, y), -y * y * Math.sin(x * y) + 2 * y, 2e-3, 'd2f/dx2');
  approx(d2fdy2(f, x, y), -x * x * Math.sin(x * y), 2e-3, 'd2f/dy2');
}

console.log('named surfaces: analytic vs numeric');
{
  const params = { a: 2, b: 3, c: 1 };
  const pts = [
    [0.5, -0.4],
    [1.1, 0.2],
  ];
  for (const id of Object.keys(SURFACES)) {
    const s = SURFACES[id];
    for (const [x, y] of pts) {
      const an = evalSurface(s, x, y, params);
      const fn = (xx, yy) => s.f(xx, yy, params);
      const g = gradNumeric(fn, x, y);
      approx(g.x, an.fx, 2e-5, `${id} fx at (${x},${y})`);
      approx(g.y, an.fy, 2e-5, `${id} fy at (${x},${y})`);
    }
  }
}

console.log('directional derivative: dot vs difference quotient');
{
  const f = (x, y) => x * x * y + Math.exp(x);
  const fx = (x, y) => 2 * x * y + Math.exp(x);
  const fy = (x, y) => x * x;
  const x = 0.7;
  const y = -0.3;
  const u = unitize(3, 5);
  ok(Math.abs(u.len - Math.hypot(3, 5)) < 1e-12, 'unitize reports original length');
  approx(Math.hypot(u.x, u.y), 1, 1e-12, 'unitize yields a unit vector');
  const Du = directional(fx(x, y), fy(x, y), u.x, u.y);
  const Dq = dirQuotient(f, x, y, u.x, u.y, 1e-6);
  approx(Dq, Du, 2e-5, 'D_u f: quotient vs grad · u');
  absApprox(directional(fx(x, y), fy(x, y), 0, 0), 0, 1e-15, 'D_0 f = 0 (absolute)');
}

console.log('steepest ascent: atan2 vs 720-step sweep');
{
  const f = (x, y) => 3 * x + 4 * y;
  const fx = 3;
  const fy = 4;
  const x = 0.2;
  const y = -0.1;
  const thA = steepestAngle(fx, fy);
  const sweep = steepestSweep(f, x, y, { steps: 720, h: 1e-5 });
  const res = (2 * Math.PI) / 720;
  absApprox(Math.abs(wrapPi(sweep.theta - thA)), 0, 2 * res, 'argmax angle matches atan2(fy,fx)');
  approx(sweep.Du, Math.hypot(fx, fy), 2e-4, 'max quotient equals ||grad f||');
  const u = dirFromAngle(thA);
  approx(directional(fx, fy, u.x, u.y), 5, 1e-12, 'D_u f along grad = 5');
}

console.log('quadrature');
{
  approx(simpson((t) => t * t, 0, 1), 1 / 3, 1e-8, '∫_0^1 x^2 dx = 1/3');
  approx(simpson(Math.sin, 0, Math.PI), 2, 1e-8, '∫_0^π sin = 2');
  const f = (x, y) => x * x * y + y;
  const Ixy = integral2(f, 0, 1, 0, 2, { order: 'xy', n: 64 });
  const Iyx = integral2(f, 0, 1, 0, 2, { order: 'yx', n: 64 });
  // Analytic: ∫_0^1 ∫_0^2 (x^2 y + y) dy dx = ∫_0^1 (x^2 + 1) * 2 dx = 8/3
  approx(Ixy, 8 / 3, 1e-6, 'double integral xy-order');
  approx(Iyx, 8 / 3, 1e-6, 'double integral yx-order');
  absApprox(Ixy - Iyx, 0, 1e-9, 'Fubini: xy order vs yx order');

  const areaPolar = integralPolar((r, th) => 1, 0, 1, 0, 2 * Math.PI, { n: 80 });
  approx(areaPolar, Math.PI, 2e-4, 'polar area of unit disk = π (r dr dθ)');
  const areaCart = integral2((x, y) => (x * x + y * y <= 1 ? 1 : 0), -1, 1, -1, 1, { order: 'xy', n: 200 });
  approx(areaCart, Math.PI, 0.03, 'Cartesian indicator of unit disk ≈ π');
  approx(areaPolar, areaCart, 0.04, 'polar vs Cartesian area of the unit disk');
}

console.log('polar: round-trip and basis');
{
  const pts = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1.2, 0.9],
    [-0.7, 1.4],
    [-1.1, -0.5],
    [0.4, -1.3],
  ];
  for (const [x, y] of pts) {
    const pol = toPolar(x, y);
    const back = toCart(pol.r, pol.theta);
    absApprox(back.x, x, 1e-12, `round-trip x (${x},${y})`);
    absApprox(back.y, y, 1e-12, `round-trip y (${x},${y})`);
    approx(pol.r * pol.r, x * x + y * y, 1e-12, `r^2 (${x},${y})`);
    ok(pol.theta >= 0 && pol.theta < 2 * Math.PI, `θ in [0, 2π) for (${x},${y})`);
    const rh = rHat(pol.theta);
    const th = thetaHat(pol.theta);
    absApprox(rh.x * th.x + rh.y * th.y, 0, 1e-12, `r-hat · θ-hat (${x},${y})`);
    approx(rh.x * th.y - rh.y * th.x, 1, 1e-12, `det(r-hat, θ-hat)=1 (${x},${y})`);
  }
  const o = toPolar(0, 0);
  absApprox(o.r, 0, 0, 'origin r = 0');
  ok(!Number.isFinite(o.theta), 'origin θ undefined');
  absApprox(wrapTau(-Math.PI / 2), 1.5 * Math.PI, 1e-12, 'wrap −π/2 → 3π/2');
  absApprox(wrapTau(2 * Math.PI), 0, 1e-12, 'wrap 2π → 0');
}

console.log('parametric: derivatives and arc length');
{
  const circ = CURVES.circle;
  const e = evalCurve(circ, Math.PI / 2);
  absApprox(e.x, 0, 1e-12, 'circle γ(π/2).x');
  absApprox(e.y, 1, 1e-12, 'circle γ(π/2).y');
  absApprox(e.xp, -1, 1e-12, "circle γ'(π/2).x");
  absApprox(e.yp, 0, 1e-12, "circle γ'(π/2).y");
  ok(e.tangent === 'horizontal', 'circle at π/2 is horizontal');
  approx(circ.length(0, 2 * Math.PI), 2 * Math.PI, 1e-12, 'circle closed length 2π');
  const Ls = simpson((t) => circ.speed(t), 0, 2 * Math.PI);
  approx(Ls, 2 * Math.PI, 1e-6, 'circle Simpson length');
  approx(polylineLength(circ, 0, 2 * Math.PI, 800), 2 * Math.PI, 0.002, 'circle polyline length');

  const par = CURVES.parabola;
  const Lp = par.length(-1, 1);
  const Ls2 = simpson((t) => par.speed(t), -1, 1);
  approx(Ls2, Lp, 1e-5, 'parabola Simpson vs closed form');
  approx(polylineLength(par, -1, 1, 800), Lp, 0.005, 'parabola polyline vs closed form');

  const cub = evalCurve(CURVES.cubic, 0);
  absApprox(cub.x, 0, 1e-12, 'cubic γ(0).x');
  absApprox(cub.y, 0, 1e-12, 'cubic γ(0).y');
  ok(cub.tangent === 'vertical', 'cubic at t=0 is vertical (x′=0, y′≠0)');
}

console.log('Hessian test');
{
  const para = classify(SURFACES.paraboloid, 0, 0, { a: 1, b: 1 });
  ok(para.critical, 'paraboloid (0,0) critical');
  ok(para.kind === 'min', 'paraboloid is a min');
  approx(para.D, 4, 1e-12, 'paraboloid D=4');

  const sad = classify(SURFACES.saddle, 0, 0, { a: 1, b: 1 });
  ok(sad.kind === 'saddle', 'saddle classified');
  approx(sad.D, -4, 1e-12, 'saddle D=−4');

  const gau = classify(SURFACES.gaussian, 0, 0, {});
  ok(gau.kind === 'max', 'gaussian is a max');
  approx(gau.D, 4, 1e-12, 'gaussian D=4');

  const c0 = classify(SURFACES.cubic, 0, 0, {});
  ok(c0.kind === 'saddle', 'cubic (0,0) saddle');
  const c1 = classify(SURFACES.cubic, 1, 1, {});
  ok(c1.kind === 'min', 'cubic (1,1) min');
  approx(c1.D, 27, 1e-12, 'cubic (1,1) D=27');

  const H = hessian(0, 0, 0);
  ok(H.kind === 'inconclusive', 'D=0 inconclusive');

  const fn = (x, y) => x * x * x + y * y * y - 3 * x * y;
  const x = 0.4;
  const y = 0.3;
  const an = evalSurface(SURFACES.cubic, x, y, {});
  approx(d2fdx2(fn, x, y), an.fxx, 2e-3, 'cubic fxx numeric');
  approx(d2fdy2(fn, x, y), an.fyy, 2e-3, 'cubic fyy numeric');
  approx(d2fdxdy(fn, x, y), an.fxy, 2e-3, 'cubic fxy numeric');
}

console.log('Schwarz: mixed from f vs from first partials');
{
  const s = SURFACES.prod2;
  const p = { a: 2 };
  const x = 0.6;
  const y = -0.4;
  const an = evalSurface(s, x, y, p);
  const fn = (xx, yy) => s.f(xx, yy, p);
  const fxFn = (xx, yy) => s.fx(xx, yy, p);
  const fyFn = (xx, yy) => s.fy(xx, yy, p);
  approx(an.fxy, 2 * p.a * x, 1e-12, 'prod2 analytic fxy = 2ax');
  approx(d2fdxdy(fn, x, y), an.fxy, 2e-3, 'prod2 four-point mixed');
  approx(dfdy(fxFn, x, y), an.fxy, 2e-5, 'prod2 ∂/∂y of fx');
  approx(dfdx(fyFn, x, y), an.fxy, 2e-5, 'prod2 ∂/∂x of fy');
  absApprox(dfdy(fxFn, x, y) - dfdx(fyFn, x, y), 0, 2e-5, 'prod2 Schwarz numeric');
}

console.log('chain rule');
{
  const t = Math.PI / 3;
  const an = chainAlong(SURFACES.xy, CURVES.circle, t, { a: 1 });
  approx(an.gp, Math.cos(2 * t), 1e-12, 'xy along circle, analytic g′ = cos 2t');
  approx(gQuotient(SURFACES.xy, CURVES.circle, t, { a: 1 }), an.gp, 2e-5, 'g′ quotient vs chain');
  const fn = (x, y) => SURFACES.xy.f(x, y, { a: 1 });
  const gN = gradNumeric(fn, an.x, an.y);
  approx(gN.x * an.xp + gN.y * an.yp, an.gp, 2e-5, 'numeric ∇f · γ′ vs chain');

  const an2 = chainAlong(SURFACES.paraboloid, CURVES.parabola, 1, { a: 1, b: 1 });
  approx(an2.gp, 6, 1e-12, 'x²+y² along (t,t²) at t=1');
  approx(gQuotient(SURFACES.paraboloid, CURVES.parabola, 1, { a: 1, b: 1 }), 6, 2e-5, 'parabola g′ quotient');

  const inn = INNERS.polar;
  const s = 1.2;
  const th = 0.7;
  const h = chainMap(SURFACES.paraboloid, inn, s, th, { a: 1, b: 1 });
  approx(h.hs, 2 * s, 1e-12, 'polar h_s = 2s for x²+y²');
  absApprox(h.ht, 0, 1e-12, 'polar h_t = 0 for x²+y²');
  approx(hQuotientS(SURFACES.paraboloid, inn, s, th, { a: 1, b: 1 }), h.hs, 2e-5, 'h_s quotient');
  absApprox(hQuotientT(SURFACES.paraboloid, inn, s, th, { a: 1, b: 1 }), 0, 2e-5, 'h_t quotient');

  const innB = INNERS.bilinear;
  const hb = chainMap(SURFACES.xy, innB, 0.8, 0.9, { a: 1 });
  approx(hQuotientS(SURFACES.xy, innB, 0.8, 0.9, { a: 1 }), hb.hs, 2e-4, 'bilinear h_s quotient vs chain');
  approx(hQuotientT(SURFACES.xy, innB, 0.8, 0.9, { a: 1 }), hb.ht, 2e-4, 'bilinear h_t quotient vs chain');
}

console.log('double Riemann sums and regions');
{
  const f = (x, y) => x * x + y * y;
  const mid = riemannRect(f, 0, 1, 0, 1, { nx: 16, ny: 16, sample: 'mid' });
  approx(mid.sum, 2 / 3, 0.01, 'midpoint n=16 vs ∬(x²+y²)=2/3');
  approx(closedRect('paraboloid', 0, 1, 0, 1, { a: 1, b: 1 }), 2 / 3, 1e-12, 'closed ∬(x²+y²) on [0,1]²');
  const one = riemannRect(() => 1, 0, 1, 0, 2, { nx: 3, ny: 5, sample: 'll' });
  approx(one.sum, 2, 1e-12, 'f=1 Riemann is the area');
  const xy = riemannRect((x, y) => x * y, 0, 1, 0, 1, { nx: 1, ny: 1, sample: 'mid' });
  approx(xy.sum, 0.25, 1e-12, 'midpoint n=1 is exact for xy');
  const n2 = riemannRect(f, 0, 1, 0, 1, { nx: 2, ny: 2, sample: 'mid' });
  approx(n2.sum, 0.625, 1e-12, 'n=2 midpoint of x²+y² on [0,1]²');

  const dI = diskTypeI(1);
  const dII = diskTypeII(1);
  const areaI = integralTypeI(() => 1, dI.xa, dI.xb, dI.yLo, dI.yHi, { n: 80 });
  const areaII = integralTypeII(() => 1, dII.ya, dII.yb, dII.xLo, dII.xHi, { n: 80 });
  approx(areaI, Math.PI, 0.01, 'disk type I area');
  approx(areaII, Math.PI, 0.01, 'disk type II area');
  absApprox(areaI - areaII, 0, 0.005, 'disk type I vs type II');

  const tri = triangleBounds();
  approx(integralTypeI(() => 1, tri.xa, tri.xb, tri.yLo, tri.yHi, { n: 40 }), 0.5, 0.005, 'triangle area type I');
  approx(integralTypeII(() => 1, tri.ya, tri.yb, tri.xLo, tri.xHi, { n: 40 }), 0.5, 0.005, 'triangle area type II');
  approx(closedTriangle('xy'), 1 / 24, 1e-12, 'triangle ∬ xy = 1/24');
  approx(closedTriangle('paraboloid'), 1 / 6, 1e-12, 'triangle ∬(x²+y²)=1/6');

  const pol = integralPolar((r, th) => 1, 0, 1, 0, 2 * Math.PI, { n: 80 });
  approx(pol, Math.PI, 2e-4, 'polar area with Jacobian');
  const rpol = riemannPolar(() => 1, 1, { nr: 12, nth: 24, sample: 'mid' });
  approx(rpol.sum, Math.PI, 0.03, 'polar Riemann area');
  approx(closedDisk('paraboloid', 1, { a: 1, b: 1 }), Math.PI / 2, 1e-12, '∬(x²+y²) on unit disk = π/2');
  const Ipara = integralPolar((r) => r * r, 0, 1, 0, 2 * Math.PI, { n: 80 });
  approx(Ipara, Math.PI / 2, 2e-4, 'polar Simpson x²+y²');
  approx(closedDisk('one', 2), 4 * Math.PI, 1e-12, 'area of D_2 = 4π');
  approx(closedDisk('xy', 1), 0, 1e-12, '∬ xy on a disk is 0');
  approx(closedDisk('gaussian', 1), Math.PI * (1 - Math.exp(-1)), 1e-12, 'gaussian disk closed form');

  const cell0 = rectCell(0, 1, 0, 1, 2, 2, 0, 'mid');
  approx(cell0.x, 0.25, 1e-12, 'rect cell 0 sample x');
  approx(cell0.y, 0.25, 1e-12, 'rect cell 0 sample y');
  approx(cell0.dA, 0.25, 1e-12, 'rect cell area Δx Δy');
  const parts = rectPartial(f, 0, 1, 0, 1, 2, 2, 'mid', 4);
  approx(parts.sum, n2.sum, 1e-12, 'partial sum of every cell is the Riemann sum');
  const neg = rectPartial(() => -1, 0, 1, 0, 1, 2, 2, 'mid', 4);
  approx(neg.sum, -1, 1e-12, 'sum of f=−1 is minus the area');
  const oneBar = barPartial(() => 1, 0, 2, 4, 'left', 4);
  approx(oneBar.sum, riemann1d(() => 1, 0, 2, { n: 4, sample: 'left' }).sum, 1e-12, '1D partial sum matches riemann1d');

  const pc = polarCell(1, 4, 8, 8, 'mid');
  approx(pc.r0, 0.25, 1e-12, 'polar ring 1 starts at Δr');
  approx(pc.dA, pc.r * pc.dr * pc.dth, 1e-12, 'polar cell area is r Δr Δθ');
  approx(polarArea(pc.r, pc.dr, pc.dth, { jacobian: false }), pc.bare, 1e-12, 'dropped r is Δr Δθ');
  const fullPol = polarPartial(() => 1, 1, 12, 24, 'mid', 12 * 24, { jacobian: true });
  approx(fullPol.sum, rpol.sum, 1e-12, 'polar partial of every cell matches riemannPolar');
  approx(polarPartial(() => 1, 1, 4, 8, 'mid', 32, { jacobian: false }).sum, 2 * Math.PI, 1e-12, 'Riemann without r is 2πR');
  approx(integralPolar(() => 1, 0, 1, 0, 2 * Math.PI, { n: 80, jacobian: false }), 2 * Math.PI, 1e-3, '∫∫ dr dθ on the unit disk is 2π');

  const corners = polarRectCorners({ r: 1, th: 0, dr: 0.2, tang: 0.5 });
  approx(corners[2].x, 1.1, 1e-12, 'forgotten-r rectangle, θ=0, outer corner x');
  approx(corners[2].y, 0.25, 1e-12, 'forgotten-r rectangle, θ=0, θ-hat is +y');
  const up = polMath(1, Math.PI / 2, 2);
  approx(up.x, 0, 1e-12, 'θ=π/2 is +y, x');
  approx(up.y, 1, 1e-12, 'θ=π/2 is +y, y');
  approx(up.z, 2, 1e-12, 'polMath keeps z');
}

console.log('R³: polarization and parallelogram');
{
  const u = { x: 1.2, y: 0.7, z: 0.4 };
  const v = { x: 0.3, y: 1.1, z: 0.8 };
  approx(polarizeDot(u, v), dot(u, v), 1e-12, 'polarization vs component dot');
  approx(paraArea(u, v), len(cross(u, v)), 1e-12, 'para area vs ||u×v||');
  absApprox(dot(cross(u, v), u), 0, 1e-12, '(u×v)·u = 0');
  absApprox(dot(cross(u, v), v), 0, 1e-12, '(u×v)·v = 0');
  const e1 = { x: 1, y: 0, z: 0 };
  const e2 = { x: 0, y: 1, z: 0 };
  const e3 = cross(e1, e2);
  approx(e3.z, 1, 1e-12, 'e1 × e2 = e3');
}

console.log('space curves');
{
  const h = SPACE_CURVES.helix;
  const e = evalSpace(h, Math.PI / 2);
  absApprox(e.x, 0, 1e-12, 'helix γ(π/2).x');
  absApprox(e.y, 1, 1e-12, 'helix γ(π/2).y');
  approx(e.z, Math.PI / 4, 1e-12, 'helix γ(π/2).z');
  approx(h.length(0, 2 * Math.PI), Math.PI * Math.sqrt(5), 1e-12, 'helix closed length π√5');
  approx(simpson((t) => h.speed(t), 0, 2 * Math.PI), Math.PI * Math.sqrt(5), 1e-6, 'helix Simpson');
  approx(polylineLength3(h, 0, 2 * Math.PI, 800), Math.PI * Math.sqrt(5), 0.01, 'helix polyline');

  const coil = SPACE_CURVES.coil;
  approx(coil.length(0, 2 * Math.PI), 2 * Math.PI * Math.sqrt(5), 1e-12, 'coil closed length');
  approx(simpson((t) => coil.speed(t), 0, 2 * Math.PI), coil.length(0, 2 * Math.PI), 1e-6, 'coil Simpson vs closed');
  approx(polylineLength3(SPACE_CURVES.cubic, -1, 1, 600), simpson((t) => SPACE_CURVES.cubic.speed(t), -1, 1), 0.01, 'cubic polyline vs Simpson');
}

console.log('partials in R³');
{
  const f = (x, y, z) => x * y * z;
  approx(dfdx3(f, 1, 2, 3), 6, 1e-6, '∂/∂x of xyz at (1,2,3)');
  approx(dfdy3(f, 1, 2, 3), 3, 1e-6, '∂/∂y of xyz');
  approx(dfdz3(f, 1, 2, 3), 2, 1e-6, '∂/∂z of xyz');
  const gN = gradNumeric3(f, 1, 2, 3);
  approx(gN.x, 6, 1e-6, 'numeric grad xyz.x');
  const fld = FIELDS3.prod;
  const p = {};
  const x = 0.5;
  const y = -0.4;
  const z = 0.8;
  const an = evalField(fld, x, y, z, p);
  const fn = (xx, yy, zz) => fld.f(xx, yy, zz, p);
  approx(d2fdxdy3(fn, x, y, z), an.fxy, 2e-3, 'prod fxy four-point');
  approx(d2fdydx3(fn, x, y, z), an.fxy, 2e-3, 'prod fyx four-point');
  absApprox(d2fdxdy3(fn, x, y, z) - d2fdydx3(fn, x, y, z), 0, 2e-5, 'Schwarz in R³ for x²yz');
  const bowl = evalField(FIELDS3.bowl, 0, 0, 0, {});
  absApprox(bowl.fx, 0, 0, 'bowl ∇f at origin, fx');
  absApprox(bowl.fy, 0, 0, 'bowl ∇f at origin, fy');
  absApprox(bowl.fz, 0, 0, 'bowl ∇f at origin, fz');
}

console.log('graphs and 1D calculus');
{
  const q = GRAPHS.quad;
  approx(df1(q.f, 0.7), q.fp(0.7), 1e-6, 'x²: central quotient vs 2x');
  approx(simpson(q.f, 0, 1), q.F(1) - q.F(0), 1e-6, 'x²: Simpson vs F(1)-F(0)=1/3');
  const mid = riemann1d(q.f, 0, 1, { n: 4, sample: 'mid' });
  approx(mid.sum, 0.328125, 1e-12, 'x² midpoint n=4');
  const left = riemann1d(q.f, 0, 1, { n: 8, sample: 'left' });
  const right = riemann1d(q.f, 0, 1, { n: 8, sample: 'right' });
  ok(left.sum < simpson(q.f, 0, 1) && simpson(q.f, 0, 1) < right.sum, 'x² increasing: left < I < right');

  const line = GRAPHS.line;
  approx(line.F(2) - line.F(0), 6, 1e-12, '2x+1 on [0,2] = 6');
  approx(riemann1d(line.f, 0, 2, { n: 4, sample: 'mid' }).sum, 6, 1e-12, 'linear midpoint is exact');
  approx(simpson((x) => graphSpeed(line, x, 0, 1), 0, 1), Math.sqrt(5), 1e-6, 'graph length of 2x+1 on [0,1] = √5');
  approx(graphPolyline(line, 0, 1, 20), Math.sqrt(5), 1e-12, 'polyline of a line is exact');

  const abs = GRAPHS.abs;
  approx(df1left(abs.f, 0), -1, 1e-8, '|x| left derivative at 0');
  approx(df1right(abs.f, 0), 1, 1e-8, '|x| right derivative at 0');
  ok(!Number.isFinite(abs.fp(0)), '|x| analytic f′ undefined at 0');
  approx(abs.f(0), 0, 0, '|x| continuous at 0');

  const cube = GRAPHS.cube;
  absApprox(cube.fp(0), 0, 0, 'x³: f′(0)=0');
  ok(cube.f(0.2) > 0 && cube.f(-0.2) < 0, 'x³ takes both signs near 0');

  const hole = GRAPHS.hole;
  ok(!Number.isFinite(hole.f(1)), 'hole: f(1) undefined');
  approx(hole.f(1.001), 2.001, 1e-12, 'hole: f(1.001)=2.001');
  approx(df1(hole.f, 1, 1e-4), 1, 2e-3, 'hole: difference quotient at 1 is 1');

  const sq = GRAPHS.squeeze;
  absApprox(sq.f(0), 0, 0, 'squeeze f(0)=0');
  absApprox(sq.fp(0), 0, 0, 'squeeze f′(0)=0');
  approx(df1(sq.f, 0, 1e-4), 0, 2e-3, 'squeeze central quotient at 0');

  const semi = GRAPHS.semi;
  approx(semi.F(1) - semi.F(-1), Math.PI / 2, 1e-12, 'semicircle area π/2');
  approx(graphPolyline(semi, -1, 1, 800), Math.PI, 0.01, 'semicircle polyline vs π');
}

console.log('triple integrals');
{
  approx(closedBox('one', 0, 1, 0, 1, 0, 1), 1, 1e-12, 'unit cube volume');
  approx(closedBox('xyz', 0, 1, 0, 1, 0, 1), 0.125, 1e-12, 'xyz on unit cube = 1/8');
  approx(closedBox('xonly', 0, 2, 0, 1, 0, 1), 2, 1e-12, 'x on [0,2]×[0,1]×[0,1]');
  const fn = (x, y, z) => x * y * z;
  approx(integral3(fn, 0, 1, 0, 1, 0, 1, { order: 'xyz', n: 16 }), 0.125, 2e-4, 'xyz Simpson xyz-order');
  approx(integral3(fn, 0, 1, 0, 1, 0, 1, { order: 'zyx', n: 16 }), 0.125, 2e-4, 'xyz Simpson zyx-order');
  approx(riemann3(() => 1, 0, 1, 0, 1, 0, 1, { n: 4 }).sum, 1, 1e-12, 'f=1 midpoint is exact');
  approx(closedBox('bowl', 0, 1, 0, 1, 0, 1), 1, 1e-12, 'x²+y²+z² on unit cube = 1');

  approx(closedCyl('one', 1, 0, 1), Math.PI, 1e-12, 'unit cylinder volume');
  approx(closedCyl('zonly', 1, 0, 2), 2 * Math.PI, 1e-12, '∭ z on R=1, z∈[0,2]');
  const one = () => 1;
  approx(integralCyl(one, 1, 0, 1, { n: 24 }), Math.PI, 2e-4, 'cyl Simpson f=1');
  approx(integralCylCart(one, 1, 0, 1, { n: 24 }), Math.PI, 5e-3, 'cyl Cartesian f=1');
  const zf = (x, y, z) => z;
  approx(integralCyl(zf, 1, 0, 2, { n: 24 }), 2 * Math.PI, 2e-3, 'cyl Simpson z');
  approx(integralCylCart(zf, 1, 0, 2, { n: 24 }), 2 * Math.PI, 1e-2, 'cyl Cartesian z');

  approx(closedBall('one', 1), (4 / 3) * Math.PI, 1e-12, 'unit ball volume');
  absApprox(closedBall('zonly', 1), 0, 0, '∭ z on a ball is 0');
  approx(closedBall('bowl', 1), (4 / 5) * Math.PI, 1e-12, '∭ ρ² on unit ball = 4π/5');
  approx(integralSph(one, 1, { n: 24 }), (4 / 3) * Math.PI, 2e-3, 'sph Simpson f=1');
  approx(integralSphCart(one, 1, { n: 20 }), (4 / 3) * Math.PI, 1e-2, 'sph Cartesian f=1');
  absApprox(integralSph(zf, 1, { n: 24 }), 0, 2e-3, 'sph Simpson z ≈ 0');
  const bowl = (x, y, z) => x * x + y * y + z * z;
  approx(integralSph(bowl, 1, { n: 24 }), (4 / 5) * Math.PI, 3e-3, 'sph Simpson ρ²');
  approx(integralCyl(one, 1, 0, 1, { n: 24, jacobian: false }), 2 * Math.PI, 2e-3, 'cyl without r is 2πRH');
  approx(integralSph(one, 1, { n: 32, sinPhi: false }), (2 * Math.PI * Math.PI) / 3, 2e-3, 'sph without sinφ is 2π²R³/3');

  const bc = boxCell(0, 1, 0, 1, 0, 1, 2, 0);
  approx(bc.x, 0.25, 1e-12, 'box cell 0 centre x');
  approx(bc.dV, 0.125, 1e-12, 'box cell volume');
  approx(boxPartial(() => 1, 0, 1, 0, 1, 0, 1, 2, 8).sum, 1, 1e-12, 'every unit-cube cell sums to 1');

  const pole = sphMath(2, 0, 0);
  approx(pole.x, 0, 1e-12, 'φ=0 is on the z-axis, x');
  approx(pole.z, 2, 1e-12, 'φ=0 is +z');
  const eq = sphMath(2, Math.PI / 2, 0);
  approx(eq.x, 2, 1e-12, 'φ=π/2, θ=0 is +x');
  approx(eq.z, 0, 1e-12, 'equator has z=0');
  const eqy = sphMath(2, Math.PI / 2, Math.PI / 2);
  approx(eqy.y, 2, 1e-12, 'φ=π/2, θ=π/2 is +y');
  const rho = 0.7;
  const phiP = 0.35;
  const dRho = 0.2;
  const dPhi = 0.3;
  const dTh = 0.4;
  approx(sphVolume(rho, Math.PI / 2, dRho, dPhi, dTh), rho * rho * dRho * dPhi * dTh, 1e-12, 'equator cell uses sinφ=1');
  approx(
    sphVolume(rho, phiP, dRho, dPhi, dTh),
    rho * rho * Math.sin(phiP) * dRho * dPhi * dTh,
    1e-12,
    'pole cell uses sinφ',
  );
  approx(sphVolume(rho, phiP, dRho, dPhi, dTh, { sinPhi: false }), rho * rho * dRho * dPhi * dTh, 1e-12, 'dropped sinφ ignores φ');

  setFrame({ upm: 2, plane: 'xyfloor' });
  const w = mathToWorld(eq.x, eq.y, eq.z, 2);
  approx(w.x, 4, 1e-12, 'equator point, world x');
  approx(w.y, 0, 1e-12, 'equator point sits on the floor');
  approx(w.z, 0, 1e-12, 'equator point, world depth');
  const wz = mathToWorld(pole.x, pole.y, pole.z, 2);
  approx(wz.y, 4, 1e-12, '+z in math is up in the scene');
  setFrame({ upm: 1, plane: 'xyfloor' });
}

{
  console.log('agreement tolerance');
  /*
   * The rule these replaced was `|a-b| < tol * max(1, |a|, |b|)`. That floor of 1 turned a relative
   * tolerance into a flat absolute one for every quantity below 1 — and most of what these labs
   * display is below 1. These cases fail against that old rule and pass against the new one; if
   * anyone reintroduces the floor, the first two turn red here instead of silently on screen.
   */
  const OLD = (a, b, tol = 0.02) => Math.abs(a - b) < tol * Math.max(1, Math.abs(a), Math.abs(b));

  // D_u f on the Gaussian at (−2,−2): a 10% error, invisible to the old rule.
  const Du = 6.617e-4;
  const wrong = Du * 1.1;
  const gmag = 1.87e-3;
  ok(OLD(Du, wrong), 'old rule passes a 10% error on a small D_u f (the bug)');
  ok(!agreeTo(Du, wrong, gmag), 'new rule catches it, scaled by ||grad f||');
  ok(agreeTo(Du, Du * 1.001, gmag), 'and still passes a 0.1% difference');

  // An integral of 0.2 with a 12% disagreement: the same blindness on the quadrature labs.
  ok(OLD(0.2, 0.225, 0.03), 'old rule passes a 12% disagreement on a small integral');
  ok(!agreeTo(0.2, 0.225, 0.2, { tol: 0.03 }), 'new rule catches it, scaled by the integral of |f|');

  // A quantity that legitimately cancels to zero must stay satisfiable.
  ok(agreeTo(0, 0, 0), 'two exact zeros agree');
  ok(agreeTo(0, 1e-17, 0, { floor: quotientNoise(1, 1e-5) }), 'floating-point dust is not a disagreement');
  ok(!agreeTo(0, 0.5, 0), 'but a real difference against a zero scale is');
  ok(!agreeTo(NaN, 1, 1) && !agreeTo(1, Infinity, 1), 'non-finite never agrees');

  // The measured truncation floor: f'(0) = 0 for x³ while the quotient returns h².
  const cube = (x) => x * x * x;
  const slack = df1Slack(cube, 0);
  ok(slack > 0 && slack < 1e-8, 'df1Slack bounds the quotient truncation at x^3');
  ok(agreeTo(0, dirQuotient((x) => cube(x), 0, 0, 1, 0), 0, { floor: slack }), 'x^3 at 0 agrees within that floor');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
console.log('selftest ok');
