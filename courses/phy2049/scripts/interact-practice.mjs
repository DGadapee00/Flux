/**
 * Drive the practice panel at 1440 and 380 wide: the list, opening a problem, a hint, a wrong answer, the solution, the notes link, back to the list, a mixed set and a practice exam; prints the stored progress too.
 *
 *   node scripts/interact-practice.mjs [--seed progress.json] > out.json
 *
 * --seed loads a {key: value} map into localStorage before the app starts: a returning student.
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
const out = {};
const errors = [];
async function run(width, height, tag) {
  const page = await b.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(FREEZE);
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
  const store = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
  const step = async (name, fn) => { try { await fn(); } catch (e) { out[`${tag}:${name}:ERR`] = String(e).split('\n')[0]; } };
  await page.goto(`${BASE}#/phy2049/e1/vectors`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gauss?.state?.lab, null, { polling: 100 });
  await settle(600);
  await page.click('#btn-practice'); await settle(500);
  out[`${tag}:list`] = await text('#problems');
  out[`${tag}:badge`] = await page.$eval('#practice-due', (e) => e.hidden + '|' + e.textContent).catch(() => '(none)');
  await step('open', async () => { await page.click('[data-open="e1.v.mag-dir"]'); await settle(900); });
  out[`${tag}:problem`] = await text('#problems');
  out[`${tag}:body`] = await page.evaluate(() => document.body.className);
  await step('hint', async () => { await page.click('[data-act="hint"]'); await settle(300); });
  out[`${tag}:hinted`] = await text('#problems');
  await step('wrong', async () => { for (const i of await page.$$('#problems .pb-input')) await i.fill('1'); await page.click('[data-act="check"]'); await settle(400); });
  out[`${tag}:wrong`] = await text('#problems');
  await step('reveal', async () => { await page.click('[data-act="reveal"]'); await settle(500); });
  out[`${tag}:revealed`] = await text('#problems');
  out[`${tag}:store`] = await store();
  await step('notes', async () => { await page.click('.pb-notes'); await settle(700); });
  out[`${tag}:notesOpen`] = await page.evaluate(() => ({ body: document.body.className, hidden: document.getElementById('notes').hidden }));
  await page.click('#btn-practice').catch(() => {}); await settle(400);
  await step('back', async () => { await page.click('.pb-back'); await settle(400); });
  out[`${tag}:listAfter`] = await text('#problems');
  await step('mixed', async () => { await page.click('[data-act="mixed"]'); await settle(900); });
  out[`${tag}:mixed`] = await text('#problems');
  await step('exam', async () => { await page.click('[data-act="list"]').catch(() => {}); await settle(300); await page.click('[data-act="exam-start"]'); await settle(1200); });
  out[`${tag}:exam`] = await text('#problems');
  out[`${tag}:examBody`] = await page.evaluate(() => document.body.className);
  out[`${tag}:examStore`] = await store();
  await page.close();
}
await run(1440, 900, 'wide');
await run(380, 820, 'phone');
out.errors = errors;
console.log(JSON.stringify(out, null, 1));
await b.close();
