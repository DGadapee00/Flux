/**
 * Opens the hub in headless Chrome at 380px, 720px and 1280px.
 * Fails if Today is not on the first screen, if a link that names a concept does not open the Map
 * tab alone, on that concept, if the page scrolls sideways, if the map is missing a concept, if choosing a concept does
 * not open it, if a phone's map does not bring the chosen concept into view, if a course card is
 * missing, if a concept's Parallels row is wrong or opening it throws, if following a card or a lab
 * link does not land on that course's app, or if a due problem in a course's record does not give
 * a thread review on Today whose Solve link opens that problem in its course app and fills the
 * concept's box on the map as learning and due.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { loadConcepts, loadPaths } from '@flux/map/load.mjs';
import { problemIndex } from '@flux/map/problems.mjs';
import { builtCourses, latestBuilt, visibleTracks } from '../src/tracks.js';

const CONCEPTS = (await loadConcepts()).map((item) => item.concept);
/** The concept the hub's map opens on (START in src/map.js, which Node cannot import: it loads CSS). */
const START = 'divergence-theorem';
const PATHS = (await loadPaths()).map((item) => item.path);

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chromeBin = process.env.CHROME || 'google-chrome';
const debugPort = Number(process.env.FLUX_CHROME_PORT || 9333);
const outDir = process.env.FLUX_SMOKE_OUT || '/tmp/flux-smoke';

class Cdp {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.next = 1;
    this.pending = new Map();
    this.handlers = [];
  }

  open() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.addEventListener('open', () => resolve());
      this.ws.addEventListener('error', () => reject(new Error(`websocket failed for ${this.wsUrl}`)));
      this.ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (message.id && this.pending.has(message.id)) {
          const pending = this.pending.get(message.id);
          this.pending.delete(message.id);
          if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
          else pending.resolve(message.result);
        } else {
          for (const handler of this.handlers) handler(message);
        }
      });
    });
  }

  send(method, params = {}) {
    const id = this.next;
    this.next += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(handler) {
    this.handlers.push(handler);
  }

  off(handler) {
    this.handlers = this.handlers.filter((item) => item !== handler);
  }
}

/**
 * @param {Cdp} page
 * @param {string} url
 */
async function navigate(page, url) {
  const loaded = new Promise((resolve) => {
    const handler = (message) => {
      if (message.method === 'Page.loadEventFired') {
        page.off(handler);
        resolve();
      }
    };
    page.on(handler);
  });
  await page.send('Page.navigate', { url });
  await loaded;
}

/**
 * @param {Cdp} page
 * @param {string} expression
 */
async function evalJson(page, expression) {
  // A page that is still navigating can drop an evaluation; try again, a few times only.
  let result;
  for (let attempt = 0; ; attempt += 1) {
    try {
      result = await page.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      break;
    } catch (err) {
      if (attempt >= 4 || !/navigated or closed|context/i.test(String(err.message))) throw err;
      await delay(250);
    }
  }
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'page evaluation failed');
  }
  return result.result?.value;
}

/**
 * @param {Cdp} page
 * @param {string} prefix
 */
async function waitForPrefix(page, prefix) {
  const deadline = Date.now() + 20000;
  let href = '';
  while (Date.now() < deadline) {
    href = await evalJson(page, 'location.href');
    if (typeof href === 'string' && href.startsWith(prefix)) return href;
    await delay(200);
  }
  throw new Error(`expected a url starting ${prefix}, last was ${href}`);
}

/**
 * @param {string} url
 */
async function waitJson(url) {
  const deadline = Date.now() + 10000;
  let last = 'not up';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      last = `HTTP ${response.status}`;
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
    }
    await delay(100);
  }
  throw new Error(`${url} did not come up (${last})`);
}

/**
 * @param {number} ms
 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @param {Cdp} page
 */
async function readHub(page) {
  return evalJson(
    page,
    `(() => {
      const tracks = [...document.querySelectorAll('[data-track]')];
      const grid = document.querySelector('#tracks');
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
      return {
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        cols,
        ids: tracks.map((el) => el.dataset.track),
        opens: tracks.map((el) => el.querySelector('.track-open')?.href ?? null),
        built: [...document.querySelectorAll('a.course-link')].map((a) => ({ id: a.dataset.course, href: a.href })),
        unbuilt: [...document.querySelectorAll('.unbuilt')].map((el) => el.textContent),
        motions: tracks.map((el) => el.dataset.motion),
        staged: tracks.filter((el) => el.querySelector('.stage')).map((el) => el.dataset.track),
        nodes: document.querySelectorAll('#map .node').length,
        firstScreen: (() => {
          const box = document.querySelector('#mapbox').getBoundingClientRect();
          const node = document.querySelector('#map .node.sel rect')?.getBoundingClientRect();
          const title = document.querySelector('#concept-title')?.getBoundingClientRect();
          const inside = (r, b) => r && r.top >= b.top - 1 && r.bottom <= b.bottom + 1 && r.left >= b.left - 1 && r.right <= b.right + 1;
          const screen = { top: 0, left: 0, bottom: innerHeight, right: innerWidth };
          return Boolean(inside(node, box) && inside(node, screen) && inside(title, screen));
        })(),
        chosen: document.querySelector('#detail')?.dataset.concept ?? null,
        mapScrolls: (() => {
          const box = document.querySelector('#mapbox');
          return box.scrollWidth > box.clientWidth + 1;
        })(),
      };
    })()`,
  );
}

/** @param {Record<string, any>} o @param {string[]} keys */
function pick(o, keys) {
  return Object.fromEntries(keys.map((k) => [k, o[k]]));
}

/**
 * Card hrefs are absolute in the DOM. A relative href is the platform copy on this hub.
 * @param {string} href
 * @param {string} base
 */
function resolvedHref(href, base) {
  return new URL(href, base).href;
}

function assertHub(width, metrics, hub) {
  const expectedCols = width >= 1040 ? 3 : width >= 720 ? 2 : 1;
  if (metrics.nodes < 2 || metrics.nodes >= CONCEPTS.length) {
    throw new Error(`${width}px local view shows ${metrics.nodes} concepts, expected a neighbourhood`);
  }
  if (!metrics.firstScreen) throw new Error(`${width}px: the chosen concept and its title are not both on the first screen`);
  if (!metrics.chosen) throw new Error(`${width}px map opened on no concept`);
  if (metrics.scroll > metrics.client + 1) {
    throw new Error(`${width}px scrolls sideways (${metrics.scroll} > ${metrics.client})`);
  }
  if (metrics.cols !== expectedCols) {
    throw new Error(`${width}px has ${metrics.cols} columns, expected ${expectedCols}`);
  }
  const shown = visibleTracks();
  const ids = shown.map((track) => track.id);
  if (JSON.stringify(metrics.ids) !== JSON.stringify(ids)) {
    throw new Error(`tracks are ${metrics.ids.join(', ')}`);
  }
  shown.forEach((track, i) => {
    const latest = latestBuilt(track);
    const expected = latest ? resolvedHref(latest.href, hub) : null;
    if (metrics.opens[i] !== expected) {
      throw new Error(`${track.id} opens ${metrics.opens[i]}, expected ${expected}`);
    }
  });
  for (const course of builtCourses()) {
    const row = metrics.built.find((item) => item.id === course.id);
    const expected = resolvedHref(course.href, hub);
    if (!row || row.href !== expected) {
      throw new Error(`${course.id} link is ${row ? row.href : 'missing'}, expected ${expected}`);
    }
  }
  if (metrics.unbuilt.some((text) => !text.includes('not built yet'))) {
    throw new Error('an unbuilt course is missing its label');
  }
}

/**
 * @param {Cdp} page
 * @param {string} id
 */
async function hoverTrack(page, id) {
  await evalJson(page, `document.querySelector('[data-track="${id}"]').scrollIntoView({ block: 'center' })`);
  await delay(120);
  await evalJson(
    page,
    `document.querySelector('[data-track="${id}"]').dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))`,
  );
  const deadline = Date.now() + 3000;
  let motion = '';
  while (Date.now() < deadline) {
    motion = await evalJson(page, `document.querySelector('[data-track="${id}"]').dataset.motion`);
    if (motion === 'held') return;
    await delay(50);
  }
  throw new Error(`${id} did not finish, motion=${motion}`);
}

async function main() {
  const server = await createServer({
    root: siteRoot,
    configFile: path.join(siteRoot, 'vite.config.js'),
    server: { host: '127.0.0.1', port: 5173, strictPort: true, hmr: false },
  });
  await server.listen();

  const userData = `/tmp/flux-hub-chrome-${process.pid}`;
  const chrome = spawn(
    chromeBin,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userData}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  try {
    const version = await waitJson(`http://127.0.0.1:${debugPort}/json/version`);
    const browser = new Cdp(version.webSocketDebuggerUrl);
    await browser.open();
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const targets = await waitJson(`http://127.0.0.1:${debugPort}/json/list`);
    const target = targets.find((item) => item.id === targetId);
    if (!target?.webSocketDebuggerUrl) throw new Error('chrome target has no debugger url');

    const page = new Cdp(target.webSocketDebuggerUrl);
    await page.open();
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    // Headless Chrome reports pointer: none, so a card would play on scroll.
    // The hover check needs a fine pointer. prefers-reduced-motion stays real.
    await page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => {
        const orig = window.matchMedia.bind(window);
        window.matchMedia = (query) => {
          if (query === '(hover: hover) and (pointer: fine)') {
            return {
              matches: true,
              media: query,
              onchange: null,
              addListener() {},
              removeListener() {},
              addEventListener() {},
              removeEventListener() {},
              dispatchEvent() { return false; },
            };
          }
          return orig(query);
        };
      })();`,
    });

    fs.mkdirSync(outDir, { recursive: true });
    const hub = 'http://127.0.0.1:5173/';

    for (const width of [380, 720, 1280]) {
      await page.send('Emulation.setDeviceMetricsOverride', {
        width,
        height: width === 380 ? 780 : 900,
        deviceScaleFactor: 1,
        mobile: width < 700,
      });
      await page.send('Emulation.setEmulatedMedia', { features: [] });
      // The hub opens on Today.
      await navigate(page, hub);
      await evalJson(page, 'document.fonts ? document.fonts.ready : null');
      await delay(250);
      const today = await evalJson(page, `(() => {
        const h = document.querySelector('#today-title')?.getBoundingClientRect();
        return { headline: document.querySelector('#today-title')?.textContent ?? '', top: h ? h.top : -1, bottom: h ? h.bottom : -1, scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth };
      })()`);
      if (!today.headline || today.top < 0 || today.bottom > (width === 380 ? 780 : 900)) throw new Error(`${width}px: Today's headline is not on the first screen`);
      if (today.scroll > today.client + 1) throw new Error(`${width}px Today scrolls sideways`);
      if (width === 380 || width === 1280) {
        const shot = await page.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(outDir, `hub-${width}-today.png`), Buffer.from(shot.data, 'base64'));
      }
      // A link that names a concept opens the Map tab on it. The course cards are on Courses.
      await navigate(page, `${hub}?from=smoke#${START}`);
      await evalJson(page, 'document.fonts ? document.fonts.ready : null');
      await delay(250);
      const tab = await evalJson(page, `({ tab: document.body.dataset.activeTab, shown: [...document.querySelectorAll('[data-tab]')].filter((el) => !el.hidden).map((el) => el.dataset.tab) })`);
      if (tab.tab !== 'map' || JSON.stringify(tab.shown) !== '["map"]') throw new Error(`${width}px: #${START} shows ${tab.shown.join(', ')}, expected the Map tab alone`);
      const mapShotFirst = await page.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(outDir, `hub-${width}-map-tab.png`), Buffer.from(mapShotFirst.data, 'base64'));
      const mapMetrics = await readHub(page);
      await evalJson(page, `location.hash = 'courses'`);
      await delay(300);
      const metrics = { ...(await readHub(page)), ...pick(mapMetrics, ['nodes', 'firstScreen', 'chosen', 'mapScrolls']) };
      assertHub(width, metrics, hub);
      if (metrics.motions.some((motion) => motion !== 'still')) {
        throw new Error(`${width}px rest frame is moving (${metrics.motions.join(', ')})`);
      }
      if (width === 380 || width === 1280) {
        const shot = await page.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(outDir, `hub-${width}.png`), Buffer.from(shot.data, 'base64'));
        for (const track of visibleTracks()) {
          if (!metrics.staged.includes(track.id)) continue;
          await hoverTrack(page, track.id);
          const box = await evalJson(
            page,
            `(() => {
              const rect = document.querySelector('[data-track="${track.id}"]').getBoundingClientRect();
              return {
                x: rect.x + window.scrollX,
                y: rect.y + window.scrollY,
                width: rect.width,
                height: rect.height,
              };
            })()`,
          );
          const cardShot = await page.send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: true,
            clip: { ...box, scale: 1 },
          });
          fs.writeFileSync(path.join(outDir, `hub-${width}-${track.id}.png`), Buffer.from(cardShot.data, 'base64'));
          console.log(`${width}px ${track.id} played`);
        }
        if (width === 1280) {
          const played = await page.send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(outDir, 'hub-1280-played.png'), Buffer.from(played.data, 'base64'));
        }
      }
      console.log(`${width}px ok, ${metrics.cols} column(s), ${metrics.nodes} concepts, no horizontal scroll`);
      // Back to the Map tab for the full map.
      await evalJson(page, `location.hash = '${START}'`);
      await delay(400);

      // Full map draws every concept. Choosing one opens it; the map scrolls in its box to show it.
      await evalJson(page, `document.querySelector('#scope [data-scope="all"]').click()`);
      await delay(200);
      const all = await evalJson(page, `document.querySelectorAll('#map .node').length`);
      if (all !== CONCEPTS.length) throw new Error(`${width}px full map shows ${all} concepts, expected ${CONCEPTS.length}`);
      const last = CONCEPTS[CONCEPTS.length - 1].id;
      await evalJson(page, `document.querySelector('#map .node[data-concept="${last}"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
      await delay(400);
      const chosen = await evalJson(
        page,
        `({ hash: location.hash, shown: document.querySelector('#detail').dataset.concept, left: document.querySelector('#mapbox').scrollLeft, page: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })`,
      );
      if (chosen.hash !== `#${last}` || chosen.shown !== last) {
        throw new Error(`${width}px clicking ${last} showed ${chosen.shown} at ${chosen.hash}`);
      }
      if (metrics.mapScrolls && width < 720) {
        const deep = CONCEPTS.reduce((a, c) => (c.requires.length > a.requires.length ? c : a), CONCEPTS[0]);
        await evalJson(page, `location.hash = '${deep.id}'`);
        await delay(600);
        const left = await evalJson(page, `document.querySelector('#mapbox').scrollLeft`);
        if (!(left > 0)) throw new Error(`${width}px map did not scroll to ${deep.id}`);
      }
      if (chosen.page > chosen.client + 1) throw new Error(`${width}px scrolls sideways after choosing a concept`);
      const mapShot = await page.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(outDir, `hub-${width}-map.png`), Buffer.from(mapShot.data, 'base64'));

      // A tall map can fill the width without shrinking every lane into the viewport height.
      await evalJson(page, `document.querySelector('[data-zoom="width"]').click()`);
      const fitted = await evalJson(page, `(() => {
        const box = document.querySelector('#mapbox');
        return { width: box.clientWidth, drawing: document.querySelector('#map').getBoundingClientRect().width };
      })()`);
      if (Math.abs(fitted.width - fitted.drawing) > 8) throw new Error(`${width}px Fit width leaves unused map space`);
      await evalJson(page, `document.querySelector('[data-zoom="fit"]').click()`);
      const fitsAll = await evalJson(page, `(() => {
        const box = document.querySelector('#mapbox');
        const drawing = document.querySelector('#map').getBoundingClientRect();
        return drawing.width <= box.clientWidth + 1 && drawing.height <= box.clientHeight + 1;
      })()`);
      if (!fitsAll) throw new Error(`${width}px Fit all does not show the whole map`);
    }

    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 380,
      height: 780,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await page.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await navigate(page, `${hub}#courses`);
    for (const track of visibleTracks()) {
      if (!(await evalJson(page, `!!document.querySelector('[data-track="${track.id}"] .stage')`))) continue;
      await evalJson(
        page,
        `document.querySelector('[data-track="${track.id}"]').scrollIntoView({ block: 'center' })`,
      );
      await delay(80);
      await evalJson(
        page,
        `document.querySelector('[data-track="${track.id}"]').dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))`,
      );
    }
    await delay(400);
    const reduced = await readHub(page);
    for (const motion of reduced.motions) {
      if (motion !== 'still') throw new Error(`reduced motion played a card (${reduced.motions.join(', ')})`);
    }
    console.log('380px reduced motion stays on the still frame');
    await page.send('Emulation.setEmulatedMedia', { features: [] });

    await navigate(page, hub);
    for (const course of builtCourses()) {
      const prefix = resolvedHref(course.href, hub).replace(/\/$/, '');
      await evalJson(page, `document.querySelector('a.course-link[data-course="${course.id}"]').click()`);
      const landed = await waitForPrefix(page, prefix);
      console.log(`${course.id} → ${landed}`);
      await navigate(page, hub);
    }
    for (const track of visibleTracks()) {
      const latest = latestBuilt(track);
      const prefix = resolvedHref(latest.href, hub).replace(/\/$/, '');
      await evalJson(page, `document.querySelector('a.track-open[data-track-open="${track.id}"]').click()`);
      const landed = await waitForPrefix(page, prefix);
      console.log(`${track.id} card → ${landed}`);
      await navigate(page, hub);
    }
    // Choosing a course numbers its path on the map and lists it in order.
    for (const p of PATHS) {
      const want = p.units.flatMap((u) => u.concepts);
      await navigate(page, hub);
      await evalJson(page, `document.querySelector('[data-path="${p.course}"]').click()`);
      await delay(200);
      const got = await evalJson(
        page,
        `({ on: [...document.querySelectorAll('#map .node.on-path')].length, list: [...document.querySelectorAll('#path-list [data-go]')].map((b) => b.dataset.go), url: location.search })`,
      );
      if (got.on !== want.length || JSON.stringify(got.list) !== JSON.stringify(want) || got.url !== `?path=${p.course}`) {
        throw new Error(`${p.course} path shows ${got.on} on the map and lists ${got.list.join(', ')}`);
      }
      console.log(`${p.course} path: ${want.length} concepts`);
    }

    // The find box opens a concept by name, and a subject match keeps only that lane.
    await navigate(page, hub);
    const typeAndEnter = (q) =>
      evalJson(
        page,
        `(() => { const i = document.querySelector('#find-input'); i.focus(); i.value = ${JSON.stringify(q)}; i.dispatchEvent(new Event('input')); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`,
      );
    await typeAndEnter('gauss');
    await delay(300);
    const foundId = await evalJson(page, `document.getElementById('detail').dataset.concept`);
    if (foundId !== 'gauss-law') throw new Error(`find "gauss" opened ${foundId}`);
    await typeAndEnter('heat transfer');
    await delay(300);
    const lane = await evalJson(page, `({ url: location.search, subjects: [...new Set([...document.querySelectorAll('#map .node')].map((n) => n.querySelector('rect').getAttribute('stroke')))].length })`);
    if (!lane.url.includes('lanes=heat') || lane.subjects !== 1) throw new Error(`find "heat transfer" left ${lane.subjects} lanes at ${lane.url}`);
    console.log('find: a name opens its concept, a subject keeps its lane');

    // A concept with a parallel lists it in the panel, from either end, and opening it throws nothing.
    const parallels = new Map(CONCEPTS.map((c) => [c.id, []]));
    for (const c of CONCEPTS) {
      for (const r of c.related || []) {
        parallels.get(c.id).push(r.id);
        parallels.get(r.id).push(c.id);
      }
    }
    const thrown = [];
    const onThrow = (message) => {
      if (message.method === 'Runtime.exceptionThrown') thrown.push(message.params.exceptionDetails?.exception?.description || 'exception');
    };
    page.on(onThrow);
    for (const [id, want] of parallels) {
      if (!want.length) continue;
      await navigate(page, hub);
      await evalJson(page, `location.hash = '${id}'`);
      const deadline = Date.now() + 10000;
      while ((await evalJson(page, `document.getElementById('detail').dataset.concept`)) !== id) {
        if (Date.now() > deadline) throw new Error(`${id}: the panel did not open`);
        await delay(100);
      }
      const got = await evalJson(page, `[...document.querySelectorAll('.parallels [data-go]')].map((b) => b.dataset.go)`);
      if (JSON.stringify([...got].sort()) !== JSON.stringify([...want].sort())) {
        throw new Error(`${id}: Parallels lists ${got.join(', ') || 'nothing'}, expected ${want.join(', ')}`);
      }
      if (thrown.length) throw new Error(`${id}: the page threw ${thrown.join('; ')}`);
      console.log(`${id} parallels: ${want.join(', ')}`);
    }
    page.off(onThrow);

    // Every lab link on the map lands in its course app.
    for (const concept of CONCEPTS) {
      for (const ref of concept.labs) {
        await navigate(page, hub);
        await evalJson(page, `location.hash = '${concept.id}'`);
        // Wait for the panel to show this concept's lab link before following it.
        const selector = `[data-lab="${ref.course}/${ref.lab}"]`;
        const deadline = Date.now() + 10000;
        while (!(await evalJson(page, `Boolean(document.querySelector('${selector}'))`))) {
          if (Date.now() > deadline) throw new Error(`${concept.id}: no link to ${ref.course}/${ref.lab} in the panel`);
          await delay(100);
        }
        await evalJson(page, `document.querySelector('${selector}').click()`);
        const landed = await waitForPrefix(page, `${hub}${ref.course}/#/${ref.course}/`);
        console.log(`${concept.id} lab → ${landed}`);
      }
    }
    // A due problem in a course's record gives a thread review on Today, and Solve opens it.
    const { byLab, titles } = await problemIndex();
    const plain = (lab) => (byLab[`phy2049/${lab}`] || []).filter((k) => !titles[k].includes('$'));
    const concept = CONCEPTS.find((c) => c.labs.some((ref) => ref.course === 'phy2049' && plain(ref.lab).length));
    const ref = concept.labs.find((r) => r.course === 'phy2049' && plain(r.lab).length);
    const key = plain(ref.lab)[0];
    const problemId = key.slice('phy2049:'.length);
    for (const width of [380, 1280]) {
      await page.send('Emulation.setDeviceMetricsOverride', { width, height: width === 380 ? 780 : 900, deviceScaleFactor: 1, mobile: width < 700 });
      await navigate(page, hub);
      await evalJson(page, `(() => {
        const t = Date.now();
        localStorage.setItem('flux.phy2049.problems.v1', JSON.stringify({ v: 1, items: { ${JSON.stringify(problemId)}: { box: 1, due: t - 864e5, lastOk: false, last: t - 2 * 864e5 } } }));
        sessionStorage.clear();
      })()`);
      await navigate(page, `${hub}?from=smoke-review`);
      await delay(250);
      const thread = await evalJson(page, `document.querySelector('.tdy-thread')?.getAttribute('href') ?? null`);
      if (thread !== `#review-${concept.id}`) throw new Error(`${width}px: Today shows thread ${thread}, expected #review-${concept.id}`);
      await evalJson(page, `document.querySelector('.tdy-thread').click()`);
      await delay(250);
      await evalJson(page, `document.querySelector('[data-show]').click()`);
      await delay(250);
      const review = await evalJson(page, `({ solve: document.querySelector('.tdy-solve')?.href ?? null, title: document.querySelector('#today-title')?.textContent ?? '', scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })`);
      const want = `/phy2049/#/phy2049/`;
      if (!review.solve || !review.solve.includes(want) || !review.solve.endsWith(`?p=${encodeURIComponent(problemId)}`)) {
        throw new Error(`${width}px: Solve links to ${review.solve}, expected a phy2049 link ending ?p=${problemId}`);
      }
      if (review.scroll > review.client + 1) throw new Error(`${width}px thread review scrolls sideways`);
      const shot = await page.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(outDir, `hub-${width}-review.png`), Buffer.from(shot.data, 'base64'));
      // The reading panel shows the record for that concept.
      await navigate(page, `${hub}?from=smoke-panel#${concept.id}`);
      await delay(250);
      const record = await evalJson(page, `document.querySelector('#detail .tdy-record')?.textContent ?? ''`);
      if (!/Learning/.test(record)) throw new Error(`${width}px: ${concept.id} panel record reads "${record}"`);
      // The concept's box on the map is filled as learning and marked due.
      const box = await evalJson(page, `(() => { const g = document.querySelector('#map .node[data-concept="${concept.id}"]'); return g ? [...g.classList] : null; })()`);
      if (!box || !box.includes('st-learning') || !box.includes('st-due')) throw new Error(`${width}px: ${concept.id} box is ${JSON.stringify(box)}, expected learning and due`);
      if (width === 1280) {
        // Following Solve opens that problem in PHY 2049, ready to answer.
        await navigate(page, review.solve);
        await waitForPrefix(page, `${hub}phy2049/`);
        const deadline = Date.now() + 15000;
        let text = '';
        while (Date.now() < deadline && !text.includes(titles[key])) {
          await delay(300);
          text = await evalJson(page, 'document.body.innerText');
        }
        if (!text.includes(titles[key])) throw new Error(`Solve opened PHY 2049 without "${titles[key]}"`);
        console.log(`thread review → ${titles[key]} in PHY 2049`);
        await navigate(page, hub);
      }
      await evalJson(page, `localStorage.removeItem('flux.phy2049.problems.v1')`);
    }
    console.log('smoke ok');
  } finally {
    chrome.kill('SIGKILL');
    await server.close();
    await delay(200);
    fs.rmSync(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

await main();
