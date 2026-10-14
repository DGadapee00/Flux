import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './playwright.mjs';

const out = path.resolve('scripts/output');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
const fail = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

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

await page.goto('http://localhost:5179/#/mac2312/u1/solids', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForFunction(() => window.__flux?.state?.lab === 'solids', null, { timeout: 15000 });
await settle();

const first = await page.evaluate(() => {
  const c = window.__flux.computed;
  return {
    lab: window.__flux.state.lab,
    scenario: window.__flux.state.scenarioId,
    b: window.__flux.state.b,
    disk: c.disk,
    shell: c.shell,
    overPi: c.overPi,
    agree: c.agree,
  };
});
if (first.scenario !== 'disks') fail.push(`default scenario ${first.scenario}`);
if (!(Math.abs(first.disk - 8 * Math.PI) < 1e-6)) fail.push(`disk ${first.disk}`);
if (!(Math.abs(first.shell - 8 * Math.PI) < 1e-6)) fail.push(`shell ${first.shell}`);
if (!(Math.abs(first.overPi - 8) < 1e-6)) fail.push(`overPi ${first.overPi}`);
if (first.agree !== true) fail.push('disks do not agree');
await page.screenshot({ path: path.join(out, 'solids-desktop.png'), fullPage: true });

await page.selectOption('#scenario', 'shells');
await page.waitForTimeout(200);
const shells = await page.evaluate(() => ({
  scenario: window.__flux.state.scenarioId,
  method: window.__flux.state.method,
  agree: window.__flux.computed.agree,
  disk: window.__flux.computed.disk,
  shell: window.__flux.computed.shell,
}));
if (shells.scenario !== 'shells' || shells.method !== 'shells') fail.push(`shells scenario ${JSON.stringify(shells)}`);
if (shells.agree !== true) fail.push('shells scenario disagrees');
if (!(Math.abs(shells.disk - shells.shell) < 1e-6)) fail.push('shells volumes differ');

await page.fill('#sol-b', '2');
await page.dispatchEvent('#sol-b', 'input');
await page.waitForTimeout(200);
const half = await page.evaluate(() => ({
  b: window.__flux.state.b,
  disk: window.__flux.computed.disk,
  shell: window.__flux.computed.shell,
  agree: window.__flux.computed.agree,
}));
if (!(Math.abs(half.b - 2) < 1e-9)) fail.push(`b ${half.b}`);
if (!(Math.abs(half.disk - 2 * Math.PI) < 1e-6)) fail.push(`half disk ${half.disk}`);
if (!(Math.abs(half.shell - 2 * Math.PI) < 1e-6)) fail.push(`half shell ${half.shell}`);
if (half.agree !== true) fail.push('b=2 disagrees');

await page.setViewportSize({ width: 380, height: 780 });
await settle();
await page.screenshot({ path: path.join(out, 'solids-phone.png'), fullPage: true });
const phoneSolid = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));
if (phoneSolid.scroll > phoneSolid.client + 1) fail.push(`solids 380 scroll ${JSON.stringify(phoneSolid)}`);

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5179/#/mac2312/u3/taylor', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'taylor', null, { timeout: 15000 });
await settle();
const line = await page.evaluate(() => {
  const c = window.__flux.computed;
  return { n: window.__flux.state.n, x: window.__flux.state.x, poly: c.poly, err: c.err, agree: c.agree };
});
if (line.n !== 1) fail.push(`taylor order ${line.n}`);
if (!(Math.abs(line.poly - 0.5) < 1e-9)) fail.push(`P1 ${line.poly}`);
if (!(line.err > 0.01 && line.err < 0.03)) fail.push(`line error ${line.err}`);
if (line.agree !== true) fail.push('taylor line disagrees');
await page.screenshot({ path: path.join(out, 'taylor-desktop.png'), fullPage: true });

await page.fill('#tay-n', '5');
await page.dispatchEvent('#tay-n', 'input');
await page.waitForTimeout(200);
const fifth = await page.evaluate(() => ({
  n: window.__flux.state.n,
  poly: window.__flux.computed.poly,
  err: window.__flux.computed.err,
  agree: window.__flux.computed.agree,
}));
if (fifth.n !== 5) fail.push(`order ${fifth.n}`);
if (!(Math.abs(fifth.poly - 1841 / 3840) < 1e-9)) fail.push(`P5 ${fifth.poly}`);
if (!(fifth.err < line.err / 10)) fail.push(`order 5 error ${fifth.err} vs ${line.err}`);
if (fifth.agree !== true) fail.push('order 5 disagrees');

await page.selectOption('#scenario', 'shift');
await page.waitForTimeout(200);
const shift = await page.evaluate(() => ({
  scenario: window.__flux.state.scenarioId,
  a: window.__flux.state.a,
  poly: window.__flux.computed.poly,
  agree: window.__flux.computed.agree,
}));
if (shift.scenario !== 'shift') fail.push(`shift scenario ${shift.scenario}`);
if (!(Math.abs(shift.a - Math.PI / 2) < 1e-9)) fail.push(`centre ${shift.a}`);
if (!(Math.abs(shift.poly - 0.92) < 1e-9)) fail.push(`shifted poly ${shift.poly}`);
if (shift.agree !== true) fail.push('shift disagrees');

await page.setViewportSize({ width: 380, height: 780 });
await settle();
await page.screenshot({ path: path.join(out, 'taylor-phone.png'), fullPage: true });
const phoneTay = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));
if (phoneTay.scroll > phoneTay.client + 1) fail.push(`taylor 380 scroll ${JSON.stringify(phoneTay)}`);

await page.goto('http://localhost:5179/#/mac2312/u1/solids', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'solids', null, { timeout: 10000 });
await page.goBack();
await page.waitForTimeout(400);
const back = await page.evaluate(() => location.hash);
if (back !== '#/mac2312/u3/taylor') fail.push(`back hash ${back}`);

await browser.close();

if (errors.length) {
  console.error('page errors:', errors);
  process.exit(1);
}
if (fail.length) {
  console.error('verify failed:\n' + fail.map((f) => '  ' + f).join('\n'));
  process.exit(1);
}
console.log('verify ok', { disk: first.disk, lineErr: line.err, fifthErr: fifth.err, back });
