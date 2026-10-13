/**
 * Explore: the list of labs, and a lab's page.
 *
 * A lab page is the plot with its readout, then (beside it from 900px, under it on a phone) the
 * Predict-first card, the scenario menu, the controls, the action buttons and the explainer.
 * Everything on it is drawn from `lab.compute(state, rng)`; a control changes `state`, and one
 * animation frame later the lab recomputes and redraws.
 *
 * Predict first: a prediction puts the lab in a set-up state and asks what a change will do. You
 * commit to an answer, press "Make the change", and the lab computes both states and says what
 * happened; the verdict comes from the lab's own numbers, not from a stored answer.
 */
import { LABS, labById } from '../labs/index.js';
import { unitById } from '../data/catalog.js';
import { hashFor } from '../engine/router.js';
import { createRng } from '../stats/rng.js';
import { mathProse, escapeHTML as esc } from './shared.js';

const TALLY_KEY = 'fluxstats.labs.v1';

function loadTally() {
  try {
    return JSON.parse(localStorage.getItem(TALLY_KEY)) || {};
  } catch {
    return {};
  }
}
function saveTally(t) {
  try {
    localStorage.setItem(TALLY_KEY, JSON.stringify(t));
  } catch {
    /* private window: the tally just is not kept */
  }
}

export function renderExplore(root, { unitId, labId, scenario = null }) {
  if (labId) {
    const lab = labById(labId);
    if (lab) return renderLab(root, { unitId, lab, scenario });
  }
  const unit = unitById(unitId);
  const tally = loadTally();
  const mine = LABS.filter((l) => unit.labs.includes(l.id));
  const later = LABS.filter((l) => !unit.labs.includes(l.id));
  const item = (l) => {
    const t = tally[l.id] || {};
    const done = Object.values(t).filter((r) => r.right).length;
    const tag = l.predictions.length ? `${done}/${l.predictions.length} predictions` : '';
    return `<a class="card lab-item" href="${hashFor({ unitId, mode: 'explore', labId: l.id })}">
        <div class="row" style="justify-content:space-between"><h3>${esc(l.title)}</h3><span class="tag">Ch ${esc(l.ch.join(', '))}</span></div>
        <p class="note">${mathProse(l.blurb)}</p>
        ${tag ? `<span class="dim">${tag}</span>` : ''}
      </a>`;
  };
  root.innerHTML = `
    <div class="stack">
      <h2>Explore</h2>
      <p class="note">Each lab is a picture you change to test an idea. Start with a prediction: commit to what a change will do, then make it and see.</p>
      ${mine.map(item).join('')}
      ${later.length ? `<h3 class="muted">After the midterm</h3>${later.map(item).join('')}` : ''}
    </div>`;
  root.onclick = null;
}

/* ------------------------------------------------------------------ one lab */

const resolve = (v, s) => (typeof v === 'function' ? v(s) : v);
const decimals = (step) => {
  const t = String(step);
  return t.includes('.') ? t.split('.')[1].length : 0;
};

function controlHTML(p) {
  const id = `lp-${p.id}`;
  if (p.type === 'range') {
    return `<div class="ctl ctl-range" data-param="${p.id}">
        <label for="${id}">${mathProse(p.label)}</label>
        <input type="range" id="${id}" data-in="${p.id}" />
        <input type="number" class="num" inputmode="decimal" aria-label="${esc(p.label.replace(/\$/g, ''))}" data-num="${p.id}" />
      </div>`;
  }
  if (p.type === 'toggle') {
    return `<label class="ctl ctl-toggle" data-param="${p.id}"><input type="checkbox" data-in="${p.id}" /> <span>${mathProse(p.label)}</span></label>`;
  }
  if (p.select || p.options.length > 4) {
    return `<div class="ctl ctl-choice" data-param="${p.id}"><label for="${id}">${mathProse(p.label)}</label>
        <select id="${id}" data-in="${p.id}">${p.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></div>`;
  }
  return `<div class="ctl ctl-choice" data-param="${p.id}"><span class="ctl-label">${mathProse(p.label)}</span>
      <div class="seg" role="radiogroup">${p.options.map(([v, l]) => `<button type="button" role="radio" data-seg="${p.id}" data-v="${esc(v)}">${mathProse(l)}</button>`).join('')}</div></div>`;
}

export function renderLab(root, { unitId, lab, scenario = null }) {
  // Opened from a notes example (`?sc=`): start on that example's scenario.
  const opening = scenario ? lab.scenarios.find((x) => x.id === scenario) : null;
  let state = opening ? { ...lab.defaults(), ...opening.state } : lab.defaults();
  let result = null;
  let view = null;
  let frame = 0;
  let predIndex = 0;
  let pred = null; // { p, picked, before, done }

  root.innerHTML = `
    <div class="lab">
      <div class="crumbs"><a href="${hashFor({ unitId, mode: 'explore' })}">← Explore</a><span class="dim">Ch ${esc(lab.ch.join(', '))}</span></div>
      <h2>${esc(lab.title)}</h2>
      <div class="lab-grid">
        <div class="lab-plot">
          <div class="canvas-wrap"><canvas id="lab-canvas" role="img" style="aspect-ratio: 1 / ${lab.height}"></canvas></div>
          <div class="readout lab-readout" id="lab-readout" aria-live="polite"></div>
        </div>
        <div class="lab-side stack">
          ${lab.predictions.length ? '<div class="card predict" id="lab-predict"></div>' : ''}
          ${lab.scenarios.length ? `<label class="ctl ctl-choice"><span class="ctl-label">Scenario</span><select id="lab-scenario"><option value="">Choose an example…</option>${lab.scenarios.map((sc) => `<option value="${esc(sc.id)}">${esc(sc.label)}</option>`).join('')}</select></label>` : ''}
          <div class="controls" id="lab-controls">${lab.params.map(controlHTML).join('')}</div>
          ${lab.actions.length ? `<div class="row">${lab.actions.map((a) => `<button class="btn small" data-act="${a.id}">${esc(a.label)}</button>`).join('')}</div>` : ''}
          <div class="lab-explain note" id="lab-explain"></div>
        </div>
      </div>
    </div>`;

  const canvas = root.querySelector('#lab-canvas');
  const controls = root.querySelector('#lab-controls');
  const readoutEl = root.querySelector('#lab-readout');
  const explainEl = root.querySelector('#lab-explain');
  const predictEl = root.querySelector('#lab-predict');
  const scenarioEl = root.querySelector('#lab-scenario');

  const compute = (s) => lab.compute(s, createRng(s.seed));

  /** Push `state` into the controls: visibility, dynamic limits, values. Clamps ranges. */
  function sync() {
    for (const p of lab.params) {
      const box = controls.querySelector(`[data-param="${p.id}"]`);
      const shown = p.show ? !!p.show(state) : true;
      box.hidden = !shown;
      if (p.type === 'range') {
        const min = resolve(p.min, state);
        const max = resolve(p.max, state);
        const step = resolve(p.step, state);
        const dp = decimals(step);
        let v = Math.min(max, Math.max(min, Number(state[p.id])));
        v = Number((min + Math.round((v - min) / step) * step).toFixed(dp));
        if (v > max) v = Number(max.toFixed(dp));
        state[p.id] = v;
        const r = box.querySelector('[data-in]');
        const n = box.querySelector('[data-num]');
        for (const el of [r, n]) {
          el.min = min;
          el.max = max;
          el.step = step;
        }
        r.value = v;
        if (document.activeElement !== n) n.value = v;
      } else if (p.type === 'toggle') {
        box.querySelector('[data-in]').checked = !!state[p.id];
      } else {
        const sel = box.querySelector('select');
        if (sel) sel.value = state[p.id];
        for (const b of box.querySelectorAll('[data-seg]')) {
          const on = b.dataset.v === String(state[p.id]);
          b.classList.toggle('on', on);
          b.setAttribute('aria-checked', on);
        }
      }
    }
  }

  function paint() {
    frame = 0;
    result = compute(state);
    view = lab.draw(canvas, state, result);
    const cells = lab.readout(state, result);
    readoutEl.innerHTML = cells.map(([l, v]) => `<div class="cell"><div class="label">${mathProse(l)}</div><div class="value">${mathProse(v)}</div></div>`).join('');
    canvas.setAttribute('aria-label', `${lab.title}. ${cells.map(([l, v]) => `${l} ${v}`.replace(/\$/g, '')).join('; ')}`);
    explainEl.innerHTML = lab.explain(state, result).map((t) => `<p>${mathProse(t)}</p>`).join('');
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };
  const update = () => {
    sync();
    for (const a of lab.actions) {
      const b = root.querySelector(`[data-act="${a.id}"]`);
      if (b) b.hidden = a.show ? !a.show(state) : false;
    }
    schedule();
  };

  const coerce = (p, raw) => {
    if (p.type === 'range') return Number(raw);
    const opt = p.options.find(([v]) => String(v) === raw);
    return opt ? opt[0] : raw;
  };

  controls.addEventListener('input', (e) => {
    if (locked) return;
    const t = e.target;
    const id = t.dataset.in || t.dataset.num;
    const p = lab.params.find((q) => q.id === id);
    if (!p) return;
    if (p.type === 'toggle') state[id] = t.checked;
    else if (t.dataset.num) {
      if (t.value === '' || !Number.isFinite(Number(t.value))) return;
      state[id] = Number(t.value);
    } else {
      state[id] = coerce(p, t.value);
      if (p.reset) Object.assign(state, p.reset(state[id]));
    }
    // A choice or toggle can change what else is shown and every range's limits.
    update();
  });
  controls.addEventListener('change', (e) => {
    if (locked) return;
    if (e.target.dataset.num) {
      e.target.blur();
      update();
    }
  });
  controls.addEventListener('click', (e) => {
    if (locked) return;
    const b = e.target.closest('[data-seg]');
    if (!b) return;
    const p = lab.params.find((q) => q.id === b.dataset.seg);
    state[p.id] = coerce(p, b.dataset.v);
    if (p.reset) Object.assign(state, p.reset(state[p.id]));
    update();
  });

  root.querySelectorAll('[data-act]').forEach((b) =>
    b.addEventListener('click', () => {
      if (locked) return;
      const a = lab.actions.find((x) => x.id === b.dataset.act);
      const next = a.run(state, result);
      if (next) state = next;
      update();
    }),
  );

  if (scenarioEl) {
    if (opening) scenarioEl.value = opening.id;
    scenarioEl.addEventListener('change', () => {
      if (locked) return;
      const sc = lab.scenarios.find((x) => x.id === scenarioEl.value);
      if (!sc) return;
      state = { ...lab.defaults(), ...sc.state, seed: state.seed };
      update();
    });
  }

  /* ---------------- pointer (labs that let you drag) */
  if (lab.pointer) {
    canvas.classList.add('draggable');
    const at = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    let dragging = false;
    canvas.addEventListener('pointerdown', (e) => {
      if (locked) return;
      if (!view) return;
      const [x, y] = at(e);
      if (lab.pointer.down(view, state, x, y)) {
        dragging = true;
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        update();
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const [x, y] = at(e);
      if (lab.pointer.move(view, state, x, y)) update();
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (lab.pointer.up) lab.pointer.up(view, state);
      update();
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  /* ---------------- tap (labs whose picture is also a menu) */
  if (lab.tap) {
    canvas.classList.add('tappable');
    canvas.addEventListener('click', (e) => {
      if (locked) return;
      if (!view) return;
      const r = canvas.getBoundingClientRect();
      const next = lab.tap(view, state, e.clientX - r.left, e.clientY - r.top);
      if (next) {
        state = next;
        update();
      }
    });
  }

  /* ---------------- Predict first */

  // While a prediction is open, the controls are locked: the student commits before seeing.
  let locked = false;
  function lock(on) {
    locked = on;
    root.querySelector('.lab-side').classList.toggle('locked', on);
    for (const el of root.querySelectorAll('#lab-controls input, #lab-controls select, #lab-controls button, #lab-scenario, [data-act]')) el.disabled = on;
  }
  function renderPredict() {
    if (!predictEl) return;
    const tally = loadTally()[lab.id] || {};
    const p = lab.predictions[predIndex];
    const right = Object.values(tally).filter((r) => r.right).length;
    const head = `<div class="row" style="justify-content:space-between"><h3>Predict first</h3><span class="dim">${predIndex + 1} of ${lab.predictions.length} · ${right} right so far</span></div>`;
    if (!pred) {
      predictEl.innerHTML = `${head}<p class="note">${mathProse(p.prompt)}</p>
        <div class="row"><button class="btn small primary" data-pred="start">Try it</button>${lab.predictions.length > 1 ? '<button class="btn small ghost" data-pred="next">Another</button>' : ''}</div>`;
      return;
    }
    const opts = p.options
      .map(([v, l]) => {
        let cls = pred.picked === v ? 'picked' : '';
        if (pred.done && v === pred.actual) cls = 'right';
        else if (pred.done && pred.picked === v) cls = 'wrong';
        return `<button type="button" class="opt ${cls}" data-pick="${esc(v)}" ${pred.done ? 'disabled' : ''}>${mathProse(l)}</button>`;
      })
      .join('');
    let foot = `<button class="btn small primary" data-pred="change" ${pred.picked == null ? 'disabled' : ''}>Make the change</button>`;
    if (pred.done) {
      const ok = pred.picked === pred.actual;
      const actualLabel = p.options.find(([v]) => v === pred.actual)?.[1] ?? pred.actual;
      foot = `<div class="verdict ${ok ? 'ok' : 'bad'}"><b>${ok ? 'As you predicted.' : 'Not what you predicted.'}</b> What happened: ${mathProse(actualLabel)}.<div class="why">${mathProse(p.why)}</div></div>
        <div class="row"><button class="btn small" data-pred="again">Back to the set-up</button>${lab.predictions.length > 1 ? '<button class="btn small primary" data-pred="next">Next prediction</button>' : ''}</div>`;
    }
    predictEl.innerHTML = `${head}<p class="note">${mathProse(p.prompt)}</p><div class="opts pred-opts">${opts}</div>${foot}`;
  }

  if (predictEl) {
    predictEl.addEventListener('click', (e) => {
      const pick = e.target.closest('[data-pick]');
      if (pick && pred && !pred.done) {
        const p = lab.predictions[predIndex];
        pred.picked = p.options.find(([v]) => String(v) === pick.dataset.pick)[0];
        renderPredict();
        return;
      }
      const act = e.target.closest('[data-pred]')?.dataset.pred;
      if (!act) return;
      const p = lab.predictions[predIndex];
      if (act === 'start' || act === 'again') {
        state = { ...lab.defaults(), ...p.setup, seed: state.seed };
        sync();
        // The verdict is computed from this set-up, never from whatever is on screen by then.
        pred = { picked: null, done: false, base: { ...state } };
        update();
      } else if (act === 'next') {
        predIndex = (predIndex + 1) % lab.predictions.length;
        pred = null;
        lock(false);
      } else if (act === 'change' && pred && pred.picked != null) {
        const before = compute({ ...pred.base });
        state = { ...pred.base, ...p.change };
        sync();
        const after = compute(state);
        pred.actual = p.outcome(before, after, state);
        pred.done = true;
        const all = loadTally();
        const mine = (all[lab.id] ||= {});
        const rec = (mine[p.id] ||= { tries: 0, right: false });
        rec.tries++;
        if (pred.picked === pred.actual) rec.right = true;
        saveTally(all);
        schedule();
      }
      lock(!!pred && !pred.done);
      renderPredict();
    });
  }

  root.onclick = null;
  update();
  renderPredict();
  paint();

  // Redraw at the new size when the plot's width changes (rotation, window resize).
  if (typeof ResizeObserver !== 'undefined') {
    let w = canvas.clientWidth;
    const ro = new ResizeObserver(() => {
      if (!canvas.isConnected) return ro.disconnect();
      if (canvas.clientWidth !== w) {
        w = canvas.clientWidth;
        schedule();
      }
    });
    ro.observe(canvas);
  }
}
