#!/usr/bin/env node
/**
 * Browser smoke for PHY 2048, against the dev server (`npm run dev`, port 5180; SMOKE_URL overrides):
 * every unit opens, every built lab opens under every scenario at 1280×800 and 380×820, with no
 * console error, no sideways scroll, a law that typeset, and numbers on screen that are not NaN.
 */
import { EXAMS } from '../src/catalog.js';
import { COURSE } from '../src/engine/router.js';
import { chromium } from './playwright.mjs';

const base = process.env.SMOKE_URL || 'http://localhost:5180/';
const SIZES = [
  { width: 1280, height: 800 },
  { width: 380, height: 820 },
];
const fails = [];
const browser = await chromium.launch();
let views = 0;

for (const viewport of SIZES) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/fonts|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  const tag = `${viewport.width}px`;
  // A link, not the bare address: the bare address opens Practice, which folds Setup away.
  await page.goto(`${base}#/${COURSE}/u2/projectile`);
  await page.waitForFunction(() => window.__phy2048?.state?.lab === 'projectile', null, { timeout: 15000 });
  for (const unit of EXAMS) {
    for (const lab of unit.labs.length ? unit.labs : [null]) {
      const route = `#/${COURSE}/${unit.id}${lab ? `/${lab}` : ''}`;
      await page.evaluate((h) => { location.hash = h; }, route);
      await page.waitForFunction((id) => window.__phy2048?.state?.examId === id, unit.id, { timeout: 10000 });
      await page.waitForTimeout(250);
      const scenarios = lab ? await page.$$eval('#scenario option:not([disabled])', (os) => os.map((o) => o.value)) : [null];
      for (const scenario of scenarios) {
        if (scenario) {
          await page.evaluate((id) => {
            const el = document.getElementById('scenario');
            el.value = id;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }, scenario);
          await page.waitForTimeout(150);
        }
        views += 1;
        const where = `${tag} ${route}${scenario ? ` [${scenario}]` : ''}`;
        const seen = await page.evaluate(() => ({
          over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          text: document.body.innerText,
          lawError: !!document.querySelector('#law-line .katex-error'),
          bad: [...document.querySelectorAll('input')].filter((i) => {
            const size = parseFloat(getComputedStyle(i).fontSize);
            return i.offsetParent && size < 16;
          }).length,
        }));
        if (seen.over > 0) fails.push(`${where}: scrolls sideways by ${seen.over}px`);
        if (/NaN|undefined/.test(seen.text)) fails.push(`${where}: shows NaN or undefined`);
        if (seen.lawError) fails.push(`${where}: the law did not typeset`);
        if (seen.bad) fails.push(`${where}: ${seen.bad} input(s) under 16px`);
      }
    }
  }
  if (errors.length) fails.push(`${tag}: console errors: ${[...new Set(errors)].slice(0, 3).join(' | ')}`);
  await page.close();
}
await browser.close();

if (fails.length) {
  console.error(`smoke: ${fails.length} problem(s)\n  ${fails.join('\n  ')}`);
  process.exit(1);
}
console.log(`smoke: ${views} views (every unit, every built lab, every scenario, 2 sizes) · no console error · no sideways scroll`);
