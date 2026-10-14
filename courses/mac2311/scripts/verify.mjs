import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './playwright.mjs';

const out = path.resolve('scripts/output');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto('http://localhost:5178/#/mac2311/u2/secant', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForFunction(() => window.__flux?.state?.lab === 'secant', null, { timeout: 15000 });
await page.waitForTimeout(600);

const first = await page.evaluate(() => {
  const c = window.__flux.computed;
  return {
    lab: window.__flux.state.lab,
    scenario: window.__flux.state.scenarioId,
    fp: c.fp,
    msec: c.msec,
    dq: c.dq,
    agree: c.agree,
  };
});
await page.screenshot({ path: path.join(out, 'secant-desktop.png'), fullPage: true });

await page.selectOption('#scenario', 'abs');
await page.waitForTimeout(200);
await page.fill('#sc-x0', '0');
await page.dispatchEvent('#sc-x0', 'input');
await page.waitForTimeout(200);
const corner = await page.evaluate(() => ({
  scenario: window.__flux.state.scenarioId,
  x0: window.__flux.state.x0,
  fp: window.__flux.computed.fp,
  left: window.__flux.computed.left,
  right: window.__flux.computed.right,
}));

await page.selectOption('#scenario', 'quad');
await page.waitForTimeout(150);
await page.fill('#sc-x0', '1');
await page.dispatchEvent('#sc-x0', 'input');
await page.fill('#sc-h', '0.05');
await page.dispatchEvent('#sc-h', 'input');
await page.waitForTimeout(200);
const smallH = await page.evaluate(() => ({
  x0: window.__flux.state.x0,
  h: window.__flux.state.h,
  msec: window.__flux.computed.msec,
  fp: window.__flux.computed.fp,
}));

const settle = async () => {
  let last = null;
  for (let i = 0; i < 40; i++) {
    const now = await page.evaluate(() =>
      [window.__flux.camera.position.x, window.__flux.camera.position.y, window.__flux.camera.position.z]
        .map((v) => +v.toFixed(4))
        .join(),
    );
    if (now === last) return;
    last = now;
    await page.waitForTimeout(100);
  }
};

const snap = () =>
  page.evaluate(() =>
    [window.__flux.camera.position.x, window.__flux.camera.position.y, window.__flux.camera.position.z]
      .map((v) => +v.toFixed(3))
      .join(),
  );

await settle();
const camBefore = await snap();
await page.mouse.move(900, 220);
await page.mouse.down();
for (let i = 1; i <= 10; i++) await page.mouse.move(900 - i * 14, 220 + i * 5);
await page.mouse.up();
await settle();
const camAfter = await snap();

await page.click('#btn-practice');
await page.waitForTimeout(500);
const practiceOpen = await page.evaluate(() => document.body.classList.contains('practice-open'));
await page.screenshot({ path: path.join(out, 'secant-practice.png'), fullPage: true });
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

await page.setViewportSize({ width: 380, height: 780 });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'secant-phone.png'), fullPage: true });
const phone = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
  lab: window.__flux.state.lab,
}));

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5178/#/mac2311/u4/riemann', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'riemann');
await page.waitForTimeout(400);
const riemann = await page.evaluate(() => ({
  sum: window.__flux.computed.sum,
  exact: window.__flux.computed.exact,
  agree: window.__flux.computed.agree,
  n: window.__flux.state.n,
}));
await page.selectOption('#rm-sample', 'mid');
await page.waitForTimeout(200);
const mid = await page.evaluate(() => ({
  sample: window.__flux.state.sample,
  sum: window.__flux.computed.sum,
}));

await page.goto('http://localhost:5178/#/mac2311/u4/accum', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'accum');
await settle();
const accum = await page.evaluate(() => ({
  x: window.__flux.state.x,
  area: window.__flux.computed.area,
  height: window.__flux.computed.height,
  agree: window.__flux.computed.agree,
}));
await page.screenshot({ path: path.join(out, 'ftc-accum.png'), fullPage: true });
await page.fill('#ac-x', '1.5');
await page.dispatchEvent('#ac-x', 'input');
await page.waitForTimeout(150);
const later = await page.evaluate(() => ({
  x: window.__flux.state.x,
  area: window.__flux.computed.area,
  height: window.__flux.computed.height,
  agree: window.__flux.computed.agree,
}));
await page.selectOption('#scenario', 'line');
await page.waitForTimeout(200);
const line = await page.evaluate(() => ({
  area: window.__flux.computed.area,
  height: window.__flux.computed.height,
  agree: window.__flux.computed.agree,
}));
await page.selectOption('#scenario', 'sine');
await page.waitForTimeout(200);
const sine = await page.evaluate(() => ({
  area: window.__flux.computed.area,
  height: window.__flux.computed.height,
  agree: window.__flux.computed.agree,
}));
await page.setViewportSize({ width: 380, height: 780 });
await page.waitForTimeout(300);
const accumPhone = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
  lab: window.__flux.state.lab,
}));
await page.screenshot({ path: path.join(out, 'ftc-accum-380.png'), fullPage: true });
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto('http://localhost:5178/#/mac2311/u1/limits', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'limits');
await page.waitForTimeout(400);
const hole = await page.evaluate(() => ({
  scenario: window.__flux.state.scenarioId,
  limit: window.__flux.computed.limit,
  value: window.__flux.computed.value,
  exists: window.__flux.computed.exists,
  agree: window.__flux.computed.agree,
}));
await page.screenshot({ path: path.join(out, 'limits-hole.png'), fullPage: true });
await page.selectOption('#scenario', 'jump');
await page.waitForTimeout(200);
const jump = await page.evaluate(() => ({
  left: window.__flux.computed.left,
  right: window.__flux.computed.right,
  exists: window.__flux.computed.exists,
}));
await page.selectOption('#scenario', 'line');
await page.waitForTimeout(150);
await page.fill('#lim-h', '0.1');
await page.dispatchEvent('#lim-h', 'input');
await page.fill('#lim-eps', '0.5');
await page.dispatchEvent('#lim-eps', 'input');
await page.waitForTimeout(150);
const inside = await page.evaluate(() => ({
  inside: window.__flux.computed.inside,
  delta: window.__flux.computed.delta,
}));
await page.fill('#lim-eps', '0.1');
await page.dispatchEvent('#lim-eps', 'input');
await page.waitForTimeout(150);
const tight = await page.evaluate(() => ({
  inside: window.__flux.computed.inside,
  delta: window.__flux.computed.delta,
}));
await page.setViewportSize({ width: 380, height: 780 });
await page.waitForTimeout(300);
const limitsPhone = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
  lab: window.__flux.state.lab,
}));

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5178/#/mac2311/u2/rates', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'rates');
await settle();
const ladder = await page.evaluate(() => ({
  y: window.__flux.computed.y,
  dy: window.__flux.computed.dy,
  agree: window.__flux.computed.agree,
  x: window.__flux.state.x,
}));
await page.screenshot({ path: path.join(out, 'rates-ladder.png'), fullPage: true });
await page.selectOption('#scenario', 'steep');
await page.waitForTimeout(200);
const steep = await page.evaluate(() => Math.abs(window.__flux.computed.dy));
await page.selectOption('#scenario', 'flat');
await page.waitForTimeout(200);
const flat = await page.evaluate(() => ({
  x: window.__flux.state.x,
  dy: window.__flux.computed.dy,
  agree: window.__flux.computed.agree,
}));
await page.fill('#ld-v', '1');
await page.dispatchEvent('#ld-v', 'input');
await page.waitForTimeout(150);
const half = await page.evaluate(() => window.__flux.computed.dy);
await page.setViewportSize({ width: 380, height: 780 });
await page.waitForTimeout(300);
const ratesPhone = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
  lab: window.__flux.state.lab,
}));
await page.screenshot({ path: path.join(out, 'rates-ladder-380.png'), fullPage: true });

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5178/#/mac2311/u3/box', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'box');
await settle();
const box = await page.evaluate(() => ({
  x: window.__flux.state.x,
  v: window.__flux.computed.v,
  dv: window.__flux.computed.dv,
  vmax: window.__flux.computed.vmax,
  best: window.__flux.computed.best,
  agree: window.__flux.computed.agree,
}));
await page.screenshot({ path: path.join(out, 'open-box.png'), fullPage: true });
await page.selectOption('#scenario', 'peak');
await page.waitForTimeout(200);
const peak = await page.evaluate(() => ({
  x: window.__flux.state.x,
  v: window.__flux.computed.v,
  dv: window.__flux.computed.dv,
  agree: window.__flux.computed.agree,
}));
await page.selectOption('#scenario', 'deep');
await page.waitForTimeout(200);
const deep = await page.evaluate(() => ({
  x: window.__flux.state.x,
  v: window.__flux.computed.v,
  dv: window.__flux.computed.dv,
  agree: window.__flux.computed.agree,
}));
await page.setViewportSize({ width: 380, height: 780 });
await page.waitForTimeout(300);
const boxPhone = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
  lab: window.__flux.state.lab,
}));
await page.screenshot({ path: path.join(out, 'open-box-380.png'), fullPage: true });

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5178/#/mac2311/u1/limits', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'limits');
await page.goBack();
await page.waitForTimeout(400);
const back = await page.evaluate(() => location.hash);

await browser.close();

const fail = [];
if (first.lab !== 'secant') fail.push(`lab ${first.lab}`);
if (first.scenario !== 'quad') fail.push(`scenario ${first.scenario}`);
if (!Number.isFinite(first.fp) || Math.abs(first.fp - 2) > 1e-6) fail.push(`fp ${first.fp}`);
if (first.agree !== true) fail.push('secant routes disagree');
if (corner.scenario !== 'abs') fail.push(`corner scenario ${corner.scenario}`);
if (Number.isFinite(corner.fp)) fail.push(`|x| at 0 should have no derivative, got ${corner.fp}`);
if (!(corner.left < 0 && corner.right > 0)) fail.push(`one-sided slopes ${corner.left}, ${corner.right}`);
if (Math.abs(smallH.x0 - 1) > 1e-9) fail.push(`x0 ${smallH.x0}`);
if (Math.abs(smallH.h - 0.05) > 1e-9) fail.push(`h ${smallH.h}`);
if (Math.abs(smallH.fp - 2) > 1e-6) fail.push(`fp after reset ${smallH.fp}`);
if (Math.abs(smallH.msec - smallH.fp) > 0.15) fail.push(`small h secant ${smallH.msec} vs ${smallH.fp}`);
if (camBefore === camAfter) fail.push('dragging empty canvas did not orbit the camera');
if (!practiceOpen) fail.push('practice did not open');
if (phone.scroll > phone.client + 1) fail.push(`380px scrolls sideways (${phone.scroll} > ${phone.client})`);
if (!Number.isFinite(riemann.sum) || !riemann.agree) fail.push(`riemann ${JSON.stringify(riemann)}`);
if (Math.abs(riemann.exact - 1 / 3) > 1e-9) fail.push(`exact ${riemann.exact}`);
if (mid.sample !== 'mid') fail.push(`sample ${mid.sample}`);
if (!(Math.abs(mid.sum - riemann.sum) > 1e-6)) fail.push('midpoint sum did not move');
if (!accum.agree || Math.abs(accum.area - 1 / 3) > 1e-6 || Math.abs(accum.height - 1) > 1e-9) fail.push(`accum ${JSON.stringify(accum)}`);
if (!later.agree || Math.abs(later.x - 1.5) > 1e-9 || Math.abs(later.height - 2.25) > 1e-6 || Math.abs(later.area - 1.125) > 1e-6) {
  fail.push(`later ${JSON.stringify(later)}`);
}
if (!(later.height > accum.height)) fail.push('moving right did not raise the height');
if (!line.agree || Math.abs(line.area - 2) > 1e-6 || Math.abs(line.height - 3) > 1e-9) fail.push(`line ${JSON.stringify(line)}`);
if (!sine.agree || Math.abs(sine.area - 1) > 1e-6 || Math.abs(sine.height - 1) > 1e-6) fail.push(`sine ${JSON.stringify(sine)}`);
if (accumPhone.scroll > accumPhone.client + 1) fail.push(`ftc 380px scrolls (${accumPhone.scroll} > ${accumPhone.client})`);
if (hole.scenario !== 'hole') fail.push(`limits scenario ${hole.scenario}`);
if (!hole.agree || hole.exists !== true || !Number.isFinite(hole.limit)) fail.push(`hole ${JSON.stringify(hole)}`);
if (Number.isFinite(hole.value)) fail.push(`hole value ${hole.value}`);
if (jump.exists !== false || jump.left !== 0 || jump.right !== 1) fail.push(`jump ${JSON.stringify(jump)}`);
if (inside.inside !== true || Math.abs(inside.delta - 0.25) > 1e-9) fail.push(`band ${JSON.stringify(inside)}`);
if (tight.inside !== false || Math.abs(tight.delta - 0.05) > 1e-9) fail.push(`tight band ${JSON.stringify(tight)}`);
if (limitsPhone.scroll > limitsPhone.client + 1) fail.push(`limits 380px scrolls (${limitsPhone.scroll} > ${limitsPhone.client})`);
if (!ladder.agree || Math.abs(ladder.y - 8) > 1e-6 || Math.abs(ladder.dy + 1.5) > 1e-6) fail.push(`ladder ${JSON.stringify(ladder)}`);
if (!(flat.x === 8 && flat.agree && Math.abs(flat.dy) > steep)) fail.push(`flat ${JSON.stringify(flat)} vs steep ${steep}`);
if (Math.abs(half - flat.dy / 2) > 1e-6) fail.push(`half speed ${half} vs ${flat.dy}`);
if (ratesPhone.scroll > ratesPhone.client + 1) fail.push(`ladder 380px scrolls (${ratesPhone.scroll} > ${ratesPhone.client})`);
if (!box.agree || !(box.dv > 0) || !(box.v < box.vmax) || Math.abs(box.best - 2) > 1e-9) fail.push(`box ${JSON.stringify(box)}`);
if (!peak.agree || Math.abs(peak.x - 2) > 1e-9 || Math.abs(peak.v - 128) > 1e-6 || Math.abs(peak.dv) > 1e-6) fail.push(`peak ${JSON.stringify(peak)}`);
if (!deep.agree || deep.x !== 4 || !(deep.dv < 0) || !(deep.v < peak.v)) fail.push(`deep ${JSON.stringify(deep)}`);
if (boxPhone.scroll > boxPhone.client + 1) fail.push(`box 380px scrolls (${boxPhone.scroll} > ${boxPhone.client})`);
if (back !== '#/mac2311/u3/box') fail.push(`back hash ${back}`);
if (errors.length) fail.push(`page errors: ${errors.join(' | ')}`);

console.log({ first, corner, smallH, practiceOpen, phone, riemann, mid, accum, later, line, sine, accumPhone, hole, jump, inside, tight, ladder, steep, flat, half, limitsPhone, ratesPhone, box, peak, deep, boxPhone, back, errors });
if (fail.length) {
  console.error('VERIFY FAIL', fail);
  process.exit(1);
}
console.log('verify ok');
