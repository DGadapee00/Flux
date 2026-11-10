/** Browser checks for the satellite recipes. Uses the same Chrome DevTools protocol as smoke.mjs. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { SATELLITE } from '@flux/map/applications/satellite.js';
import { decisionsOf } from '@flux/map/applications/decisions/index.js';
import { travelerById } from '@flux/map/applications/travelers/index.js';

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
  assert.equal(await page.eval('document.querySelectorAll("#application-workbench .component-recipes button").length'), 8);
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
  await click('#applications [data-concept="em-waves"]');
  await wait(() => page.eval('document.querySelector("#concept-title")?.textContent.includes("Electromagnetic")'));
  assert.equal(await page.eval('location.hash'), '#em-waves');
  // The address keeps the chosen subsystem, and Back returns to the one before.
  await navigate('http://127.0.0.1:5175/?application=satellite&component=payload#applications');
  assert.equal(await page.eval('document.querySelector("#recipe-title").textContent'), 'Sensor payload');
  await select('power');
  await page.eval('history.back()');
  await wait(() => page.eval('document.querySelector("#recipe-title").textContent === "Sensor payload"'));
  // Structure has a Make side: its decisions open in place, and `&decision=` opens one.
  const structure = 'http://127.0.0.1:5175/?application=satellite&component=structure';
  const choices = decisionsOf('structure');
  await navigate(`${structure}&decision=structure-process#applications`);
  assert.equal(await page.eval('document.querySelector("#recipe-title").textContent'), 'Structure');
  assert.equal(await page.eval('document.querySelectorAll("[data-make] details[data-decision]").length'), choices.length);
  assert.equal(await page.eval('[...document.querySelectorAll("[data-make] details[data-decision]")].filter((d) => d.open).map((d) => d.dataset.decision).join()'), 'structure-process');
  for (const d of choices) {
    assert.equal(await page.eval(`document.querySelectorAll('#decision-${d.id} .option-table tbody tr').length`), d.options.length, `${d.id} table`);
    assert.equal(await page.eval(`document.querySelectorAll('#decision-${d.id} .options input[type=radio]').length`), d.options.length, `${d.id} picks`);
    assert.equal(await page.eval(`document.querySelectorAll('#decision-${d.id} .references a').length`), d.references.length, `${d.id} sources`);
  }
  // Picks tie the cards together: 6061 plate and metal printing rule each other out, and both cards say so.
  const pick = (decision, option) => page.eval(`(() => { const el = document.querySelector('input[name="pick-${decision}"][value="${option}"]'); el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await pick('structure-material', 'al-6061-t6');
  await pick('structure-process', 'printed-metal');
  await wait(() => page.eval('document.querySelector("[data-make-status]").textContent.includes("rule each other out")'));
  assert.equal(await page.eval('document.querySelectorAll("[data-make] .decision.has-clash").length'), 2);
  assert.match(await page.eval('document.querySelector("#decision-structure-material .option.is-picked .option-standing.is-clash").textContent'), /Ruled out by your pick for Process: Print in metal/);
  const record = await page.eval('document.querySelector("[data-text=\\"record-structure-material\\"]").textContent');
  assert.match(record, /^1\. I chose: Aluminium 6061-T6$/m);
  assert.match(record, /Conflicts with my pick for "How is the frame made\?": Print in metal\./);
  await click('[data-copy="record"][data-decision="structure-material"]');
  await wait(() => page.eval('document.querySelector("[data-copied=\\"record-structure-material\\"]").textContent.length > 0'));
  // The usual picks agree with each other, and clearing the picks starts over.
  await pick('structure-process', 'machined');
  await wait(() => page.eval('document.querySelector("[data-make-status]").textContent.includes("No pick rules out another")'));
  await click('[data-clear-picks]');
  await wait(() => page.eval('document.querySelectorAll("[data-make] input[type=radio]:checked").length === 0'));
  // A subsystem with no decisions has no Make side, and the address drops the card.
  await select('orbit');
  assert.equal(await page.eval('document.querySelectorAll("[data-make], [data-jump-make]").length'), 0);
  assert.equal(await page.eval('new URLSearchParams(location.search).has("decision")'), false);

  // The Welded joint leads to the traveler that shows how the process is run.
  await navigate(`${structure}&decision=structure-joints#applications`);
  assert.match(await page.eval('document.querySelector(".option-traveler a").getAttribute("href")'), /^\?traveler=fsw-dome#applications$/);

  // A traveler: one part through the shop. The switch shows it, and the address keeps the station.
  const dome = travelerById['fsw-dome'];
  const travelerUrl = 'http://127.0.0.1:5175/?traveler=fsw-dome';
  await navigate(`${travelerUrl}&station=panels#applications`);
  assert.equal(await page.eval('document.querySelector("#application-workbench").hidden'), true);
  assert.equal(await page.eval('document.querySelector("#traveler-workbench").hidden'), false);
  assert.equal(await page.eval('document.querySelector("[data-build=\\"traveler\\"]").getAttribute("aria-pressed")'), 'true');
  assert.equal(await page.eval('document.querySelectorAll(".route [data-station]").length'), dome.stations.length);
  assert.equal(await page.eval('document.querySelector("#station-title").textContent'), 'Gore panels');
  const station = (sel) => page.eval(`document.querySelectorAll('#traveler-station ${sel}').length`);
  for (const st of dome.stations) {
    await click(`.route [data-station="${st.id}"]`);
    assert.equal(await page.eval('document.querySelector("#station-title").textContent'), st.title, st.id);
    assert.equal(await station('.option-table tbody tr'), st.wrong.length, `${st.id} failures`);
    assert.equal(await station('.paper dt'), st.paper.length, `${st.id} paper`);
    assert.equal(await station('.station-grid > section > .references a'), st.sources.length, `${st.id} sources`);
    assert.equal(await station('[data-numbers]'), st.numbers ? 1 : 0, `${st.id} numbers`);
    assert.equal(await station('[data-case]'), dome.cases.filter((c) => c.station === st.id).length, `${st.id} cases`);
    assert.equal(await page.eval('document.querySelectorAll(".dome-figure [data-part].active").length > 0'), true, `${st.id} lights the drawing`);
  }
  // The numbers follow the part: a higher pressure at Requirement is a thicker land at Gore panels.
  const type = (id, value) => page.eval(`(() => { const el = document.querySelector('${id}'); el.value = '${value}'; el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const rows = () => page.eval('document.querySelector("#traveler-station .number-rows").textContent');
  await click('.route [data-station="requirement"]');
  assert.match(await rows(), /247 kPa/);
  await type('#dome-p', '400');
  await wait(async () => (await rows()).includes('420 kPa'));
  await click('.route [data-station="panels"]');
  assert.match(await rows(), /4\.58 mm: yield at proof governs/);
  // A case brief carries the dome as set, and copying says what happened.
  await click('.route [data-station="nonconformance"]');
  assert.match(await rows(), /Fusion weld repair67% warm, 61% cold/);
  assert.match(await page.eval('document.querySelector("[data-text-case=\\"repair\\"]").textContent'), /design pressure 400 kPa/);
  await click('[data-copy-case="repair"]');
  await wait(() => page.eval('document.querySelector("[data-copied-case=\\"repair\\"]").textContent.length > 0'));
  assert.equal(await page.eval('new URLSearchParams(location.search).get("station")'), 'nonconformance');
  // Nonsense for a pressure shows the example and says so.
  await click('.route [data-station="requirement"]');
  await type('#dome-p', '-3');
  await wait(() => page.eval('document.querySelector("[data-dome-hint]").textContent.includes("Showing the example")'));
  assert.match(await rows(), /247 kPa/);
  // Next and back walk the route, and the switch returns to the satellite.
  await click('.station-nav [data-station="material"]');
  assert.equal(await page.eval('document.querySelector("#station-title").textContent'), 'Material and process');
  await click('[data-build="satellite"]');
  assert.equal(await page.eval('document.querySelector("#traveler-workbench").hidden'), true);
  assert.equal(await page.eval('document.querySelector("#application-workbench").hidden'), false);
  assert.equal(await page.eval('new URLSearchParams(location.search).has("traveler")'), false);
  await page.eval('history.back()');
  await wait(() => page.eval('document.querySelector("#traveler-workbench").hidden === false'));

  for (const theme of ['light', 'dark']) {
    for (const [width, height] of [[390, 844], [1280, 800]]) {
      await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
      // Orbit for the overview and a recipe, Structure for the Make side: every card open in both.
      for (const [url, views] of [
        [undefined, [['overview', '#applications'], ['recipe', '#application-recipe']]],
        [`${structure}#applications`, [['make', '[data-make]'], ['decision', '#decision-structure-material .option-table']]],
        [`${travelerUrl}&station=nonconformance#applications`, [['traveler', '#traveler-workbench'], ['station', '#traveler-station'], ['case', '.station-cases']]],
      ]) {
        await navigate(url);
        await page.eval(`document.documentElement.dataset.theme = '${theme}'; document.querySelectorAll('#applications details').forEach((d) => d.setAttribute('open', '')); document.querySelector('#applications').scrollIntoView()`);
        await delay(150);
        assert.equal(await page.eval('document.documentElement.scrollWidth > innerWidth'), false, `${theme} ${width} ${views[0][0]}`);
        for (const [name, selector] of views) {
          await page.eval(`document.querySelector('${selector}').scrollIntoView()`);
          await delay(100);
          const shot = await page.send('Page.captureScreenshot', { format: 'png' });
          await fs.writeFile(`${out}/${theme}-${width}-${name}.png`, Buffer.from(shot.data, 'base64'));
        }
      }
    }
  }
  assert.deepEqual(page.errors, []);
  console.log(`Applications smoke passed. Twenty-eight screenshots: ${out}`);
} finally {
  page?.ws.close();
  chrome.kill();
  await server.close();
}
