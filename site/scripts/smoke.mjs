/**
 * Opens the hub in headless Chrome at 380px, 720px and 1280px.
 * Fails if the page scrolls sideways, if a subject card or a course link is missing or points at
 * the wrong place, if a card moves at rest or under reduced motion, if a card's animation does not
 * finish when hovered, if the Progress backup did not mount, or if following a course link or a
 * card does not land on that course's app.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { builtCourses, latestBuilt, visibleTracks } from '../src/tracks.js';

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
        firstCardTop: tracks[0] ? tracks[0].getBoundingClientRect().top : -1,
        backup: document.querySelectorAll('#backup button').length,
      };
    })()`,
  );
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
  if (metrics.scroll > metrics.client + 1) {
    throw new Error(`${width}px scrolls sideways (${metrics.scroll} > ${metrics.client})`);
  }
  if (metrics.firstCardTop < 0 || metrics.firstCardTop > (width === 380 ? 780 : 900)) {
    throw new Error(`${width}px: the first subject card is not on the first screen`);
  }
  if (metrics.backup < 2) throw new Error(`${width}px: the Progress backup did not mount`);
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
      await navigate(page, hub);
      await evalJson(page, 'document.fonts ? document.fonts.ready : null');
      await delay(250);
      const metrics = await readHub(page);
      assertHub(width, metrics, hub);
      if (metrics.motions.some((motion) => motion !== 'still')) {
        throw new Error(`${width}px rest frame is moving (${metrics.motions.join(', ')})`);
      }
      if (width === 380 || width === 1280) {
        const shot = await page.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(outDir, `hub-${width}.png`), Buffer.from(shot.data, 'base64'));
        // A hovered card plays its animation through to the held frame.
        for (const track of visibleTracks()) {
          if (!metrics.staged.includes(track.id)) continue;
          await hoverTrack(page, track.id);
        }
      }
      console.log(`${width}px: ${metrics.ids.length} subjects, ${metrics.built.length} courses, ${metrics.cols} column${metrics.cols === 1 ? '' : 's'}`);
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
    await navigate(page, hub);
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
    console.log('smoke ok');
  } finally {
    chrome.kill('SIGKILL');
    await server.close();
    await delay(200);
    fs.rmSync(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

await main();
