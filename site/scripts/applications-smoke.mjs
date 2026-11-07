/** Browser checks for the satellite recipes. Uses the same Chrome DevTools protocol as smoke.mjs. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { SATELLITE } from '@flux/map/applications/satellite.js';

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
const chrome = spawn(process.env.CHROME || 'google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/flux-app-chrome-${process.pid}`, 'about:blank'], { stdio: 'ignore' });
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
    await wait(() => page.eval('!!document.querySelector("[data-copy=\\"brief\\"]")'));
  }
  const click = (selector) => page.eval(`document.querySelector(${JSON.stringify(selector)}).click()`);
  async function select(id) { await click(`[data-select="${id}"]`); }
  await navigate();
  // Seven subsystems and the integration, each a reference page with its own review brief.
  assert.equal(await page.eval('document.querySelectorAll(".component-recipes button").length'), 8);
  assert.equal(await page.eval('document.querySelectorAll("[data-record], #application-evidence, .application-submission").length'), 0);
  for (const r of [...SATELLITE.components, SATELLITE.integration]) {
    await select(r.id);
    const text = await page.eval('document.querySelector("[data-text=\\"brief\\"]").textContent');
    assert.match(text, new RegExp(`^# Review: ${r.title}`), r.id);
    for (const item of r.checklist) assert.ok(text.includes(item), `${r.id}: ${item}`);
    assert.equal(await page.eval('document.querySelectorAll(".method li").length'), r.method.length, r.id);
  }
  // The Project instructions are on the page to copy once.
  assert.match(await page.eval('document.querySelector("[data-text=\\"instructions\\"]").textContent'), /Recompute every number/);
  // Copying either text says what happened: copied, or selected for copying by hand.
  await click('[data-copy="brief"]');
  await wait(() => page.eval('document.querySelector("[data-copied=\\"brief\\"]").textContent.length > 0'));
  // Orbit keeps a self-check: a wrong speed fails, the right numbers pass, nothing is recorded.
  await select('orbit');
  async function checkOrbit(v, T) {
    await page.eval(`(() => { document.querySelector('#oc-h').value = '550'; document.querySelector('#oc-v').value = '${v}'; document.querySelector('#oc-T').value = '${T}'; document.querySelector('[data-orbit-form]').requestSubmit(); })()`);
    return page.eval('document.querySelector("[data-orbit-result]").textContent');
  }
  assert.match(await checkOrbit('7.0', '95.5'), /Not yet: speed is off/);
  assert.match(await checkOrbit('7.59', '95.5'), /agree with both routes/);
  // A foundation link selects the concept in the live map.
  await select('communications');
  await click('[data-concept="em-waves"]');
  await wait(() => page.eval('document.querySelector("#concept-title")?.textContent.includes("Electromagnetic")'));
  assert.equal(await page.eval('location.hash'), '#em-waves');
  // The address keeps the chosen subsystem, and Back returns to the one before.
  await navigate('http://127.0.0.1:5175/?application=satellite&component=payload#applications');
  assert.equal(await page.eval('document.querySelector("#recipe-title").textContent'), 'Sensor payload');
  await select('power');
  await page.eval('history.back()');
  await wait(() => page.eval('document.querySelector("#recipe-title").textContent === "Sensor payload"'));
  for (const theme of ['light', 'dark']) {
    for (const [width, height] of [[390, 844], [1280, 800]]) {
      await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
      await navigate();
      await page.eval(`document.documentElement.dataset.theme = '${theme}'; document.querySelectorAll('#applications details').forEach((d) => d.setAttribute('open', '')); document.querySelector('#applications').scrollIntoView()`);
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
  assert.deepEqual(page.errors, []);
  console.log(`Applications smoke passed. Eight screenshots: ${out}`);
} finally {
  page?.ws.close();
  chrome.kill();
  await server.close();
}
