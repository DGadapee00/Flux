import assert from 'node:assert/strict';
import { chromium } from './playwright.mjs';
const base = process.env.SMOKE_URL || 'http://localhost:5178/';
const legacy = process.env.LEGACY_URL || 'http://localhost:5179/';
const options = { headless: true };
if (process.env.CHROMIUM_EXECUTABLE)
  Object.assign(options, { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] });
const browser = await chromium.launch(options);
try {
  for (const width of [380, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 820 } });
    await context.addInitScript(() => {
      if (sessionStorage.getItem('merge-fixture')) return;
      sessionStorage.setItem('merge-fixture', '1');
      const record = {
        attempts: 4,
        solved: 3,
        clean: 2,
        box: 4,
        due: 123456,
        last: 500,
        lastSeed: 7,
        lastOk: true,
      };
      localStorage.setItem(
        'flux.mac2311.problems.v1',
        JSON.stringify({ v: 1, items: { 'u1.lim.poly': record } }),
      );
      localStorage.setItem(
        'flux.mac2312.problems.v1',
        JSON.stringify({ v: 1, items: { 'u1.vol.disk': record } }),
      );
      localStorage.setItem(
        'flux.mac2312.exam.v1',
        JSON.stringify({
          examId: 'u1',
          items: [{ id: 'u1.vol.disk', seed: 7, inputs: { V: '8*pi' } }],
          i: 0,
          done: false,
          startedAt: 500,
          endsAt: 9999999999999,
        }),
      );
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${legacy}#/u1/solids?p=u1.vol.disk&s=7`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(
      (url) => url.pathname === new URL(base).pathname && url.hash.includes('p=ii.u1.vol.disk'),
    );
    await page.waitForSelector('.pb-part');
    assert.ok(page.url().includes('/c3/solids'));
    const data = await page.evaluate(() => ({
      i: JSON.parse(localStorage.getItem('flux.mac2311.problems.v1')),
      ii: JSON.parse(localStorage.getItem('flux.mac2312.problems.v1')),
      exam: JSON.parse(localStorage.getItem('flux.mac2311.exam.v1')),
    }));
    assert.equal(data.i.items['u1.lim.poly'].box, 4);
    assert.equal(data.i.items['ii.u1.vol.disk'].lastSeed, 7);
    assert.equal(data.ii.items['u1.vol.disk'].attempts, 4);
    assert.equal(data.exam.items[0].id, 'ii.u1.vol.disk');
    assert.equal(data.exam.items[0].inputs.V, '8*pi');
    await page.goto(`${base}#/mac2311/u2/secant?n=s7`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#notes .nt-show');
    assert.ok(page.url().includes('/c1/secant?n=s12'), page.url());
    assert.equal(await page.locator('#notes .katex-error').count(), 0);
    await page.goto(`${legacy}#/mac2312/u2/improper?n=s6`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL((url) => url.hash.includes('/c6/improper?n=s2'));
    await page.waitForSelector('#notes .nt-show');
    await page.goto(`${legacy}#/mac2312/u4/polar`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL((url) => url.hash.includes('/c5/polar'));
    await page.waitForFunction(() => window.__flux?.app.labId === 'polar');
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    'verify: legacy I/II links, notes anchors, seeded problems, review queues and a saved exam survive at both sizes',
  );
} finally {
  await browser.close();
}
