/** Browser checks for the satellite recipes. Uses the same Chrome DevTools protocol as smoke.mjs. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { SATELLITE } from '../src/applications/satellite.js';

const out = process.env.FLUX_APPLICATIONS_OUT || '/tmp/flux-applications';
const port = 9335;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function wait(fn) {
  for (let n = 0; n < 150; n++) {
    try { const result = await fn(); if (result) return result; } catch { /* wait for readiness */ }
    await delay(100);
  }
  throw Error('Browser check timed out');
}
class CDP {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); this.errors = []; this.loads = 0; }
  async open() {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener('message', ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.method === 'Page.loadEventFired') this.loads++;
      if (msg.method === 'Runtime.exceptionThrown') this.errors.push(msg.params.exceptionDetails);
      const p = this.pending.get(msg.id);
      if (p) { this.pending.delete(msg.id); msg.error ? p.reject(Error(JSON.stringify(msg.error))) : p.resolve(msg.result); }
    });
    await new Promise((resolve, reject) => { this.ws.addEventListener('open', resolve); this.ws.addEventListener('error', reject); });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  async eval(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
}

const server = await createServer({ root: new URL('..', import.meta.url).pathname, server: { host: '127.0.0.1', port: 5175, strictPort: true, hmr: false } });
await server.listen();
const chrome = spawn(process.env.CHROME || 'chromium', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/flux-app-chrome-${process.pid}`, 'about:blank'], { stdio: 'ignore' });
let page;
try {
  const targets = await wait(async () => { const r = await fetch(`http://127.0.0.1:${port}/json/list`); return (await r.json()).find((x) => x.type === 'page'); });
  page = new CDP(targets.webSocketDebuggerUrl);
  await page.open();
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await fs.mkdir(out, { recursive: true });
  async function navigate(url = 'http://127.0.0.1:5175/?application=satellite&component=orbit#applications') {
    const before = page.loads;
    await page.send('Page.navigate', { url: 'about:blank' });
    await wait(() => page.loads > before);
    const blank = page.loads;
    await page.send('Page.navigate', { url });
    await wait(() => page.loads > blank);
    await wait(() => page.eval('!!document.querySelector("[data-record]")'));
  }
  const click = (selector) => page.eval(`document.querySelector(${JSON.stringify(selector)}).click()`);
  async function evidence(text) {
    await page.eval(`(() => { const e = document.querySelector('#application-evidence'); e.value = ${JSON.stringify(text)}; e.dispatchEvent(new Event('input', {bubbles:true})); })()`);
  }
  async function select(id) { await click(`[data-select="${id}"]`); }
  await navigate();
  await page.eval('localStorage.clear()');
  await navigate();
  assert.equal(await page.eval('document.querySelectorAll(".component-recipes button").length'), 7);
  assert.equal(await page.eval('document.querySelector("[data-record]").disabled'), true);
  await select('power');
  await click('[data-studied]');
  await evidence('A power budget without an orbit is not enough.');
  assert.equal(await page.eval('document.querySelector("[data-record]").disabled'), true);
  for (const r of SATELLITE.components) {
    await select(r.id);
    if (!await page.eval('document.querySelector("[data-studied]").checked')) await click('[data-studied]');
    await evidence(`${r.title}: my model, assumptions, computed result and independent check.`);
    assert.equal(await page.eval('document.querySelector("[data-record]").disabled'), false, r.id);
    await click('[data-record]');
  }
  await select('satellite');
  await evidence('Mission report: all budgets agree; transmitter duty cycle tradeoff checked.');
  assert.equal(await page.eval('document.querySelector("[data-record]").disabled'), false);
  await click('[data-record]');
  assert.match(await page.eval('document.querySelector("#assembly-count").textContent'), /7 of 7.*integration recorded/);
  await navigate('http://127.0.0.1:5175/?application=satellite&component=satellite#applications');
  assert.match(await page.eval('document.querySelector("#assembly-count").textContent'), /integration recorded/);
  await select('orbit');
  await evidence('Revised orbit changes eclipse time.');
  assert.match(await page.eval('document.querySelector("#assembly-count").textContent'), /1 of 7/);
  await select('communications');
  assert.match(await page.eval('document.querySelector("#application-evidence").value'), /computed result/);
  assert.equal(await page.eval('document.querySelector("[data-record]").disabled'), true);
  // A foundation link selects the concept in the live map, clearing an unrelated course path.
  await click('[data-concept="em-waves"]');
  await wait(() => page.eval('document.querySelector("#concept-title")?.textContent.includes("Electromagnetic")'));
  assert.equal(await page.eval('location.hash'), '#em-waves');
  await navigate('http://127.0.0.1:5175/?application=satellite&component=payload#applications');
  assert.equal(await page.eval('document.querySelector("#recipe-title").textContent'), 'Sensor payload');
  await select('power');
  await page.eval('history.back()');
  await wait(() => page.eval('document.querySelector("#recipe-title").textContent === "Sensor payload"'));
  // User-provided evidence stays text across navigation and restore.
  await evidence('<img src=x onerror="window.applicationXss=true">');
  await navigate('http://127.0.0.1:5175/?application=satellite&component=payload#applications');
  assert.equal(await page.eval('!!window.applicationXss'), false);
  assert.match(await page.eval('document.querySelector("#application-evidence").value'), /<img/);
  // Fresh records make initial screenshots useful, without pretending the learner has passed.
  await page.eval('localStorage.clear()');
  for (const theme of ['light', 'dark']) {
    for (const [width, height] of [[390, 844], [1280, 800]]) {
      await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
      await navigate();
      await page.eval(`document.documentElement.dataset.theme = '${theme}'; document.querySelector('#applications').scrollIntoView()`);
      await delay(150);
      assert.equal(await page.eval('document.documentElement.scrollWidth > innerWidth'), false, `${theme} ${width}`);
      for (const [name, selector] of [['overview', '#applications'], ['recipe', '#application-recipe']]) {
        await page.eval(`document.querySelector('${selector}').scrollIntoView()`);
        await delay(100);
        const shot = await page.send('Page.captureScreenshot', { format: 'png' });
        await fs.writeFile(`${out}/${theme}-${width}-${name}.png`, Buffer.from(shot.data, 'base64'));
      }
    }
  }
  // Blocked storage still lets a learner explore and record during this visit.
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: 'Object.defineProperty(window, "localStorage", {get(){throw new DOMException("Blocked", "SecurityError")}})' });
  await navigate();
  await click('[data-studied]');
  await evidence('Session-only report.');
  await click('[data-record]');
  assert.match(await page.eval('document.querySelector("[data-storage]").textContent'), /only for this visit/);
  assert.match(await page.eval('document.querySelector("[data-recipe-status]").textContent'), /Demonstration recorded/);
  assert.deepEqual(page.errors, []);
  console.log(`Applications smoke passed. Eight screenshots: ${out}`);
} finally {
  page?.ws.close();
  chrome.kill();
  await server.close();
}
