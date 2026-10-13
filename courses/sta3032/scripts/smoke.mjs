/**
 * Every screen in a real browser, on a phone and a laptop. Fails on any page error, console error,
 * or a page wider than the screen (horizontal scroll on a phone is a bug here). Screenshots go to
 * scripts/output/smoke/ for looking at.
 *
 * Needs the dev server: npx vite --port 5175 --strictPort   (in the background)
 *
 *   node scripts/smoke.mjs [--all]    --all opens every problem, not a sample
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './playwright.mjs';
import { PROBLEMS } from '../src/problems/index.js';
import { accepted, instance } from '../src/problems/engine.js';
import { LABS } from '../src/labs/index.js';
import { NOTES } from '../src/notes/index.js';

const BASE = process.env.SMOKE_URL || 'http://localhost:5175/';
const OUT = path.resolve('scripts/output/smoke');
fs.mkdirSync(OUT, { recursive: true });
const ALL = process.argv.includes('--all');

let fails = 0;
const err = (where, msg) => {
  fails++;
  console.log(`FAIL ${where}: ${msg}`);
};

const browser = await chromium.launch();
for (const [name, vp] of [['phone', { width: 380, height: 800 }], ['laptop', { width: 1280, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: name === 'phone' ? 2 : 1, hasTouch: name === 'phone', isMobile: name === 'phone' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => window.addEventListener('error', (e) => console.log('STACK', e.error && e.error.stack)));
  page.on('console', (m) => m.text().startsWith('STACK') && console.log(m.text()));
  page.on('console', (m) => {
    // A sandbox without network cannot fetch the web fonts; that is not the app's error.
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });

  async function visit(hash, label, { shot = true } = {}) {
    await page.goto(BASE + hash, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(150);
    await settle(label, shot);
  }
  async function settle(label, shot = true) {
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) err(`${name} ${label}`, `page is ${over}px wider than the screen`);
    if (errors.length) err(`${name} ${label}`, errors.splice(0).join(' | '));
    if (shot) await page.screenshot({ path: path.join(OUT, `${name}-${label}.png`), fullPage: true });
  }

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await visit('', 'home');
  for (const unit of ['mid', 'final']) await visit(`#/${unit}`, `list-${unit}`, { shot: unit === 'mid' });
  await visit('#/mid/tables', 'tables');
  await page.fill('#z', '-1.26');
  await page.fill('#area', '0.95');
  await page.waitForTimeout(50);
  const zt = await page.locator('#zout').innerText();
  if (!zt.includes('0.1038') || !zt.includes('1.645')) err(`${name} tables`, `z lookup shows ${zt.replace(/\s+/g, ' ')}`);
  await settle('tables-lookup');
  await visit('#/mid/notes', 'notes');
  await visit('#/mid/explore', 'explore');
  // Every notes chapter, with every solution and calculator box open (wide math shows up there).
  for (const N of NOTES) {
    await visit(`#/final/notes/${N.ch}`, `notes-${N.ch}`, { shot: false });
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
    await page.waitForTimeout(50);
    await settle(`notes-${N.ch}-open`, false);
  }

  // Every lab: it draws, a control redraws it, and a prediction runs to its verdict.
  const inked = () =>
    page.evaluate(() => {
      const c = document.querySelector('#lab-canvas');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 16) if (d[i]) n++;
      return n;
    });
  for (const lab of LABS) {
    await visit(`#/final/explore/${lab.id}`, `lab-${lab.id}`);
    const ink = await inked();
    if (ink < 500) err(`${name} lab ${lab.id}`, `canvas nearly blank (${ink})`);
    if ((await page.locator('#lab-readout .cell').count()) < 1) err(`${name} lab ${lab.id}`, 'no readout');
    const range = page.locator('#lab-controls input[type=range]:visible').first();
    if (await range.count()) {
      const before = await page.locator('#lab-readout').innerText();
      await range.evaluate((el) => {
        el.value = String(Number(el.min) + (Number(el.max) - Number(el.min)) * 0.8);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForTimeout(80);
      if ((await page.locator('#lab-readout').innerText()) === before) err(`${name} lab ${lab.id}`, 'moving a slider changed nothing');
    }
    if (lab.predictions.length) {
      const p = lab.predictions[0];
      await page.click('[data-pred=start]');
      // Fiddling with a control before committing must not change the verdict (it is locked).
      await page.evaluate(() => {
        const el = document.querySelector('#lab-controls input[type=range]');
        if (!el) return;
        el.value = el.max;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.click(`[data-pick="${p.expect}"]`);
      await page.click('[data-pred=change]');
      await page.waitForTimeout(80);
      if (!(await page.locator('#lab-predict .verdict.ok').count())) err(`${name} lab ${lab.id}`, `prediction ${p.id}: the expected answer was not marked right`);
      await settle(`lab-${lab.id}-predicted`, name === 'phone');
    }
  }

  // Every problem (or a sample) opens, at its worked case and at a fresh version.
  const list = ALL ? PROBLEMS : PROBLEMS.filter((_, i) => i % 3 === 0 || name === 'phone');
  for (const t of list) {
    for (const s of [0, 5]) {
      await visit(`#/mid?p=${t.id}&s=${s}`, `p-${t.id}-${s}`, { shot: s === 0 && name === 'phone' });
      if (!(await page.locator('.statement').count())) err(`${name} ${t.id}`, 'no statement');
    }
  }

  // Work one problem: a wrong answer, then the right one.
  const tpl = PROBLEMS.find((t) => t.id === 'c6.normal-prob');
  const inst = instance(tpl, 0);
  await visit(`#/mid?p=${tpl.id}&s=0`, 'work-open', { shot: false });
  await page.fill('input[data-part="p"]', String(1 - accepted(tpl.parts[0], inst.$)[0]));
  await page.click('[data-act="check"]');
  const fb = await page.locator('.verdict.bad').innerText();
  if (!/complement/i.test(fb)) err(`${name} work`, `wrong answer feedback: ${fb}`);
  await settle('work-wrong');
  await page.fill('input[data-part="p"]', String(accepted(tpl.parts[0], inst.$)[0].toFixed(4)));
  await page.click('[data-act="check"]');
  if (!(await page.locator('.verdict.ok').count())) err(`${name} work`, 'the right answer was not accepted');
  if (!(await page.locator('.steps').count())) err(`${name} work`, 'no worked solution after solving');
  await settle('work-right');

  // A choice problem, and the solution button.
  await visit('#/mid?p=c5.which-distribution&s=0', 'choice', { shot: false });
  await page.click('label.opt >> nth=2');
  await page.click('[data-act="check"]');
  if (!(await page.locator('.verdict.ok').count())) err(`${name} choice`, 'Poisson was not accepted for the toll booth');
  await visit('#/mid?p=c1.quartiles&s=3', 'reveal', { shot: false });
  await page.click('[data-act="reveal"]');
  if (!(await page.locator('.steps li').count())) err(`${name} reveal`, 'no steps');
  await settle('reveal');

  // The practice exam: start, answer one, submit, review.
  await visit('#/mid/exam', 'exam-intro');
  await page.click('[data-act="start"]');
  await page.waitForTimeout(100);
  await settle('exam-sheet');
  page.once('dialog', (d) => d.accept());
  await page.click('.exam-bar [data-act="submit"]');
  await page.waitForTimeout(100);
  if (!(await page.locator('.score').count())) err(`${name} exam`, 'no results after submit');
  await page.click('.qnav a >> nth=0');
  await page.waitForTimeout(50);
  if (!(await page.locator('#review .steps').count())) err(`${name} exam`, 'review shows no solution');
  await settle('exam-results');
  await ctx.close();
}
await browser.close();
console.log(`smoke: ${fails ? `${fails} FAILED` : 'all screens load, no errors, nothing wider than the screen'} (screenshots in ${path.relative(process.cwd(), OUT)})`);
process.exit(fails ? 1 : 0);
