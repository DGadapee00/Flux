/**
 * Drive a predict card (try it, pick, make the change) on the vectors lab and a step-through derivation on the rc lab.
 *
 *   node scripts/interact-predict-derive.mjs > out.json
 *
 * Prints what a student sees as JSON, under the same virtual clock as compare.mjs, so two runs of the
 * same tree match exactly. Run it on each tree and diff the output: that is how a UI move is shown to
 * change nothing a student can see. Needs the dev server on port 5174 (FLUX_URL overrides it).
 */
import fs from 'node:fs';
import { FREEZE } from './compare-freeze.mjs';
import { chromium } from './playwright.mjs';

const BASE = process.env.FLUX_URL || 'http://localhost:5174/';
const seedFile = process.argv.includes('--seed') ? process.argv[process.argv.indexOf('--seed') + 1] : null;
const seed = seedFile ? JSON.parse(fs.readFileSync(seedFile, 'utf8')) : null;
const b = await chromium.launch({ headless: true });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript(FREEZE);
if (seed) {
  await page.addInitScript((entries) => {
    if (sessionStorage.getItem('flux-seeded')) return;
    sessionStorage.setItem('flux-seeded', '1');
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
  }, seed);
}
  if (seed) {
    // A returning student: progress written by an earlier visit, loaded once before the app starts.
    await page.addInitScript((entries) => {
      if (sessionStorage.getItem('flux-seeded')) return;
      sessionStorage.setItem('flux-seeded', '1');
      for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
    }, seed);
  }
const settle = async (ms) => { await page.waitForTimeout(150); await page.evaluate((n) => window.__advance(n), ms); };
const text = (sel) => page.$eval(sel, (e) => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => '(none)');
const out = {};
await page.goto(`${BASE}#/phy2049/e1/vectors`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__gauss?.state?.lab, null, { polling: 100 });
await settle(800);
out.predictIdle = await text('#predict');
await page.click('[data-pr="try"]'); await settle(2000);
out.predictTried = await text('#predict');
const ids = await page.$$eval('[data-pr-pick]', (els) => [...new Set(els.map((e) => e.dataset.prPick))]);
for (const id of ids) await page.click(`[data-pr-pick="${id}"]`);
await settle(300);
out.predictPicked = await text('#predict');
await page.click('[data-pr="change"]'); await settle(3000);
out.predictResult = await text('#predict');
out.vectorsLive = await text('#eq-live');
out.predictTally = await page.evaluate(() => localStorage.getItem('flux.phy2049.predict.v1') ?? JSON.stringify(Object.keys(localStorage)));
await page.evaluate(() => (location.hash = '#/phy2049/e4/rc'));
await page.waitForFunction(() => window.__gauss?.state?.lab === 'rc', null, { polling: 100 });
await settle(800);
out.openerHidden = await page.$eval('#eq-derive', (e) => e.hidden);
await page.click('#eq-derive'); await settle(800);
out.derive0 = await text('#derive');
const clicks = [];
for (let i = 0; i < 12; i++) {
  const opt = await page.$('.derive-opt:not([disabled])');
  if (!opt) break;
  await opt.click(); await settle(300);
  clicks.push(await text('#derive'));
}
out.deriveClicks = clicks.length;
out.deriveEnd = clicks[clicks.length - 1];
out.panelClass = await page.$eval('#eq-panel', (e) => e.className);
out.overlayChildren = await page.evaluate(() => window.__gauss.app?.scene?.children?.length ?? null);
out.errors = errors;
console.log(JSON.stringify(out, null, 1));
await b.close();
