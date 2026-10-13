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

const labs = ['polar', 'parametric', 'partials', 'extrema', 'chain', 'gradient'];
const snap = {};

await page.goto('http://localhost:5175/#/ch2/polar', { waitUntil: 'networkidle', timeout: 30000 });

for (const id of labs) {
  await page.evaluate((h) => {
    location.hash = h;
  }, `#/ch2/${id}`);
  await page.waitForFunction((lab) => window.__flux?.state?.lab === lab, id, { timeout: 15000 });
  await page.waitForTimeout(500);
  snap[id] = await page.evaluate(() => {
    const c = window.__flux.computed;
    return { lab: window.__flux.state.lab, keys: Object.keys(c).slice(0, 12), f: c.f, r: c.r, x: c.x, D: c.D, Lsimp: c.Lsimp, fx: c.fx, gp: c.gp, hs: c.hs, err: c.err };
  });
  await page.screenshot({ path: path.join(out, `${id}.png`), fullPage: true });
}

await page.evaluate(() => {
  location.hash = '#/ch2/partials';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'partials');
await page.selectOption('#scenario', 'prod2');
await page.waitForTimeout(300);
await page.fill('#pa-x0', '1.2');
await page.dispatchEvent('#pa-x0', 'input');
await page.fill('#pa-y0', '-0.4');
await page.dispatchEvent('#pa-y0', 'input');
await page.waitForTimeout(300);
const partialsLive = await page.evaluate(() => {
  const s = window.__flux.state;
  const c = window.__flux.computed;
  return {
    scenario: s.scenarioId,
    x: s.probe.x,
    y: s.probe.y,
    fxy: c.fxy,
    fxyN: c.fxyN,
    fyxFromFy: c.fyxFromFy,
    agree: c.agree,
  };
});
await page.screenshot({ path: path.join(out, 'partials-prod2.png'), fullPage: true });

await page.evaluate(() => {
  location.hash = '#/ch2/chain';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'chain');
await page.selectOption('#scenario', 'xy-polar');
await page.waitForTimeout(400);
await page.fill('#ch-s', '1.2');
await page.dispatchEvent('#ch-s', 'input');
await page.waitForTimeout(300);
const chainLive = await page.evaluate(() => {
  const s = window.__flux.state;
  const c = window.__flux.computed;
  return {
    scenario: s.scenarioId,
    mode: s.mode,
    s: s.s,
    hs: c.hs,
    ht: c.ht,
    hsQ: c.hsQ,
    agree: c.agree,
  };
});
await page.screenshot({ path: path.join(out, 'chain-polar.png'), fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => {
  location.hash = '#/ch2/partials';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'partials');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'partials-phone.png'), fullPage: true });
await page.evaluate(() => {
  location.hash = '#/ch2/polar';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'polar');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'polar-phone.png'), fullPage: true });

await browser.close();

const fail = [];
if (snap.polar.lab !== 'polar' || !(snap.polar.r > 0)) fail.push('polar');
if (snap.parametric.lab !== 'parametric' || !Number.isFinite(snap.parametric.Lsimp)) fail.push('parametric');
if (snap.partials.lab !== 'partials' || !Number.isFinite(snap.partials.fx)) fail.push('partials');
if (snap.extrema.lab !== 'extrema' || !Number.isFinite(snap.extrema.D)) fail.push('extrema');
if (snap.chain.lab !== 'chain' || !Number.isFinite(snap.chain.gp)) fail.push('chain');
if (snap.gradient.lab !== 'gradient' || !Number.isFinite(snap.gradient.f)) fail.push('gradient');
if (partialsLive.scenario !== 'prod2' || !partialsLive.agree) fail.push('partials-prod2');
if (Math.abs(partialsLive.fxy - 2 * 1.2) > 0.02) fail.push('partials-fxy');
if (chainLive.mode !== 'map' || !chainLive.agree || !Number.isFinite(chainLive.hs)) fail.push('chain-polar');
if (errors.length) fail.push(`errors: ${errors.join(' | ')}`);

console.log(JSON.stringify({ snap, partialsLive, chainLive, errors }, null, 2));
if (fail.length) {
  console.error('VERIFY FAIL', fail);
  process.exit(1);
}
console.log('verify-ch2 ok');
