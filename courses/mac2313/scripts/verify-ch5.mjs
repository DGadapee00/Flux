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

const labs = ['triple', 'cyl', 'sph'];
const snap = {};

await page.goto('http://localhost:5175/#/ch5/triple', { waitUntil: 'networkidle', timeout: 30000 });

for (const id of labs) {
  await page.evaluate((h) => {
    location.hash = h;
  }, `#/ch5/${id}`);
  await page.waitForFunction((lab) => window.__flux?.state?.lab === lab, id, { timeout: 15000 });
  await page.waitForTimeout(600);
  snap[id] = await page.evaluate(() => {
    const c = window.__flux.computed;
    return {
      lab: window.__flux.state.lab,
      sum: c.sum,
      Ixyz: c.Ixyz,
      Izyx: c.Izyx,
      Icyl: c.Icyl,
      Icart: c.Icart,
      Isph: c.Isph,
      closed: c.closed,
      agree: c.agree,
    };
  });
  await page.screenshot({ path: path.join(out, `${id}.png`), fullPage: true });
}

await page.evaluate(() => {
  location.hash = '#/ch5/triple';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'triple');
await page.selectOption('#scenario', 'xyz');
await page.waitForTimeout(500);
const xyzLive = await page.evaluate(() => ({
  scenario: window.__flux.state.scenarioId,
  closed: window.__flux.computed.closed,
  Ixyz: window.__flux.computed.Ixyz,
  agree: window.__flux.computed.agree,
}));
await page.screenshot({ path: path.join(out, 'triple-xyz.png'), fullPage: true });

await page.evaluate(() => {
  location.hash = '#/ch5/sph';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'sph');
await page.selectOption('#scenario', 'z');
await page.waitForTimeout(500);
const sphZ = await page.evaluate(() => ({
  fieldId: window.__flux.state.fieldId,
  closed: window.__flux.computed.closed,
  Isph: window.__flux.computed.Isph,
}));
await page.screenshot({ path: path.join(out, 'sph-z.png'), fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => {
  location.hash = '#/ch5/cyl';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'cyl');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'cyl-phone.png'), fullPage: true });

await browser.close();

const fail = [];
if (snap.triple.lab !== 'triple' || !Number.isFinite(snap.triple.Ixyz)) fail.push('triple');
if (snap.cyl.lab !== 'cyl' || Math.abs(snap.cyl.closed - Math.PI) > 0.05) fail.push('cyl');
if (snap.sph.lab !== 'sph' || Math.abs(snap.sph.closed - (4 / 3) * Math.PI) > 0.08) fail.push('sph');
if (xyzLive.scenario !== 'xyz' || Math.abs(xyzLive.closed - 0.125) > 0.01) fail.push('triple-xyz');
if (sphZ.fieldId !== 'zonly' || Math.abs(sphZ.closed) > 0.02) fail.push('sph-z');
if (errors.length) fail.push(`errors: ${errors.join(' | ')}`);

console.log(JSON.stringify({ snap, xyzLive, sphZ, errors }, null, 2));
if (fail.length) {
  console.error('VERIFY FAIL', fail);
  process.exit(1);
}
console.log('verify-ch5 ok');
