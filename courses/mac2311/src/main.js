import '@flux/shells/math/styles/main.css';
import '@flux/shells/math/styles/practice.css';
import '@flux/shells/math/styles/mobile.css';
import '@flux/shells/math/styles/notes.css';
import 'katex/dist/katex.min.css';
import { mountTrackBar } from '@flux/core';
import * as THREE from 'three';
import { createScene } from './scene/createScene.js';
import { createHUD } from './ui/hud.js';
import { examById, examForLab } from './data/catalog.js';
import { parseHash, writeHash, neighborExam, problemQuery } from './engine/router.js';
import { loadLab, loadExamLabs } from './labs/load.js';
import { setFrame, refit, defaultView, sceneScale, workPlane, mathToWorld } from './engine/frame.js';
import { applyExample } from './notes/setups.js';
import { applyProblem } from './problems/simbridge.js';
import { createPractice } from './ui/problems.js';
import { ANSWER_LAYER } from '@flux/core/scene3d/manim.js';

console.info(
  `FLUX build ${__BUILD__.commit}${__BUILD__.subject ? ` — ${__BUILD__.subject}` : ''} (built ${__BUILD__.built})`,
);
window.__build = __BUILD__;

const brand = document.getElementById('brand');
mountTrackBar(brand);

const canvas = document.getElementById('c');
const { renderer, scene, camera, controls, labels, grid } = createScene(canvas);
const clock = new THREE.Clock();
camera.layers.enable(ANSWER_LAYER);

const ctx = { scene, camera, controls, grid, clock, renderer };

const app = {
  examId: 'u2',
  labId: 'secant',
  lab: null,
  handles: {},
  slices: {},
  gen: 0,
  dirty: true,
  query: '',
};

const computed = {};
let practice = null;
let loadingProblem = false;
let booting = true;

function slice() {
  return app.slices[app.labId] || {};
}

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

const hud = createHUD({
  setLab,
  setExam,
  setScenario,
  setLabIndex,
  shiftExam,
  resetCamera,
  toggleShow,
  toggleSweep() {},
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
      applyFrame({ force: true });
      goCamera(app.lab);
      bump(false);
    });
  },
  reframe() {
    goCamera(app.lab);
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
  const action = lab.keys?.[e.key];
  if (action === 'reset') resetCamera();
}

function applyFrame({ force = false } = {}) {
  const lab = app.lab;
  const s = slice();
  if (lab?.frame) {
    if (!s.view) s.view = defaultView('xy');
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
  lab.applyScenario?.(id, slice());
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
  await loadExamLabs(exam.labs);
  app.examId = exam.id;
  const id = preferredLab && exam.labs.includes(preferredLab) ? preferredLab : exam.labs[0];
  if (id) {
    await setLab(id);
    return;
  }
  if (app.lab) app.lab.exit(ctx, app.handles[app.labId], slice());
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

async function openProblemInApp(inst, { push = true, query = true } = {}) {
  const tpl = inst.tpl;
  app.query = query ? problemQuery(tpl.id, inst.seed) : '';
  loadingProblem = true;
  try {
    if (tpl.lab) await setLab(tpl.lab);
    else if (app.examId !== tpl.exam) await setExam(tpl.exam);
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
  if (!lab) {
    grid.visible = true;
    return;
  }
  ctx.handle = app.handles[app.labId];
  lab.syncViews(slice(), computed, ctx);
}

function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  stepCamera(dt);
  controls.update();
  const lab = app.lab;
  const s = slice();
  if (app.dirty || s.dirty) {
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

window.__flux = {
  get state() {
    return publicState();
  },
  computed,
  app,
  camera,
  controls,
  practice,
  probeScreen() {
    const s = slice();
    if (!s?.probe) return null;
    const w = mathToWorld(s.probe.x, s.probe.y, s.probe.z || 0, sceneScale());
    const v = new THREE.Vector3(w.x, w.y, w.z).project(camera);
    if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) return null;
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
  },
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
