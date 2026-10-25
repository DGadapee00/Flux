// Before KaTeX's CSS, as the stylesheet links were before it: the cascade order is unchanged.
import '@flux/shells/physics/styles/main.css';
import '@flux/shells/physics/styles/practice.css';
import '@flux/shells/physics/styles/mobile.css';
import 'katex/dist/katex.min.css';
import { mountTrackBar } from '@flux/core';
import * as THREE from 'three';
import { renderChrome } from '@flux/shells/physics/chrome.js';
import { createScene } from '@flux/core/scene3d/createScene.js';
import { defaultView, refit, sceneScale, setFrame, workPlane } from '@flux/core/scene3d/frame.js';
import './engine/frame.js';
import { EXAMS, examById, examForLab } from './catalog.js';
import { parseHash, neighborExam, problemQuery, writeHash } from './engine/router.js';
import { createViewPool } from './engine/views.js';
import { loadExamLabs, loadLab } from './labs/load.js';
import { course } from './manifest.js';
import { createHUD } from './ui/hud.js';
import { createPredict } from './ui/predict.js';
import { createPractice } from './ui/problems.js';
import { createUnits } from './ui/units.js';

console.info(`FLUX ${course.code}`);

// The page's panels, before anything reads an element by id.
renderChrome(document.getElementById('app'), {
  code: course.code,
  setupHint: 'Move a slider. The numbers follow.',
  unitName: 'Unit',
});

// Notes arrive with each unit (docs/course-plans/phy2048.md); until then the mode is not offered.
const notesButton = document.getElementById('btn-notes');
if (notesButton) notesButton.hidden = true;

mountTrackBar(document.getElementById('brand'));

const $id = (id) => document.getElementById(id);
const canvas = $id('c');
const { renderer, scene, camera, controls, labels, grid } = createScene(canvas);
const pool = createViewPool(scene);
const clock = new THREE.Clock();
const ctx = { scene, camera, controls, pool, grid, clock, renderer };

const app = {
  examId: EXAMS[0].id,
  labId: null,
  lab: null,
  handles: {},
  slices: {},
  gen: 0,
  dirty: true,
  /** '?p=…&s=…' while a practice problem is open, so the URL reopens it. */
  query: '',
};

const computed = {};
/** Practice panel (src/ui/problems.js); created once the lab-switching functions exist. */
let practice = null;
let units = null;
let loadingProblem = false;
let booting = true;

function slice() {
  return app.slices[app.labId] || {};
}

/** The student changed the setup by hand: it no longer matches a preset or a problem. */
function markCustom() {
  const s = app.slices[app.labId];
  if (s && !loadingProblem) s.custom = true;
}

function bump(physics = true) {
  app.dirty = true;
  if (physics && !loadingProblem) {
    practice?.noteEdit();
    markCustom();
  }
  const s = app.slices[app.labId];
  if (s) {
    s.dirty = true;
    if (physics && s.anim) s.anim.playing = false;
  }
}

function publicState() {
  const s = slice();
  s.lab = app.labId;
  s.examId = app.examId;
  return s;
}

const hud = createHUD({
  setLab,
  setExam,
  setScenario,
  setLabIndex,
  shiftExam,
  resetCamera,
  toggleShow,
  toggleSweep: () => {},
  handleKey,
  userEdit: () => {
    practice?.noteEdit();
    markCustom();
  },
  togglePractice: () => {
    units?.close(); // they share the left column
    practice.toggle();
  },
  toggleUnits: () => units.toggle(),
  toggleNotes: () => {},
  escape: () => practice.escape(),
  bump,
  slice,
  fitView: () => {
    applyFrame({ force: true });
    bump(false);
  },
});

let camTween = null;
controls.addEventListener('start', () => {
  camTween = null;
});

function goCamera(lab) {
  const cam = lab?.cameraFor?.(slice()) || lab?.camera;
  if (!cam) return;
  camTween = {
    t: 0,
    fromPos: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPos: cam.pos,
    toTarget: cam.target,
  };
}

function stepCamera(dt) {
  if (!camTween) return;
  camTween.t = Math.min(1, camTween.t + dt / 0.9);
  const t = camTween.t;
  const k = t * t * t * (t * (6 * t - 15) + 10);
  camera.position.lerpVectors(camTween.fromPos, camTween.toPos, k);
  controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, k);
  if (t >= 1) camTween = null;
}

function resetCamera() {
  goCamera(app.lab);
}

function setOrbit(on) {
  controls.enableRotate = on !== false;
}

function toggleShow(key) {
  const s = slice();
  if (!s.show) s.show = {};
  s.show[key] = !s.show[key];
  app.dirty = true;
}

function handleKey(e) {
  const lab = app.lab;
  if (!lab) return;
  if (lab.keys[e.key] === 'reset') resetCamera();
}

function applyLabScenario(lab, id, s) {
  lab.applyScenario(id, s);
  // A preset replaces whatever was there: it is neither a hand-edited setup nor a problem's.
  s.custom = false;
  s.answerScreen = false;
  delete s.problemId;
  if (lab.frame) s.view = defaultView();
}

/** Push the active lab's view into the scene, refitting when the content has outgrown the frame. */
function applyFrame({ force = false } = {}) {
  const lab = app.lab;
  const s = slice();
  if (lab?.frame) {
    s.view = refit(s, { force, extent: lab.extent?.(s) });
    setFrame(s.view);
  } else {
    setFrame(null);
  }
  grid.setScale(sceneScale());
  grid.setPlane(workPlane());
}

function setScenario(id) {
  const lab = app.lab;
  if (!lab) return;
  practice?.noteEdit();
  applyLabScenario(lab, id, slice());
  applyFrame({ force: true });
  goCamera(lab);
  bump();
  slice().custom = false;
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
  if (id) {
    await setLab(id, { examId: exam.id });
    return;
  }
  // A unit with no lab built yet: its problems still work.
  if (app.lab) app.lab.exit(ctx, app.handles[app.labId], slice());
  app.lab = null;
  app.labId = null;
  pool.hideAll();
  hud.mount(null, exam, { examId: exam.id });
  practice?.onMount({ byProblem: loadingProblem });
  writeHash(exam.id, '', { replace: booting, query: app.query });
  app.dirty = true;
}

/** Switch to a lab, under the unit already showing when that unit lists it. */
async function setLab(labId, { examId = app.examId } = {}) {
  if (!labId) return;
  const listed = examId && examById(examId).labs.includes(labId);
  const exam = listed ? examById(examId) : examForLab(labId);
  if (app.labId === labId && app.lab && app.examId === exam.id) return;
  const my = ++app.gen;
  await loadExamLabs(exam.labs);
  const lab = await loadLab(labId);
  if (!lab || my !== app.gen) return;

  if (app.lab) app.lab.exit(ctx, app.handles[app.labId], slice());

  app.examId = exam.id;
  app.labId = labId;
  app.lab = lab;
  units?.onLab(labId);
  if (!app.handles[labId]) app.handles[labId] = lab.init(ctx);
  if (!app.slices[labId]) app.slices[labId] = freshSlice(lab);
  const s = app.slices[labId];
  s.lab = labId;
  applyFrame();
  lab.enter(ctx, app.handles[labId], s);
  setOrbit(lab.orbit);
  goCamera(lab);
  hud.mount(lab, examById(app.examId), s);
  practice?.onMount({ byProblem: loadingProblem });
  writeHash(app.examId, labId, { replace: booting, query: app.query });
  app.dirty = true;
}

/** A lab's state as it first opens: its defaults with its first scenario applied. */
function freshSlice(lab) {
  const s = lab.defaultState();
  const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
  if (list[0]) applyLabScenario(lab, list[0].id, s);
  return s;
}

/** Put the app into a problem's unit. The bank's problems carry no lab setup yet. */
async function openProblemInApp(inst, { push = true, query = true } = {}) {
  const tpl = inst.tpl;
  app.query = query ? problemQuery(tpl.id, inst.seed) : '';
  loadingProblem = true;
  try {
    if (tpl.lab) {
      await setLab(tpl.lab, { examId: tpl.exam });
      if (app.lab?.id !== tpl.lab) await setLab(tpl.lab, { examId: tpl.exam });
    } else if (app.examId !== tpl.exam) await setExam(tpl.exam);
    writeHash(app.examId, app.labId, { replace: !push, query: app.query });
    return '';
  } finally {
    loadingProblem = false;
  }
}

units = createUnits({
  // One overlay at a time: they share the left column.
  onOpen: () => practice?.close?.(),
});

practice = createPractice({
  openInLab: openProblemInApp,
  clearQuery({ push = false } = {}) {
    if (!app.query) return;
    app.query = '';
    writeHash(app.examId, app.labId, { replace: !push });
  },
  /** Blind mode: the lab's own numbers are veiled by the panel; there are no answer arrows yet. */
  setSceneBlind(on) {
    hud.setBlind(on);
  },
  labId: () => app.labId,
  examId: () => app.examId,
  setExam: (id) => setExam(id),
  openNotes: () => {},
  slice,
  computed,
  labelLayer: labels.domElement,
});

// Predict first (src/ui/predict.js): a card under the lab's Setup controls.
const predict = createPredict({
  lab: () => app.lab,
  labId: () => app.labId,
  slice: () => app.slices[app.labId] || null,
  bump,
  setScenario,
  practiceActive: () => !!practice.current(),
});

/** The header's switch shows the mode on screen. Notes are not offered yet. */
const modeButtons = { practice: $id('btn-practice'), explore: $id('btn-explore') };
function syncModeSwitch() {
  const mode = document.body.classList.contains('practice-open') ? 'practice' : 'explore';
  for (const [k, b] of Object.entries(modeButtons)) {
    if (!b) continue;
    b.classList.toggle('active', k === mode);
    b.setAttribute('aria-selected', k === mode ? 'true' : 'false');
  }
}
new MutationObserver(syncModeSwitch).observe(document.body, { attributes: true, attributeFilter: ['class'] });
modeButtons.practice?.addEventListener('click', () => {
  units.close();
  if (!practice.isOpen()) practice.open();
});
modeButtons.explore?.addEventListener('click', () => {
  units.close();
  practice.close();
});

function followUrl() {
  const { examId, labId, problemId, seed } = parseHash();
  if (practice.followUrl(problemId, seed)) return;
  if (examId === app.examId && labId === app.labId) return;
  if (labId) setLab(labId, { examId });
  else setExam(examId);
}
// Typed / bookmarked hashes fire hashchange; Back / Forward over pushState entries fire popstate.
window.addEventListener('hashchange', followUrl);
window.addEventListener('popstate', followUrl);

function recompute() {
  const lab = app.lab;
  if (!lab) return;
  applyFrame();
  ctx.handle = app.handles[app.labId];
  lab.recompute(slice(), computed, ctx);
  computed.coach = lab.coach(slice(), computed);
}

function syncViews() {
  const lab = app.lab;
  pool.hideAll();
  if (!lab) {
    grid.visible = true;
    return;
  }
  ctx.handle = app.handles[app.labId];
  lab.syncViews(slice(), computed, ctx);
}

/**
 * The scene is framed into the free space between the panels, not the window: on a wide screen the
 * picture slides to the middle of that space (a projection offset: orbit and labels follow).
 */
const view = { shift: 0, w: 0, h: 0 };
const shown = (el) => !!el && el.offsetParent !== null && !el.hidden && getComputedStyle(el).display !== 'none';
function stepViewShift() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  let left = 0;
  let right = w;
  if (w > 720) {
    for (const id of ['eq-panel', 'problems', 'units-ref']) {
      const el = $id(id);
      if (shown(el)) left = Math.max(left, el.getBoundingClientRect().right);
    }
    const controlsEl = $id('controls');
    if (shown(controlsEl)) right = controlsEl.getBoundingClientRect().left;
  }
  const target = w > 720 ? Math.round((left + Math.max(left + 1, right)) / 2 - w / 2) : 0;
  const next = Math.abs(target - view.shift) < 0.5 ? target : view.shift + (target - view.shift) * 0.2;
  if (next === view.shift && w === view.w && h === view.h) return;
  view.shift = next;
  view.w = w;
  view.h = h;
  if (Math.abs(next) < 0.5) {
    if (camera.view?.enabled) camera.clearViewOffset();
  } else camera.setViewOffset(w, h, -next, 0, w, h);
}

function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  stepCamera(dt);
  stepViewShift();
  controls.update();

  const lab = app.lab;
  const s = slice();
  if (lab?.tick && s.anim) {
    if (lab.tick(dt, s, computed, ctx)) app.dirty = true;
  }

  if (app.dirty || s.dirty || !!lab?.live) {
    recompute();
    syncViews();
    hud.update(publicState(), computed, lab);
    practice.afterUpdate();
    app.dirty = false;
    if (s.dirty !== undefined) s.dirty = false;
  }
  practice.frame();
  predict.sync();

  renderer.render(scene, camera);
  labels.render(scene, camera);
  requestAnimationFrame(frame);
}

window.__phy2048 = {
  get state() {
    return publicState();
  },
  computed,
  app,
  camera,
  controls,
  practice,
  predict,
};

const boot = parseHash();
// No link at all: a student opening the app. Practice is the front door.
const bare = !location.hash.replace(/^#\/?/, '');
setExam(boot.examId, boot.labId).then(() => {
  booting = false;
  if (boot.problemId) practice.followUrl(boot.problemId, boot.seed);
  else if (bare) practice.open();
  syncModeSwitch();
  recompute();
  syncViews();
  hud.update(publicState(), computed, app.lab);
  frame();
});
