import { TRAVELERS, travelerById } from '@flux/map/applications/travelers/index.js';
import { DEFAULTS, FACTORS, domeNumbers } from '@flux/map/applications/travelers/dome-numbers.js';
import { caseBrief } from './brief.js';
import { blockRows, fig, pickBuildView } from './traveler-text.js';
import './style.css';
import { COURSE_ORDER } from './dome-course.js';
import { equipmentHtml, mountEquipment } from './equipment-view.js';
import { mountDomeCourse } from './dome-course-ui.js';

/**
 * A traveler on the Build tab: one part followed through the shop. A drawing of the part, a route
 * of numbered stations, and one station open at a time. Every station shows the same things in the
 * same places: what the engineer decides, what goes wrong, the paper, what to ask on the floor and
 * the concepts behind it. The dome's own numbers follow it: set the pressure and the diameter at
 * the first station and they return at the panels, the inspection, the repairs and the proof test.
 *
 * `?traveler=<id>&station=<id>#applications` opens a station. Cases are reviewed in a Claude
 * Project from a brief the page builds, like the satellite. Your build notes save in this browser. Case review happens outside Flux.
 */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const two = (n) => String(n).padStart(2, '0');
const WORDS = { solid: 'solid', assumed: 'from a course you took', taught: 'covered in class', learning: 'learning', ready: 'ready to learn', locked: 'not yet' };

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
  return `${equipmentHtml('dome', true)}<div class="dome-legacy" aria-hidden="true"><svg viewBox="0 0 600 300" role="img" aria-labelledby="dome-drawing-title">
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
  </svg></div>`;
}

/** Which drawn parts a station lights. */
const LIT = { all: ['gores', 'seams', 'barrel'], gores: ['gores'], lands: ['lands', 'seams'], seams: ['seams'], tool: ['tool', 'seams'] };

async function copyText(text, box) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (box) {
      const range = document.createRange();
      range.selectNodeContents(box);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    return false;
  }
}

/**
 * @param {any} map The mounted map, for concept links.
 * @param {Element | null} [parent]
 * @param {{ status?: (id: string) => ({ status: string } | null) }} [opts] The learner's standing on a concept, from Today.
 */
export function mountTraveler(map, parent = document.querySelector('#traveler-workbench'), { status: standing = () => null } = {}) {
  if (!parent) return;
  const source = TRAVELERS[0];
  const traveler = { ...source, stations: COURSE_ORDER.map(id => source.stations.find(s => s.id === id)) };
  let selected = traveler.stations[0].id;
  /** The dome as the learner set it. Kept for the page only. */
  const typed = { pressureKPa: String(DEFAULTS.pressureKPa), diameterM: String(DEFAULTS.diameterM) };
  const numbers = () => domeNumbers({ pressureKPa: parseFloat(typed.pressureKPa), diameterM: parseFloat(typed.diameterM) });
  const usingExample = (n) => String(n.inputs.pressureKPa) !== String(parseFloat(typed.pressureKPa)) || String(n.inputs.diameterM) !== String(parseFloat(typed.diameterM));

  parent.innerHTML = `<div class="mission-overview">
      <div class="mission-copy"><p class="app-kicker">Project lab · ${esc(traveler.process)}</p>
        <h3>${esc(traveler.title)}</h3>
        <p class="mission-lede">From first requirement<br>to finished hardware.</p>
        <p>${esc(traveler.lede)}</p>
        <p>${esc(traveler.why)}</p>
        <p class="app-meta">${traveler.stations.length} guided lessons and ${traveler.cases.length} shop cases. Start with no shop experience. Learn to explain the build, the evidence and when to ask a specialist. Sources are NASA’s own reports and standards, each linked at its station.</p>
      </div><figure class="sat-figure dome-figure">${domeDrawing()}<figcaption data-dome-caption></figcaption></figure>
    </div>
    <section class="course-overview" aria-label="Your course progress"><div><strong data-course-progress></strong><progress data-course-bar max="${traveler.stations.length}" value="0" aria-label="Completed lessons"></progress><p class="app-meta">Your goal: explain how this part is designed, made and verified. Completing the course records your learning, not authorization to run machines or release hardware.</p><p class="app-meta" data-parameter-status role="status"></p></div><div class="course-actions"><button type="button" class="copy-button" data-course-resume>Continue learning</button><button type="button" class="copy-button" data-course-export>Export build plan</button></div></section>
    <details class="course-syllabus"><summary>What you will be able to explain</summary><p>Work toward practical literacy: explain the build from memory, calculate simple checks, interpret evidence and know which specialist to involve. Lesson completion tracks this learning work; it is not a measured literacy percentage.</p><dl data-capability-progress></dl><p class="app-meta" data-practice-progress></p></details>
    <details class="course-primer"><summary>New to hardware? Start with units and roles</summary><div><h4>Read a measurement</h4><p>A number needs a quantity, unit, location and condition. Diameter is across the part; radius is half the diameter. 1 m = 1,000 mm. 1 MPa = 1 N/mm² = 1,000 kPa. Stress is force divided by area; strain is extension divided by original length.</p><h4>Read a limit</h4><p>Nominal is the target. A tolerance is the allowed variation. Calibration connects an instrument to a reference; uncertainty describes doubt in a result. A reading close to a limit needs the inspection plan’s decision rule. Keep the original reading and its unit.</p><h4>Know the team</h4><p>The designer defines the geometry and loads. Materials and welding specialists establish suitable properties and qualified processes. Manufacturing engineers and trained operators plan and run equipment. Metrology and inspection specialists evaluate geometry and flaws. Quality and authorized engineering reviewers close departures and approve the evidence.</p><h4>Use the four steps</h4><p>Learn the idea, follow the worked reasoning, practise with a fictional record, then write your own decision and evidence. Respond to the transfer challenge in your build note. The card mock-up in the design lesson gives you a physical way to explore sequence and tool access.</p></div></details>
    <nav class="component-recipes route" aria-label="Stations">${traveler.stations.map((s, i) => `<button type="button" data-station="${esc(s.id)}" aria-pressed="false"><span class="component-number">${two(i + 1)}</span><span><strong>${esc(s.title)}</strong><small data-course-status>To explore</small></span></button>`).join('')}</nav>
    <article class="application-recipe station" id="traveler-station" aria-labelledby="station-title"></article>`;
  const panel = parent.querySelector('#traveler-station');
  const course = mountDomeCourse(parent, traveler, typed);
  const equipment = mountEquipment(parent);

  function conceptLink(id) {
    const c = map.graph.byId[id];
    const w = WORDS[standing(id)?.status] || null;
    return `<a href="#${id}" data-concept="${id}">${esc(c.title)}${c.labs.length ? '' : ' <span class="app-meta">/ lab gap</span>'}${w ? ` <span class="app-meta foundation-state" data-state="${standing(id).status}">· ${w}</span>` : ''}</a>`;
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
      <p class="app-meta">${esc(b.note)}${['lands', 'flaws', 'proof'].includes(station.numbers) ? ' Change the dome at lesson 01.' : ''}</p></section>`;
  }

  function casesHtml(station, n) {
    const cases = traveler.cases.filter((c) => c.station === station.id);
    if (!cases.length) return '';
    return `<section class="station-wide station-cases"><h4>Practise on a case</h4>
      <p>A situation you would meet at this station. Work it, then take it to your Claude Project with the brief. Your build notes save in this browser. Case review happens outside Flux.</p>
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
    panel.innerHTML = `<header class="recipe-heading"><div><p class="app-kicker">Lesson ${two(i + 1)} / ${two(traveler.stations.length)}</p><h3 id="station-title">${esc(s.title)}</h3><p>${esc(s.what)}</p></div></header>
      ${s.id === 'requirement' ? `<div class="course-parameters">${numbersHtml(s, n)}</div>` : ''}
      ${course.html(s.id)}
      <details class="station-shop-reference"><summary class="station-reference-label">Shop reference · decisions, records and sources</summary>
      <div class="station-grid">
        <section><h4>The engineer decides</h4><ul class="decision-list">${s.decides.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
        ${s.id === 'requirement' ? '' : s.numbers ? numbersHtml(s, n) : ask}
        <section class="station-wide"><h4>What goes wrong</h4><div class="option-table"><table>
          <thead><tr><th scope="col">What</th><th scope="col">Why</th><th scope="col">How it is found</th></tr></thead>
          <tbody>${s.wrong.map((w) => `<tr><th scope="row">${esc(w.what)}</th><td data-label="Why">${esc(w.why)}</td><td data-label="How it is found">${esc(w.found)}</td></tr>`).join('')}</tbody></table></div></section>
        <section><h4>The paper</h4><dl class="paper">${s.paper.map((p) => `<div><dt>${esc(p.name)}</dt><dd>${esc(p.what)}</dd></div>`).join('')}</dl></section>
        ${s.numbers ? ask : ''}
        <section><h4>Behind it, on the map</h4><div class="foundation-links">${s.concepts.map(conceptLink).join('')}</div></section>
        <section><h4>Sources</h4><ul class="references">${refs.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)} <span aria-hidden="true">↗</span></a><p class="app-meta">${esc(x.why)}</p></li>`).join('')}</ul></section>
        ${casesHtml(s, n)}
      </div></details>
      <footer class="station-nav">
        ${prev ? `<button type="button" data-station="${esc(prev.id)}"><span aria-hidden="true">←</span> ${two(i)} ${esc(prev.title)}</button>` : '<span></span>'}
        ${next ? `<button type="button" data-station="${esc(next.id)}">${two(i + 2)} ${esc(next.title)} <span aria-hidden="true">→</span></button>` : '<span></span>'}
      </footer>`;
    for (const b of parent.querySelectorAll('.route [data-station]')) b.setAttribute('aria-pressed', String(b.dataset.station === selected));
    const lit = LIT[s.part] || [];
    parent.querySelectorAll('.dome-figure [data-part]').forEach((el) => el.classList.toggle('active', lit.includes(el.dataset.part)));
    parent.querySelector('[data-dome-caption]').textContent = `Lesson ${two(i + 1)}: ${s.title}.`;
    course.update();
    equipment.refresh();
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
      for (const key of ['application', 'component', 'decision']) url.searchParams.delete(key);
      url.searchParams.set('traveler', traveler.id);
      url.searchParams.set('station', selected);
      url.hash = 'applications';
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
    const concept = event.target.closest('[data-concept]');
    if (concept) {
      event.preventDefault();
      map.choosePath(null);
      map.go(concept.dataset.concept);
      return;
    }
    const copy = event.target.closest('[data-copy-case]');
    if (copy) {
      const id = copy.dataset.copyCase;
      const box = panel.querySelector(`[data-text-case="${id}"]`);
      const ok = await copyText(caseBrief(traveler, traveler.cases.find((c) => c.id === id), { numbers: numbers() }), box);
      if (!ok) box?.closest('details')?.setAttribute('open', '');
      const note = panel.querySelector(`[data-copied-case="${id}"]`);
      if (note) note.textContent = ok ? 'Copied. Paste it into Claude.' : 'Copying is blocked here. The text is selected below: copy it by hand.';
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

  /** Follow the address: the station it names, when it names this traveler. */
  function fromAddress() {
    const asked = pickBuildView(window.location.search);
    if (asked.view === 'traveler' && travelerById[asked.traveler] === source) select(asked.station, false);
  }
  window.addEventListener('popstate', fromAddress);
  render();
  fromAddress();
  return { refresh: render };
}
