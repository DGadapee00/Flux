import { LAB_CATALOGS, labHref, notesHref } from '@flux/map';
import { SATELLITE, RECIPES, recipeById } from '@flux/map/applications/satellite.js';
import { checkOrbit } from '@flux/subjects/mechanics/orbit-check.js';
import { applicationStore, cleanProgress, demonstrated, missingInputs, record, revise, wouldClear } from './progress.js';
import './style.css';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
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
 * @param {any} map
 * @param {Element | null} [parent]
 * @param {{ status?: (id: string) => ({ status: string } | null) }} [opts] The learner's standing
 *   on a concept, from Today, shown beside each foundation.
 */
export function mountApplications(map, parent = document.querySelector('#application-workbench'), { status: standing = () => null } = {}) {
  if (!parent) return;
  /** The last numbers typed into the Orbit check, kept while the panel redraws. */
  const orbitInput = { h: '550', v: '', T: '' };
  const store = applicationStore();
  let state = cleanProgress(store.readJSON('satellite'));
  let selected = 'orbit';
  /** Evidence typed but not yet saved. It is saved, and its dependents cleared, when the box loses focus. */
  let draft = null;
  let storageMessage = 'Saved in this browser. Included in your Progress backup.';

  parent.innerHTML = `<div class="mission-overview">
    <div class="mission-copy"><p class="app-kicker">APPLICATION 01</p>
      <h3>Build a satellite</h3><p class="mission-lede">Learn the pieces.<br>Make them work together.</p>
      <p>Model a small satellite in Earth orbit. Keep a sensor powered, point it and return its readings. Each subsystem turns concepts into a capability.</p>
      <a class="app-bench" href="bench/">Start at the Bench <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13 13 3M4 3h9v9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a>
      <p class="app-meta">First scope: simulation. Hardware testing and flight qualification are separate work.</p>
    </div><figure class="sat-figure">${spacecraft()}<figcaption>Seven subsystems. One shared mission.</figcaption></figure>
    </div>
    <div class="assembly-summary"><div><span class="app-kicker">YOUR ASSEMBLY</span><p id="assembly-count" aria-live="polite"></p></div>
      <a href="#application-recipe" class="app-assembly-link" data-select="satellite">View integration <span aria-hidden="true">↓</span></a></div>
    <nav class="component-recipes" aria-label="Satellite subsystems">${SATELLITE.components.map((r) => `<button type="button" data-select="${r.id}" aria-pressed="false"><span class="component-number">${number(r.id)}</span><span><strong>${r.title}</strong><small>${r.part}</small></span><span class="component-state" data-status="${r.id}"></span></button>`).join('')}</nav>
    <article class="application-recipe" id="application-recipe" aria-labelledby="recipe-title"></article>
    <p class="application-note">These are personal project records. Orbit checks the numbers you enter two ways; the other subsystems’ checks are still to be built. Opening a lab or completing a course does not verify a satellite subsystem. The coupled mission simulator is still to be built.</p>`;

  const panel = parent.querySelector('#application-recipe');
  const status = (id) => demonstrated(id, state) ? (id === 'satellite' ? 'Integration recorded' : 'Demonstration recorded') : state[id].studied ? 'Foundations studied' : 'To explore';

  function summary() {
    const done = SATELLITE.components.filter((r) => demonstrated(r.id, state)).length;
    parent.querySelector('#assembly-count').textContent = `${done} of 7 subsystem demonstrations recorded${demonstrated('satellite', state) ? ' · integration recorded' : ''}`;
    for (const r of SATELLITE.components) {
      const b = parent.querySelector(`button[data-select="${r.id}"]`);
      b.setAttribute('aria-pressed', String(selected === r.id));
      b.dataset.complete = String(demonstrated(r.id, state));
      b.querySelector('[data-status]').textContent = demonstrated(r.id, state) ? 'Recorded' : state[r.id].studied ? 'Studied' : 'Explore';
    }
    parent.querySelectorAll('[data-part]').forEach((el) => el.classList.toggle('active', el.dataset.part === selected || selected === 'satellite'));
    const badge = panel.querySelector('[data-recipe-status]');
    if (badge) badge.textContent = status(selected);
    const text = draft ?? state[selected].evidence;
    const missing = missingInputs(selected, state);
    const unstudied = selected !== 'satellite' && !state[selected].studied;
    const save = panel.querySelector('[data-record]');
    if (save) save.disabled = (draft === null && demonstrated(selected, state)) || missing.length > 0 || !text.trim() || unstudied;
    const needs = panel.querySelector('[data-requirements]');
    if (needs) needs.textContent = requirements(missing, text, unstudied);
    const warning = panel.querySelector('[data-warning]');
    if (warning) {
      const clear = draft !== null && draft !== state[selected].evidence ? wouldClear(state, selected) : [];
      warning.hidden = clear.length === 0;
      warning.textContent = clear.length
        ? `Leaving this box saves the edit and clears ${clear.length === 1 ? '1 record' : `${clear.length} records`}: ${clear.map((id) => recipeById[id].title).join(', ')}. Their notes stay.`
        : '';
    }
    const message = panel.querySelector('[data-storage]');
    if (message) message.textContent = storageMessage;
  }

  function requirements(missing, text, unstudied) {
    if (missing.length) return `First record demonstrations for: ${missing.map((id) => recipeById[id].title).join(', ')}.`;
    if (draft === null && demonstrated(selected, state)) {
      return selected === 'satellite' ? 'Integration recorded.' : 'Demonstration recorded. Editing it asks dependent subsystems to be checked again.';
    }
    if (unstudied) return text.trim() ? 'Tick the box once you have studied the foundations.' : 'Study the foundations and add evidence before recording a demonstration.';
    if (!text.trim()) return selected === 'satellite' ? 'All subsystem inputs are recorded. Add your integration evidence.' : 'Add evidence before recording a demonstration.';
    return selected === 'satellite' ? 'Ready to record the integration.' : 'Ready to record.';
  }

  /** Save typed evidence. A changed record asks its dependents to be checked again. */
  function commit() {
    if (draft === null) return;
    const text = draft;
    draft = null;
    if (text === state[selected].evidence) return summary();
    state = revise(state, selected, { evidence: text });
    save();
  }

  function save() {
    store.writeJSON('satellite', state);
    storageMessage = JSON.stringify(store.readJSON('satellite')) === JSON.stringify(state)
      ? 'Saved in this browser. Included in your Progress backup.'
      : 'Browser storage is unavailable. Changes will last only for this visit.';
    summary();
  }

  function render() {
    const r = recipeById[selected];
    const integrated = selected === 'satellite';
    const foundations = (r.concepts || []).map((id) => {
      const c = map.graph.byId[id];
      const s = standing(id)?.status;
      const word = { solid: 'solid', assumed: 'from a course you took', learning: 'learning', ready: 'ready to learn', locked: 'not yet' }[s];
      return `<a href="#${id}" data-concept="${id}">${esc(c.title)}${c.labs.length ? '' : ' <span class="app-meta">/ lab gap</span>'}${word ? ` <span class="app-meta foundation-state" data-state="${s}">· ${word}</span>` : ''}</a>`;
    }).join('');
    const labs = (r.labs || []).map((ref) => {
      const c = map.graph.byId[ref.concept];
      const source = c.labs.find((l) => l.course === ref.course && l.lab === ref.lab);
      const meta = LAB_CATALOGS[ref.course][ref.lab];
      const notes = notesHref(source, meta.unit);
      return `<li><a href="${labHref({ ...ref, unit: meta.unit })}">${esc(meta.title)}</a><span>${ref.course === 'bench' ? 'Bench' : esc(ref.course.toUpperCase())}${notes ? ` · <a href="${notes}">Notes</a>` : ''}</span></li>`;
    }).join('');
    panel.innerHTML = `<header class="recipe-heading"><div><p class="app-kicker">${integrated ? 'FINAL ASSEMBLY' : `SUBSYSTEM ${number(r.id)} / 07`}</p><h3 id="recipe-title">${esc(r.title)}</h3><p>${esc(r.outcome)}</p></div><span class="recipe-status" data-recipe-status></span></header>
      <div class="recipe-columns"><div class="recipe-learning">
        <section><h4>${integrated ? 'Ingredients' : 'Combine these capabilities'}</h4>${r.requires.length ? `<div class="recipe-inputs">${r.requires.map((dep) => `<button type="button" data-select="${dep}"><span aria-hidden="true">${demonstrated(dep, state) ? '✓' : '○'}</span> ${esc(recipeById[dep].title)}<small>${demonstrated(dep, state) ? 'demonstration recorded' : 'demonstration needed'}</small></button>`).join('')}</div>` : '<p>Start here. No other subsystem demonstration is needed.</p>'}</section>
        ${!integrated ? `<section><h4>Learn the foundations</h4><div class="foundation-links">${foundations}</div><h4>Explore in Flux</h4>${labs ? `<ul class="application-labs">${labs}</ul>` : '<p>No matching spacecraft lab is built yet. Start with the linked concepts and their sources.</p>'}</section>` : ''}
        <section class="recipe-output"><h4>Produce</h4><p>${esc(r.deliverable)}</p>${r.interface ? `<h4>Connect it to the mission</h4><p>${esc(r.interface)}</p>` : ''}</section>
        ${r.submission ? `<section class="application-submission"><h4>Submit your work</h4><p>${esc(r.submission.description)}</p><a class="app-bench" href="${esc(r.submission.url)}">${esc(r.submission.title)} <span aria-hidden="true">→</span></a><p class="app-meta">A review applies to one saved version. Copy its evidence link into your capability record. Revisions keep earlier files and feedback.</p></section>` : ''}
        <section class="application-gap"><h4>Still to build</h4><p>${esc(r.gap)}</p></section>
      </div><div class="recipe-record"><p class="app-kicker">${integrated ? '03 / INTEGRATED' : '01 / STUDIED → 02 / DEMONSTRATED'}</p><h4>${integrated ? 'Record the shared mission' : 'Keep a capability record'}</h4>
        ${!integrated ? `<label class="app-check"><input type="checkbox" data-studied ${state[selected].studied ? 'checked' : ''}> I have studied these foundations.</label>` : ''}
        <p class="demonstration-task">${esc(r.demonstrate)}</p>
        ${selected === 'orbit' ? orbitCheck() : ''}
        <label for="application-evidence">Your evidence <span>(personal record)</span></label><textarea id="application-evidence" maxlength="2000" rows="5" placeholder="Describe your model, result and checks. Add a report reference or link.">${esc(draft ?? state[selected].evidence)}</textarea>
        <p class="record-warning" data-warning role="status" hidden></p>
        <p class="record-requirements" data-requirements></p>
        <button type="button" class="record-capability" data-record>${integrated ? 'Record integration' : 'Record demonstration'}</button>
        <p class="app-meta">Self-recorded evidence. No automated check or hardware qualification is claimed. Editing a record asks dependent subsystems to be checked again. Their notes stay.</p>
        <p class="app-meta" data-storage role="status"></p>
      </div></div>`;
    summary();
  }

  function orbitCheck() {
    return `<form class="orbit-check" data-orbit-form novalidate><h4>Check your numbers</h4>
      <p>Work out the speed and period for your altitude, by hand or in your own code, then enter them. Flux checks them against \u221A(GM/r) and against an orbit it integrates step by step.</p>
      <div class="orbit-fields">
        <label for="oc-h">Altitude, km<input id="oc-h" inputmode="decimal" autocomplete="off" value="${esc(orbitInput.h)}"></label>
        <label for="oc-v">Your speed, km/s<input id="oc-v" inputmode="decimal" autocomplete="off" value="${esc(orbitInput.v)}"></label>
        <label for="oc-T">Your period, min<input id="oc-T" inputmode="decimal" autocomplete="off" value="${esc(orbitInput.T)}"></label>
      </div>
      <button type="submit" class="record-capability">Check my numbers</button>
      <div class="orbit-result" data-orbit-result role="status" aria-live="polite"></div>
      <p class="app-meta">GM = 3.986004418\u00D710\u00B9\u2074 m\u00B3/s\u00B2 and Earth\u2019s mean radius, 6371 km. Within 1% of both routes passes, and your numbers go into the evidence below.</p></form>`;
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
    out.innerHTML = `<div class="orbit-table"><table><thead><tr><th></th><th>Yours</th><th>\u221A(GM/r)</th><th>Integrated</th></tr></thead><tbody>
      <tr><th>Speed, km/s</th><td>${f(orbitInput.v, 3)}</td><td>${f(res.closed.speed, 3)}</td><td>${f(res.integrated.speed, 3)}</td></tr>
      <tr><th>Period, min</th><td>${f(orbitInput.T, 2)}</td><td>${f(res.closed.period, 2)}</td><td>${f(res.integrated.period, 2)}</td></tr></tbody></table></div>
      <p class="${res.pass ? 'orbit-pass' : 'orbit-fail'}">${res.pass ? 'Your numbers agree with both routes. They are in your evidence below.' : `Not yet: speed is off by ${f(res.speedError * 100, 1)}%, period by ${f(res.periodError * 100, 1)}%. ${esc(res.hint)}`}</p>`;
    if (res.pass) {
      const line = `Orbit check passed in Flux: altitude ${orbitInput.h} km, speed ${orbitInput.v} km/s, period ${orbitInput.T} min. Closed form ${f(res.closed.speed, 3)} km/s and ${f(res.closed.period, 2)} min; integrated orbit ${f(res.integrated.speed, 3)} km/s and ${f(res.integrated.period, 2)} min.`;
      const prior = (draft ?? state.orbit.evidence).replace(/^Orbit check passed in Flux:.*$/m, '').trim();
      draft = prior ? `${line}\n${prior}` : line;
      commit();
      const box = panel.querySelector('#application-evidence');
      if (box) box.value = state.orbit.evidence;
    }
  }

  function select(id, updateUrl = true) {
    commit();
    selected = recipeById[id] ? id : 'orbit';
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('application', 'satellite');
      url.searchParams.set('component', selected);
      url.hash = 'applications';
      window.history.pushState(null, '', url);
    }
    render();
  }

  parent.addEventListener('click', (event) => {
    const selectButton = event.target.closest('[data-select]');
    if (selectButton) {
      event.preventDefault();
      select(selectButton.dataset.select);
      panel.scrollIntoView({ block: 'start' });
      const heading = panel.querySelector('#recipe-title');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    const concept = event.target.closest('[data-concept]');
    if (concept) {
      event.preventDefault();
      map.choosePath(null);
      map.go(concept.dataset.concept);
      document.querySelector('.explore').scrollIntoView({ block: 'start' });
    }
    if (event.target.closest('[data-record]')) {
      commit();
      state = record(state, selected);
      save();
    }
  });
  panel.addEventListener('submit', (event) => {
    if (event.target.matches('[data-orbit-form]')) {
      event.preventDefault();
      runOrbitCheck(event.target);
    }
  });
  panel.addEventListener('change', (event) => {
    if (event.target.matches('[data-studied]')) {
      state = revise(state, selected, { studied: event.target.checked });
      save();
    }
  });
  panel.addEventListener('input', (event) => {
    if (event.target.id === 'application-evidence') {
      draft = event.target.value;
      summary();
    }
  });
  panel.addEventListener('change', (event) => {
    if (event.target.id === 'application-evidence') commit();
  });
  // Typed evidence is not lost when the tab closes or goes to the background.
  window.addEventListener('pagehide', commit);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') commit();
  });
  window.addEventListener('popstate', () => select(new URLSearchParams(window.location.search).get('component'), false));
  window.addEventListener('storage', (event) => {
    if (event.key === 'flux.applications.satellite.v1' || event.key === null) {
      // Another tab saved. Keep any evidence still being typed here.
      state = cleanProgress(store.readJSON('satellite'));
      render();
    }
  });
  select(new URLSearchParams(window.location.search).get('component'), false);
}
