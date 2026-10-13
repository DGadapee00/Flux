/**
 * Math wider than the phone column. Opens every problem at 380px with the solution revealed (and
 * every notes chapter with its solutions open) and reports any equation that does not fit its box:
 * the page itself never scrolls sideways, so the smoke test cannot see a clipped result.
 *
 * Needs the dev server on 5175.   node scripts/overflow.mjs [--seeds 0,5,17]
 */
import { chromium } from './playwright.mjs';
import { PROBLEMS } from '../src/problems/index.js';
import { NOTES } from '../src/notes/index.js';

const BASE = process.env.SMOKE_URL || 'http://localhost:5175/';
const seedsArg = process.argv.indexOf('--seeds');
const SEEDS = seedsArg > 0 ? process.argv[seedsArg + 1].split(',').map(Number) : [0, 5, 17];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 380, height: 800 } });
const measure = () =>
  page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.disp, .katex')) {
      if (el.closest('.scroll-x')) continue; // tables scroll sideways on purpose
      if (el.classList.contains('katex') && el.closest('.disp')) continue;
      const box = el.closest('.disp') || el.parentElement;
      const over = el.classList.contains('disp') ? el.scrollWidth - el.clientWidth : el.getBoundingClientRect().right - document.querySelector('main').getBoundingClientRect().right + 16;
      if (over > 2) out.push({ over: Math.round(over), text: el.textContent.slice(0, 60) });
    }
    return out;
  });

let bad = 0;
const byCh = {};
for (const t of PROBLEMS) {
  for (const s of SEEDS) {
    await page.goto(`${BASE}#/final?p=${t.id}&s=${s}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(60);
    const reveal = page.locator('[data-act="reveal"]');
    if (await reveal.count()) await reveal.click();
    await page.waitForTimeout(40);
    const o = await measure();
    if (o.length) {
      bad++;
      byCh[t.ch] = (byCh[t.ch] || 0) + 1;
      console.log(`${t.id} s=${s}: ${o.length} too wide, worst +${Math.max(...o.map((x) => x.over))}px, ${o.map((x) => x.kind).join(" ")} — ${o[0].text}`);
      break;
    }
  }
}
for (const N of NOTES) {
  await page.goto(`${BASE}#/final/notes/${N.ch}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(80);
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  await page.waitForTimeout(60);
  const o = await measure();
  if (o.length) {
    bad++;
    console.log(`notes ch${N.ch}: ${o.length} too wide, worst +${Math.max(...o.map((x) => x.over))}px, ${o.map((x) => x.kind).join(" ")} — ${o[0].text}`);
  }
}
console.log(`overflow: ${bad} screens with math wider than 380px`, byCh);
await browser.close();
process.exit(bad ? 1 : 0);
