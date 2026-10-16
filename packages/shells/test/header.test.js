import assert from 'node:assert/strict';
import test from 'node:test';
import { createHUD as createEngineeringHUD } from '../engineering/hud.js';
import { createHUD as createMathHUD } from '../math/hud.js';
import { installDOM } from './dom.js';

function page() {
  installDOM();
  document.body.innerHTML = `
    <div id="app">
      <canvas id="c"></canvas>
      <header id="brand" class="hud panel brand">
        <h1 id="mark">TRUSS</h1>
        <p id="brand-sub">old</p>
        <nav id="track-row" aria-label="Courses in this track"></nav>
        <select id="exam-select" aria-label="Unit"></select>
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
      <div id="sheet-switch"></div>
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
    ...extra,
  };
}

const exams = [
  { id: 'u1', n: 1, title: 'Particle kinematics', chapters: '12', labs: ['diagram'], coming: [] },
  { id: 'u2', n: 2, title: 'Force and acceleration', chapters: '13', labs: [], coming: [] },
];

const catalog = {
  exams,
  examById: (id) => exams.find((exam) => exam.id === id),
  labMeta: { diagram: { title: 'Diagram' } },
  code: 'EGN 3321',
  title: 'Dynamics',
  courseId: 'egn3321',
  homeId: 'u1',
  track: [
    { id: 'statics', code: 'EGN 3311', title: 'Statics', href: '../statics/' },
    { id: 'egn3321', code: 'EGN 3321', title: 'Dynamics', href: '../egn3321/' },
    { id: 'egn3331', code: 'EGN 3331', title: 'Mechanics of Materials', href: null },
  ],
};

test('both shells share the wordmark, the unit names, and the track row', () => {
  for (const create of [createEngineeringHUD, createMathHUD]) {
    page();
    const seen = [];
    const hud = create(
      api({
        setExam(id) {
          seen.push(id);
        },
      }),
      catalog,
    );
    assert.equal(document.getElementById('mark').textContent, 'FLUX');
    assert.equal(document.getElementById('brand-sub').textContent, 'EGN 3321 · Dynamics');
    assert.equal(document.title, 'FLUX — EGN 3321');
    const row = document
      .getElementById('track-row')
      .childNodes.filter((node) => node.nodeType === 1)
      .map((el) => ({
      text: el.textContent,
      href: el.getAttribute('href'),
      current: el.getAttribute('aria-current'),
      title: el.getAttribute('title'),
    }));
    assert.deepEqual(row, [
      { text: 'EGN 3311', href: '../statics/', current: null, title: 'Statics' },
      { text: 'EGN 3321', href: '../egn3321/', current: 'page', title: 'Dynamics' },
      { text: 'EGN 3331', href: null, current: null, title: 'Mechanics of Materials' },
    ]);
    hud.mount(null, exams[1], { examId: 'u2' });
    const select = document.getElementById('exam-select');
    assert.equal(select.value, 'u2');
    assert.deepEqual(
      [...select.querySelectorAll('option')].map((option) => option.textContent),
      ['Unit 1 · Particle kinematics', 'Unit 2 · Force and acceleration'],
    );
    select.value = 'u1';
    select.dispatchEvent({ type: 'change' });
    assert.deepEqual(seen, ['u1']);
    assert.equal(document.getElementById('brand-sub').textContent, 'EGN 3321 · Dynamics');
  }
});

test('a header with no track list hides the row', () => {
  page();
  createEngineeringHUD(api(), { ...catalog, track: [] });
  assert.equal(document.getElementById('track-row').hidden, true);
  assert.equal(document.getElementById('track-row').textContent, '');
});
