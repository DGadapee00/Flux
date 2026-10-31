/** Production browser review for a single reworked unit. Set REVIEW_UNIT=c1..c6. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from './playwright.mjs';
import { EXAMS } from '../src/data/catalog.js';
import { SETUPS } from '../src/notes/setups.js';
import { PROBLEMS } from '../src/problems/index.js';
const unit = process.env.REVIEW_UNIT || 'c1',
  exam = EXAMS.find((e) => e.id === unit);
const base = process.env.SMOKE_URL || 'http://localhost:5178/';
const shots = process.env.SMOKE_SHOTS || '../../work/unit-shots';
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] }
    : {}),
});
const errors = [];
let scenarios = 0,
  examples = 0;
try {
  for (const [width, height] of [
    [380, 820],
    [1280, 800],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', (e) => errors.push(e.message));
    for (const lab of exam.labs.filter(id=>!process.env.REVIEW_LAB||id===process.env.REVIEW_LAB)) {
      await page.goto(`${base}#/mac2311/${unit}/${lab}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction((id) => window.__flux?.app.lab?.id === id, lab);
      const ids = await page.locator('#scenario option').evaluateAll((els) => els.map((e) => e.value));
      for (const id of ids) {
        await page.selectOption('#scenario', id);
        await page.waitForTimeout(100);
        const text = await page.locator('#readout').innerText();
        assert.ok(text.length && !/NaN|\[object Object\]/.test(text), `${lab}: ${text}`);
        scenarios++;
      }
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
        `${lab}/${width} overflow`,
      );
      const pred = page.locator('#predict');
      assert.equal(await pred.isVisible(), true, `${lab}: prediction missing`);
      await pred.locator('summary').click();
      await pred.locator('[data-watch]').first().click();
      await pred.locator('[data-act="apply"]').click();
      await page.waitForTimeout(100);
      assert.ok(await pred.locator('.pred-grade').count());
      await pred.locator('summary').click();
      await page.screenshot({ path: `${shots}/${unit}-${lab}-${width}.png` });
    }
    if(process.env.REVIEW_SHORT){await page.close();continue;}
    const setups = Object.entries(SETUPS[unit]).flatMap(([section, list]) =>
      list.map((ex, i) => ({ section, ex, i })),
    );
    await page.goto(`${base}#/mac2311/${unit}/${exam.labs[0]}?n=${setups[0].section}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('#notes .nt-show');
    for (const { section, ex, i } of setups) {
      if ((await page.locator('#btn-notes').getAttribute('aria-expanded')) !== 'true')
        await page.keyboard.press('n');
      await page.locator(`[data-ex="${section}:${i}"]`).click();
      await page.waitForFunction((id) => window.__flux.app.labId === id, ex.lab);
      await page.waitForTimeout(150);
      examples++;
    }
    if ((await page.locator('#btn-notes').getAttribute('aria-expanded')) !== 'true')
      await page.keyboard.press('n');
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${shots}/${unit}-notes-${width}.png` });
    assert.equal(await page.locator('#notes .katex-error').count(), 0);
    for (const tpl of PROBLEMS.filter((t) => t.exam === unit).slice(-5)) {
      await page.goto(`${base}#/mac2311/${unit}/${tpl.lab || exam.labs[0]}?p=${tpl.id}&s=7`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForSelector('.pb-part');
      assert.equal(await page.locator('.katex-error').count(), 0, tpl.id);
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    `${unit}: ${scenarios} scenario views; ${examples} worked examples; predictions and practice at both sizes`,
  );
} finally {
  await browser.close();
}
