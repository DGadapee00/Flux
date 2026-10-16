import assert from 'node:assert/strict';
import test from 'node:test';
import { defineCourse, defineLab } from '@flux/core';
import { setup } from '@flux/core/plot2d/plot.js';
import { createHUD } from '../engineering/hud.js';
import { createHUD as createMathHUD } from '../math/hud.js';
import { createStage } from '../engineering/stage.js';
import { installDOM } from './dom.js';

const NOTES_HTML = `<header class="top">
  <div class="eyebrow">Fixture · Unit 1</div>
  <h1>Motion of a point</h1>
  <p class="lede">Velocity is the slope of position.</p>
</header>
<main>
  <section class="topic" id="s1">
    <h2><span class="n">1</span>Area under the graph</h2>
    <p>The area under velocity is the change in position.</p>
  </section>
</main>`;

function page() {
  installDOM();
  document.body.innerHTML = `
    <div id="app">
      <canvas id="c"></canvas>
      <header id="brand" class="hud panel brand">
        <h1 id="mark">TRUSS</h1>
        <p id="brand-sub"></p>
        <nav id="track-row"></nav>
        <select id="exam-select"></select>
        <nav id="lab-tabs"></nav>
        <div class="practice-row">
          <button id="btn-practice" type="button">Practice</button>
          <span id="practice-stat"></span>
        </div>
      </header>
      <div id="law-line"></div>
      <div id="eq-live"></div>
      <div id="insight-title"></div>
      <div id="insight-body"></div>
      <canvas id="mini-plot"></canvas>
      <div id="readout"></div>
      <div id="toggle-host"></div>
      <button id="btn-reset-cam" type="button"></button>
      <div id="setup-hint"></div>
      <div id="hint-action"></div>
      <span id="hint-orbit"></span>
      <span id="hint-plane"></span>
      <label><select id="scenario"></select></label>
      <div id="lab-controls"></div>
      <div id="legend-host"></div>
    </div>`;
}

function api(extra = {}) {
  return {
    setExam() {},
    setLab() {},
    setScenario() {},
    resetCamera() {},
    toggleShow() {},
    togglePractice() {},
    escape() {},
    shiftExam() {},
    setLabIndex() {},
    handleKey() {},
    examId: () => 'u1',
    explore() {},
    ...extra,
  };
}

const catalog = {
  exams: [{ id: 'u1', n: 1, title: 'Motion of a point', chapters: '12', labs: ['diagram'], coming: [] }],
  examById: (id) => catalog.exams.find((exam) => exam.id === id),
  labMeta: { diagram: { title: 'Diagram' } },
  code: 'FIX 1000',
  title: 'Fixture',
  courseId: 'fixture',
  homeId: 'u1',
};

function key(name) {
  window.dispatchEvent({
    type: 'keydown',
    key: name,
    target: document.body,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
  });
}

test('a course with no notes keeps the practice button where it was', () => {
  page();
  const calls = { key: 0, escape: 0 };
  const hud = createHUD(
    api({
      handleKey() {
        calls.key += 1;
      },
      escape() {
        calls.escape += 1;
      },
    }),
    catalog,
  );
  assert.equal(hud.notes, null);
  assert.equal(document.getElementById('btn-notes'), null);
  assert.equal(document.getElementById('notes'), null);
  assert.equal(document.querySelector('.mode-tabs'), null);
  const practice = document.getElementById('btn-practice');
  assert.equal(practice.parentNode.className, 'practice-row');
  assert.equal(practice.parentNode.childNodes.filter((node) => node.nodeType === 1).length, 2);

  hud.mount(null, catalog.exams[0], { examId: 'u1' });
  assert.equal(document.getElementById('mark').textContent, 'FLUX');
  assert.equal(document.getElementById('brand-sub').textContent, 'FIX 1000 · Fixture');
  const select = document.getElementById('exam-select');
  assert.equal(select.value, 'u1');
  assert.equal(select.querySelector('option').textContent, 'Unit 1 · Motion of a point');
  key('n');
  key('Escape');
  assert.equal(calls.key, 1);
  assert.equal(calls.escape, 1);
  assert.equal(document.body.classList.contains('notes-open'), false);
});

test('a fixture course with notes opens them beside the lab', async () => {
  page();
  const manifest = defineCourse({
    id: 'fixture',
    code: 'FIX 1000',
    title: 'Fixture',
    subject: 'mechanics',
    term: 'test',
    units: [{ id: 'u1', title: 'Motion of a point', chapters: ['12'], date: null, labs: ['diagram'] }],
    chapters: { 12: 'Kinematics' },
    labs: async () => ({}),
    problems: async () => ({}),
    notes: async () => NOTES_HTML,
  });
  assert.equal(typeof manifest.notes, 'function');

  const bag = new Map();
  const store = {
    getItem: (k) => (bag.has(k) ? bag.get(k) : null),
    setItem: (k, v) => {
      if (v == null) bag.delete(k);
      else bag.set(k, String(v));
    },
  };
  const set = {
    exam: 'u1',
    title: 'Motion of a point',
    chapters: '12',
    load: manifest.notes,
    sections: [{ id: 's1', n: '1', title: 'Area under the graph', lab: 'diagram', ch: [] }],
  };
  const seen = { explore: null, escape: 0 };
  const hud = createHUD(
    api({
      explore(labId, examId) {
        seen.explore = [labId, examId];
      },
      escape() {
        seen.escape += 1;
      },
    }),
    {
      ...catalog,
      notes: {
        notesForExam: () => set,
        allNotes: () => [set],
        setupsFor: () => [],
        matchExamples: () => [],
        DERIVATIONS: [],
        LAB_META: catalog.labMeta,
        examById: catalog.examById,
        examLabel: (exam) => `Unit ${exam.n}`,
        CHAPTER_TITLES: {},
        countFor: () => 0,
        esc: (value) => String(value),
        store,
      },
    },
  );

  const practice = document.getElementById('btn-practice');
  assert.equal(practice.parentNode.className, 'mode-tabs');
  const btn = document.getElementById('btn-notes');
  assert.equal(btn.textContent.includes('Notes'), true);
  assert.equal(document.getElementById('notes').hidden, true);

  key('n');
  await new Promise((resolve) => setTimeout(resolve, 30));
  const panel = document.getElementById('notes');
  assert.equal(hud.notes.isOpen(), true);
  assert.equal(panel.hidden, false);
  assert.equal(document.body.classList.contains('notes-open'), true);
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  assert.equal(panel.textContent.includes('Motion of a point'), true);
  assert.equal(panel.textContent.includes('Area under the graph'), true);
  assert.equal(panel.textContent.includes('See it in the Diagram lab'), true);

  panel.querySelector('.nt-lab').click();
  assert.deepEqual(seen.explore, ['diagram', 'u1']);
  assert.equal(hud.notes.isOpen(), false);
  assert.equal(seen.escape, 0);

  key('n');
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(hud.notes.isOpen(), true);
  key('Escape');
  assert.equal(hud.notes.isOpen(), false);
  assert.equal(seen.escape, 0);
  key('Escape');
  assert.equal(seen.escape, 1);
});

test('the wordmark is FLUX, the course code, and the title', () => {
  page();
  createHUD(api(), { ...catalog, code: 'EGN 3321', title: 'Dynamics', courseId: 'egn3321' });
  assert.equal(document.getElementById('mark').textContent, 'FLUX');
  assert.equal(document.getElementById('mark').classList.contains('wordmark-long'), false);
  assert.equal(document.getElementById('brand-sub').textContent, 'EGN 3321 · Dynamics');
  assert.equal(document.title, 'FLUX — EGN 3321');
});

test('a plot2d lab takes the three.js canvas down and draws on the plot canvas', () => {
  page();
  const canvas3d = document.getElementById('c');
  const stage = createStage(canvas3d);
  const scene = defineLab({ id: 'body', kind: 'scene3d' });
  assert.equal(stage.show(scene, {}, () => 0).kind, 'scene3d');
  assert.equal(canvas3d.hidden, false);
  assert.equal(stage.plot.hidden, true);
  assert.equal(canvas3d.nextSibling, stage.plot);

  const diagram = defineLab({
    id: 'diagram',
    kind: 'plot2d',
    compute(state, rng) {
      return { y: state.x + rng() };
    },
    draw(canvas, _state, result) {
      const { ctx, w } = setup(canvas);
      ctx.fillRect(0, 0, w, result.y);
      canvas.drew = result.y;
    },
  });
  const shown = stage.show(diagram, { x: 2 }, () => 0.25);
  assert.equal(shown.kind, 'plot2d');
  assert.equal(shown.result.y, 2.25);
  assert.equal(canvas3d.hidden, true);
  assert.equal(stage.plot.hidden, false);
  assert.equal(stage.plot.drew, 2.25);
  assert.equal(stage.plot.width, 360);

  assert.equal(stage.show(scene, {}, () => 0).kind, 'scene3d');
  assert.equal(canvas3d.hidden, false);
  assert.equal(stage.plot.hidden, true);
});

function mathPage() {
  page();
  const host = document.createElement('div');
  host.id = 'sheet-switch';
  document.getElementById('app').appendChild(host);
}

test('a math course with no notes keeps a single practice button', () => {
  mathPage();
  const hud = createMathHUD(api(), catalog);
  assert.equal(hud.notes, null);
  assert.equal(document.getElementById('btn-notes'), null);
  assert.equal(document.querySelector('.mode-tabs'), null);
});

test('a math course with notes opens them beside the lab', async () => {
  mathPage();
  const bag = new Map();
  const store = {
    getItem: (k) => (bag.has(k) ? bag.get(k) : null),
    setItem: (k, v) => {
      if (v == null) bag.delete(k);
      else bag.set(k, String(v));
    },
  };
  const set = {
    exam: 'u1',
    title: 'Functions and limits',
    chapters: '2',
    load: async () => NOTES_HTML,
    sections: [{ id: 's1', n: 1, title: 'Area under the graph', lab: 'diagram', ch: [] }],
  };
  const hud = createMathHUD(api(), {
    ...catalog,
    notes: {
      notesForExam: () => set,
      allNotes: () => [set],
      setupsFor: () => [],
      matchExamples: () => [],
      DERIVATIONS: [],
      LAB_META: catalog.labMeta,
      examById: catalog.examById,
      examLabel: (exam) => `Unit ${exam.n}`,
      CHAPTER_TITLES: {},
      countFor: () => 0,
      esc: (value) => String(value),
      store,
    },
  });
  const btn = document.getElementById('btn-notes');
  assert.equal(btn.textContent.includes('Notes'), true);
  assert.equal(document.getElementById('btn-practice').parentNode.className, 'mode-tabs');
  key('n');
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(hud.notes.isOpen(), true);
  assert.equal(document.getElementById('notes').textContent.includes('Motion of a point'), true);
  key('Escape');
  assert.equal(hud.notes.isOpen(), false);
});
