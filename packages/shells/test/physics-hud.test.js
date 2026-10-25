import assert from 'node:assert/strict';
import test from 'node:test';
import { createHUD } from '../physics/hud.js';
import { renderChrome } from '../physics/chrome.js';
import { installDOM } from './dom.js';

function page() {
  installDOM();
  // The test DOM's document has no listeners of its own; the HUD listens for pointerdown on it.
  document.addEventListener = () => {};
  document.body.innerHTML = '<div id="app"></div>';
  renderChrome(document.getElementById('app'), { code: 'FIX 1000', setupHint: '', unitName: 'Unit' });
}

function api(extra = {}) {
  return {
    setExam() {},
    setLab() {},
    setScenario() {},
    resetCamera() {},
    toggleShow() {},
    togglePractice() {},
    toggleUnits() {},
    toggleNotes() {},
    escape() {},
    shiftExam() {},
    setLabIndex() {},
    handleKey() {},
    slice: () => ({}),
    bump() {},
    ...extra,
  };
}

const exams = [
  { id: 'u1', n: 1, title: 'Motion', chapters: '12', labs: ['diagram'], coming: [] },
  { id: 'u2', n: 2, title: 'Forces', chapters: '13', labs: [], coming: ['Friction'] },
];

function catalog(extra = {}) {
  return {
    exams,
    examById: (id) => exams.find((e) => e.id === id),
    examLabel: (e) => `Unit ${e.n}`,
    examLongLabel: (e) => `Unit ${e.n} · ${e.title}`,
    labMeta: { diagram: { title: 'Diagram' } },
    code: 'FIX 1000',
    homeId: 'u1',
    ...extra,
  };
}

/** The smallest lab the HUD can mount and update. */
function lab(extra = {}) {
  return {
    id: 'diagram',
    title: 'Diagram',
    hint: '',
    scenarios: [],
    toggles: [],
    legend: null,
    keys: {},
    controls: () => '',
    bind() {},
    syncControls() {},
    law: () => [],
    liveRows: () => '',
    readout: () => '',
    coach: () => ({ title: '', body: '' }),
    plot: () => null,
    ...extra,
  };
}

test('the unit picker lists every unit with its label', () => {
  page();
  const hud = createHUD(api(), catalog());
  hud.mount(null, exams[0], { examId: 'u1' });
  const select = document.getElementById('exam-select');
  const options = select.querySelectorAll('option');
  assert.deepEqual(options.map((o) => o.textContent), ['Unit 1 · Motion', 'Unit 2 · Forces']);
  assert.equal(select.value, 'u1');
});

test('the unit option title comes from examNote', () => {
  page();
  const hud = createHUD(api(), catalog({ examNote: (e) => `Sec ${e.chapters}` }));
  hud.mount(null, exams[0], { examId: 'u1' });
  const titles = document.getElementById('exam-select').querySelectorAll('option').map((o) => o.getAttribute('title'));
  assert.deepEqual(titles, ['Unit 1 · Motion · Sec 12', 'Unit 2 · Forces · Sec 13']);
});

test('the sub-title carries the code and the note', () => {
  page();
  const hud = createHUD(api(), catalog({ examNote: (e) => `Sec ${e.chapters}` }));
  hud.mount(null, exams[0], { examId: 'u1' });
  assert.equal(document.getElementById('brand-sub').textContent, 'FIX 1000 · Sec 12');
});

test('the picker and sub-title work with no examNote and no dates', () => {
  page();
  const hud = createHUD(api(), catalog());
  hud.mount(null, exams[1], { examId: 'u2' });
  assert.equal(document.getElementById('brand-sub').textContent, 'FIX 1000 · ');
  assert.equal(document.getElementById('exam-select').value, 'u2');
});

test('the lab tabs list the unit labs', () => {
  page();
  const hud = createHUD(api(), catalog());
  hud.mount(lab(), exams[0], { examId: 'u1' });
  const tabs = document.getElementById('lab-tabs').querySelectorAll('button');
  assert.deepEqual(tabs.map((t) => t.textContent), ['Diagram']);
});

test('a plot is drawn through the plots map', () => {
  page();
  const drawn = [];
  const hud = createHUD(api(), catalog({ plots: { demo: (canvas, plot) => drawn.push([canvas.id, plot]) } }));
  const demo = lab({ plot: () => ({ type: 'demo', n: 3 }) });
  hud.mount(demo, exams[0], { examId: 'u1' });
  hud.update({ examId: 'u1' }, {}, demo);
  assert.equal(drawn.length, 1);
  assert.equal(drawn[0][0], 'mini-plot');
  assert.deepEqual(drawn[0][1], { type: 'demo', n: 3 });
});

test('the HUD runs with no plots map and no labPanel', () => {
  page();
  const hud = createHUD(api(), catalog());
  const demo = lab({ plot: () => ({ type: 'demo' }) });
  assert.doesNotThrow(() => {
    hud.mount(demo, exams[0], { examId: 'u1' });
    hud.update({ examId: 'u1' }, {}, demo);
  });
});

test('labPanel.reset runs each time a lab mounts', () => {
  page();
  let resets = 0;
  const hud = createHUD(api(), catalog({ labPanel: { reset: () => (resets += 1) } }));
  hud.mount(lab(), exams[0], { examId: 'u1' });
  hud.mount(null, exams[1], { examId: 'u2' });
  assert.equal(resets, 2);
});

test('key actions come from the course', () => {
  page();
  const hud = createHUD(api(), catalog({ keyActions: { push: ['G', 'Push the block'] } }));
  hud.mount(lab({ keys: { g: 'push', r: 'reset' } }), exams[0], { examId: 'u1' });
  window.dispatchEvent({ type: 'keydown', key: '?', target: document.body, ctrlKey: false, metaKey: false, altKey: false });
  const html = document.getElementById('keys').innerHTML;
  assert.ok(html.includes('Push the block'), html);
  assert.ok(html.includes('Reset the view'), html);
});
