import 'katex/dist/katex.min.css';
import * as THREE from 'three';
import { createScene } from './scene/createScene.js';
import { createHUD } from './ui/hud.js';
import { applyScenario } from './data/scenarios.js';
import { EXAMS, examById, examForLab } from './data/catalog.js';
import { parseHash, writeHash, neighborExam, problemQuery } from './engine/router.js';
import { createViewPool } from './engine/views.js';
import { createChargePointer } from './engine/pointer.js';
import { loadLab, loadExamLabs } from './labs/load.js';
import { setFrame, refit, defaultView, sceneScale, workPlane, mathToWorld } from './engine/frame.js';
import { applyProblem } from './problems/simbridge.js';
import { createPractice } from './ui/problems.js';
import { ANSWER_LAYER } from './scene/manim.js';

console.info(
  `FLUX build ${__BUILD__.commit}${__BUILD__.subject ? ` — ${__BUILD__.subject}` : ''} (built ${__BUILD__.built})`,
);
window.__build = __BUILD__;

const canvas = document.getElementById('c');
const { renderer, scene, camera, controls, labels, grid } = createScene(canvas);
const pool = createViewPool(scene);
const clock = new THREE.Clock();
camera.layers.enable(ANSWER_LAYER);

const ctx = { scene, camera, controls, pool, grid, clock, renderer };

const app = {
  examId: 'ch2',
  labId: 'gradient',
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
  togglePractice: () => practice.toggle(),
  escape: () => practice.escape(),
  bump,
  slice,
  fitView: () => {
    applyFrame({ force: true });
    goCamera(app.lab);
    bump(false);
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

function toggleSweep() {
  const s = slice();
  if (!s.anim) return;
  if (s.anim.playing) {
    s.anim.playing = false;
    s.anim.i = 1e9;
  } else {
    s.anim.playing = true;
    s.anim.i = 0;
  }
  app.dirty = true;
}

function handleKey(e) {
  const lab = app.lab;
  if (!lab) return;
  const action = lab.keys[e.key];
  if (!action) return;
  if (action === 'sweep') {
    e.preventDefault();
    toggleSweep();
    return;
  }
  if (action === 'reset') {
    resetCamera();
    return;
  }
  if (lab.onAction?.(action, slice())) {
    e.preventDefault();
    app.dirty = true;
  }
}

function applyLabScenario(lab, id, s) {
  if (lab.applyScenario) lab.applyScenario(id, s);
  else applyScenario(lab.id, id, s);
  if (lab.frame) s.view = { ...(s.view || defaultView()), plane: s.view?.plane || defaultView().plane };
}

function applyFrame({ force = false } = {}) {
  const lab = app.lab;
  const s = slice();
  if (lab?.frame) {
    if (!s.view) s.view = defaultView();
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
  if (!exam) throw new Error(`no such unit: ${examId}`);
  /*
   * Load first, commit after. This used to set app.examId before awaiting the unit's labs, so a
   * dynamic import that failed left the app believing it had switched while the UI still showed the
   * old unit — and because the booted unit's labs are already in memory, its own tab would keep
   * "working" while every other tab did nothing at all.
   */
  await loadExamLabs(exam.labs);
  app.examId = exam.id;
  const id = preferredLab && exam.labs.includes(preferredLab) ? preferredLab : exam.labs[0];
  if (id) {
    await setLab(id);
  } else {
    if (app.lab) app.lab.exit(ctx, app.handles[app.labId], slice());
    app.lab = null;
    app.labId = null;
    pool.hideAll();
    hud.mount(null, exam, { examId: exam.id });
    practice?.onMount({ byProblem: loadingProblem });
    writeHash(exam.id, '', { replace: booting, query: app.query });
    app.dirty = true;
  }
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
    if (list[0]) applyLabScenario(lab, list[0].id, s);
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

practice = createPractice({
  openInLab: openProblemInApp,
  clearQuery({ push = false } = {}) {
    if (!app.query) return;
    app.query = '';
    writeHash(app.examId, app.labId, { replace: !push });
  },
  setSceneBlind(on) {
    if (on) camera.layers.disable(ANSWER_LAYER);
    else camera.layers.enable(ANSWER_LAYER);
  },
  labId: () => app.labId,
  examId: () => app.examId,
  setExam: (id) => setExam(id),
  slice,
  computed,
  labelLayer: labels.domElement,
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
  const s = slice();
  if (!lab) return;
  applyFrame();
  ctx.handle = app.handles[app.labId];
  lab.recompute(s, computed, ctx);
  computed.coach = lab.coach(s, computed);
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

  const live = !!lab?.live;
  if (app.dirty || s.dirty || pointer.dragging || live) {
    recompute();
    syncViews();
    hud.update(publicState(), computed, lab);
    practice.afterUpdate();
    app.dirty = false;
    if (s.dirty !== undefined) s.dirty = false;
  }
  if (lab?.afterFrame) lab.afterFrame(dt, s, computed, ctx);
  practice.frame();

  renderer.render(scene, camera);
  labels.render(scene, camera);
  requestAnimationFrame(frame);
}

window.__flux = {
  get state() {
    return publicState();
  },
  computed,
  app,
  camera,
  controls,
  practice,
  /** Where the probe is on screen, for the browser checks' drag tests. Null if there is no probe. */
  probeScreen() {
    const s = slice();
    if (!s?.probe) return null;
    const w = mathToWorld(s.probe.x, s.probe.y, s.probe.z, sceneScale());
    const v = new THREE.Vector3(w.x, w.y, w.z).project(camera);
    if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) return null;
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
  },
};
window.__gauss = window.__flux;

const boot = parseHash();
setExam(boot.examId, boot.labId).then(() => {
  booting = false;
  if (boot.problemId) practice.followUrl(boot.problemId, boot.seed);
  recompute();
  syncViews();
  hud.update(publicState(), computed, app.lab);
  frame();
});
