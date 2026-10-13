/**
 * Opens the hub in headless Chrome at 380px and 1280px.
 * Fails if the page scrolls sideways, if a course card is missing, or if
 * following a card does not land on that course's live app.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { COURSES } from '../src/courses.js';

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
  const result = await page.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
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

async function main() {
  const server = await createServer({
    root: siteRoot,
    configFile: path.join(siteRoot, 'vite.config.js'),
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
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

    fs.mkdirSync(outDir, { recursive: true });
    const hub = 'http://127.0.0.1:5173/';

    for (const width of [380, 1280]) {
      await page.send('Emulation.setDeviceMetricsOverride', {
        width,
        height: width === 380 ? 780 : 800,
        deviceScaleFactor: 1,
        mobile: width < 700,
      });
      await navigate(page, hub);
      await evalJson(page, 'document.fonts ? document.fonts.ready : null');
      const metrics = await evalJson(
        page,
        `({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
          ids: [...document.querySelectorAll('a.card')].map((a) => a.dataset.course),
          hrefs: [...document.querySelectorAll('a.card')].map((a) => a.href),
        })`,
      );
      if (metrics.scroll > metrics.client + 1) {
        throw new Error(`${width}px hub scrolls horizontally (${metrics.scroll} > ${metrics.client})`);
      }
      const ids = COURSES.map((course) => course.id);
      if (JSON.stringify(metrics.ids) !== JSON.stringify(ids)) {
        throw new Error(`${width}px cards are ${metrics.ids.join(', ')}, expected ${ids.join(', ')}`);
      }
      for (let i = 0; i < COURSES.length; i += 1) {
        const expected = new URL(COURSES[i].href).href;
        if (metrics.hrefs[i] !== expected) {
          throw new Error(`${width}px ${COURSES[i].id} href is ${metrics.hrefs[i]}, expected ${expected}`);
        }
      }
      const shot = await page.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(outDir, `hub-${width}.png`), Buffer.from(shot.data, 'base64'));
      console.log(`${width}px ok, no horizontal scroll`);
    }

    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 380,
      height: 780,
      deviceScaleFactor: 1,
      mobile: true,
    });
    for (const course of COURSES) {
      await navigate(page, hub);
      const prefix = course.href.replace(/\/$/, '');
      await evalJson(page, `document.querySelector('a.card[data-course="${course.id}"]').click()`);
      const landed = await waitForPrefix(page, prefix);
      console.log(`${course.id} → ${landed}`);
    }
    console.log('smoke ok');
  } finally {
    chrome.kill();
    await server.close();
    fs.rmSync(userData, { recursive: true, force: true });
  }
}

await main();
