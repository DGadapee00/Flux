import assert from 'node:assert/strict';
import test from 'node:test';
import { defineCourse, defineLab } from '@flux/core';
import { setup } from '@flux/core/plot2d/plot.js';
import { createHUD } from '../engineering/hud.js';
import { createHUD as createMathHUD } from '../math/hud.js';
import { createStage } from '../engineering/stage.js';
import { openNotesFromRoute } from '../notes.js';
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
      <div id="sheet-switch"></div>
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

test('the math HUD mounts the same Notes tab', async () => {
  page();
  const set = {
    exam: 'u1',
    title: 'Motion of a point',
    chapters: '12',
    load: async () => NOTES_HTML,
    sections: [{ id: 's1', n: '1', title: 'Area under the graph', lab: 'diagram', ch: [] }],
  };
  const seen = { escape: 0 };
  const hud = createMathHUD(
    api({
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
        store: { getItem: () => null, setItem() {} },
      },
    },
  );
  assert.equal(document.getElementById('btn-practice').parentNode.className, 'mode-tabs');
  key('n');
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(hud.notes.isOpen(), true);
  assert.equal(document.getElementById('notes').textContent.includes('Area under the graph'), true);
  key('Escape');
  assert.equal(hud.notes.isOpen(), false);
  assert.equal(seen.escape, 0);
});

test('a math course with no notes has no Notes tab', () => {
  page();
  const hud = createMathHUD(api(), catalog);
  assert.equal(hud.notes, null);
  assert.equal(document.getElementById('btn-notes'), null);
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

for (const [name, makeHUD] of [['engineering', createHUD], ['math', createMathHUD]]) {
  test(`${name} shell: ?n=<section> opens the notes at that section`, async () => {
    page();
    const set = {
      exam: 'u1',
      title: 'Motion of a point',
      chapters: '12',
      load: async () => NOTES_HTML,
      sections: [{ id: 's1', n: '1', title: 'Area under the graph', lab: 'diagram', ch: [] }],
    };
    const shown = [];
    const hud = makeHUD(api({ showLab: (lab, exam) => shown.push([lab, exam]) }), {
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
        store: { getItem: () => null, setItem() {} },
      },
    });

    // A problem link wins, and a link with no section leaves the notes shut.
    assert.equal(openNotesFromRoute(hud.notes, { examId: 'u1', problemId: 'p1', notes: 's1' }), false);
    assert.equal(openNotesFromRoute(hud.notes, { examId: 'u1', problemId: null, notes: null }), false);
    assert.equal(hud.notes.isOpen(), false);

    assert.equal(openNotesFromRoute(hud.notes, { examId: 'u1', problemId: null, notes: 's1' }), true);
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(hud.notes.isOpen(), true);
    assert.equal(document.getElementById('notes').textContent.includes('Area under the graph'), true);
    assert.deepEqual(shown.at(-1), ['diagram', 'u1']);
    assert.equal(openNotesFromRoute(null, { examId: 'u1', notes: 's1' }), false);
  });
}

test('math prediction hook is opt-in and grades with the fixture lab computation', () => {
  page();
  const state={scenarioId:'start',n:2,show:{}};
  const prompt={id:'square',scenario:'start',ask:'Double n. Does its square double?',apply:s=>{s.n*=2;},watch:[{id:'q',label:'square',get:c=>c.q,mode:'factor'}],expect:{q:4},why:'Squaring doubles both factors.'};
  const lab={id:'diagram',title:'Square',scenarios:[{id:'start',name:'Start'}],predictions:[prompt],controls:()=>'',bind(){},syncControls(){},defaultState:()=>({n:2}),applyScenario(id,s){s.scenarioId=id;},recompute(s,c){c.q=s.n*s.n;},toggles:[],law:()=>[],liveRows:()=>'',readout:()=>'',coach:()=>({}),plot:()=>null};
  let hud=createMathHUD(api({slice:()=>state,bump(){}}),catalog);
  hud.mount(lab,catalog.exams[0],state);
  assert.equal(document.getElementById('predict'),null);
  page();
  const hooked={...catalog,predictions:true};
  hud=createMathHUD(api({slice:()=>state,bump(){hud.update(state,{},lab);}}),hooked);
  hud.mount(lab,catalog.exams[0],state);
  const host=document.getElementById('predict');
  assert.ok(host.textContent.includes('Predict first'));
  const pick=host.querySelector('[data-value="2"]');
  host.dispatchEvent({type:'click',target:pick});
  host.dispatchEvent({type:'click',target:host.querySelector('[data-act="apply"]')});
  assert.equal(state.n,4);
  assert.ok(host.textContent.includes('the lab says ×4'));
  assert.ok(host.querySelector('.pred-grade').textContent.includes('the lab says ×4'));
  assert.doesNotMatch(host.querySelector('.pred-grade').innerHTML, /<p[ >]/);
});

test('math scaffold can describe its content gate without claiming practice is ready',()=>{
  page();
  const unit={...catalog.exams[0],labs:[],coming:['Future lab']};
  let hud=createMathHUD(api(),{...catalog,exams:[unit]});
  hud.mount(null,unit,{examId:unit.id});
  assert.ok(document.getElementById('lab-controls').textContent.includes('practice problems for this unit are ready'));
  page();
  hud=createMathHUD(api(),{...catalog,exams:[unit],unbuiltMessage:'Awaiting spine confirmation.'});
  hud.mount(null,unit,{examId:unit.id});
  assert.equal(document.getElementById('lab-controls').textContent,'Awaiting spine confirmation.');
});

test('math active-tab reveal is opt-in and limited to phone width',()=>{
 page();const proto=window.Element.prototype,previous=proto.scrollIntoView,calls=[];
 proto.scrollIntoView=function(options){calls.push([this.dataset.lab,options]);};
 const lab={id:'diagram',scenarios:[],controls:()=>'',bind(){},toggles:[]};
 try{
  window.innerWidth=380;let hud=createMathHUD(api(),catalog);hud.mount(lab,catalog.exams[0],{});assert.equal(calls.length,0);
  page();window.innerWidth=380;hud=createMathHUD(api(),{...catalog,revealActiveLab:true});hud.mount(lab,catalog.exams[0],{});
  assert.deepEqual(calls,[['diagram',{block:'nearest',inline:'nearest'}]]);
  page();window.innerWidth=1280;hud=createMathHUD(api(),{...catalog,revealActiveLab:true});hud.mount(lab,catalog.exams[0],{});assert.equal(calls.length,1);
 }finally{if(previous)proto.scrollIntoView=previous;else delete proto.scrollIntoView;}
});
