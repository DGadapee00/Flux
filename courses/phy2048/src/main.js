// Before KaTeX's CSS, as the stylesheet links were before it: the cascade order is unchanged.
import '@flux/shells/physics/styles/main.css';
import '@flux/shells/physics/styles/practice.css';
import '@flux/shells/physics/styles/mobile.css';
import './styles/labs.css';
import 'katex/dist/katex.min.css';
import { mountTrackBar } from '@flux/core';
import * as THREE from 'three';
import { renderChrome } from '@flux/shells/physics/chrome.js';
import { createScene } from '@flux/core/scene3d/createScene.js';
import { defaultView, refit, sceneScale, setFrame, workPlane } from '@flux/core/scene3d/frame.js';
import './engine/frame.js';
import { EXAMS, examById, examForLab } from './catalog.js';
import { parseHash, neighborExam, problemQuery, writeHash } from './engine/router.js';
import { createLabPointer } from './engine/pointer.js';
import { createViewPool } from './engine/views.js';
import { sectionForLab } from './notes/index.js';
import { applyExample } from './notes/setups.js';
import { applyProblem } from './problems/simbridge.js';
import { loadExamLabs, loadLab } from './labs/load.js';
import { course } from './manifest.js';
import { createHUD } from './ui/hud.js';
import { createNotes } from './ui/notes.js';
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
let notes = null;
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
  toggleSweep,
  handleKey,
  userEdit: () => {
    practice?.noteEdit();
    markCustom();
  },
  togglePractice: () => {
    units?.close(); // they share the left column
    // Notes can sit over the practice sheet; P goes back to it rather than closing it.
    if (notes?.isOpen()) {
      notes.close();
      if (!practice.isOpen()) practice.open();
      return;
    }
    practice.toggle();
  },
  toggleUnits: () => units.toggle(),
  toggleNotes: () => {
    units?.close();
    notes.toggle();
  },
  escape: () => {
    if (notes?.isOpen()) notes.close();
    else practice.escape();
  },
  bump,
  slice,
  fitView: () => {
    applyFrame({ force: true });
    bump(false);
  },
});

const pointer = createLabPointer({
  canvas,
  camera,
  controls,
  getLab: () => app.lab,
  getHandle: () => app.handles[app.labId],
  getState: publicState,
  bump: () => {
    app.dirty = true;
    practice?.noteEdit();
    markCustom();
  },
});

let camTween = null;
controls.addEventListener('start', () => {
  camTween = null;
});

const TAN_HALF = Math.tan((camera.fov / 2) * (Math.PI / 180));
const shown = (el) => !!el && el.offsetParent !== null && !el.hidden && getComputedStyle(el).display !== 'none';
const PHONE_MAX = 720;

/**
 * The part of the canvas no panel covers, as an aspect (width over canvas height) and the share of
 * the canvas height it has. On a laptop that is the strip between the left panels and Setup. On a
 * phone it is the band between the top bars and the bottom sheet.
 */
function freeSpace() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w <= PHONE_MAX) {
    const top = shown($id('toggles')) ? $id('toggles').getBoundingClientRect().bottom : $id('brand').getBoundingClientRect().bottom;
    let bottom = h;
    for (const id of ['controls', 'eq-panel', 'problems', 'units-ref', 'notes']) {
      const el = $id(id);
      if (shown(el)) bottom = Math.min(bottom, el.getBoundingClientRect().top);
    }
    const strip = Math.max(120, bottom - top);
    return { left: 0, right: w, top, bottom: top + strip, aspect: w / h, hfrac: strip / h };
  }
  let left = 0;
  for (const id of ['eq-panel', 'problems', 'units-ref', 'notes']) {
    const el = $id(id);
    if (shown(el)) left = Math.max(left, el.getBoundingClientRect().right);
  }
  const controlsEl = $id('controls');
  const right = shown(controlsEl) ? controlsEl.getBoundingClientRect().left : w;
  const free = Math.max(1, right - left);
  return { left, right: Math.max(left + 1, right), top: 0, bottom: h, aspect: free / h, hfrac: 1 };
}

/**
 * A lab that says how big its drawing is (`fit: { w, h }`, in scene units) is framed so that drawing
 * fills the free space: the camera backs off along its own line of sight until both sides fit.
 */
function fitCamera(lab, cam) {
  if (!lab?.fit) return cam;
  const free = freeSpace();
  const need = Math.max((lab.fit.w * 1.05) / (2 * TAN_HALF * free.aspect), (lab.fit.h * 1.05) / (2 * TAN_HALF * free.hfrac));
  const away = cam.pos.clone().sub(cam.target);
  return { pos: cam.target.clone().add(away.setLength(Math.max(need, 4.5))), target: cam.target };
}

function goCamera(lab) {
  let cam = lab?.cameraFor?.(slice()) || lab?.camera;
  if (!cam) return;
  cam = fitCamera(lab, cam);
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
  controls.maxDistance = 90;
}

function toggleShow(key) {
  const s = slice();
  if (!s.show) s.show = {};
  s.show[key] = !s.show[key];
  app.dirty = true;
}

function toggleSweep() {
  const s = slice();
  if (!s.anim) return;
  s.anim.playing = !s.anim.playing;
  app.dirty = true;
}

function handleKey(e) {
  const lab = app.lab;
  if (!lab) return;
  const action = lab.keys[e.key];
  if (action === 'sweep') {
    e.preventDefault();
    toggleSweep();
  }
  if (action === 'reset') resetCamera();
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
  afterMount();
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
  afterMount();
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
    let note = '';
    if (tpl.lab && app.lab?.id === tpl.lab && tpl.sim) {
      note = applyProblem(app.lab, slice(), inst);
      slice().custom = false;
      applyFrame();
      goCamera(app.lab);
      bump();
    } else if (tpl.lab && app.lab?.id === tpl.lab && slice().problemId) {
      // This problem only opens its lab, which still holds the last problem's setup, and its numbers
      // may be that problem's answer. Start the lab over from its defaults.
      const fresh = freshSlice(app.lab);
      fresh.lab = app.lab.id;
      app.slices[app.lab.id] = fresh;
      hud.mount(app.lab, examById(app.examId), fresh);
      applyFrame({ force: true });
      goCamera(app.lab);
      bump();
    }
    writeHash(app.examId, app.labId, { replace: !push, query: app.query });
    return note;
  } finally {
    loadingProblem = false;
  }
}

units = createUnits({
  // One overlay at a time: they share the left column.
  onOpen: () => {
    practice?.close?.();
    notes?.close?.();
  },
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
  openNotes: (o) => notes.open(o),
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

/*
 * Notes (src/ui/notes.js): the unit's notes, read beside the lab each section describes.
 * Notes, Practice and Explore are the three modes in the header's switch.
 */
notes = createNotes({
  examId: () => app.examId,
  showLab: (labId, examId) => {
    if (app.labId !== labId) setLab(labId, { examId });
  },
  explore: (labId, examId) => {
    practice.close();
    setLab(labId, { examId });
  },
  practiceChapter: (examId, ch) => practice.showChapter(ch, examId),
  // "Show this in the lab" on a worked example: the example's own numbers, loaded like a problem's.
  setupExample: async (examId, ex) => {
    if (app.lab?.id !== ex.lab) await setLab(ex.lab, { examId });
    if (app.lab?.id !== ex.lab) return;
    applyExample(app.lab, slice(), ex);
    applyFrame({ force: true });
    goCamera(app.lab);
    bump();
  },
  stepThrough: async () => {},
  // The notes were resized: frame the lab again in whatever space is left.
  reframe: () => goCamera(app.lab),
});

/** The header's switch shows the mode on screen: Notes over Practice over Explore. */
const modeButtons = { practice: $id('btn-practice'), notes: $id('btn-notes'), explore: $id('btn-explore') };
function syncModeSwitch() {
  const cls = document.body.classList;
  const mode = cls.contains('notes-open') ? 'notes' : cls.contains('practice-open') ? 'practice' : 'explore';
  for (const [k, b] of Object.entries(modeButtons)) {
    if (!b) continue;
    b.classList.toggle('active', k === mode);
    b.setAttribute('aria-selected', k === mode ? 'true' : 'false');
  }
}
// When a panel opens or closes, the free space changes: frame the lab into what is left, once the panel has settled.
let lastMode = '';
new MutationObserver(() => {
  syncModeSwitch();
  const cls = document.body.classList;
  const mode = `${cls.contains('notes-open')}${cls.contains('practice-open')}${cls.contains('units-open')}`;
  if (mode === lastMode) return;
  lastMode = mode;
  setTimeout(() => goCamera(app.lab), 320);
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });
modeButtons.practice?.addEventListener('click', () => {
  units.close();
  notes.close();
  if (!practice.isOpen()) practice.open();
});
modeButtons.notes?.addEventListener('click', () => {
  units.close();
  if (!notes.isOpen()) notes.resume(app.examId);
});
modeButtons.explore?.addEventListener('click', () => {
  units.close();
  notes.close();
  practice.close();
});

/** After a lab or unit mounts: the notes follow the unit, and the lab links to its section. */
function afterMount() {
  notes?.onExam(app.examId);
  const link = $id('eq-notes');
  if (!link) return;
  const hit = app.labId ? sectionForLab(app.labId, app.examId) : null;
  link.hidden = !hit;
  if (hit) {
    link.textContent = `Notes §${hit.section.n} · ${hit.section.title} →`;
    link.onclick = () => notes.open({ examId: hit.set.exam, section: hit.section.id });
  }
}

function followUrl() {
  const { examId, labId, problemId, seed } = parseHash();
  if (practice.followUrl(problemId, seed)) return;
  if (examId === app.examId && labId === app.labId) return;
  if (labId) setLab(labId, { examId });
  else setExam(examId);
}
// Typed / bookmarked hashes fire hashchange; Back / Forward over pushState entries fire popstate.
window.addEventListener('resize', () => goCamera(app.lab));
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
 * The picture is centred in the free space, not the window: a projection offset moves it sideways
 * past the left panels on a laptop, and up into the band above the bottom sheet on a phone. Orbit
 * and labels follow the offset.
 */
const view = { shift: 0, lift: 0, w: 0, h: 0 };
function stepViewShift() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const free = freeSpace();
  const targetShift = w > PHONE_MAX ? Math.round((free.left + free.right) / 2 - w / 2) : 0;
  const targetLift = w > PHONE_MAX ? 0 : Math.round(h / 2 - (free.top + free.bottom) / 2);
  const ease = (from, to) => (Math.abs(to - from) < 0.5 ? to : from + (to - from) * 0.2);
  const next = ease(view.shift, targetShift);
  const nextLift = ease(view.lift, targetLift);
  if (next === view.shift && nextLift === view.lift && w === view.w && h === view.h) return;
  Object.assign(view, { shift: next, lift: nextLift, w, h });
  if (Math.abs(next) < 0.5 && Math.abs(nextLift) < 0.5) {
    if (camera.view?.enabled) camera.clearViewOffset();
  } else camera.setViewOffset(w, h, -next, nextLift, w, h);
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

  if (app.dirty || s.dirty || pointer.dragging || !!lab?.live) {
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
// `#/phy2048/u1/vectors?n=s4` opens the notes at a section. Read now: booting rewrites the hash.
const bootNotes = new URLSearchParams(location.hash.split('?')[1] || '').get('n');
// No link at all: a student opening the app. Practice is the front door.
const bare = !location.hash.replace(/^#\/?/, '');
setExam(boot.examId, boot.labId).then(() => {
  booting = false;
  if (boot.problemId) practice.followUrl(boot.problemId, boot.seed);
  else if (bare) practice.open();
  if (bootNotes && !boot.problemId) notes.open({ examId: app.examId, section: bootNotes });
  syncModeSwitch();
  recompute();
  syncViews();
  hud.update(publicState(), computed, app.lab);
  frame();
});
