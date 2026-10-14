import { chromium } from './playwright.mjs';
import { EXAMS } from '../src/data/catalog.js';

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
  solids: (c) =>
    c.agree === true &&
    Number.isFinite(c.disk) &&
    Number.isFinite(c.shell) &&
    Math.abs(c.disk - 8 * Math.PI) < 1e-6 &&
    Math.abs(c.shell - 8 * Math.PI) < 1e-6,
  taylor: (c) =>
    c.agree === true &&
    Math.abs(c.poly - 0.5) < 1e-9 &&
    c.err > 0.01 &&
    c.err < 0.03,
  numint: (c) =>
    c.agree === true &&
    c.closer === true &&
    c.n === 4 &&
    Math.abs(c.trap - (Math.PI / 4) * (1 + Math.SQRT2)) < 1e-9 &&
    Math.abs(c.simp - (Math.PI / 6) * (1 + 2 * Math.SQRT2)) < 1e-9 &&
    Math.abs(c.exact - 2) < 1e-12,
  improper: (c) =>
    c.agree === true &&
    Math.abs(c.area - 0.5) < 1e-12 &&
    Math.abs(c.tail - 0.5) < 1e-12 &&
    c.limit === 1,
};

await page.goto('http://localhost:5179/#/mac2312/u1/solids', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForFunction((id) => window.__flux?.state?.lab === id, 'solids', { timeout: 10000 });
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
    disk: app?.computed?.disk,
    shell: app?.computed?.shell,
    agree: app?.computed?.agree,
  };
});

const mismatches = [];
if (!g.gl) mismatches.push({ name: 'webgl', got: false, exp: true });
if (g.lab !== 'solids') mismatches.push({ name: 'lab', got: g.lab, exp: 'solids' });
if (!CHECK.solids(g)) mismatches.push({ name: 'solids.routes', got: g, exp: true });

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

await go('#/u1', 'solids');
const unitOpen = await page.evaluate(() => ({
  exam: window.__flux?.state?.examId,
  lab: window.__flux?.state?.lab,
  hash: location.hash,
}));
if (unitOpen.exam !== 'u1' || unitOpen.lab !== 'solids' || unitOpen.hash !== '#/mac2312/u1/solids') {
  mismatches.push({ name: 'u1', got: unitOpen, exp: 'unit hash opens the solids lab' });
}

await go('#/u3', 'taylor');
await page.goBack();
await page.waitForTimeout(400);
const afterBack = await page.evaluate(() => location.hash);

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
console.log('smoke: all labs ok', { labs: catalogLabs.length, disk: g.disk, back: afterBack, phone });
