/**
 * "Set it up": a derivation, one decision at a time, in the equation panel beside the lab.
 *
 * The student picks each next line from a few candidates. A wrong pick stays on screen, struck
 * through, with the reason it is wrong; the right one joins the working above. Every line in the
 * working shows the lab's present numbers, so a substitution (I for dq/dt, a/r for sin φ) can be
 * seen to leave the value alone. Move a slider and the numbers follow. While a step is open, the
 * part of the picture it is about is drawn over the lab: the piece dy, the distance r, the loop.
 *
 * The course supplies the derivations (the format is in the derivation files).
 */
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { fatLine, disposeTree, M } from '@flux/core/scene3d/manim.js';
import { tex, mathText, escapeHTML } from './shared.js';

/** A stable shuffle, so the right answer is not always first but does not move between visits. */
function order(n, seed) {
  const idx = [...Array(n).keys()];
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/**
 * @param {object} api What main.js offers the panel (scene, slice, computed, setScenario, bump, reframe?).
 * @param {object} [deps] Everything here is optional: a course with no derivations passes nothing.
 * @param {(labId: string) => object[]} [deps.derivationsFor] The derivations for a lab; empty for a lab with none.
 * @param {(id: string) => object|undefined} [deps.derivationById]
 * @param {(eq: [number, number][]) => boolean} [deps.agrees] Whether each pair of an evaluated line agrees.
 * @param {Record<string, number>} [deps.colors] The scene colours a derivation's picture names: mark, and the course's own.
 */
export function createDerive(api, deps = {}) {
  const { derivationsFor = () => [], derivationById = () => undefined, agrees = () => true, colors = {} } = deps;
  const $ = (id) => document.getElementById(id);
  const panel = $('eq-panel');
  const host = $('derive');
  const opener = $('eq-derive');
  const overlay = new THREE.Group();
  overlay.renderOrder = 10;
  api.scene.add(overlay);
  let overlayKey = '';

  // What the student has done: the derivation open, how far through, the wrong picks per step.
  const run = { open: false, id: null, step: 0, wrong: new Map(), shown: new Set() };
  let labId = null;
  let lastValues = new Map();

  const current = () => (run.id ? derivationById(run.id) : null);

  function reset(id) {
    run.id = id;
    run.step = 0;
    run.wrong = new Map();
    run.shown = new Set();
    run.right = null;
    lastValues = new Map();
  }

  function load(d) {
    const s = api.slice();
    if (!d.applies(s)) api.setScenario(d.scenario);
    const s2 = api.slice();
    d.prepare?.(s2);
    api.bump(false);
  }

  function open(id) {
    const d = derivationById(id) || derivationsFor(labId)[0];
    if (!d) return;
    if (run.id !== d.id) reset(d.id);
    labId = d.lab; // opened from the notes, the lab has just switched: this is its derivation
    run.open = true;
    load(d);
    panel.classList.add('deriving');
    host.hidden = false;
    render();
    api.reframe?.();
  }

  function close() {
    run.open = false;
    panel.classList.remove('deriving');
    host.hidden = true;
    clearOverlay();
    api.reframe?.();
  }

  // ------------------------------------------------------------------ panel

  function optionHTML(d, k, o, i) {
    const wrong = run.wrong.get(k)?.has(i);
    const right = run.right === i;
    const settled = run.right != null; // once the right one is picked, the rest stand down
    const body = o.tex ? tex(o.tex) : mathText(o.text);
    const badge = right ? '<span class="derive-badge ok">✓ Correct</span>' : wrong ? '<span class="derive-badge no">✗ Not quite</span>' : '';
    return `<button type="button" class="derive-opt${wrong ? ' wrong' : ''}${right ? ' right' : ''}${settled && !right && !wrong ? ' idle' : ''}" data-opt="${i}" ${wrong || settled ? 'disabled' : ''}>${badge}${body}</button>${
      wrong && o.why ? `<p class="derive-why">${mathText(o.why)}</p>` : ''
    }`;
  }

  function render() {
    const d = current();
    if (!d) return;
    const s = api.slice();
    const others = derivationsFor(labId);
    const fits = d.applies(s);
    const k = run.step;
    const done = k >= d.steps.length;
    const work = d.steps
      .slice(0, k)
      .map(
        (st, i) => `<li class="derive-line">
          <div class="derive-tex">${tex(st.line, true)}</div>
          <div class="derive-val" data-val="${i}"></div>
          ${st.units ? `<div class="derive-units">units: ${tex(st.units)}</div>` : ''}
          ${st.after ? `<p class="derive-after">${mathText(st.after)}</p>` : ''}
          ${
            run.shown.has(i)
              ? '<p class="derive-shown">Shown, not picked: try this step again later.</p>'
              : run.wrong.get(i)?.size
                ? `<p class="derive-tally late">✓ Right after ${run.wrong.get(i).size} wrong ${run.wrong.get(i).size === 1 ? 'try' : 'tries'}</p>`
                : '<p class="derive-tally first">✓ Right first try</p>'
          }
        </li>`,
      )
      .join('');
    let next = '';
    if (!fits) {
      next = `<div class="derive-off"><p>This working is for a different setup of the lab.</p><button type="button" class="btn" data-act="load">Load its setup</button></div>`;
    } else if (!done) {
      const st = d.steps[k];
      const ord = order(st.options.length, `${d.id}:${k}`);
      next = `<div class="derive-step">
        <div class="derive-count">Step ${k + 1} of ${d.steps.length}</div>
        <p class="derive-ask">${mathText(st.ask)}</p>
        <div class="derive-opts">${ord.map((i) => optionHTML(d, k, st.options[i], i)).join('')}</div>
        ${
          run.right != null
            ? `<div class="derive-confirm">
                <p class="derive-confirm-head">✓ Correct${run.wrong.get(k)?.size ? '' : ', first try'}. This line joins your working:</p>
                <div class="derive-tex">${tex(st.line, true)}</div>
                ${st.after ? `<p class="derive-after">${mathText(st.after)}</p>` : ''}
                <button type="button" class="btn derive-next" data-act="next">${k + 1 < d.steps.length ? 'Next step →' : 'Finish →'}</button>
              </div>`
            : `${run.wrong.get(k)?.size ? '<p class="derive-retry">✗ Not quite. Read why, then pick again.</p>' : ''}<button type="button" class="linkish derive-reveal" data-act="reveal">Show me this step</button>`
        }
      </div>`;
    } else {
      const first = d.steps.filter((_, i) => !run.shown.has(i) && !run.wrong.get(i)?.size).length;
      const picked = d.steps.length - run.shown.size;
      next = `<div class="derive-done">
        <p class="derive-count">Done: ${first} of ${d.steps.length} right first try${picked > first ? `, ${picked - first} after a wrong pick` : ''}${run.shown.size ? `, ${run.shown.size} shown` : ''}.</p>
        <p>${mathText(d.done)}</p>
        <div class="row wrap"><button type="button" class="btn" data-act="again">Start again</button></div>
      </div>`;
    }
    const chooser =
      others.length > 1
        ? `<select class="derive-pick" aria-label="Which derivation">${others.map((o) => `<option value="${o.id}" ${o.id === d.id ? 'selected' : ''}>${escapeHTML(o.title)}</option>`).join('')}</select>`
        : '';
    host.innerHTML = `
      <div class="derive-head">
        <button type="button" class="linkish" data-act="close">← Equations</button>
        ${chooser}
      </div>
      <h3 class="derive-title">${escapeHTML(d.title)}</h3>
      <p class="derive-goal">${mathText(d.goal)}</p>
      ${work ? `<ol class="derive-work">${work}</ol>` : ''}
      ${next}`;
    lastValues = new Map();
    updateValues();
    const el = host.querySelector('.derive-confirm, .derive-step, .derive-done, .derive-off');
    if (el && run.scroll) el.scrollIntoView({ block: 'nearest' });
    run.scroll = false;
  }

  /** The working's numbers: recomputed every update, rewritten only when they change. */
  function updateValues() {
    const d = current();
    if (!d || !run.open) return;
    const s = api.slice();
    const c = api.computed();
    if (!d.applies(s)) return;
    for (const el of host.querySelectorAll('[data-val]')) {
      const i = Number(el.dataset.val);
      let v;
      try {
        v = d.steps[i].values(s, c);
      } catch {
        v = null;
      }
      const ok = v && v.eq.length ? agrees(v.eq) : null;
      const text = v ? `${v.show}${ok == null ? '' : ok ? ' ✓' : ' ✗'}` : '';
      if (lastValues.get(i) !== text) {
        lastValues.set(i, text);
        el.textContent = text;
        el.classList.toggle('agree', ok === true);
      }
    }
  }

  host.addEventListener('click', (e) => {
    const d = current();
    if (!d) return;
    const opt = e.target.closest('[data-opt]');
    if (opt) {
      const i = Number(opt.dataset.opt);
      const st = d.steps[run.step];
      if (st.options[i].ok) {
        run.right = i; // confirmed on screen; "Next step" moves on
        run.scroll = true;
      } else {
        if (!run.wrong.has(run.step)) run.wrong.set(run.step, new Set());
        run.wrong.get(run.step).add(i);
      }
      render();
      api.bump(false);
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'next') {
      run.right = null;
      run.step++;
      run.scroll = true;
      render();
      api.bump(false);
      return;
    }
    if (act === 'close') close();
    else if (act === 'reveal') {
      run.shown.add(run.step);
      run.right = null;
      run.step++;
      run.scroll = true;
      render();
      api.bump(false);
    } else if (act === 'again') {
      reset(d.id);
      load(d);
      render();
    } else if (act === 'load') {
      load(d);
      render();
    }
  });
  host.addEventListener('change', (e) => {
    if (e.target.matches('.derive-pick')) {
      reset(e.target.value);
      load(current());
      render();
    }
  });
  opener.addEventListener('click', () => open(run.id && current()?.lab === labId ? run.id : null));

  // ------------------------------------------------------------------ the picture

  function clearOverlay() {
    for (const o of [...overlay.children]) {
      overlay.remove(o);
      disposeTree(o);
    }
    overlayKey = '';
  }

  function drawOverlay(prims) {
    clearOverlay();
    for (const p of prims) {
      const color = colors[p.color] ?? M.lavender;
      if (p.kind === 'path') {
        const line = fatLine(p.pts.flat(), { color, width: p.width || 3, dashed: !!p.dashed, dashSize: 0.18, gapSize: 0.12 });
        line.renderOrder = 10;
        line.material.depthTest = false;
        overlay.add(line);
      } else if (p.kind === 'dot') {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color, depthTest: false }));
        m.position.set(...p.at);
        m.renderOrder = 10;
        overlay.add(m);
      } else if (p.kind === 'disc') {
        const m = new THREE.Mesh(
          new THREE.CircleGeometry(p.radius, 96),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
        );
        m.rotation.x = -Math.PI / 2;
        m.position.set(...p.at);
        overlay.add(m);
      } else if (p.kind === 'label') {
        const el = document.createElement('div');
        el.className = 'circuit-label derive-label';
        el.innerHTML = p.html;
        const o = new CSS2DObject(el);
        o.position.set(...p.at);
        overlay.add(o);
      }
    }
  }

  /** After the lab draws itself: lay the open step's picture over it. */
  function syncScene(state, computed) {
    const d = current();
    if (!run.open || !d || d.lab !== labId || !d.applies(state) || document.body.classList.contains('problem-blind')) {
      if (overlay.children.length) clearOverlay();
      return;
    }
    const st = d.steps[run.step];
    const key = st?.show || '';
    const sig = `${d.id}|${key}|${JSON.stringify([state.probe, state.L, state.R, state.r, state.cx, state.cz, state.wires, state.kind, state.mode])}`;
    if (sig === overlayKey) return;
    const prims = key && d.overlay ? d.overlay(key, state, computed) : [];
    drawOverlay(prims);
    overlayKey = sig;
  }

  /** Every HUD update: show the opener where the lab has derivations, and keep the numbers live. */
  function update(state, computed, lab) {
    const id = lab?.id || null;
    if (id !== labId) {
      labId = id;
      if (run.open) close();
    }
    const list = derivationsFor(labId);
    const blind = document.body.classList.contains('problem-blind');
    opener.hidden = !list.length || blind;
    if (blind && run.open) close();
    if (!run.open) return;
    // The setup moved away from this derivation (a mode or scenario change): say so, once.
    const d = current();
    const fits = d.applies(state);
    if (fits !== run.fits) {
      run.fits = fits;
      render();
      return;
    }
    updateValues();
  }

  return { update, syncScene, open, close, isOpen: () => run.open };
}
