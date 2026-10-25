/**
 * The page chrome of a physics course: the canvas, the header with its unit picker and mode switch,
 * the practice, units, notes, equation and keys panels, the setup panel and the readout.
 *
 * The shell's modules find these elements by id, so a course renders this once, first, and then
 * mounts the modules. The course supplies the three strings the markup cannot name.
 */

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');

/**
 * @param {object} opts
 * @param {string} opts.code The course code printed under FLUX, before the course sets it.
 * @param {string} opts.setupHint The Setup panel's first hint line.
 * @param {string} [opts.unitName] What the picker calls a unit, for its accessible name.
 */
function chromeHTML({ code, setupHint, unitName = 'Unit' }) {
  return `
  <canvas id="c" role="img" aria-label="Lab scene"></canvas>
  <div id="sr-announce" class="sr-only" aria-live="polite"></div>

  <header class="hud panel brand" id="brand">
    <svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="11" fill="none" stroke="#58C4DD" stroke-width="2" />
      <circle cx="20" cy="20" r="3.2" fill="#FC6255" />
      <g stroke="#F4D345" stroke-width="1.8" stroke-linecap="round" fill="#F4D345">
        <line x1="20" y1="12.5" x2="20" y2="4.5" /><path d="M20 2 L17.6 6 L22.4 6 Z" stroke="none" />
        <line x1="27.5" y1="20" x2="35.5" y2="20" /><path d="M38 20 L34 17.6 L34 22.4 Z" stroke="none" />
        <line x1="20" y1="27.5" x2="20" y2="35.5" /><path d="M20 38 L17.6 34 L22.4 34 Z" stroke="none" />
        <line x1="12.5" y1="20" x2="4.5" y2="20" /><path d="M2 20 L6 17.6 L6 22.4 Z" stroke="none" />
      </g>
    </svg>
    <div class="brand-text">
      <h1>FLUX</h1>
      <p class="subtitle" id="brand-sub">${esc(code)}</p>
    </div>
    <!-- Which unit: named, and dated where the course dates it, so nobody has to hover a numeral to find it. -->
    <select class="exam-select" id="exam-select" aria-label="${esc(unitName)}"></select>
    <nav class="lab-tabs" id="lab-tabs" role="tablist" aria-label="Labs"></nav>
    <div class="practice-row">
      <!-- The app's three modes. Practice is the main one; Notes are the class notes; Explore is the labs on their own. -->
      <div class="mode-switch" role="tablist" aria-label="Mode">
        <button type="button" id="btn-practice" role="tab" aria-selected="false" aria-controls="problems" title="Practice (P)">
          Practice<span class="mode-badge" id="practice-due" hidden></span>
        </button>
        <button type="button" id="btn-notes" role="tab" aria-selected="false" aria-controls="notes" title="Class notes (N)">Notes</button>
        <button type="button" id="btn-explore" class="active" role="tab" aria-selected="true" title="The labs on their own">Explore</button>
      </div>
      <button type="button" class="btn ghost units-btn" id="btn-units" aria-expanded="false" aria-controls="units-ref" title="Units reference (U)">Units</button>
      <span class="practice-stat" id="practice-stat"></span>
    </div>
  </header>

  <aside class="hud panel problems" id="problems" aria-label="Practice problems" hidden></aside>

  <aside class="hud panel units-ref" id="units-ref" aria-label="Units reference" hidden></aside>

  <aside class="hud panel notes" id="notes" aria-label="Class notes" hidden></aside>

  <aside class="hud panel eq-panel" id="eq-panel">
    <div class="law" id="law-line"></div>
    <!-- Step through the setup of this lab's integral (derive.js); shown where the lab has one. -->
    <button type="button" class="btn derive-open" id="eq-derive" hidden>Set it up, step by step</button>
    <div class="derive" id="derive" hidden></div>
    <!-- The lab's headline numbers, larger, under the law they come from. -->
    <div class="eq-result" id="eq-result"></div>
    <div class="eq-live" id="eq-live"></div>
    <div class="insight" id="insight">
      <div class="insight-title" id="insight-title"></div>
      <div id="insight-body"></div>
    </div>
    <canvas id="mini-plot" width="300" height="96" hidden></canvas>
    <!-- The section of the class notes this lab shows. -->
    <button type="button" class="linkish eq-notes" id="eq-notes" hidden></button>
    <!-- Phone only: the header has no room for Units, so it sits with the symbols it explains. -->
    <button type="button" class="linkish eq-units" id="btn-units-eq" aria-controls="units-ref">Units of these symbols</button>
  </aside>

  <aside class="hud panel toggles" id="toggles">
    <!-- Phone only: the equation panel and Setup share one bottom sheet, so something has to pick. -->
    <div class="sheet-switch" id="sheet-switch" role="tablist" aria-label="Bottom panel">
      <button type="button" data-sheet="setup" role="tab" aria-selected="true">Setup</button>
      <button type="button" data-sheet="eq" role="tab" aria-selected="false">Equations</button>
      <button type="button" data-sheet="hide" role="tab" aria-selected="false">Hide</button>
    </div>
    <div id="toggle-host"></div>
    <button type="button" class="btn ghost" id="btn-reset-cam">Reset view</button>
    <button type="button" class="btn ghost keys-btn" id="btn-keys" aria-expanded="false" aria-controls="keys" title="Mouse and keyboard (?)">?</button>
  </aside>

  <aside class="hud panel keys" id="keys" aria-label="Mouse and keyboard" hidden></aside>

  <aside class="hud panel controls" id="controls">
    <div class="panel-header">
      <h2>Setup</h2>
      <span class="hint" id="setup-hint">${esc(setupHint)}</span>
    </div>

    <!-- First, not last: the prediction is the best moment in a lab, so it is not left below the fold. -->
    <section class="predict" id="predict" aria-label="Predict first" hidden></section>

    <label class="field">
      <span>Scenario</span>
      <select id="scenario"></select>
    </label>

    <div id="lab-controls"></div>
  </aside>

  <div id="legend-host"></div>

  <footer class="hud panel readout" id="readout"></footer>
  `;
}

/** Every id the chrome writes. The shell's modules may read these and no others. */
export const CHROME_IDS = Object.freeze(
  [...chromeHTML({ code: '', setupHint: '' }).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]),
);

/**
 * Write the chrome into the app element.
 * @param {HTMLElement} app
 * @param {{ code: string, setupHint: string, unitName?: string }} opts
 */
export function renderChrome(app, opts) {
  app.innerHTML = chromeHTML(opts);
}
