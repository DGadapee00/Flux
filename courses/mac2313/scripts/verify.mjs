import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './playwright.mjs';

const out = path.resolve('scripts/output');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto('http://localhost:5175/#/ch2/gradient', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForFunction(() => window.__flux?.state?.lab === 'gradient', null, { timeout: 15000 });
await page.waitForTimeout(600);

const first = await page.evaluate(() => {
  const c = window.__flux.computed;
  return { lab: window.__flux.state.lab, f: c.f, fx: c.fx, fy: c.fy, Du: c.Du, Dq: c.Dq, scenario: window.__flux.state.scenarioId };
});
await page.screenshot({ path: path.join(out, 'gradient-desktop.png'), fullPage: true });

await page.selectOption('#scenario', 'saddle');
await page.waitForTimeout(400);
const saddle = await page.evaluate(() => ({
  scenario: window.__flux.state.scenarioId,
  f: window.__flux.computed.f,
  fx: window.__flux.computed.fx,
}));

await page.fill('#g-th', '1.57');
await page.dispatchEvent('#g-th', 'input');
await page.waitForTimeout(200);
const afterTh = await page.evaluate(() => ({ theta: window.__flux.state.theta, Du: window.__flux.computed.Du }));

/*
 * Dragging empty canvas must orbit the camera and leave the probe alone; dragging the probe handle
 * must move the probe and leave the camera alone. pointerdown used to start a probe drag on any
 * left press, which switched OrbitControls off and made the view impossible to rotate by mouse.
 */
// OrbitControls has damping on (0.08), so the camera glides for a second or so after a drag.
// Without waiting for it to stop, the next measurement reads that glide as movement.
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
  page.evaluate(() => ({
    cam: [window.__flux.camera.position.x, window.__flux.camera.position.y, window.__flux.camera.position.z]
      .map((v) => +v.toFixed(3))
      .join(),
    probe: `${window.__flux.state.probe.x},${window.__flux.state.probe.y}`,
  }));

const emptyBefore = await snap();
await page.mouse.move(900, 220);
await page.mouse.down();
for (let i = 1; i <= 10; i++) await page.mouse.move(900 - i * 14, 220 + i * 5);
await page.mouse.up();
await settle();
const emptyAfter = await snap();

await settle();
const probeAt = await page.evaluate(() => window.__flux.probeScreen?.() ?? null);

let handleDrag = null;
if (probeAt) {
  await settle();
  const b4 = await snap();
  await page.mouse.move(probeAt.x, probeAt.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(probeAt.x + i * 11, probeAt.y - i * 5);
  await page.mouse.up();
  await settle();
  const a4 = await snap();
  handleDrag = { probeMoved: b4.probe !== a4.probe, camHeld: b4.cam === a4.cam };
}

const orbit = {
  camMoved: emptyBefore.cam !== emptyAfter.cam,
  probeHeld: emptyBefore.probe === emptyAfter.probe,
  handleDrag,
};

await page.click('#btn-practice');
await page.waitForTimeout(500);
const practiceOpen = await page.evaluate(() => document.body.classList.contains('practice-open'));
await page.screenshot({ path: path.join(out, 'gradient-practice.png'), fullPage: true });
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'gradient-phone.png'), fullPage: true });
const phone = await page.evaluate(() => {
  const read = document.getElementById('readout').getBoundingClientRect();
  const setup = document.getElementById('controls').getBoundingClientRect();
  return { readH: read.height, setupBottom: setup.bottom, viewH: window.innerHeight, lab: window.__flux.state.lab };
});

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('http://localhost:5175/#/ch1', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.goto('http://localhost:5175/#/ch2/gradient', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'gradient');
await page.goBack();
await page.waitForTimeout(400);
const back = await page.evaluate(() => location.hash);

await browser.close();

const fail = [];
if (first.lab !== 'gradient') fail.push(`lab ${first.lab}`);
if (!Number.isFinite(first.f)) fail.push('f not finite');
if (Math.abs(first.Du - first.Dq) > 0.05 * Math.max(1, Math.abs(first.Du))) fail.push(`Du ${first.Du} vs Dq ${first.Dq}`);
if (saddle.scenario !== 'saddle') fail.push(`scenario ${saddle.scenario}`);
if (!practiceOpen) fail.push('practice did not open');
if (!orbit.camMoved) fail.push('dragging empty canvas did not orbit the camera');
if (!orbit.probeHeld) fail.push('dragging empty canvas moved the probe');
if (orbit.handleDrag && !orbit.handleDrag.probeMoved) fail.push('dragging the probe handle did not move it');
if (orbit.handleDrag && !orbit.handleDrag.camHeld) fail.push('dragging the probe handle orbited the camera');
/*
 * Back lands on the unit's first lab, not on the bare unit hash: parseHash() resolves `#/ch1` to
 * exam.labs[0] and boot normalizes the URL with replaceState, so `#/ch1` is never what a history
 * entry holds. This asserted `#/ch1` and had never passed.
 */
if (back !== '#/ch1/limits') fail.push(`back hash ${back}`);
if (errors.length) fail.push(`page errors: ${errors.join(' | ')}`);

console.log({ first, saddle, afterTh, orbit, practiceOpen, phone, back, errors });
if (fail.length) {
  console.error('VERIFY FAIL', fail);
  process.exit(1);
}
console.log('verify ok');
