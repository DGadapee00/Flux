import { chromium } from './playwright.mjs';
import { EXAMS } from '../src/data/catalog.js';
import { NOTES } from '../src/notes/index.js';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

async function go(hash, lab) {
  await page.evaluate((h) => {
    location.hash = h;
  }, hash);
  if (lab) {
    await page.waitForFunction((id) => window.__flux?.state?.lab === id, lab, { timeout: 10000 });
  } else {
    await page.waitForFunction(() => window.__flux?.app?.lab == null, null, { timeout: 10000 });
  }
  await page.waitForTimeout(400);
}

const CHECK = {
  limits: (c) => Number.isFinite(c.limit) && c.exists === true && c.agree === true && !Number.isFinite(c.value),
  secant: (c) => Number.isFinite(c.fp) && Number.isFinite(c.msec) && c.agree === true,
  rates: (c) => Number.isFinite(c.y) && Number.isFinite(c.dy) && c.dy < 0 && c.agree === true,
  box: (c) => Number.isFinite(c.v) && Number.isFinite(c.vmax) && c.agree === true && c.dv > 0 && c.v < c.vmax,
  riemann: (c) => Number.isFinite(c.sum) && Number.isFinite(c.exact) && c.agree === true,
  accum: (c) =>
    Number.isFinite(c.area) &&
    Number.isFinite(c.height) &&
    c.agree === true &&
    Math.abs(c.area - 1 / 3) < 1e-6 &&
    Math.abs(c.height - 1) < 1e-9,
};

await page.goto('http://localhost:5178/#/mac2311/u2/secant', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForFunction((id) => window.__flux?.state?.lab === id, 'secant', { timeout: 10000 });
await page.waitForTimeout(800);

const g = await page.evaluate(() => {
  const c = document.getElementById('c');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  const app = window.__flux;
  return {
    w: c.width,
    h: c.height,
    gl: !!gl,
    lab: app?.state?.lab,
    fp: app?.computed?.fp,
    msec: app?.computed?.msec,
    agree: app?.computed?.agree,
  };
});

const mismatches = [];
if (!g.gl) mismatches.push({ name: 'webgl', got: false, exp: true });
if (g.lab !== 'secant') mismatches.push({ name: 'lab', got: g.lab, exp: 'secant' });
if (!CHECK.secant(g)) mismatches.push({ name: 'secant.routes', got: g, exp: true });

const catalogLabs = EXAMS.flatMap((e) => e.labs.map((id) => ({ exam: e.id, id })));
for (const { exam, id } of catalogLabs) {
  await go(`#/${exam}/${id}`, id);
  const snap = await page.evaluate(() => ({
    lab: window.__flux?.state?.lab,
    computed: window.__flux?.computed || {},
  }));
  if (snap.lab !== id) mismatches.push({ name: `${id}.lab`, got: snap.lab, exp: id });
  const ok = CHECK[id];
  if (!ok) mismatches.push({ name: `${id}.check`, got: 'missing', exp: 'defined' });
  else if (!ok(snap.computed)) mismatches.push({ name: `${id}.routes`, got: snap.computed, exp: true });
}

await go('#/u3', 'box');
const unitOpen = await page.evaluate(() => ({
  exam: window.__flux?.state?.examId,
  lab: window.__flux?.state?.lab,
  hash: location.hash,
}));
if (unitOpen.exam !== 'u3' || unitOpen.lab !== 'box' || unitOpen.hash !== '#/mac2311/u3/box') {
  mismatches.push({ name: 'u3', got: unitOpen, exp: 'unit hash opens the box' });
}

await go('#/u2/secant', 'secant');
await page.goBack();
await page.waitForTimeout(400);
const afterBack = await page.evaluate(() => location.hash);

/**
 * Notes: open each unit's notes with N at this size. No KaTeX errors, no sideways scroll, and no
 * displayed equation wider than its column. Unit 1 also shows a worked example in its lab.
 */
async function notesPass(width, height) {
  await page.setViewportSize({ width, height });
  const seen = {};
  for (const exam of Object.keys(NOTES)) {
    const lab = EXAMS.find((e) => e.id === exam)?.labs[0];
    await go(`#/${exam}/${lab}`, lab);
    await page.keyboard.press('n');
    await page.waitForSelector(`#notes:not([hidden]) .nt-doc section.topic[id^="nt-${exam}-"]`, { timeout: 10000 });
    const open = await page.evaluate(() => {
      const panel = document.getElementById('notes');
      const r = panel.getBoundingClientRect();
      const wideMath = [...panel.querySelectorAll('.katex-display')]
        .filter((d) => d.scrollWidth > d.clientWidth + 1)
        .map((d) => d.querySelector('annotation')?.textContent.trim().slice(0, 60));
      return {
        sections: panel.querySelectorAll('.nt-doc section.topic').length,
        katexErrors: panel.querySelectorAll('.katex-error').length,
        wideMath,
        wide: panel.scrollWidth > panel.clientWidth + 1,
        page: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        inside: r.left >= 0 && r.right <= window.innerWidth + 1,
      };
    });
    seen[exam] = open.sections;
    const tag = `notes.${width}.${exam}`;
    if (open.sections !== NOTES[exam].sections.length) mismatches.push({ name: `${tag}.sections`, got: open.sections, exp: NOTES[exam].sections.length });
    if (open.katexErrors) mismatches.push({ name: `${tag}.katex`, got: open.katexErrors, exp: 0 });
    if (open.wideMath.length) mismatches.push({ name: `${tag}.math`, got: open.wideMath, exp: 'every display fits its column' });
    if (open.wide || open.page || !open.inside) mismatches.push({ name: `${tag}.fit`, got: open, exp: 'no sideways scroll' });
    if (exam === 'u1') {
      await page.click('#notes .nt-show[data-ex="s3:0"]');
      await page.waitForFunction(() => Math.abs((window.__flux?.computed?.limit ?? NaN) - 6) < 1e-9, null, { timeout: 10000 });
    }
    if (await page.evaluate(() => !document.getElementById('notes').hidden)) await page.keyboard.press('Escape');
    const closed = await page.evaluate(() => document.getElementById('notes').hidden);
    if (!closed) mismatches.push({ name: `${tag}.escape`, got: 'open', exp: 'closed' });
  }
  return seen;
}
const notesWide = await notesPass(1280, 800);
const notesPhone = await notesPass(380, 820);

await page.setViewportSize({ width: 380, height: 780 });
await page.waitForTimeout(300);
const phone = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));
if (phone.scroll > phone.client + 1) mismatches.push({ name: '380.scroll', got: phone, exp: 'no horizontal scroll' });

await browser.close();

if (errors.length) {
  console.error('page errors:', errors);
  process.exit(1);
}
if (mismatches.length) {
  console.error('mismatches:', mismatches);
  process.exit(1);
}
console.log('smoke: all labs ok', { labs: catalogLabs.length, fp: g.fp, back: afterBack, phone, notesWide, notesPhone });
