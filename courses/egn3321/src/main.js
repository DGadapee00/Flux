import '@flux/shells/engineering/styles/main.css';
import '@flux/shells/engineering/styles/practice.css';
import '@flux/shells/styles/notes.css';
import 'katex/dist/katex.min.css';
import { mountTrackBar } from '@flux/core';
import { ANSWER_LAYER } from '@flux/core/scene3d/manim.js';
import * as THREE from 'three';
import { examById, examForLab } from './data/catalog.js';
import { sceneScale, setFrame, workPlane } from './engine/frame.js';
import { createChargePointer } from './engine/pointer.js';
import { neighborExam, parseHash, problemQuery, writeHash } from './engine/router.js';
import { createViewPool } from './engine/views.js';
import { loadExamLabs, loadLab } from './labs/load.js';
import { course } from './manifest.js';
import { applyExample } from './notes/setups.js';
import { applyProblem } from './problems/simbridge.js';
import { createScene } from './scene/createScene.js';
import { createHUD } from './ui/hud.js';
import { createPractice } from './ui/problems.js';

const brand = document.getElementById('brand');
mountTrackBar(brand);

const canvas = document.getElementById('c');
const { renderer, scene, camera, controls, labels, grid } = createScene(canvas);
const pool = createViewPool(scene);
const clock = new THREE.Clock();
camera.layers.enable(ANSWER_LAYER);

const ctx = { scene, camera, controls, pool, grid, clock, renderer };

const app = {
  examId: 'u1',
  labId: 'rectilinear',
  lab: null,
  handles: {},
  slices: {},
  gen: 0,
  dirty: true,
  query: '',
};

const computed = {};
let practice = null;

function slice() {
  return app.slices[app.labId] || {};
}

let loadingProblem = false;

function bump(physics = true) {
  app.dirty = true;
  if (physics && !loadingProblem) practice?.noteEdit();
  const s = app.slices[app.labId];
  if (s) s.dirty = true;
}

function publicState() {
  const s = slice();
  s.lab = app.labId;
  s.examId = app.examId;
  return s;
}

function fitForAspect(pos, target) {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const k = Math.min(3, Math.max(1, 1.25 / aspect));
  const out = target.clone().add(pos.clone().sub(target).multiplyScalar(k));
  if (aspect < 0.8) {
    const H = 2 * out.distanceTo(target) * Math.tan((camera.fov * Math.PI) / 360);
    return { pos: out.setY(out.y - 0.12 * H), target: target.clone().setY(target.y - 0.12 * H) };
  }
  return { pos: out, target };
}

let camTween = null;
controls.addEventListener('start', () => {
  camTween = null;
});

function goCamera(lab) {
  const cam = lab?.cameraFor?.(slice()) || lab?.camera;
  if (!cam) return;
  const fit = fitForAspect(cam.pos, cam.target);
  camTween = {
    t: 0,
    fromPos: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPos: fit.pos,
    toTarget: fit.target,
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

function toggleSweep() {
  const s = slice();
  if (!s.anim) return;
  s.anim.playing = !s.anim.playing;
  if (s.anim.playing) s.anim.i = 0;
  app.dirty = true;
}

let practiceBlind = false;
let workFirst = false;
function applyBlind() {
  if (practiceBlind || workFirst) camera.layers.disable(ANSWER_LAYER);
  else camera.layers.enable(ANSWER_LAYER);
  document.body.classList.toggle('work-first', workFirst);
  const b = document.getElementById('btn-work-first');
  if (b) {
    b.setAttribute('aria-pressed', String(workFirst));
    b.textContent = workFirst ? 'Reveal answers' : 'Work it first';
  }
}
function toggleWorkFirst() {
  workFirst = !workFirst;
  applyBlind();
}
document.getElementById('btn-work-first')?.addEventListener('click', toggleWorkFirst);

const sheetBtn = document.getElementById('btn-sheet');
sheetBtn?.addEventListener('click', () => {
  const on = document.body.classList.toggle('sheet-explain');
  sheetBtn.setAttribute('aria-pressed', String(on));
  sheetBtn.textContent = on ? 'Setup' : 'Explain';
});

function handleKey(e) {
  const lab = app.lab;
  if (!lab) return;
  if (e.key === 'w' || e.key === 'W') {
    toggleWorkFirst();
    return;
  }
  const action = lab.keys?.[e.key];
  if (action === 'sweep') {
    e.preventDefault();
    toggleSweep();
  }
  if (action === 'reset') resetCamera();
}

function applyFrame() {
  setFrame(null);
  grid.setScale(sceneScale());
  grid.setPlane(workPlane());
}

function setScenario(id) {
  const lab = app.lab;
  if (!lab) return;
  practice?.noteEdit();
  lab.applyScenario?.(id, slice());
  applyFrame();
  goCamera(lab);
  bump();
}

function setLabIndex(i) {
  const exam = examById(app.examId);
  const id = exam.labs[i];
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
    await setLab(id);
    return;
  }
  if (app.lab) app.lab.exit(ctx, app.handles[app.labId], slice());
  app.lab = null;
  app.labId = null;
  pool.hideAll();
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

  if (app.lab) app.lab.exit(ctx, app.handles[app.labId], slice());

  app.examId = lab.exam || exam.id;
  app.labId = labId;
  app.lab = lab;
  if (!app.handles[labId]) app.handles[labId] = lab.init(ctx);
  if (!app.slices[labId]) {
    const s = lab.defaultState();
    const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
    if (list[0]) lab.applyScenario?.(list[0].id, s);
    app.slices[labId] = s;
  }
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
      applyFrame();
      goCamera(app.lab);
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
  resetCamera,
  toggleShow,
  toggleSweep,
  handleKey,
  togglePractice: () => practice.toggle(),
  escape: () => practice.escape(),
  bump,
  slice,
  addCharge: () => {},
  deleteSelected: () => {},
  setChargeQ: () => {},
  setCoord() {
    bump();
  },
  fitView() {
    applyFrame();
    goCamera(app.lab);
    bump(false);
  },
  selectCharge(id) {
    slice().selectedId = id;
    bump(false);
  },
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
      applyFrame();
      goCamera(app.lab);
      bump(false);
    });
  },
  reframe() {
    goCamera(app.lab);
  },
});

const pointer = createChargePointer({
  camera,
  controls,
  canvas,
  getState: publicState,
  getPool: () => pool,
  getHandle: () => app.handles[app.labId],
  getLab: () => app.lab,
  bump: () => {
    app.dirty = true;
    practice?.noteEdit();
  },
});

practice = createPractice({
  openInLab: openProblemInApp,
  clearQuery({ push = false } = {}) {
    if (!app.query) return;
    app.query = '';
    writeHash(app.examId, app.labId, { replace: !push });
  },
  setSceneBlind(on) {
    practiceBlind = on;
    applyBlind();
  },
  labId: () => app.labId,
  examId: () => app.examId,
  setExam: (id) => setExam(id),
  slice,
  computed,
  labelLayer: labels.domElement,
  // A problem's notes link opens its section beside the problem.
  openNotes: (where) => hud.notes?.open(where),
});

function followUrl() {
  const { examId, labId, problemId, seed } = parseHash();
  if (practice.followUrl(problemId, seed)) return;
  if (examId === app.examId && labId === app.labId) return;
  if (labId) setLab(labId);
  else setExam(examId);
}
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

const view = { shift: 0, w: 0, h: 0 };
function stepViewShift() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  let target = 0;
  if (document.body.classList.contains('practice-open') && w > 720) {
    const left = document.getElementById('problems').getBoundingClientRect().right;
    const controlsEl = document.getElementById('controls');
    const right = controlsEl.offsetParent ? controlsEl.getBoundingClientRect().left : w;
    target = Math.max(0, Math.round((left + right) / 2 - w / 2));
  }
  const next = Math.abs(target - view.shift) < 0.5 ? target : view.shift + (target - view.shift) * 0.2;
  if (next === view.shift && w === view.w && h === view.h) return;
  view.shift = next;
  view.w = w;
  view.h = h;
  if (Math.abs(next) < 0.5) camera.clearViewOffset();
  else camera.setViewOffset(w, h, -next, 0, w, h);
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

  if (app.dirty || s.dirty || pointer.dragging || lab?.live) {
    recompute();
    syncViews();
    hud.update(publicState(), computed, lab);
    practice.afterUpdate();
    app.dirty = false;
    if (s.dirty !== undefined) s.dirty = false;
  }
  practice.frame();
  renderer.render(scene, camera);
  labels.render(scene, camera);
  requestAnimationFrame(frame);
}

window.__gauss = {
  get state() {
    return publicState();
  },
  computed,
  app,
  camera,
  controls,
  practice,
  courseId: course.id,
};

const boot = parseHash();
setExam(boot.examId, boot.labId).then(() => {
  booting = false;
  if (boot.problemId) practice.followUrl(boot.problemId, boot.seed);
  recompute();
  syncViews();
  hud.update(publicState(), computed, app.lab);
  frame();
});
