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

const labs = ['riemann', 'iterated', 'dpolar'];
const snap = {};

await page.goto('http://localhost:5175/#/ch3/riemann', { waitUntil: 'networkidle', timeout: 30000 });

for (const id of labs) {
  await page.evaluate((h) => {
    location.hash = h;
  }, `#/ch3/${id}`);
  await page.waitForFunction((lab) => window.__flux?.state?.lab === lab, id, { timeout: 15000 });
  await page.waitForTimeout(500);
  snap[id] = await page.evaluate(() => {
    const c = window.__flux.computed;
    return {
      lab: window.__flux.state.lab,
      sum: c.sum,
      Ixy: c.Ixy,
      Iyx: c.Iyx,
      Ipolar: c.Ipolar,
      Icart: c.Icart,
      closed: c.closed,
      agree: c.agree,
      err: c.err,
    };
  });
  await page.screenshot({ path: path.join(out, `${id}.png`), fullPage: true });
}

await page.evaluate(() => {
  location.hash = '#/ch3/riemann';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'riemann');
await page.fill('#rm-n', '8');
await page.dispatchEvent('#rm-n', 'input');
await page.waitForTimeout(300);
const riemannN = await page.evaluate(() => ({
  n: window.__flux.state.n,
  sum: window.__flux.computed.sum,
  closed: window.__flux.computed.closed,
  agree: window.__flux.computed.agree,
}));
await page.screenshot({ path: path.join(out, 'riemann-n8.png'), fullPage: true });

await page.evaluate(() => {
  location.hash = '#/ch3/iterated';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'iterated');
await page.selectOption('#scenario', 'disk-one');
await page.waitForTimeout(400);
const diskLive = await page.evaluate(() => ({
  region: window.__flux.state.region,
  Ixy: window.__flux.computed.Ixy,
  Iyx: window.__flux.computed.Iyx,
  closed: window.__flux.computed.closed,
  agree: window.__flux.computed.agree,
}));
await page.screenshot({ path: path.join(out, 'iterated-disk.png'), fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => {
  location.hash = '#/ch3/riemann';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'riemann');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'riemann-phone.png'), fullPage: true });

await browser.close();

const fail = [];
if (snap.riemann.lab !== 'riemann' || !Number.isFinite(snap.riemann.sum)) fail.push('riemann');
if (snap.iterated.lab !== 'iterated' || !Number.isFinite(snap.iterated.Ixy)) fail.push('iterated');
if (snap.dpolar.lab !== 'dpolar' || !Number.isFinite(snap.dpolar.Ipolar)) fail.push('dpolar');
if (riemannN.n !== 8 || !riemannN.agree) fail.push('riemann-n8');
if (diskLive.region !== 'disk' || !diskLive.agree) fail.push('iterated-disk');
if (Math.abs(diskLive.closed - Math.PI) > 0.05) fail.push('disk-area');
if (errors.length) fail.push(`errors: ${errors.join(' | ')}`);

console.log(JSON.stringify({ snap, riemannN, diskLive, errors }, null, 2));
if (fail.length) {
  console.error('VERIFY FAIL', fail);
  process.exit(1);
}
console.log('verify-ch3 ok');
