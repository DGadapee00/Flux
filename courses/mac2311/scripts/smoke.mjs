import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from './playwright.mjs';
import { EXAMS } from '../src/data/catalog.js';
import { NOTES } from '../src/notes/index.js';
import { SETUPS } from '../src/notes/setups.js';
const base = process.env.SMOKE_URL || 'http://localhost:5178/';
const shots = process.env.SMOKE_SHOTS;
const options = { headless: true };
if (process.env.CHROMIUM_EXECUTABLE)
  Object.assign(options, { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] });
/** Text on screen that should have been typeset: a TeX command, ^{ or _{, or a stray $. */
const rawTex = (page) =>
  page.evaluate(() => {
    const out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      if (n.parentElement.closest('.katex, script, style, [hidden], textarea')) continue;
      if (/\\[a-zA-Z]+|\^\{|_\{|\$/.test(n.textContent)) out.push(n.textContent.trim().slice(0, 60));
    }
    return out;
  });
const browser = await chromium.launch(options);
const errors = [];
let views = 0,
  examples = 0;
if (shots) fs.mkdirSync(shots, { recursive: true });
try {
  for (const [width, height] of [
    [380, 820],
    [1280, 800],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', (e) => {
      errors.push(e.message);
      console.error(e.message);
    });
    for (const exam of EXAMS) {
      for (const lab of exam.labs) {
        console.log(`checking ${width}: ${exam.id}/${lab}`);
        await page.goto(`${base}#/mac2311/${exam.id}/${lab}`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction((id) => window.__flux?.app.lab?.id === id, lab);
        if (await page.locator('#notes').isVisible()) await page.locator('#notes [data-nt="close"]').click();
        const scenarios = await page
          .locator('#scenario option')
          .evaluateAll((els) => els.map((e) => e.value));
        for (const scenario of scenarios) {
          await page.selectOption('#scenario', scenario);
          await page.waitForTimeout(150);
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
            false,
            `${exam.id}/${lab}/${width} overflow`,
          );
          const text = await page.locator('#readout').innerText();
          assert.ok(text.length > 0, `${lab} empty readout`);
          assert.ok(!/NaN|\[object Object\]/.test(text), `${lab}: ${text}`);
          assert.deepEqual(await rawTex(page), [], `${exam.id}/${lab}/${scenario}: raw TeX on screen`);
          views++;
        }
        if (shots) await page.screenshot({ path: `${shots}/${lab}-${width}.png` });
      }
      const first = NOTES[exam.id].sections.find((s) => s.lab) || NOTES[exam.id].sections[0];
      await page.goto(`${base}#/mac2311/${exam.id}/${exam.labs[0]}?n=${first.id}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForSelector('#notes .nt-show');
      assert.equal(await page.locator('#notes .katex-error').count(), 0);
      const list = Object.entries(SETUPS[exam.id] || {}).flatMap(([section, items]) =>
        items.map((ex, i) => ({ section, i, lab: ex.lab })),
      );
      for (const ex of list) {
        if ((await page.locator('#btn-notes').getAttribute('aria-expanded')) !== 'true')
          await page.keyboard.press('n');
        await page.waitForSelector('#notes:not([hidden])');
        await page.locator(`[data-ex="${ex.section}:${ex.i}"]`).click();
        await page.waitForFunction((id) => window.__flux.app.labId === id, ex.lab);
        await page.waitForTimeout(100);
        examples++;
      }
      if (shots) {
        if ((await page.locator('#btn-notes').getAttribute('aria-expanded')) !== 'true')
          await page.keyboard.press('n');
        await page.waitForTimeout(100);
        await page.screenshot({ path: `${shots}/notes-${exam.id}-${width}.png` });
      }
    }
    assert.match(await page.locator('#brand-sub').innerText(), /MAC 2311–2312/);
    const tracks = await page.locator('#track-row').innerText();
    assert.ok(tracks.includes('MAC 2311–2312'));
    assert.ok(!tracks.includes('MAC 2312\n'));
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    `smoke: ${views} scenario views, ${examples} notes example buttons at 380 and 1280; all ${EXAMS.flatMap((e) => e.labs).length} labs and ${EXAMS.length} notes units work, with no raw TeX on screen`,
  );
} finally {
  await browser.close();
}
