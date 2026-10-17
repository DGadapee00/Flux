import { sceneScale, workPlane, lenLabel, PLANE_AXES } from '@flux/core/scene3d/frame.js';
import { bindCourseHeader } from '../header.js';
import { mountNotesTab } from '../notes.js';
import { drawSeries, drawVx, drawAC, drawVI } from './plot.js';
import { choices, matchesExpect, outcomes, run } from './predict.js';
import { setLawEl, prose, mathText } from './shared.js';

/**
 * Engineering-course HUD. The course passes its catalog; this module names no course and no chapter.
 *
 * @param {object} api
 * @param {object} catalog
 * @param {object[]} catalog.exams
 * @param {(id: string) => object|undefined} catalog.examById
 * @param {Record<string, { title?: string }>} catalog.labMeta
 * @param {string} catalog.code Course code, printed under FLUX with the title.
 * @param {string} catalog.title Course title, printed under FLUX with the code.
 * @param {string} [catalog.courseId] Marks this course in the track row.
 * @param {{ id?: string, code?: string, title?: string, href?: string|null }[]} [catalog.track] Sibling courses, hub order.
 * @param {string} catalog.homeId Unit shown before one is mounted.
 * @param {object} [catalog.notes] Core `createNotes` dependencies. Omit when the manifest has no notes.
 */
export function createHUD(api, catalog) {
  const { examById, labMeta: LAB_META, homeId } = catalog;
  const notesTab = mountNotesTab(api, catalog.notes);
  const header = bindCourseHeader(catalog, api);
  const $ = (id) => document.getElementById(id);
  let lawKey = '';
  let mountedId = '';
  /** Refreshers for the typed boxes beside each slider, rebuilt whenever a lab mounts. */
  const sliderBoxes = [];
  const pred = { labId: '', index: 0, phase: 'ask', picks: {}, got: null, before: null, after: null };
  let predKey = '';

  function bindPredict() {
    const host = $('predict');
    if (!host || host.dataset.bound) return;
    host.dataset.bound = '1';
    host.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button || !pred.lab) return;
      const prompts = pred.lab.predictions || [];
      const prompt = prompts[pred.index];
      if (!prompt) return;
      if (button.dataset.act === 'next') {
        pred.index = (pred.index + 1) % prompts.length;
        pred.phase = 'ask';
        pred.picks = {};
        pred.got = null;
        predKey = '';
        renderPredict(pred.lab);
        return;
      }
      if (button.dataset.act === 'again') {
        pred.phase = 'ask';
        pred.picks = {};
        pred.got = null;
        predKey = '';
        renderPredict(pred.lab);
        return;
      }
      if (button.dataset.watch) {
        const raw = button.dataset.value;
        pred.picks[button.dataset.watch] = raw === 'true' ? true : raw === 'false' ? false : Number.isFinite(Number(raw)) && raw !== '' && button.dataset.numeric === '1' ? Number(raw) : raw;
        predKey = '';
        renderPredict(pred.lab);
        return;
      }
      if (button.dataset.act === 'apply') {
        const live = api.slice();
        const fresh = pred.lab.defaultState();
        pred.lab.applyScenario(prompt.scenario, fresh);
        prompt.prep?.(fresh);
        const { before, after, next } = run(pred.lab, fresh, prompt);
        pred.before = before;
        pred.after = after;
        pred.got = outcomes(prompt, before, after);
        pred.phase = 'result';
        predKey = '';
        for (const key of Object.keys(live)) delete live[key];
        Object.assign(live, next);
        api.bump(false);
      }
    });
  }

  function renderPredict(lab) {
    const host = $('predict');
    if (!host) return;
    const prompts = lab?.predictions || [];
    const hidden = !prompts.length || document.body.classList.contains('practice-open');
    host.hidden = hidden;
    if (hidden) return;
    if (pred.labId !== lab.id) {
      pred.labId = lab.id;
      pred.index = 0;
      pred.phase = 'ask';
      pred.picks = {};
      pred.got = null;
      predKey = '';
    }
    pred.lab = lab;
    const prompt = prompts[pred.index];
    const key = `${lab.id}|${pred.index}|${pred.phase}|${JSON.stringify(pred.picks)}|${pred.got ? 'g' : ''}`;
    if (key === predKey) return;
    predKey = key;
    const n = prompts.length;
    const head = `<div class="pred-head"><h3>Predict first</h3><span>${pred.index + 1} of ${n}</span></div>`;
    const ask = `<div class="pred-ask">${prose(prompt.ask)}</div>`;
    if (pred.phase === 'result' && pred.got) {
      const rows = prompt.watch.map((w) => {
        const right = pred.got[w.id] === pred.picks[w.id];
        const label = choices(prompt, w).find(([value]) => value === pred.got[w.id]);
        return `<p class="pred-grade ${right ? 'ok' : 'bad'}">${prose(w.label)}: ${right ? 'right' : `the lab says ${label ? label[1] : pred.got[w.id]}`}.</p>`;
      }).join('');
      const note = matchesExpect(prompt, pred.got)
        ? prose(prompt.why)
        : prose('This setup did not do what the usual case does, so the explanation for that case stays put.');
      host.innerHTML = `${head}${ask}${rows}<div class="pred-why">${note}</div><div class="pred-row"><button type="button" class="btn ghost" data-act="again">Try again</button><button type="button" class="btn" data-act="next">Next</button></div>`;
      return;
    }
    const ready = prompt.watch.every((w) => w.id in pred.picks);
    const rows = prompt.watch.map((w) => {
      const buttons = choices(prompt, w).map(([value, label]) => {
        const on = pred.picks[w.id] === value;
        const numeric = typeof value === 'number' ? ' data-numeric="1"' : '';
        return `<button type="button" class="pred-choice${on ? ' on' : ''}" data-watch="${w.id}" data-value="${value}"${numeric}>${label}</button>`;
      }).join('');
      return `<div class="pred-q"><div>${prose(w.label)}</div><div class="pred-row">${buttons}</div></div>`;
    }).join('');
    host.innerHTML = `${head}${ask}${rows}<div class="pred-row"><button type="button" class="btn" data-act="apply"${ready ? '' : ' disabled'}>Make the change</button>${n > 1 ? '<button type="button" class="btn ghost" data-act="next">Another</button>' : ''}</div>`;
  }

  function setLaw(lines) {
    const key = (lines || []).join('\n');
    if (key === lawKey) return;
    lawKey = key;
    setLawEl($('law-line'), lines);
  }

  function fillScenarios(lab) {
    const list = !lab ? [] : typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
    $('scenario').innerHTML = list.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
    $('scenario').closest('label').hidden = list.length === 0;
  }

  function renderLabTabs(exam, labId) {
    const labs = exam?.labs || [];
    const built = labs
      .map((id) => {
        const on = id === labId;
        const title = LAB_META[id]?.title || id;
        return `<button type="button" class="tab${on ? ' active' : ''}" data-lab="${id}" role="tab" aria-selected="${on}">${title}</button>`;
      })
      .join('');
    // Unbuilt labs stay visible so the exam's full scope is on screen.
    const soon = (exam?.coming || [])
      .map((t) => `<button type="button" class="tab soon" disabled title="Coming soon">${t}</button>`)
      .join('');
    $('lab-tabs').innerHTML = built + soon;
  }

  function renderToggles(lab, state) {
    const host = $('toggle-host');
    const items = lab?.toggles || [];
    host.innerHTML = items
      .map((t) => {
        const on = !!state?.show?.[t.key];
        return `<button type="button" class="toggle${on ? ' active' : ''}" data-key="${t.key}" aria-pressed="${on}"><span class="toggle-dot"></span> ${t.label}</button>`;
      })
      .join('');
  }

  function renderLegend(lab) {
    const host = $('legend-host');
    const L = lab?.legend;
    // The legend sits over the bottom-left corner; the equation panel stops short of it.
    document.body.classList.toggle('has-legend', !!L);
    if (!L) {
      host.innerHTML = '';
      host.hidden = true;
      return;
    }
    host.hidden = false;
    host.innerHTML = `<div class="hud legend" id="legend">
        <div class="legend-title">${L.title}</div>
        <div class="legend-bar${L.barClass ? ' ' + L.barClass : ''}"></div>
        <div class="legend-row"><span>${L.low}</span><span>${L.high}</span></div>
      </div>`;
  }

  /**
   * Give every slider a box you can type an exact value into. A slider is good for sweeping and bad
   * for matching a number in a problem, so the box writes straight into the same input — widening
   * the slider's range when the problem asks for a value it could not otherwise reach.
   */
  function enhanceSliders(host) {
    for (const row of host.querySelectorAll('.slider-row')) {
      const range = row.querySelector("input[type='range']");
      if (!range || row.querySelector('.slider-num')) continue;
      const step = Number(range.step);
      // Fractional steps become continuous, so a typed value is never snapped back to the grid.
      // Whole-number steps (piece counts, turns) stay discrete.
      if (Number.isFinite(step) && step > 0 && step < 1) range.step = 'any';
      const box = document.createElement('input');
      box.type = 'number';
      box.className = 'slider-num';
      box.step = Number.isFinite(step) && step > 0 ? String(step) : 'any';
      box.setAttribute('aria-label', 'Exact value');
      const show = () => {
        if (box !== document.activeElement) box.value = String(Number(Number(range.value).toPrecision(6)));
      };
      show();
      box.addEventListener('input', () => {
        const v = Number(box.value);
        if (box.value === '' || !Number.isFinite(v)) return;
        if (v < Number(range.min)) range.min = String(v);
        if (v > Number(range.max)) range.max = String(v);
        range.value = String(v);
        range.dispatchEvent(new Event('input', { bubbles: true }));
      });
      range.addEventListener('input', show);
      row.appendChild(box);
      sliderBoxes.push(show);
    }
  }

  function mount(lab, exam, state) {
    const examId = exam?.id || homeId;
    notesTab?.onExam(examId);
    const labId = lab?.id || '';
    header.showUnit(examId);
    renderLabTabs(exam, labId);
    $('setup-hint').innerHTML = mathText(lab?.hint || exam?.coming?.join(' · ') || '');
    $('hint-action').innerHTML = mathText(lab?.hint || '');
    $('hint-orbit').textContent = lab && lab.orbit === false ? 'Rotation locked' : 'Drag to orbit';
    fillScenarios(lab);
    lawKey = '';
    

    const host = $('lab-controls');
    if (!lab) {
      const coming = (exam?.coming || []).join(', ') || 'coming next';
      host.innerHTML = `<p class="tiny">The ${coming} labs are not built yet.</p>`;
      mountedId = '';
      renderToggles(null);
      renderLegend(null);
      return;
    }
    host.innerHTML = lab.controls();
    sliderBoxes.length = 0;
    lab.bind(api);
    enhanceSliders(host);
    mountedId = lab.id;
    renderToggles(lab, state);
    renderLegend(lab);
    if (state?.scenarioId) $('scenario').value = state.scenarioId;
  }

  $('lab-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lab]');
    if (btn) api.setLab(btn.dataset.lab);
  });
  $('scenario').addEventListener('change', () => api.setScenario($('scenario').value));
  $('btn-reset-cam').addEventListener('click', () => api.resetCamera());
  $('toggle-host').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-key]');
    if (btn) api.toggleShow(btn.dataset.key);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (notesTab?.isOpen()) notesTab.close();
      else api.escape();
      return;
    }
    if (e.target.matches('input, select, textarea')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'p' || e.key === 'P') {
      api.togglePractice();
      return;
    }
    if (notesTab && (e.key === 'n' || e.key === 'N')) {
      notesTab.toggle();
      return;
    }
    if (e.key === '[') {
      api.shiftExam(-1);
      return;
    }
    if (e.key === ']') {
      api.shiftExam(1);
      return;
    }
    if (e.key >= '1' && e.key <= '9') {
      api.setLabIndex(Number(e.key) - 1);
      return;
    }
    api.handleKey(e);
  });

  /** What plane a drag runs in, and what one grid square is worth — the scene's legend, in words. */
  function updatePlaneHint(lab) {
    const el = $('hint-plane');
    if (!el) return;
    const plane = workPlane();
    const off = PLANE_AXES[plane].off;
    el.textContent = lab?.frame
      ? `${plane} plane · 1 square = ${lenLabel(1 / sceneScale())} · Shift-drag for ${off}`
      : 'Shift-drag for height';
  }

  function drawPlot(plot) {
    const canvas = $('mini-plot');
    if (!canvas) return;
    if (!plot) {
      canvas.hidden = true;
      canvas.classList.remove('series');
      return;
    }
    canvas.hidden = false;
    canvas.classList.toggle('series', plot.type === 'series');
    if (plot.type === 'Vx') drawVx(canvas, plot.xs, plot.Vs, plot.xProbe, plot.xA);
    if (plot.type === 'ac') drawAC(canvas, plot.power, plot.t);
    if (plot.type === 'vi') drawVI(canvas, plot);
    if (plot.type === 'series') drawSeries(canvas, plot);
    drawnSize = `${canvas.clientWidth}x${canvas.clientHeight}`;
  }

  let lastPlot = null;
  let drawnSize = '';
  const plotCanvas = $('mini-plot');
  if (plotCanvas && typeof ResizeObserver !== 'undefined') {
    let frame = 0;
    const observer = new ResizeObserver(() => {
      const size = `${plotCanvas.clientWidth}x${plotCanvas.clientHeight}`;
      if (!lastPlot || plotCanvas.clientWidth < 2 || plotCanvas.clientHeight < 2 || size === drawnSize) return;
      drawnSize = size;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => drawPlot(lastPlot));
    });
    observer.observe(plotCanvas);
  }

  function update(state, computed, lab) {
    if (!lab) {
      $('eq-live').innerHTML = '';
      $('readout').innerHTML = '';
      $('insight-title').textContent = examById(state.examId)?.title || '';
      $('insight-body').innerHTML = prose((examById(state.examId)?.coming || []).join(', '));
      $('mini-plot').hidden = true;
      $('mini-plot').classList.remove('series');
      const predict = $('predict');
      if (predict) predict.hidden = true;
      return;
    }
    if (state.scenarioId && $('scenario').value !== state.scenarioId) {
      $('scenario').value = state.scenarioId;
    }
    lab.syncControls(state);
    for (const show of sliderBoxes) show();
    updatePlaneHint(lab);
    document.querySelectorAll('#toggle-host [data-key]').forEach((b) => {
      const on = !!state.show?.[b.dataset.key];
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    const coach = computed.coach || lab.coach(state, computed) || { title: '', body: '' };
    $('insight-title').innerHTML = mathText(coach.title || '');
    $('insight-body').innerHTML = prose(coach.body || '');

    setLaw(lab.law(state, computed));
    $('eq-live').innerHTML = lab.liveRows(state, computed);
    $('readout').innerHTML = lab.readout(state, computed);

    lastPlot = lab.plot(state, computed);
    drawPlot(lastPlot);
    bindPredict();
    renderPredict(lab);
  }

  return { mount, update, notes: notesTab };
}

export { sciHTML } from './format.js';
