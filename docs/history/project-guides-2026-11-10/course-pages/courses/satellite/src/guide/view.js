import { copiedNote, copyText, esc } from '@flux/shells/project/page.js';
import { checkOrbit } from '@flux/subjects/mechanics/orbit-check.js';
import { SATELLITE, RECIPES, recipeById } from './recipes.js';
import { decisionById, decisionsOf } from './decisions/index.js';
import { decisionRecord, projectInstructions, reviewBrief } from './brief.js';
import { courseCode, foundation, labLink, notesLink } from './links.js';
import { makeHtml } from './make.js';

/**
 * The satellite as a reference and how-to. Each subsystem shows its foundations and where a course
 * teaches each, the Flux labs to explore, a worked method, references, and the checklist a good
 * result meets. The work is reviewed in a Claude Project: the page copies a self-contained brief
 * to paste into a fresh chat there, and the Project's instructions once. Orbit keeps a number
 * check as a self-check; it records nothing.
 *
 * A subsystem with decisions also has a Make side below its method (make.js): the choices of
 * material, process, joints and finish, with a record to copy. `?decision=<id>` opens one, and
 * `?component=<id>` a subsystem.
 *
 * This page was the hub's Build tab until 10 November 2026 (docs/history/map-2026-11-10/).
 */

const number = (id) => String(RECIPES.findIndex((r) => r.id === id) + 1).padStart(2, '0');

function spacecraft() {
  return `<svg viewBox="0 0 600 310" role="img" aria-labelledby="sat-drawing-title">
    <title id="sat-drawing-title">A satellite assembled from solar panels, frame, electronics, sensor and radio</title>
    <defs><pattern id="sat-cells" width="26" height="24" patternUnits="userSpaceOnUse"><path d="M0 0H26V24" fill="none" stroke="currentColor" stroke-width=".7"/></pattern></defs>
    <g class="sat-orbit" data-part="orbit"><ellipse cx="300" cy="163" rx="267" ry="113" transform="rotate(-12 300 163)"/><path d="m55 211 8-16 7 13"/><text x="45" y="240">01 / ORBIT</text></g>
    <g class="sat-piece" data-part="power"><path d="m48 136 148-57 73 44-147 59z M344 192l148-57 73 44-148 59z"/><path class="sat-grid" d="m48 136 148-57 73 44-147 59z M344 192l148-57 73 44-148 59z"/><path d="m206 150 61-22 M340 190l53-19"/><text x="75" y="111">02 / POWER</text></g>
    <g class="sat-piece" data-part="structure"><path d="m247 125 82-32 67 42-83 33z M247 125v82l66 43v-82 M313 250l83-33v-82"/><path d="m256 146 47 31v54l-47-31z M323 177l63-25v55l-63 25z"/><text x="217" y="280">03 / STRUCTURE</text></g>
    <g class="sat-piece" data-part="thermal"><path d="m269 124 58-23 47 29-59 24z"/><path d="m280 121 44-17 M290 128l44-17 M300 135l44-17"/><text x="360" y="83">05 / THERMAL</text><path class="sat-leader" d="m359 88-30 29"/></g>
    <g class="sat-piece" data-part="attitude"><ellipse cx="346" cy="187" rx="17" ry="12" transform="rotate(-20 346 187)"/><path d="m337 185 18-7v14l-18 7z"/><text x="399" y="269">06 / POINTING</text><path class="sat-leader" d="m408 254-48-51"/></g>
    <g class="sat-piece" data-part="communications"><path d="m342 96 9-33 M330 51q28-11 42 11-26 17-42-11z M350 48l10-22"/><text x="381" y="34">07 / RADIO</text><path class="sat-leader" d="m377 39-15 13"/></g>
    <g class="sat-piece" data-part="payload"><path d="m258 157 29 19v24l-29-19z"/><ellipse cx="272" cy="179" rx="6" ry="9" transform="rotate(-30 272 179)"/><text x="83" y="269">04 / SENSOR</text><path class="sat-leader" d="m176 257 87-68"/></g>
  </svg>`;
}

/**
 * @param {Element | null} [parent]
 */
export function mountGuide(parent = document.querySelector('#workbench')) {
  if (!parent) return;
  let selected = 'orbit';
  /** The last numbers typed into the Orbit check, kept while the panel redraws. */
  const orbitInput = { h: '550', v: '', T: '' };
  /** The learner's picks on the Make side, `{ [decision id]: option id }`, and the cards left open. Kept for the page only. */
  const picks = {};
  const openDecisions = new Set();

  parent.innerHTML = `<div class="mission-overview">
    <div class="mission-copy"><p class="app-kicker">PROJECT</p>
      <h2>Build a satellite</h2><p class="mission-lede">Learn the pieces.<br>Make them work together.</p>
      <p>Model a small satellite in Earth orbit. Keep a sensor powered, point it and return its readings. Each subsystem is a how-to: the foundations, a method, references and a checklist.</p>
      <a class="app-bench" href="../bench/">Start at the Bench <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13 13 3M4 3h9v9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a>
      <a class="app-bench" href="./">Open the satellite labs <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13 13 3M4 3h9v9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a>
      <p class="app-meta">First scope: simulation. Hardware testing and flight qualification are separate work.</p>
    </div><figure class="sat-figure">${spacecraft()}<figcaption>Seven subsystems. One shared mission.</figcaption></figure>
    </div>
    <section class="project-setup" aria-labelledby="project-setup-title">
      <div><p class="app-kicker">REVIEW IN CLAUDE</p><h3 id="project-setup-title">Your work is reviewed in a Claude Project</h3>
        <p>Make one Project for the satellite and paste these instructions into it once. Then, for each subsystem, open a new chat in the Project, paste that subsystem's review brief and attach your work. A fresh chat keeps each review on its own.</p></div>
      <div class="copy-row"><button type="button" class="copy-button" data-copy="instructions">Copy the Project instructions</button><span class="copy-note" data-copied="instructions" role="status"></span></div>
      <details><summary>Show the instructions</summary><pre class="brief-text" data-text="instructions">${esc(projectInstructions())}</pre></details>
    </section>
    <nav class="component-recipes" aria-label="Satellite subsystems">${SATELLITE.components.map((r) => `<button type="button" data-select="${r.id}" aria-pressed="false"><span class="component-number">${number(r.id)}</span><span><strong>${r.title}</strong><small>${r.part}</small></span><span class="component-state" data-status="${r.id}"></span></button>`).join('')}
      <button type="button" data-select="satellite" aria-pressed="false"><span class="component-number">08</span><span><strong>Integration</strong><small>All seven together</small></span><span class="component-state" data-status="satellite"></span></button></nav>
    <article class="application-recipe" id="application-recipe" aria-labelledby="recipe-title"></article>`;

  const panel = parent.querySelector('#application-recipe');

  function summary() {
    for (const r of RECIPES) {
      const b = parent.querySelector(`button[data-select="${r.id}"]`);
      if (!b) continue;
      b.setAttribute('aria-pressed', String(selected === r.id));
      const labs = (r.labs || []).length;
      b.querySelector('[data-status]').textContent = r.id === 'satellite' ? 'Review' : `${labs} lab${labs === 1 ? '' : 's'}`;
    }
    parent.querySelectorAll('[data-part]').forEach((el) => el.classList.toggle('active', el.dataset.part === selected || selected === 'satellite'));
  }

  function brief() {
    return reviewBrief(recipeById[selected], { recipeById });
  }

  function orbitCheck() {
    return `<form class="orbit-check" data-orbit-form novalidate><h4>Check your numbers</h4>
      <p>Work out the speed and period for your altitude, then enter them. Flux checks them against √(GM/r) and against an orbit it integrates step by step. This is a self-check: take the full work to review.</p>
      <div class="orbit-fields">
        <label for="oc-h">Altitude, km<input id="oc-h" inputmode="decimal" autocomplete="off" value="${esc(orbitInput.h)}"></label>
        <label for="oc-v">Your speed, km/s<input id="oc-v" inputmode="decimal" autocomplete="off" value="${esc(orbitInput.v)}"></label>
        <label for="oc-T">Your period, min<input id="oc-T" inputmode="decimal" autocomplete="off" value="${esc(orbitInput.T)}"></label>
      </div>
      <button type="submit" class="copy-button">Check my numbers</button>
      <div class="orbit-result" data-orbit-result role="status" aria-live="polite"></div>
      <p class="app-meta">GM = 3.986004418×10¹⁴ m³/s² and Earth’s mean radius, 6371 km. Within 1% of both routes passes.</p></form>`;
  }

  function runOrbitCheck(form) {
    orbitInput.h = form.querySelector('#oc-h').value;
    orbitInput.v = form.querySelector('#oc-v').value;
    orbitInput.T = form.querySelector('#oc-T').value;
    const res = checkOrbit({ altitudeKm: parseFloat(orbitInput.h), speedKmS: parseFloat(orbitInput.v), periodMin: parseFloat(orbitInput.T) });
    const out = form.querySelector('[data-orbit-result]');
    if (!res.ok) {
      out.innerHTML = `<p class="orbit-fail">${esc(res.reason)}</p>`;
      return;
    }
    const f = (x, d) => Number(x).toFixed(d);
    out.innerHTML = `<div class="orbit-table"><table><thead><tr><th></th><th>Yours</th><th>√(GM/r)</th><th>Integrated</th></tr></thead><tbody>
      <tr><th>Speed, km/s</th><td>${f(orbitInput.v, 3)}</td><td>${f(res.closed.speed, 3)}</td><td>${f(res.integrated.speed, 3)}</td></tr>
      <tr><th>Period, min</th><td>${f(orbitInput.T, 2)}</td><td>${f(res.closed.period, 2)}</td><td>${f(res.integrated.period, 2)}</td></tr></tbody></table></div>
      <p class="${res.pass ? 'orbit-pass' : 'orbit-fail'}">${res.pass ? 'Your numbers agree with both routes. Put them in your work for review.' : `Not yet: speed is off by ${f(res.speedError * 100, 1)}%, period by ${f(res.periodError * 100, 1)}%. ${esc(res.hint)}`}</p>`;
  }

  /** A foundation as a link to the course that teaches it, or plain text where no lab shows it yet. */
  function foundationLink(id) {
    const f = foundation(id);
    if (!f.href) return `<span class="foundation">${esc(f.title)} <span class="app-meta">/ no lab yet</span></span>`;
    return `<a class="foundation" href="${esc(f.href)}">${esc(f.title)} <span class="app-meta">· ${esc(f.code)}</span></a>`;
  }

  const make = () => makeHtml(recipeById[selected], { picks, open: openDecisions, foundationLink });

  /** Redraw the Make side alone, after a pick, keeping the keyboard where it was. */
  function renderMake(focus) {
    const box = panel.querySelector('[data-make]');
    if (!box) return;
    box.innerHTML = make();
    if (focus) box.querySelector(focus)?.focus({ preventScroll: true });
  }

  function render() {
    const r = recipeById[selected];
    const integrated = selected === 'satellite';
    const foundations = (r.foundations || []).map(foundationLink).join('');
    const choices = decisionsOf(r.id).length;
    const labs = (r.labs || []).map((ref) => {
      const notes = notesLink(ref);
      return `<li><a href="${esc(labLink(ref))}">${esc(ref.title)}</a><span>${esc(courseCode(ref.course))}${notes ? ` · <a href="${esc(notes)}">Notes</a>` : ''}</span></li>`;
    }).join('');
    const refs = (r.references || []).map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)} <span aria-hidden="true">↗</span></a><p class="app-meta">${esc(x.why)}</p></li>`).join('');
    const text = brief();
    panel.innerHTML = `<header class="recipe-heading"><div><p class="app-kicker">${integrated ? 'FINAL ASSEMBLY' : `SUBSYSTEM ${number(r.id)} / 07`}</p><h3 id="recipe-title">${esc(r.title)}</h3><p>${esc(r.outcome)}</p></div>
        ${choices ? `<button type="button" class="make-jump" data-jump-make>Make it: ${choices} choices <span aria-hidden="true">↓</span></button>` : ''}</header>
      <div class="recipe-columns"><div class="recipe-learning">
        ${r.requires.length ? `<section><h4>Takes numbers from</h4><div class="recipe-inputs">${r.requires.map((dep) => `<button type="button" data-select="${dep}">${esc(recipeById[dep].title)}</button>`).join('')}</div></section>` : ''}
        ${!integrated ? `<section><h4>Learn the foundations</h4><div class="foundation-links">${foundations}</div><h4>Explore in Flux</h4>${labs ? `<ul class="application-labs">${labs}</ul>` : '<p>No matching spacecraft lab is built yet. Start with the foundations and the references.</p>'}</section>` : ''}
        <section><h4>How to do it</h4><ol class="method">${(r.method || []).map((m) => `<li>${esc(m)}</li>`).join('')}</ol>${selected === 'orbit' ? orbitCheck() : ''}</section>
        ${refs ? `<section><h4>References</h4><ul class="references">${refs}</ul></section>` : ''}
        <section class="recipe-output"><h4>Produce</h4><p>${esc(r.deliverable)}</p>${r.interface ? `<h4>Connect it to the mission</h4><p>${esc(r.interface)}</p>` : ''}</section>
        <section class="application-gap"><h4>Still to build</h4><p>${esc(r.gap)}</p></section>
      </div><div class="recipe-record"><p class="app-kicker">TAKE THIS TO REVIEW</p><h4>What a good result contains</h4>
        <ul class="checklist">${(r.checklist || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <p>Open a new chat in your satellite Project, paste the brief, and attach your work: numbers, report, drawings or CAD.</p>
        <div class="copy-row"><button type="button" class="copy-button" data-copy="brief">Copy the review brief</button><span class="copy-note" data-copied="brief" role="status"></span></div>
        <details><summary>Show the brief</summary><pre class="brief-text" data-text="brief">${esc(text)}</pre></details>
      </div></div>
      ${choices ? `<section class="make" id="make" data-make aria-labelledby="make-title">${make()}</section>` : ''}`;
    summary();
  }

  function select(id, updateUrl = true) {
    selected = recipeById[id] ? id : 'orbit';
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('component', selected);
      url.searchParams.delete('decision');
      window.history.pushState(null, '', url);
    }
    render();
  }

  parent.addEventListener('click', async (event) => {
    const selectButton = event.target.closest('[data-select]');
    if (selectButton) {
      event.preventDefault();
      select(selectButton.dataset.select);
      panel.scrollIntoView({ block: 'start' });
      const heading = panel.querySelector('#recipe-title');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      return;
    }
    if (event.target.closest('[data-jump-make]')) {
      const box = panel.querySelector('[data-make]');
      box?.scrollIntoView({ block: 'start' });
      const title = box?.querySelector('#make-title');
      if (title) {
        title.tabIndex = -1;
        title.focus({ preventScroll: true });
      }
      return;
    }
    if (event.target.closest('[data-clear-picks]')) {
      for (const id of Object.keys(picks)) delete picks[id];
      renderMake('[data-make-status]');
      return;
    }
    const copy = event.target.closest('[data-copy]');
    if (copy) {
      const record = copy.dataset.copy === 'record' ? decisionById[copy.dataset.decision] : null;
      // A decision's record is one of several on the page, so its box and note carry its id.
      const kind = record ? `record-${record.id}` : copy.dataset.copy;
      const text = record ? decisionRecord(record, { recipe: recipeById[selected], picks }) : kind === 'instructions' ? projectInstructions() : brief();
      const box = parent.querySelector(`[data-text="${kind}"]`);
      const ok = await copyText(text, box);
      if (!ok) box?.closest('details')?.setAttribute('open', '');
      const note = parent.querySelector(`[data-copied="${kind}"]`);
      if (note) note.textContent = copiedNote(ok);
    }
  });
  // A pick: remember it and redraw the cards, since it changes what the others go with and rule out.
  panel.addEventListener('change', (event) => {
    const input = event.target.closest('input[name^="pick-"]');
    if (!input) return;
    picks[input.name.slice('pick-'.length)] = input.value;
    renderMake(`input[name="${input.name}"][value="${input.value}"]`);
  });
  // `toggle` does not bubble, so it is caught on the way down. The address follows the open card.
  panel.addEventListener('toggle', (event) => {
    const card = event.target.closest?.('details[data-decision]');
    if (!card || event.target !== card) return;
    const id = card.dataset.decision;
    if (card.open) openDecisions.add(id);
    else openDecisions.delete(id);
    const url = new URL(window.location.href);
    if (card.open) url.searchParams.set('decision', id);
    else if (url.searchParams.get('decision') === id) url.searchParams.delete('decision');
    window.history.replaceState(null, '', url);
  }, true);
  panel.addEventListener('submit', (event) => {
    if (event.target.matches('[data-orbit-form]')) {
      event.preventDefault();
      runOrbitCheck(event.target);
    }
  });
  window.addEventListener('popstate', () => select(new URLSearchParams(window.location.search).get('component'), false));
  const asked = new URLSearchParams(window.location.search);
  // `&decision=<id>` opens that card, on the subsystem it belongs to.
  const opening = decisionById[asked.get('decision')];
  if (opening) openDecisions.add(opening.id);
  select(opening ? opening.subsystem : asked.get('component'), false);
  if (opening) panel.querySelector(`#decision-${opening.id}`)?.scrollIntoView({ block: 'start' });
  return { refresh: render };
}
