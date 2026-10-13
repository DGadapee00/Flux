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

const labs = ['limits', 'riemann1'];
const snap = {};

await page.goto('http://localhost:5175/#/ch1/limits', { waitUntil: 'networkidle', timeout: 30000 });

for (const id of labs) {
  await page.evaluate((h) => {
    location.hash = h;
  }, `#/ch1/${id}`);
  await page.waitForFunction((lab) => window.__flux?.state?.lab === lab, id, { timeout: 15000 });
  await page.waitForTimeout(500);
  snap[id] = await page.evaluate(() => {
    const c = window.__flux.computed;
    return {
      lab: window.__flux.state.lab,
      fp: c.fp,
      dq: c.dq,
      f0: c.f0,
      sum: c.sum,
      Isimp: c.Isimp,
      Iclosed: c.Iclosed,
      Lsimp: c.Lsimp,
      agree: c.agree,
    };
  });
  await page.screenshot({ path: path.join(out, `${id}.png`), fullPage: true });
}

await page.evaluate(() => {
  location.hash = '#/ch1/limits';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'limits');
await page.selectOption('#scenario', 'hole');
await page.waitForTimeout(400);
const holeLive = await page.evaluate(() => ({
  scenario: window.__flux.state.scenarioId,
  graphId: window.__flux.state.graphId,
  lim: window.__flux.computed.lim,
  f0: window.__flux.computed.f0,
  cont: window.__flux.computed.cont,
}));
await page.screenshot({ path: path.join(out, 'limits-hole.png'), fullPage: true });

await page.evaluate(() => {
  location.hash = '#/ch1/riemann1';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'riemann1');
await page.selectOption('#scenario', 'semi');
await page.waitForTimeout(400);
const semiLive = await page.evaluate(() => ({
  graphId: window.__flux.state.graphId,
  Iclosed: window.__flux.computed.Iclosed,
  agreeL: window.__flux.computed.agreeL,
}));
await page.screenshot({ path: path.join(out, 'riemann1-semi.png'), fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => {
  location.hash = '#/ch1/limits';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'limits');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'limits-phone.png'), fullPage: true });

await browser.close();

const fail = [];
if (snap.limits.lab !== 'limits' || !Number.isFinite(snap.limits.fp)) fail.push('limits');
if (snap.riemann1.lab !== 'riemann1' || !Number.isFinite(snap.riemann1.Iclosed)) fail.push('riemann1');
if (holeLive.graphId !== 'hole' || Math.abs(holeLive.lim - 2) > 0.05) fail.push('limits-hole');
if (semiLive.graphId !== 'semi' || Math.abs(semiLive.Iclosed - Math.PI / 2) > 0.05) fail.push('riemann1-semi');
if (errors.length) fail.push(`errors: ${errors.join(' | ')}`);

console.log(JSON.stringify({ snap, holeLive, semiLive, errors }, null, 2));
if (fail.length) {
  console.error('VERIFY FAIL', fail);
  process.exit(1);
}
console.log('verify-ch1 ok');
