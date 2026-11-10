import { copiedNote, copyText, esc, two } from '@flux/shells/project/page.js';
import traveler from './traveler.js';
import { DEFAULTS, FACTORS, domeNumbers } from './dome-numbers.js';
import { caseBrief, projectInstructions } from './brief.js';
import { foundation } from './links.js';
import { blockRows, fig, stationFromAddress } from './text.js';

/**
 * The traveler: one part followed through the shop. A drawing of the part, a route of numbered
 * stations, and one station open at a time. Every station shows the same things in the same
 * places: what the engineer decides, what goes wrong, the paper, what to ask on the floor and the
 * foundations behind it. The dome's own numbers follow it: set the pressure and the diameter at
 * the first station and they return at the panels, the inspection, the repairs and the proof test.
 *
 * `?station=<id>` opens a station. Cases are reviewed in a Claude Project from a brief the page
 * builds. Flux keeps nothing.
 *
 * This page was on the hub's Build tab until 10 November 2026 (docs/history/map-2026-11-10/).
 */

/** The dome from above and from the side. A station lights the part it works on. */
function domeDrawing() {
  const cx = 150, cy = 150, R = 118, r0 = 24;
  const seams = Array.from({ length: 8 }, (_, k) => {
    const a = ((k * 45 + 22.5) * Math.PI) / 180;
    return `M${(cx + r0 * Math.cos(a)).toFixed(1)} ${(cy + r0 * Math.sin(a)).toFixed(1)}L${(cx + R * Math.cos(a)).toFixed(1)} ${(cy + R * Math.sin(a)).toFixed(1)}`;
  }).join('');
  // The tool sits part way along one seam, travelling outward.
  const ta = (22.5 * Math.PI) / 180;
  const tx = cx + 78 * Math.cos(ta), ty = cy + 78 * Math.sin(ta);
  return `<svg viewBox="0 0 600 300" role="img" aria-labelledby="dome-drawing-title">
    <title id="dome-drawing-title">A tank dome from above and from the side: eight gore panels welded to each other, to a ring at the rim and to a fitting at the crown</title>
    <g data-part="gores"><circle class="dome-skin" cx="${cx}" cy="${cy}" r="${R}"/><path class="dome-skin" d="M340 190A110 64 0 0 1 560 190Z"/></g>
    <g data-part="lands"><path class="dome-land" d="${seams}"/><circle class="dome-land" cx="${cx}" cy="${cy}" r="${R}"/><circle class="dome-land" cx="${cx}" cy="${cy}" r="${r0}"/>
      <path class="dome-land" d="M450 126A42 64 0 0 0 408 190M450 126A42 64 0 0 1 492 190M450 126A102 64 0 0 0 348 190M450 126A102 64 0 0 1 552 190M340 190H560"/></g>
    <g data-part="seams"><path class="dome-seam" d="${seams}"/><circle class="dome-seam" cx="${cx}" cy="${cy}" r="${R}"/><circle class="dome-seam" cx="${cx}" cy="${cy}" r="${r0}"/>
      <path class="dome-seam" d="M450 126A42 64 0 0 0 408 190M450 126A42 64 0 0 1 492 190M450 126A102 64 0 0 0 348 190M450 126A102 64 0 0 1 552 190M340 190H560"/></g>
    <g data-part="barrel"><path class="dome-barrel" d="M340 190A110 64 0 0 1 560 190M340 190V250M560 190V250"/><path class="dome-cut" d="M340 250H560"/><path class="dome-ring" d="M332 186h16v8h-16zM552 186h16v8h-16z"/><path class="dome-ring" d="M438 122h24v6h-24z"/></g>
    <g data-part="tool"><circle class="dome-tool" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="10"/><circle class="dome-pin" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="3"/></g>
    <g class="dome-labels"><text x="150" y="292" text-anchor="middle">FROM ABOVE</text><text x="450" y="292" text-anchor="middle">FROM THE SIDE</text>
      <text x="150" y="20" text-anchor="middle">8 GORES</text><path class="dome-leader" d="M150 24V44"/>
      <text x="282" y="150">RING</text><path class="dome-leader" d="M280 147H270"/>
      <text x="450" y="108" text-anchor="middle">FITTING</text>
      <text x="450" y="226" text-anchor="middle">BARREL</text></g>
  </svg>`;
}

/** Which drawn parts a station lights. */
const LIT = { all: ['gores', 'seams', 'barrel'], gores: ['gores'], lands: ['lands', 'seams'], seams: ['seams'], tool: ['tool', 'seams'] };

/**
 * @param {Element | null} [parent]
 */
export function mountTraveler(parent = document.querySelector('#workbench')) {
  if (!parent) return;
  let selected = traveler.stations[0].id;
  /** The dome as the learner set it. Kept for the page only. */
  const typed = { pressureKPa: String(DEFAULTS.pressureKPa), diameterM: String(DEFAULTS.diameterM) };
  const numbers = () => domeNumbers({ pressureKPa: parseFloat(typed.pressureKPa), diameterM: parseFloat(typed.diameterM) });
  const usingExample = (n) => String(n.inputs.pressureKPa) !== String(parseFloat(typed.pressureKPa)) || String(n.inputs.diameterM) !== String(parseFloat(typed.diameterM));

  parent.innerHTML = `<div class="mission-overview">
      <div class="mission-copy"><p class="app-kicker">Traveler · ${esc(traveler.process)}</p>
        <h2>${esc(traveler.title)}</h2>
        <p class="mission-lede">One part.<br>Every station it passes.</p>
        <p>${esc(traveler.lede)}</p>
        <p>${esc(traveler.why)}</p>
        <a class="app-bench" href="../satellite/guide.html?component=structure&amp;decision=structure-joints">See where a weld is chosen: the satellite’s joints <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13 13 3M4 3h9v9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a>
        <p class="app-meta">${traveler.stations.length} stations and ${traveler.cases.length} cases. Sources are NASA’s own reports and standards, each linked at its station.</p>
      </div><figure class="sat-figure dome-figure">${domeDrawing()}<figcaption data-dome-caption></figcaption></figure>
    </div>
    <section class="project-setup" aria-labelledby="project-setup-title">
      <div><p class="app-kicker">REVIEW IN CLAUDE</p><h3 id="project-setup-title">The cases are reviewed in a Claude Project</h3>
        <p>Make one Project for this traveler and paste these instructions into it once. Then, for each case, open a new chat in the Project, paste that case’s brief and write your answer. A fresh chat keeps each review on its own.</p></div>
      <div class="copy-row"><button type="button" class="copy-button" data-copy-instructions>Copy the Project instructions</button><span class="copy-note" data-copied-instructions role="status"></span></div>
      <details><summary>Show the instructions</summary><pre class="brief-text" data-text-instructions>${esc(projectInstructions())}</pre></details>
    </section>
    <nav class="component-recipes route" aria-label="Stations">${traveler.stations.map((s, i) => `<button type="button" data-station="${esc(s.id)}" aria-pressed="false"><span class="component-number">${two(i + 1)}</span><span><strong>${esc(s.title)}</strong></span></button>`).join('')}</nav>
    <article class="application-recipe station" id="traveler-station" aria-labelledby="station-title"></article>`;
  const panel = parent.querySelector('#traveler-station');

  /** A foundation as a link to the course that teaches it, or plain text where no lab shows it yet. */
  function foundationLink(id) {
    const f = foundation(id);
    if (!f.href) return `<span class="foundation">${esc(f.title)} <span class="app-meta">/ no lab yet</span></span>`;
    return `<a class="foundation" href="${esc(f.href)}">${esc(f.title)} <span class="app-meta">· ${esc(f.code)}</span></a>`;
  }

  function numbersHtml(station, n) {
    if (!station.numbers) return '';
    const b = blockRows(station.numbers, n);
    const inputs = station.numbers === 'requirement'
      ? `<form class="orbit-fields dome-inputs" data-dome-form novalidate>
          <label for="dome-p">Design pressure, kPa<input id="dome-p" name="pressureKPa" inputmode="decimal" autocomplete="off" value="${esc(typed.pressureKPa)}"></label>
          <label for="dome-d">Diameter, m<input id="dome-d" name="diameterM" inputmode="decimal" autocomplete="off" value="${esc(typed.diameterM)}"></label>
        </form>
        <p class="app-meta" data-dome-hint>${usingExample(n) ? `Enter two numbers above zero. Showing the example: ${fig(DEFAULTS.pressureKPa)} kPa and ${fig(DEFAULTS.diameterM)} m.` : `The example is ${fig(DEFAULTS.diameterM)} m across at ${fig(DEFAULTS.pressureKPa)} kPa, the top of the Shuttle hydrogen tank’s operating range. Factors: ${FACTORS.ultimate} on ultimate strength, ${FACTORS.proof} for proof.`}</p>`
      : '';
    return `<section class="station-numbers" data-numbers="${esc(station.numbers)}"><h4>${esc(b.title)}</h4>${inputs}
      <dl class="number-rows">${b.rows.map((r) => `<div${r.strong ? ' class="is-strong"' : ''}><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`).join('')}</dl>
      <p class="app-meta">${esc(b.note)}${['lands', 'flaws', 'proof'].includes(station.numbers) ? ' Change the dome at station 01.' : ''}</p></section>`;
  }

  function casesHtml(station, n) {
    const cases = traveler.cases.filter((c) => c.station === station.id);
    if (!cases.length) return '';
    return `<section class="station-wide station-cases"><h4>Practise on a case</h4>
      <p>A situation you would meet at this station. Work it, then take it to your Claude Project with the brief. Flux keeps nothing.</p>
      ${cases.map((c) => `<details class="decision case" data-case="${esc(c.id)}"><summary><span class="component-number">CASE</span><span class="decision-title"><strong>${esc(c.title)}</strong><span>${esc(c.situation)}</span></span></summary>
        <div class="decision-body">
          <h5>What is known</h5><ul class="decision-list">${c.evidence.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <h5>The task</h5><p>${esc(c.task)}</p>
          <h5>What a good answer contains</h5><ul class="checklist">${c.checklist.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <div class="copy-row"><button type="button" class="copy-button" data-copy-case="${esc(c.id)}">Copy the case brief</button><span class="copy-note" data-copied-case="${esc(c.id)}" role="status"></span></div>
          <details><summary>Show the brief</summary><pre class="brief-text" data-text-case="${esc(c.id)}">${esc(caseBrief(traveler, c, { numbers: n }))}</pre></details>
        </div></details>`).join('')}</section>`;
  }

  function render() {
    const i = traveler.stations.findIndex((s) => s.id === selected);
    const s = traveler.stations[i];
    const n = numbers();
    const prev = traveler.stations[i - 1];
    const next = traveler.stations[i + 1];
    const refs = s.sources.map((id) => traveler.references.find((r) => r.id === id));
    // Beside the decisions sit the dome's numbers, or, at a station with none, what to ask.
    const ask = `<section><h4>Ask on the floor</h4><ul class="decision-list">${s.ask.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
    panel.innerHTML = `<header class="recipe-heading"><div><p class="app-kicker">Station ${two(i + 1)} / ${two(traveler.stations.length)}</p><h3 id="station-title">${esc(s.title)}</h3><p>${esc(s.what)}</p></div></header>
      <div class="station-grid">
        <section><h4>The engineer decides</h4><ul class="decision-list">${s.decides.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
        ${s.numbers ? numbersHtml(s, n) : ask}
        <section class="station-wide"><h4>What goes wrong</h4><div class="option-table"><table>
          <thead><tr><th scope="col">What</th><th scope="col">Why</th><th scope="col">How it is found</th></tr></thead>
          <tbody>${s.wrong.map((w) => `<tr><th scope="row">${esc(w.what)}</th><td data-label="Why">${esc(w.why)}</td><td data-label="How it is found">${esc(w.found)}</td></tr>`).join('')}</tbody></table></div></section>
        <section><h4>The paper</h4><dl class="paper">${s.paper.map((p) => `<div><dt>${esc(p.name)}</dt><dd>${esc(p.what)}</dd></div>`).join('')}</dl></section>
        ${s.numbers ? ask : ''}
        <section><h4>Behind it</h4><div class="foundation-links">${s.foundations.map(foundationLink).join('')}</div></section>
        <section><h4>Sources</h4><ul class="references">${refs.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)} <span aria-hidden="true">↗</span></a><p class="app-meta">${esc(x.why)}</p></li>`).join('')}</ul></section>
        ${casesHtml(s, n)}
      </div>
      <footer class="station-nav">
        ${prev ? `<button type="button" data-station="${esc(prev.id)}"><span aria-hidden="true">←</span> ${two(i)} ${esc(prev.title)}</button>` : '<span></span>'}
        ${next ? `<button type="button" data-station="${esc(next.id)}">${two(i + 2)} ${esc(next.title)} <span aria-hidden="true">→</span></button>` : '<span></span>'}
      </footer>`;
    for (const b of parent.querySelectorAll('.route [data-station]')) b.setAttribute('aria-pressed', String(b.dataset.station === selected));
    const lit = LIT[s.part] || [];
    parent.querySelectorAll('.dome-figure [data-part]').forEach((el) => el.classList.toggle('active', lit.includes(el.dataset.part)));
    parent.querySelector('[data-dome-caption]').textContent = `Station ${two(i + 1)}: ${s.title}.`;
  }

  /** Redraw what depends on the dome's numbers, leaving the inputs alone so typing is not interrupted. */
  function renderNumbers() {
    const s = traveler.stations.find((x) => x.id === selected);
    const n = numbers();
    const box = panel.querySelector('[data-numbers]');
    if (box && s.numbers) {
      const b = blockRows(s.numbers, n);
      box.querySelector('.number-rows').innerHTML = b.rows.map((r) => `<div${r.strong ? ' class="is-strong"' : ''}><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`).join('');
      const hint = box.querySelector('[data-dome-hint]');
      if (hint && usingExample(n)) hint.textContent = `Enter two numbers above zero. Showing the example: ${fig(DEFAULTS.pressureKPa)} kPa and ${fig(DEFAULTS.diameterM)} m.`;
      else if (hint) hint.textContent = `Factors: ${FACTORS.ultimate} on ultimate strength, ${FACTORS.proof} for proof.`;
    }
    for (const pre of panel.querySelectorAll('[data-text-case]')) {
      pre.textContent = caseBrief(traveler, traveler.cases.find((c) => c.id === pre.dataset.textCase), { numbers: n });
    }
  }

  function select(id, updateUrl = true) {
    selected = traveler.stations.some((s) => s.id === id) ? id : traveler.stations[0].id;
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('station', selected);
      window.history.pushState(null, '', url);
    }
    render();
  }

  parent.addEventListener('click', async (event) => {
    const go = event.target.closest('[data-station]');
    if (go) {
      event.preventDefault();
      select(go.dataset.station);
      panel.scrollIntoView({ block: 'start' });
      const heading = panel.querySelector('#station-title');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      return;
    }
    if (event.target.closest('[data-copy-instructions]')) {
      const box = parent.querySelector('[data-text-instructions]');
      const ok = await copyText(projectInstructions(), box);
      if (!ok) box?.closest('details')?.setAttribute('open', '');
      parent.querySelector('[data-copied-instructions]').textContent = copiedNote(ok);
      return;
    }
    const copy = event.target.closest('[data-copy-case]');
    if (copy) {
      const id = copy.dataset.copyCase;
      const box = panel.querySelector(`[data-text-case="${id}"]`);
      const ok = await copyText(caseBrief(traveler, traveler.cases.find((c) => c.id === id), { numbers: numbers() }), box);
      if (!ok) box?.closest('details')?.setAttribute('open', '');
      const note = panel.querySelector(`[data-copied-case="${id}"]`);
      if (note) note.textContent = copiedNote(ok);
    }
  });
  panel.addEventListener('input', (event) => {
    const input = event.target.closest('[data-dome-form] input');
    if (!input) return;
    typed[input.name] = input.value;
    renderNumbers();
  });
  panel.addEventListener('submit', (event) => {
    if (event.target.matches('[data-dome-form]')) event.preventDefault();
  });

  /** Follow the address: the station it names. */
  function fromAddress() {
    select(stationFromAddress(traveler, window.location.search), false);
  }
  window.addEventListener('popstate', fromAddress);
  fromAddress();
  return { refresh: render };
}
