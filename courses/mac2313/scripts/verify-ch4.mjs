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
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});

const labs = ['r3', 'space', 'partials3'];
const snap = {};

await page.goto('http://localhost:5175/#/ch4/r3', { waitUntil: 'networkidle', timeout: 30000 });

for (const id of labs) {
  await page.evaluate((h) => {
    location.hash = h;
  }, `#/ch4/${id}`);
  await page.waitForFunction((lab) => window.__flux?.state?.lab === lab, id, { timeout: 15000 });
  await page.waitForTimeout(500);
  snap[id] = await page.evaluate(() => {
    const c = window.__flux.computed;
    return {
      lab: window.__flux.state.lab,
      du: c.du,
      area: c.area,
      Lsimp: c.Lsimp,
      speed: c.speed,
      fx: c.fx,
      fy: c.fy,
      fz: c.fz,
      agree: c.agree,
      z: c.z,
    };
  });
  await page.screenshot({ path: path.join(out, `${id}.png`), fullPage: true });
}

await page.evaluate(() => {
  location.hash = '#/ch4/r3';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'r3');
await page.selectOption('#scenario', 'generic');
await page.waitForTimeout(400);
const r3Live = await page.evaluate(() => ({
  scenario: window.__flux.state.scenarioId,
  du: window.__flux.computed.du,
  duP: window.__flux.computed.duP,
  area: window.__flux.computed.area,
  areaB: window.__flux.computed.areaB,
  agree: window.__flux.computed.agree,
}));
await page.screenshot({ path: path.join(out, 'r3-generic.png'), fullPage: true });

await page.evaluate(() => {
  location.hash = '#/ch4/space';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'space');
await page.selectOption('#scenario', 'coil');
await page.waitForTimeout(400);
const coilLive = await page.evaluate(() => ({
  curveId: window.__flux.state.curveId,
  speed: window.__flux.computed.speed,
  agree: window.__flux.computed.agree,
}));
await page.screenshot({ path: path.join(out, 'space-coil.png'), fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => {
  location.hash = '#/ch4/r3';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'r3');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'r3-phone.png'), fullPage: true });

await browser.close();

const fail = [];
if (snap.r3.lab !== 'r3' || !Number.isFinite(snap.r3.du)) fail.push('r3');
if (snap.space.lab !== 'space' || !Number.isFinite(snap.space.Lsimp)) fail.push('space');
if (snap.partials3.lab !== 'partials3' || !Number.isFinite(snap.partials3.fx)) fail.push('partials3');
if (!r3Live.agree || r3Live.scenario !== 'generic') fail.push('r3-generic');
if (coilLive.curveId !== 'coil' || Math.abs(coilLive.speed - Math.sqrt(5)) > 0.02) fail.push('space-coil');
if (errors.length) fail.push(`errors: ${errors.join(' | ')}`);

console.log(JSON.stringify({ snap, r3Live, coilLive, errors }, null, 2));
if (fail.length) {
  console.error('VERIFY FAIL', fail);
  process.exit(1);
}
console.log('verify-ch4 ok');
