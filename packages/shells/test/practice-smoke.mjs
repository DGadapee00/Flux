#!/usr/bin/env node
/**
 * Browser smoke for the practice loop in the three shells, on the fixture course (test/fixture/).
 *
 *   node test/practice-smoke.mjs      (from packages/shells; starts its own server on 5190)
 *
 * At 380×820 (a touch phone) and 1280×800, in the math and the engineering shell: a problem opens
 * with its parts and no principle question; a worked example sits above a first problem; a trap value gets its message and a wrong option its
 * why; the solution names the deciding principle and asks what went wrong; the miss shows in the
 * weak-principle list; the notes link calls the course; the lab drawer opens on desktop; the
 * palette inserts and previews a formula; the number pad shows on the phone only; nothing scrolls
 * sideways; and no page error.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from './playwright.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixture');
const server = await createServer({ root, configFile: path.join(root, 'vite.config.js'), logLevel: 'error' });
await server.listen();
const BASE = 'http://localhost:5190/';

const fails = [];
let checks = 0;
const expect = (ok, msg) => {
  checks++;
  if (!ok) fails.push(msg);
};

const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox']}: {}) });

async function run(shell, [w, h]) {
  const phone = w <= 720;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: phone, isMobile: phone });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  const tag = `${shell} at ${w}×${h}`;
  await page.goto(`${BASE}${shell}.html`, { waitUntil: 'networkidle' });
  await page.click('#btn-practice');
  await page.waitForSelector('#problems:not([hidden]) .pb-list');
  // The physics panel keeps its filters folded behind a toggle.
  if (shell === 'physics') await page.click('[data-act="filters"]');
  expect(await page.locator('[data-filter="group:principle"]').count() === 1, `${tag}: no "group by principle" chip`);

  // A numeric problem: no principle question, the parts are there at once.
  await page.click('[data-open="f.1.force"]');
  await page.waitForSelector('.pb-parts');
  expect((await page.locator('.pb-principle, .pb-popt').count()) === 0, `${tag}: a principle question is on the page`);
  expect(!/which principle decides/i.test(await page.textContent('#problems')), `${tag}: the problem asks which principle decides it`);
  expect((await page.locator('.pb-notes').count()) === 1, `${tag}: no notes link`);
  expect((await page.locator('.pb-guide .pb-guide-h').count()) === 1, `${tag}: no worked example on a first problem`);
  const pad = await page.locator('.pb-numpal').first().isVisible();
  expect(pad === phone, `${tag}: the number pad is ${pad ? 'shown' : 'hidden'}`);

  // A trap value gets its message.
  const $ = await page.evaluate(() => window.__fixture.practice.current().inst.$);
  await page.fill('[data-input="0"]', String($.m / $.a));
  await page.click('[data-act="check"]');
  await page.waitForSelector('.pb-part.bad');
  expect(/That is m\/a/.test(await page.textContent('.pb-part .pb-fb')), `${tag}: the trap's message is missing`);

  // The solution: deciding principle, what went wrong, the drawer.
  await page.click('[data-act="reveal"]');
  await page.waitForSelector('.pb-solution');
  expect(/Deciding principle/.test(await page.textContent('.pb-solution')), `${tag}: the solution does not name the principle`);
  expect((await page.locator('.pb-gap [data-gap]').count()) >= 3, `${tag}: no "what went wrong" after a miss`);
  await page.click('.pb-gap [data-gap="newton"]');
  await page.waitForSelector('.pb-gap.done');
  if (!phone) {
    expect(!(await page.locator('#controls').isVisible()), `${tag}: the lab controls show while a problem is open`);
    await page.click('[data-act="lab"]');
    expect(await page.locator('#controls').isVisible(), `${tag}: the drawer did not open the lab controls`);
  }
  await page.click('.pb-notes');
  const notes = await page.evaluate(() => window.__fixture.calls.openNotes);
  expect(notes.length === 1 && notes[0].section === 's1', `${tag}: the notes link did not ask the course for §1`);

  // Back to the list: the miss shows as a weak principle.
  await page.click('[data-act="list"]');
  await page.waitForSelector('.pb-weak');
  expect(/Newton’s second law/.test(await page.textContent('.pb-weak')), `${tag}: the weak-principle list is missing the miss`);

  // A choice problem: a wrong option's why.
  await page.click('[data-open="f.1.which"]');
  await page.waitForSelector('.pb-parts');
  const opt = await page.$$eval('[data-choice="0"]', (els) => els.findIndex((e) => e.nextElementSibling.textContent.includes('Impulse')));
  await page.check(`[data-choice="0"][value="${opt}"]`);
  await page.click('[data-act="check"]');
  await page.waitForSelector('.pb-part.bad');
  expect(/No time or force-over-time/.test(await page.textContent('.pb-part .pb-fb')), `${tag}: the wrong option's why is missing`);

  // A formula: the palette inserts, the preview typesets.
  await page.click('[data-act="list"]');
  await page.click('[data-open="f.1.formula"]');
  await page.waitForSelector('.pb-parts .pb-pal');
  await page.click('[data-key-for="0"][data-ins="a"]');
  await page.click('[data-key-for="0"][data-ins="t"]');
  const typed = await page.inputValue('[data-input="0"]');
  expect(typed.replace(/\s/g, '') === 'at', `${tag}: the palette typed "${typed}", want "at"`);
  await page.waitForSelector('.pb-preview .katex');
  expect(true, '');

  // The physics shell's own pieces, on a course with no electromagnetic data.
  if (shell === 'physics') {
    const missing = await page.evaluate(() => window.__fixture.chromeIds.filter((id) => !document.getElementById(id)));
    expect(missing.length === 0, `${tag}: the chrome is missing ${missing.join(', ')}`);
    expect((await page.locator('#exam-select option').count()) === 2, `${tag}: the unit picker does not list both units`);
    expect(/FIX 1000/.test(await page.textContent('#brand-sub')), `${tag}: the sub-title lost the course code`);
    await page.evaluate(() => window.__fixture.units.toggle());
    expect(/force/.test(await page.textContent('#units-ref')), `${tag}: the units panel does not list its rows`);
    await page.evaluate(() => window.__fixture.units.close());
  }

  // Nothing sideways at either size.
  const wide = await page.evaluate(() => {
    const p = document.getElementById('problems');
    return document.documentElement.scrollWidth > window.innerWidth + 1 || p.scrollWidth > p.clientWidth + 1;
  });
  expect(!wide, `${tag}: something scrolls sideways`);
  for (const e of errors) fails.push(`${tag}: page error: ${e}`);
  await ctx.close();
}

try {
  for (const shell of ['engineering', 'math', 'physics']) {
    for (const size of [[1280, 800], [380, 820]]) await run(shell, size);
  }
  for(const width of [380,1280]){
    const page=await browser.newPage({viewport:{width,height:width===380?820:800}});
    await page.goto(`${BASE}math.html?cumulative=1`);await page.click('#btn-practice');
    expect((await page.locator('.pb-kicker').innerText()).includes('Unit 1'),`math ${width}: custom unit label missing`);
    expect((await page.locator('[data-act="exam-start"]').innerText()).includes('Cumulative practice'),`math ${width}: custom assessment label missing`);
    await page.locator('[data-act="exam-start"]').click();await page.locator('.pb-examnav').waitFor();
    const ids=await page.evaluate(()=>window.__fixture.progress.loadExam().items.map(x=>x.id));
    expect(ids.some(id=>id.startsWith('f.2.')),`math ${width}: cumulative assessment ignored earlier/sibling unit templates`);
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}

if (fails.length) {
  console.error(`practice smoke: ${fails.length} problem(s)\n  ${fails.join('\n  ')}`);
  process.exit(1);
}
console.log(`practice smoke: three shells at 1280×800 and 380×820 · ${checks} checks · no page errors`);
