import '@flux/shells/engineering/styles/main.css';
import '@flux/shells/engineering/styles/practice.css';
import '@flux/shells/engineering/styles/stage.css';
import '@flux/shells/styles/notes.css';
import { openNotesFromRoute } from '@flux/shells/notes.js';
import 'katex/dist/katex.min.css';
import './styles.css';
import { mountTrackBar } from '@flux/core';
import { createStage } from '@flux/shells/engineering/stage.js';
import { examById, examForLab } from './data/catalog.js';
import { neighborExam, parseHash, problemQuery, writeHash } from './engine/router.js';
import { loadExamLabs, loadLab } from './labs/load.js';
import { course } from './manifest.js';
import { applyExample } from './notes/setups.js';
import { applyProblem } from './problems/simbridge.js';
import { createHUD } from './ui/hud.js';
import { createPractice } from './ui/problems.js';

mountTrackBar(document.getElementById('brand'));

/** The labs are plot2d: the stage hides this canvas and draws on its own. */
const canvas = document.getElementById('c');
const stage = createStage(canvas);

const app = {
  examId: 'u1',
  labId: 'phase',
  lab: null,
  slices: {},
  gen: 0,
  dirty: true,
  query: '',
};

const computed = {};
let practice = null;
let loadingProblem = false;

function slice() {
  return app.slices[app.labId] || {};
}

function bump(physics = true) {
  app.dirty = true;
  if (physics && !loadingProblem) practice?.noteEdit();
}

function publicState() {
  const s = slice();
  s.lab = app.labId;
  s.examId = app.examId;
  return s;
}

const sheetBtn = document.getElementById('btn-sheet');
sheetBtn?.addEventListener('click', () => {
  const on = document.body.classList.toggle('sheet-explain');
  sheetBtn.setAttribute('aria-pressed', String(on));
  sheetBtn.textContent = on ? 'Setup' : 'Explain';
  app.dirty = true;
});

function setScenario(id) {
  const lab = app.lab;
  if (!lab) return;
  practice?.noteEdit();
  lab.applyScenario?.(id, slice());
  bump();
}

function setLabIndex(i) {
  const id = examById(app.examId).labs[i];
  if (id) setLab(id);
}

function shiftExam(dir) {
  const next = neighborExam(app.examId, dir);
  if (next.id !== app.examId) setExam(next.id);
}

async function setExam(examId, preferredLab) {
  const exam = examById(examId);
  app.examId = exam.id;
  await loadExamLabs(exam.labs);
  const id = preferredLab && exam.labs.includes(preferredLab) ? preferredLab : exam.labs[0];
  if (id) return setLab(id);
  app.lab = null;
  app.labId = null;
  hud.mount(null, exam, { examId: exam.id });
  practice?.onMount({ byProblem: loadingProblem });
  writeHash(exam.id, '', { replace: booting, query: app.query });
  app.dirty = true;
}

async function setLab(labId) {
  if (!labId) return;
  if (app.labId === labId && app.lab) return;
  const my = ++app.gen;
  const exam = examForLab(labId);
  await loadExamLabs(exam.labs);
  const lab = await loadLab(labId);
  if (!lab || my !== app.gen) return;
  app.examId = lab.exam || exam.id;
  app.labId = labId;
  app.lab = lab;
  if (!app.slices[labId]) {
    const s = lab.defaultState();
    const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
    if (list[0]) lab.applyScenario?.(list[0].id, s);
    app.slices[labId] = s;
  }
  slice().lab = labId;
  hud.mount(lab, examById(app.examId), slice());
  practice?.onMount({ byProblem: loadingProblem });
  writeHash(app.examId, labId, { replace: booting, query: app.query });
  app.dirty = true;
}

let booting = true;

async function openProblemInApp(inst, { push = true, query = true } = {}) {
  const tpl = inst.tpl;
  app.query = query ? problemQuery(tpl.id, inst.seed) : '';
  loadingProblem = true;
  try {
    if (tpl.lab) {
      await setLab(tpl.lab);
      if (app.lab?.id !== tpl.lab) await setLab(tpl.lab);
    } else if (app.examId !== tpl.exam) await setExam(tpl.exam);
    let note = '';
    if (tpl.lab && app.lab?.id === tpl.lab) {
      note = applyProblem(app.lab, slice(), inst);
      bump();
    }
    writeHash(app.examId, app.labId, { replace: !push, query: app.query });
    return note;
  } finally {
    loadingProblem = false;
  }
}

const hud = createHUD({
  setLab,
  setExam,
  setScenario,
  setLabIndex,
  shiftExam,
  resetCamera: () => {},
  toggleShow(key) {
    const s = slice();
    s.show = { ...(s.show || {}), [key]: !s.show?.[key] };
    bump(false);
  },
  toggleSweep: () => {},
  handleKey: () => {},
  togglePractice: () => practice.toggle(),
  escape: () => practice.escape(),
  bump,
  slice,
  addCharge: () => {},
  deleteSelected: () => {},
  setChargeQ: () => {},
  setCoord: () => bump(),
  fitView: () => bump(false),
  selectCharge: () => {},
  examId: () => app.examId,
  explore: (labId) => setLab(labId),
  showLab: (labId) => setLab(labId),
  practiceChapter(examId) {
    const go = examId && examId !== app.examId ? setExam(examId) : Promise.resolve();
    return go.then(() => practice?.open());
  },
  setupExample(examId, ex) {
    const go = examId && examId !== app.examId ? setExam(examId, ex.lab) : setLab(ex.lab);
    return go.then(() => {
      if (!app.lab || app.lab.id !== ex.lab) return;
      applyExample(app.lab, slice(), ex);
      bump(false);
    });
  },
  reframe: () => {
    app.dirty = true;
  },
});

practice = createPractice({
  openInLab: openProblemInApp,
  clearQuery({ push = false } = {}) {
    if (!app.query) return;
    app.query = '';
    writeHash(app.examId, app.labId, { replace: !push });
  },
  setSceneBlind: () => {},
  labId: () => app.labId,
  examId: () => app.examId,
  setExam: (id) => setExam(id),
  slice,
  computed,
  labelLayer: document.getElementById('label-layer'),
});

function followUrl() {
  const route = parseHash();
  const { examId, labId, problemId, seed } = route;
  if (practice.followUrl(problemId, seed)) return;
  openNotesFromRoute(hud.notes, route);
  if (examId === app.examId && labId === app.labId) return;
  if (labId) setLab(labId);
  else setExam(examId);
}
window.addEventListener('hashchange', followUrl);
window.addEventListener('popstate', followUrl);

function recompute() {
  const lab = app.lab;
  if (!lab) return;
  for (const key of Object.keys(computed)) delete computed[key];
  lab.recompute(slice(), computed);
  computed.coach = lab.coach(slice(), computed);
}

/** Panels move (the sheet, practice, a resize), and the diagram must refit the space they leave. */
let layoutKey = '';
let layoutChecked = 0;
function layoutChanged(now) {
  if (now - layoutChecked < 200) return false;
  layoutChecked = now;
  const parts = [window.innerWidth, window.innerHeight, document.body.className];
  for (const id of ['brand', 'eq-panel', 'controls', 'readout', 'problems', 'btn-sheet']) {
    const el = document.getElementById(id);
    const r = el && !el.hidden ? el.getBoundingClientRect() : null;
    parts.push(r ? `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}` : '-');
  }
  const key = parts.join('|');
  if (key === layoutKey) return false;
  layoutKey = key;
  return true;
}

function draw() {
  const lab = app.lab;
  if (!lab) return;
  stage.show(lab, slice());
}

let lastFrame = 0;
function frame(now = 0) {
  const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0;
  lastFrame = now;
  if (typeof app.lab?.tick === 'function' && app.lab.tick(dt, slice(), computed)) app.dirty = true;
  const relayout = layoutChanged(now);
  if (app.dirty) {
    recompute();
    hud.update(publicState(), computed, app.lab);
    practice.afterUpdate();
  }
  if (app.dirty || relayout) draw();
  app.dirty = false;
  practice.frame();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  app.dirty = true;
});

window.__flux = {
  get state() {
    return publicState();
  },
  computed,
  app,
  practice,
  stage,
  courseId: course.id,
};

const boot = parseHash();
setExam(boot.examId, boot.labId).then(() => {
  booting = false;
  if (boot.problemId) practice.followUrl(boot.problemId, boot.seed);
  else openNotesFromRoute(hud.notes, boot);
  recompute();
  hud.update(publicState(), computed, app.lab);
  frame();
});
