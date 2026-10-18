#!/usr/bin/env node
/**
 * Browser smoke for EGN 3331, against the dev server on 5182 (or SMOKE_URL).
 *
 * At 1280×800 and 380×820, for every lab and scenario (and on a phone with the Explain sheet
 * open and shut): no page error, the plot canvas shows and has drawn, the diagram's box is clear
 * of every panel, and the page does not scroll sideways. Then the shared layout check (readout
 * bar against the panels), the notes for each unit (KaTeX, equation width, Escape, a worked
 * example shown in its lab), and the practice panel opening a problem in its lab.
 */
import { checkLayout } from '@flux/shells/engineering/layout-check.mjs';
import { EXAMS } from '../src/data/catalog.js';
import { COURSE } from '../src/engine/router.js';
import { NOTES } from '../src/notes/index.js';
import { chromium } from './playwright.mjs';

const BASE = process.env.SMOKE_URL || 'http://localhost:5182/';
const SIZES = [[1280, 800], [380, 820]];
const fails = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

async function go(hash, lab) {
  await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' });
  await page.waitForFunction((id) => window.__flux?.app?.lab?.id === id, lab, { timeout: 10000 });
  await page.waitForTimeout(350);
}

/** What the page shows right now: the plot, its box, the panels it must clear, and the page width. */
function look() {
  const vis = (el) => {
    if (!el || el.hidden) return null;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return null;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1 ? r : null;
  };
  const plot = document.getElementById('plot');
  const shown = !!vis(plot) && document.getElementById('c').hidden;
  let ink = 0;
  if (shown) {
    const ctx = plot.getContext('2d');
    const { data } = ctx.getImageData(0, 0, plot.width, plot.height);
    for (let i = 3; i < data.length; i += 4 * 7) if (data[i] > 0 && data[i - 1] + data[i - 2] + data[i - 3] > 300) ink++;
  }
  const [x0, y0, x1, y1] = (plot.dataset.box || '0,0,0,0').split(',').map(Number);
  const covering = [];
  for (const sel of ['.brand', '#eq-panel', '#controls', '#readout', '#btn-sheet', '#problems']) {
    const r = vis(document.querySelector(sel));
    if (r && r.left < x1 - 2 && x0 < r.right - 2 && r.top < y1 - 2 && y0 < r.bottom - 2) covering.push(sel);
  }
  return {
    shown,
    ink,
    box: [x0, y0, x1, y1],
    covering,
    sideways: document.documentElement.scrollWidth > window.innerWidth + 1,
  };
}

let views = 0;
for (const [w, h] of SIZES) {
  await page.setViewportSize({ width: w, height: h });
  for (const exam of EXAMS) {
    for (const lab of exam.labs) {
      await go(`#/${COURSE}/${exam.id}/${lab}`, lab);
      const scenarios = await page.evaluate(() => [...document.querySelectorAll('#scenario option')].map((o) => o.value));
      for (const sc of scenarios) {
        await page.selectOption('#scenario', sc);
        for (const sheet of w <= 720 ? [false, true] : [false]) {
          const open = await page.evaluate(() => document.body.classList.contains('sheet-explain'));
          if (open !== sheet) await page.click('#btn-sheet');
          await page.waitForTimeout(450);
          const r = await page.evaluate(look);
          views++;
          const tag = `${lab}/${sc} at ${w}×${h}${sheet ? ', Explain open' : ''}`;
          if (!r.shown) fails.push(`${tag}: the plot canvas is not showing`);
          if (r.ink < 200) fails.push(`${tag}: the plot drew almost nothing (${r.ink} samples)`);
          if (r.covering.length) fails.push(`${tag}: ${r.covering.join(', ')} covers the diagram ${r.box.join(',')}`);
          if (r.box[2] - r.box[0] < 200 || r.box[3] - r.box[1] < 150) fails.push(`${tag}: the diagram is too small, ${r.box.join(',')}`);
          if (r.sideways) fails.push(`${tag}: the page scrolls sideways`);
        }
        if (w <= 720 && (await page.evaluate(() => document.body.classList.contains('sheet-explain')))) await page.click('#btn-sheet');
      }
    }
  }
}

// The readout bar against the panels, from the engineering shell.
const routes = EXAMS.flatMap((e) => e.labs.map((lab) => `#/${COURSE}/${e.id}/${lab}`));
const layout = await checkLayout({ chromium, base: BASE, routes });
fails.push(...layout.fails);

// Notes: each unit at both sizes.
for (const [w, h] of SIZES) {
  await page.setViewportSize({ width: w, height: h });
  for (const exam of Object.keys(NOTES)) {
    const lab = EXAMS.find((e) => e.id === exam).labs[0];
    await go(`#/${COURSE}/${exam}/${lab}`, lab);
    await page.keyboard.press('n');
    await page.waitForSelector(`#notes:not([hidden]) .nt-doc section.topic[id^="nt-${exam}-"]`, { timeout: 10000 });
    const r = await page.evaluate(() => {
      const panel = document.getElementById('notes');
      const box = panel.getBoundingClientRect();
      return {
        sections: panel.querySelectorAll('.nt-doc section.topic').length,
        katex: panel.querySelectorAll('.katex-error').length,
        wide: [...panel.querySelectorAll('.katex-display')].filter((d) => d.scrollWidth > d.clientWidth + 1).map((d) => d.querySelector('annotation')?.textContent.trim().slice(0, 50)),
        sideways: panel.scrollWidth > panel.clientWidth + 1 || document.documentElement.scrollWidth > window.innerWidth + 1,
        inside: box.left >= 0 && box.right <= window.innerWidth + 1,
      };
    });
    const tag = `notes ${exam} at ${w}×${h}`;
    if (r.sections !== NOTES[exam].sections.length) fails.push(`${tag}: ${r.sections} sections, want ${NOTES[exam].sections.length}`);
    if (r.katex) fails.push(`${tag}: ${r.katex} KaTeX errors`);
    if (r.wide.length) fails.push(`${tag}: equations wider than the column: ${r.wide.join(' | ')}`);
    if (r.sideways || !r.inside) fails.push(`${tag}: scrolls sideways or leaves the screen`);
    if (exam === 'u1') {
      await page.click('#notes .nt-show[data-ex="s3:0"]');
      await page.waitForFunction(() => Math.abs((window.__flux?.computed?.sigma ?? NaN) - 75e6) < 1, null, { timeout: 10000 });
    }
    if (await page.evaluate(() => !document.getElementById('notes').hidden)) await page.keyboard.press('Escape');
    if (!(await page.evaluate(() => document.getElementById('notes').hidden))) fails.push(`${tag}: Escape did not close the notes`);
  }
}

// Practice: a problem with a lab opens in that lab with the problem's numbers.
await page.setViewportSize({ width: 1280, height: 800 });
await go(`#/${COURSE}/u1/cut?p=u1.1.inclined&s=0`, 'cut');
await page.waitForFunction(() => Math.abs((window.__flux?.computed?.tau ?? NaN) - 43.30127018922193e6) < 1, null, { timeout: 10000 }).catch(() => {
  fails.push('practice: u1.1.inclined case did not set the cut lab to τ = 43.3 MPa');
});
const practiceOpen = await page.evaluate(() => !document.getElementById('problems').hidden);
if (!practiceOpen) fails.push('practice: the problem panel did not open from the link');

await browser.close();
for (const e of errors) fails.push(`page error: ${e}`);
if (fails.length) {
  console.error(`smoke: ${fails.length} problem(s)\n  ${fails.join('\n  ')}`);
  process.exit(1);
}
console.log(`smoke: ${views} lab views at 1280×800 and 380×820 · layout ${layout.views} views · notes for ${Object.keys(NOTES).length} units at both sizes · practice opens a problem in its lab · no page errors`);
