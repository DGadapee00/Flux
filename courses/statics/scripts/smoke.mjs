#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from './playwright.mjs';
import { EXAMS, LAB_META } from '../src/data/catalog.js';
import { NOTES } from '../src/notes/index.js';
import { SETUPS } from '../src/notes/setups.js';
const base = process.env.SMOKE_URL || 'http://localhost:5176/';
const screenshotDir = process.env.SMOKE_SHOTS;
const launch = { headless: true };
if (process.env.CHROMIUM_EXECUTABLE)
  Object.assign(launch, { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] });
const browser = await chromium.launch(launch);
const errors = [];
let views = 0,
  examples = 0;
if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });
try {
  for (const [width, height] of [
    [380, 820],
    [1280, 800],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', (e) => errors.push(e.message));
    for (const exam of EXAMS) {
      for (const lab of exam.labs.filter((id) => LAB_META[id].app || id === 'pappus')) {
        console.log(`smoke: ${lab} at ${width}`);
        if (await page.locator('#notes').isVisible()) await page.locator('#notes [data-nt="close"]').click();
        await page.goto(`${base}#/statics/${exam.id}/${lab}`);
        await page.waitForFunction((id) => window.__gauss?.app.labId === id && window.__gauss.app.lab, lab);
        await page.waitForTimeout(300);
        if (await page.locator('#notes').isVisible()) await page.locator('#notes [data-nt="close"]').click();
        assert.ok(await page.locator('#exam-select option:checked').innerText());
        const scenes = await page.locator('#scenario option').evaluateAll((els) => els.map((e) => e.value));
        for (const scenario of scenes) {
          if (
            width < 720 &&
            (await page.locator('body').evaluate((el) => el.classList.contains('sheet-explain')))
          )
            await page.click('#btn-sheet');
          await page.selectOption('#scenario', scenario);
          for (const explain of width < 720 ? [false, true] : [false]) {
            if (
              width < 720 &&
              (await page.locator('body').evaluate((el) => el.classList.contains('sheet-explain'))) !==
                explain
            )
              await page.click('#btn-sheet');
            await page.waitForTimeout(300);
            const result = await page.evaluate(() => {
              const plot = document.getElementById('plot');
              const bounds = plot.dataset.box.split(',').map(Number);
              const [x0, y0, x1, y1] = bounds;
              const covered = [];
              for (const id of ['brand', 'controls', 'eq-panel', 'readout', 'toggles', 'btn-sheet']) {
                const el = document.getElementById(id);
                if (!el || el.hidden || getComputedStyle(el).display === 'none') continue;
                const r = el.getBoundingClientRect();
                if (r.left < x1 - 2 && x0 < r.right - 2 && r.top < y1 - 2 && y0 < r.bottom - 2)
                  covered.push(id);
              }
              const data = plot.getContext('2d').getImageData(0, 0, plot.width, plot.height).data;
              let ink = 0;
              for (let i = 3; i < data.length; i += 28)
                if (data[i] > 0 && data[i - 1] + data[i - 2] + data[i - 3] > 300) ink++;
              return {
                covered,
                bounds,
                ink,
                overflow: document.documentElement.scrollWidth > innerWidth + 1,
              };
            });
            assert.equal(result.overflow, false, `${lab}/${width} overflow`);
            assert.deepEqual(result.covered, [], `${lab}/${width} diagram covered`);
            assert.ok(result.ink > 50, `${lab} diagram empty`);
            views++;
          }
        }
        if (screenshotDir) {
          if (width < 720) await page.locator('#btn-sheet').click();
          await page.waitForTimeout(250);
          await page.screenshot({ path: `${screenshotDir}/${lab}-${width}.png` });
        }
        // Grade a prediction from the recomputed lab, including factor questions.
        await page.evaluate(() => document.body.classList.remove('sheet-explain'));
        const prediction = page.locator('#predict');
        await prediction.locator('.pred-choice').first().click();
        await prediction.locator('[data-act="apply"]').click();
        await page.waitForFunction(() => document.querySelector('.pred-grade'));
        assert.ok(await prediction.locator('.pred-grade').count());
      }
      console.log(`smoke: notes ${exam.id} at ${width}`);
      const notes = NOTES[exam.id];
      const first = notes.sections.find((s) => s.lab);
      await page.goto(`${base}#/statics/${exam.id}/${first.lab}?n=${first.id}`);
      await page.waitForSelector('#notes .nt-show');
      if (width < 720) assert.equal(await page.locator('#btn-sheet').isVisible(), false, 'Explain covers phone notes');
      assert.equal(await page.locator('#notes .katex-error').count(), 0);
      assert.ok(page.url().includes('?n='), 'notes route was erased');
      const targets = Object.entries(SETUPS[exam.id]).flatMap(([sid, list]) =>
        list.map((ex, i) => ({ sid, i, lab: ex.lab })),
      );
      for (const ex of targets) {
        if ((await page.locator('#btn-notes').getAttribute('aria-expanded')) !== 'true')
          await page.keyboard.press('n');
        await page.waitForSelector('#notes:not([hidden])');
        await page.locator(`#notes [data-ex="${ex.sid}:${ex.i}"]`).click();
        await page.waitForFunction((id) => window.__gauss.app.labId === id, ex.lab);
        await page.waitForTimeout(150);
        examples++;
      }
      if (screenshotDir) {
        if ((await page.locator('#btn-notes').getAttribute('aria-expanded')) !== 'true')
          await page.keyboard.press('n');
        await page.waitForSelector('#notes:not([hidden])');
        await page.screenshot({ path: `${screenshotDir}/${exam.id}-notes-${width}.png` });
      }
    }
    await page.goto(`${base}#/statics/u3/frame?p=ch6.pliers&s=2`);
    await page.waitForSelector('.pb-part');
    assert.equal(await page.locator('#problems').isVisible(), true);
    assert.equal(await page.locator('#brand h1').innerText(), 'FLUX');
    assert.ok((await page.locator('#track-row a').count()) >= 3);
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    `smoke: ${views} lab scenario views, ${examples} example-button checks; notes routes, predictions and practice work at 380 and 1280`,
  );
} finally {
  await browser.close();
}
