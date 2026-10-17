/**
 * Layout check for the engineering HUD, run by a course against its dev server.
 *
 * Every route, every scenario in its picker, at each size. It fails when
 *  - the readout bar covers the equation panel, the Setup panel, or the visible part of the plot;
 *  - a readout value is wider than its cell;
 *  - a stacked plot (a, v, s against time) runs below the fold of its panel;
 *  - the page scrolls sideways.
 * On a phone the equation panel shares the bottom sheet, so the Explain toggle is opened first.
 *
 * @param {{ chromium: any, base: string, routes: string[], sizes?: number[][] }} opts
 * @returns {Promise<{ views: number, plots: number, fails: string[] }>}
 */
export async function checkLayout({ chromium, base, routes, sizes = [[1280, 800], [380, 820]] }) {
  const browser = await chromium.launch({ headless: true });
  const fails = [];
  let views = 0;
  let plots = 0;
  try {
    for (const [w, h] of sizes) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      page.on('pageerror', (e) => fails.push(`${w}x${h}: page error ${e.message}`));
      for (const route of routes) {
        await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        const scenarios = await page.evaluate(() => [...(document.querySelector('#scenario')?.options || [])].map((o) => o.value));
        for (const sc of scenarios.length ? scenarios : [null]) {
          if (sc != null) {
            await page.evaluate((v) => {
              const el = document.querySelector('#scenario');
              el.value = v;
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, sc);
          }
          await page.evaluate(() => {
            const b = document.querySelector('#btn-sheet');
            if (b && getComputedStyle(b).display !== 'none' && b.getAttribute('aria-pressed') !== 'true') b.click();
          });
          await page.waitForTimeout(250);
          const r = await page.evaluate(measure);
          const tag = `${route}${sc ? ` (${sc})` : ''} at ${w}x${h}`;
          views++;
          if (r.plot) plots++;
          for (const f of r.fails) fails.push(`${tag}: ${f}`);
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return { views, plots, fails };
}

/** Runs in the page. */
function measure() {
  const fails = [];
  const rect = (el) => {
    if (!el || el.hidden) return null;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return null;
    const b = el.getBoundingClientRect();
    return b.width > 1 && b.height > 1 ? b : null;
  };
  const hit = (a, b) => a && b && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
  const bar = rect(document.getElementById('readout'));
  const panel = rect(document.getElementById('eq-panel'));
  const controls = rect(document.querySelector('.controls'));
  const canvas = document.getElementById('mini-plot');
  const plot = rect(canvas);
  if (hit(panel, bar)) fails.push('the readout covers the equation panel');
  if (hit(controls, bar)) fails.push('the readout covers the Setup panel');
  if (plot && panel) {
    const shown = { left: plot.left, right: plot.right, top: Math.max(plot.top, panel.top), bottom: Math.min(plot.bottom, panel.bottom) };
    if (shown.bottom > shown.top && hit(shown, bar)) fails.push('the readout covers the plot');
    const below = Math.round(plot.bottom - (panel.bottom - 8));
    if (canvas.classList.contains('series') && below > 2) fails.push(`${below}px of the plot is below the fold of its panel`);
  }
  for (const v of document.querySelectorAll('#readout .value')) {
    if (v.scrollWidth > v.clientWidth + 1) fails.push(`the readout value "${v.textContent}" is wider than its cell`);
  }
  if (document.documentElement.scrollWidth > window.innerWidth + 1) fails.push(`the page scrolls sideways (${document.documentElement.scrollWidth}px)`);
  return { plot: !!plot, fails };
}
