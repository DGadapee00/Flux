/**
 * Second methods for rigid2d.js. None of these repeat the formula they check.
 *
 *   node src/mechanics/rigid-selftest.js
 */
import { cross, v } from './vectors.js';
import {
  circleCircle,
  cycloid,
  fourBar,
  instantCenter,
  ladder,
  lineIntersection,
  omegaFromCenter,
  relativeAcceleration,
  relativeVelocity,
  rollContact,
  rollingPoint,
  sliderCrank,
} from './rigid2d.js';

let passed = 0;
let failed = 0;

function approx(got, want, tol, name) {
  const scale = Math.max(1, Math.abs(want));
  const good = Number.isFinite(got) && Math.abs(got - want) <= tol * scale;
  if (good) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        got ${got}  expected ${want}`);
  }
}

function rot(x, y, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: c * x - s * y, y: s * x + c * y };
}

function velocityCheck() {
  const vA = { x: 1.2, y: -0.4, z: 0 };
  const omega = 2.5;
  const r = { x: 0.3, y: -0.7, z: 0 };
  const got = relativeVelocity(vA, omega, r);
  const byCross = cross(v(0, 0, omega), v(r.x, r.y, 0));
  approx(got.x, vA.x + byCross.x, 1e-12, 'v_B matches v_A + ω k × r from the 3D cross');
  approx(got.y, vA.y + byCross.y, 1e-12, 'v_B,y matches the 3D cross');
  const h = 1e-6;
  const ahead = rot(r.x, r.y, omega * h);
  const back = rot(r.x, r.y, -omega * h);
  approx(got.x, vA.x + (ahead.x - back.x) / (2 * h), 1e-8, 'v_B,x matches a small rigid rotation');
  approx(got.y, vA.y + (ahead.y - back.y) / (2 * h), 1e-8, 'v_B,y matches a small rigid rotation');
}

function accelerationCheck() {
  const aA = { x: 0.2, y: -0.5, z: 0 };
  const omega = 1.7;
  const alpha = -0.8;
  const r0 = { x: 0.4, y: 0.25 };
  const got = relativeAcceleration(aA, omega, alpha, { x: r0.x, y: r0.y, z: 0 });
  const h = 1e-5;
  const vel = (t) => {
    const th = omega * t + 0.5 * alpha * t * t;
    const p = rot(r0.x, r0.y, th);
    const w = omega + alpha * t;
    const vA = { x: aA.x * t, y: aA.y * t, z: 0 };
    return relativeVelocity(vA, w, { x: p.x, y: p.y, z: 0 });
  };
  approx(got.x, (vel(h).x - vel(-h).x) / (2 * h), 1e-6, 'a_B,x is d/dt of v_B');
  approx(got.y, (vel(h).y - vel(-h).y) / (2 * h), 1e-6, 'a_B,y is d/dt of v_B');
  const spin = relativeAcceleration({ x: 0, y: 0, z: 0 }, 3, 0, { x: 0.5, y: 0, z: 0 });
  approx(spin.x, -4.5, 1e-12, 'centripetal acceleration is −ω²r');
  approx(spin.y, 0, 1e-12, 'centripetal acceleration has no tangential part when α = 0');
}

function centerCheck() {
  const L = 4;
  const th = 60 * Math.PI / 180;
  const foot = { x: L * Math.cos(th), y: 0, z: 0 };
  const top = { x: 0, y: L * Math.sin(th), z: 0 };
  const ic = instantCenter(foot, { x: 1, y: 0 }, top, { x: 0, y: -1 });
  approx(ic.x, foot.x, 1e-12, 'ladder IC x is the foot x');
  approx(ic.y, top.y, 1e-12, 'ladder IC y is the top y');
  const parallel = instantCenter({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 0 });
  if (parallel === null) {
    passed += 1;
    console.log('  PASS  parallel velocities put the IC at infinity');
  } else {
    failed += 1;
    console.log('  FAIL  parallel velocities put the IC at infinity');
  }
  const omega = omegaFromCenter(foot, { x: 2, y: 0, z: 0 }, ic);
  approx(omega, 2 / (L * Math.sin(th)), 1e-12, 'ω from the IC matches v / (L sin θ)');
  const row = ladder(L, 60, 2);
  approx(row.omega, 1 / Math.sqrt(3), 1e-12, 'steep ladder ω is 1/√3');
  approx(row.down, 2 / Math.sqrt(3), 1e-12, 'steep ladder top speed is 2/√3');
  const shallow = ladder(L, 30, 2);
  approx(shallow.omega, 1, 1e-12, 'shallow ladder ω is 1 rad/s');
  approx(shallow.down, 2 * Math.sqrt(3), 1e-12, 'shallow ladder top speed is 2√3');
  const vTop = relativeVelocity({ x: 0, y: 0, z: 0 }, row.omega, {
    x: row.top.x - row.ic.x,
    y: row.top.y - row.ic.y,
    z: 0,
  });
  approx(vTop.y, -row.down, 1e-12, 'top velocity from ω × r matches the ladder');
  const miss = lineIntersection({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 0 });
  if (miss === null) {
    passed += 1;
    console.log('  PASS  parallel lines do not meet');
  } else {
    failed += 1;
    console.log('  FAIL  parallel lines do not meet');
  }
}

function beltCheck() {
  const open = rollContact(0.15, 20, 0.3);
  approx(open.speed, 3, 1e-12, 'open belt speed is rω');
  approx(open.omega2, 10, 1e-12, 'open belt keeps the sense');
  const arc = 0.15 * 20;
  approx(open.omega2, arc / 0.3, 1e-12, 'driven pulley ω is the arc in one second over its radius');
  const gears = rollContact(0.1, 8, 0.25, { external: true });
  approx(gears.omega2, -3.2, 1e-12, 'external gears reverse the sense');
  approx(gears.ratio * 2, -0.8, 1e-12, 'external gears scale α by the same ratio');
  approx(Math.abs(gears.omega2 * 0.25), Math.abs(0.1 * 8), 1e-12, 'pitch-line speeds match');
}

function sliderGeometry(r, l, theta) {
  const s = (r / l) * Math.sin(theta);
  if (Math.abs(s) > 1) return NaN;
  return r * Math.cos(theta) + l * Math.sqrt(1 - s * s);
}

function sliderNumeric(spec, t) {
  const ang = spec.theta + spec.omega * t + 0.5 * spec.alpha * t * t;
  return sliderGeometry(spec.r, spec.l, ang);
}

function sliderCheck() {
  const spec = { r: 0.2, l: 0.8, theta: 0, omega: 10, alpha: 0 };
  const extended = sliderCrank(spec);
  approx(extended.x, 1, 1e-12, 'extended slider is at r + l');
  approx(extended.v, 0, 1e-12, 'extended slider speed is 0');
  approx(extended.a, -25, 1e-12, 'extended slider acceleration is −rω²(1 + r/l)');
  const folded = sliderCrank({ ...spec, theta: Math.PI });
  approx(folded.x, 0.6, 1e-12, 'folded slider is at l − r');
  approx(folded.v, 0, 1e-12, 'folded slider speed is 0');
  approx(folded.a, 15, 1e-12, 'folded slider acceleration is rω²(1 − r/l)');
  const mid = sliderCrank({ ...spec, theta: Math.PI / 2 });
  approx(mid.v, -2, 1e-12, 'mid slider speed is −rω');
  const h = 1e-5;
  for (const row of [spec, { ...spec, theta: Math.PI / 2 }, { ...spec, theta: Math.PI }, { r: 0.2, l: 0.8, theta: 0.4, omega: 3, alpha: 4 }]) {
    const got = sliderCrank(row);
    const x = (t) => sliderNumeric(row, t);
    const v = (x(h) - x(-h)) / (2 * h);
    const a = (x(h) - 2 * x(0) + x(-h)) / (h * h);
    approx(got.x, x(0), 1e-12, `slider x matches the constraint at θ=${row.theta.toFixed(3)}`);
    approx(got.v, v, 1e-6, `slider v matches Δx/Δt at θ=${row.theta.toFixed(3)}`);
    approx(got.a, a, 1e-4, `slider a matches Δ²x/Δt² at θ=${row.theta.toFixed(3)}`);
  }
  const locked = sliderCrank({ r: 1, l: 0.5, theta: Math.PI / 2, omega: 1, alpha: 0 });
  if (locked.locked && Number.isFinite(locked.x) && Number.isFinite(locked.v)) {
    passed += 1;
    console.log('  PASS  a crank that cannot reach returns finite zeros');
  } else {
    failed += 1;
    console.log('  FAIL  a crank that cannot reach returns finite zeros');
  }
}

function linkCheck() {
  const hits = circleCircle({ x: 0, y: 0 }, 5, { x: 6, y: 0 }, 5);
  approx(hits[0].x, 3, 1e-12, 'circle intersection x');
  approx(Math.abs(hits[0].y), 4, 1e-12, 'circle intersection y');
  const spec = { crank: 1, coupler: 2.5, rocker: 2, ground: 3, theta: Math.PI / 3, omega: 2, assembly: 'up' };
  const pose = fourBar(spec);
  if (pose.miss || !pose.ic) {
    failed += 1;
    console.log('  FAIL  four-bar at 60° assembles');
    return;
  }
  passed += 1;
  console.log('  PASS  four-bar at 60° assembles');
  const h = 1e-5;
  const ahead = fourBar({ ...spec, theta: spec.theta + spec.omega * h });
  const back = fourBar({ ...spec, theta: spec.theta - spec.omega * h });
  approx(pose.vB.x, (ahead.B.x - back.B.x) / (2 * h), 1e-5, 'coupler v_Bx matches ΔB/Δt');
  approx(pose.vB.y, (ahead.B.y - back.B.y) / (2 * h), 1e-5, 'coupler v_By matches ΔB/Δt');
  const along = relativeVelocity(pose.vA, pose.omegaCoupler, {
    x: pose.B.x - pose.A.x,
    y: pose.B.y - pose.A.y,
    z: 0,
  });
  approx(along.x, pose.vB.x, 1e-9, 'v_B from the coupler matches v_B from the IC');
  approx(along.y, pose.vB.y, 1e-9, 'v_B,y from the coupler matches the IC');
  const arm = { x: pose.B.x - pose.C.x, y: pose.B.y - pose.C.y };
  approx(pose.vB.x * arm.x + pose.vB.y * arm.y, 0, 1e-9, 'rocker velocity is perpendicular to the rocker');
  let worst = 0;
  for (let deg = 0; deg < 360; deg++) {
    const th = deg * Math.PI / 180;
    const row = fourBar({ ...spec, theta: th });
    if (row.miss || !row.ic) {
      failed += 1;
      console.log(`  FAIL  four-bar assembles at ${deg}°`);
      return;
    }
    const a = fourBar({ ...spec, theta: th + spec.omega * h });
    const b = fourBar({ ...spec, theta: th - spec.omega * h });
    const err = Math.max(
      Math.abs(row.vB.x - (a.B.x - b.B.x) / (2 * h)),
      Math.abs(row.vB.y - (a.B.y - b.B.y) / (2 * h)),
    );
    if (err > worst) worst = err;
  }
  approx(worst, 0, 1e-4, 'four-bar velocity stays with ΔB/Δt over a full turn');
  console.log(`        worst |Δv| over the turn is ${worst}`);
}

function rollCheck() {
  const R = 0.4;
  const speed = 2;
  const w = speed / R;
  const h = 1e-5;
  for (const phi of [0, Math.PI / 2, Math.PI, 1.2]) {
    const got = rollingPoint({ radius: R, speed, phi });
    const at = (p) => cycloid(R, p);
    const vx = (at(phi + w * h).x - at(phi - w * h).x) / (2 * h);
    const vy = (at(phi + w * h).y - at(phi - w * h).y) / (2 * h);
    const ax = (at(phi + w * h).x - 2 * at(phi).x + at(phi - w * h).x) / (h * h);
    const ay = (at(phi + w * h).y - 2 * at(phi).y + at(phi - w * h).y) / (h * h);
    approx(got.vx, vx, 1e-6, `rim vx matches the cycloid at φ=${phi.toFixed(3)}`);
    approx(got.vy, vy, 1e-6, `rim vy matches the cycloid at φ=${phi.toFixed(3)}`);
    approx(got.ax, ax, 1e-4, `rim ax matches the cycloid at φ=${phi.toFixed(3)}`);
    approx(got.ay, ay, 1e-4, `rim ay matches the cycloid at φ=${phi.toFixed(3)}`);
  }
  const contact = rollingPoint({ radius: R, speed, phi: 0 });
  approx(contact.speed, 0, 1e-12, 'contact speed is 0');
  approx(contact.ay, speed * speed / R, 1e-12, 'contact acceleration is v²/R upward');
  approx(contact.aMag, 10, 1e-12, 'contact acceleration magnitude is 10');
  const top = rollingPoint({ radius: R, speed, phi: Math.PI });
  approx(top.speed, 4, 1e-12, 'top speed is 2v');
  approx(top.ay, -10, 1e-12, 'top acceleration points toward the centre');
  const side = rollingPoint({ radius: R, speed, phi: Math.PI / 2 });
  approx(side.speed, 2 * Math.SQRT2, 1e-12, 'side speed is v√2');
  approx(contact.omega, -5, 1e-12, 'rolling ω is −v/R');
}

velocityCheck();
accelerationCheck();
centerCheck();
beltCheck();
sliderCheck();
linkCheck();
rollCheck();

console.log(failed ? `\n${failed} failed, ${passed} passed` : `\nrigid2d: ${passed} passed`);
if (failed) process.exit(1);
