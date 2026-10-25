import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { memoryStorage } from '@flux/core';
import { renderChrome } from '../physics/chrome.js';
import { createPractice } from '../physics/problems.js';
import { installDOM } from './dom.js';
import { primaryOf } from '../practice/principles.js';
import { PRINCIPLES, PROBLEMS, fullBank } from './fixture/bank.js';

/** What this panel reads beyond the loop's bank: the course's sequence, sheets, principle step and fading. */
function physicsBank(overrides = {}, storage = memoryStorage()) {
  return {
    ...fullBank({ storage }),
    ASK_PRINCIPLE: false,
    sequenceRank: () => 0,
    stageOf: () => null,
    sheetItems: () => [],
    sheetCaseLabel: () => '',
    caseIndex: () => 0,
    examLabel: (exam) => `Unit ${exam.n ?? exam.id}`,
    asksPrinciple: () => false,
    principleOptions: () => [],
    gradePrinciple: () => true,
    primaryOf: () => null,
    UNSURE: 'unsure',
    guidanceFor: () => null,
    workedExample: () => null,
    exprToTex: (s) => s,
    GLYPH: {},
    ...overrides,
  };
}

function page() {
  installDOM();
  document.body.innerHTML = '<div id="app"></div>';
  renderChrome(document.getElementById('app'), { code: 'FIX 1000', setupHint: '', unitName: 'Unit' });
}

function api() {
  return {
    examId: () => 'u1',
    labId: () => 'demo',
    slice: () => ({}),
    computed: {},
    labelLayer: { children: [] },
    openInLab: async () => '',
    clearQuery() {},
    setSceneBlind() {},
    setExam() {},
    openNotes() {},
  };
}

test('createPractice returns the panel API', () => {
  page();
  const practice = createPractice(api(), physicsBank());
  for (const name of ['toggle', 'open', 'close', 'showChapter', 'isOpen', 'escape', 'noteEdit', 'onMount', 'followUrl', 'afterUpdate', 'frame', 'current']) {
    assert.equal(typeof practice[name], 'function', name);
  }
  assert.equal(practice.isOpen(), false);
});

test('opening the panel lists the unit’s problems', () => {
  page();
  const practice = createPractice(api(), physicsBank());
  practice.open('u1');
  assert.equal(practice.isOpen(), true);
  const html = document.getElementById('problems').innerHTML;
  const first = PROBLEMS.find((p) => p.exam === 'u1');
  assert.ok(html.includes(first.title), `the list should name "${first.title}"`);
  assert.equal(document.body.classList.contains('practice-open'), true);
});

test('the panel uses the progress object the bank gives it', () => {
  page();
  let made = 0;
  const bank = physicsBank();
  const real = bank.createProgress;
  let given = null;
  bank.createProgress = () => {
    made += 1;
    given = real();
    return given;
  };
  const practice = createPractice(api(), bank);
  assert.equal(made, 1);
  assert.equal(practice.progress, given);
});

test('the panel never touches storage itself, so it invents no key', () => {
  const source = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../physics/problems.js'), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|\.setItem\(|\.getItem\(|courseStore/);
});

test('the panel runs with no principles and no worked examples', () => {
  page();
  const practice = createPractice(api(), physicsBank({ PRINCIPLES: {}, guidanceFor: undefined, workedExample: undefined, sectionForProblem: undefined }));
  assert.doesNotThrow(() => practice.open('u1'));
});

/** The mode is still called a practice exam (and its buttons say exam-*); only the course's own units change name. */
const withoutModeName = (html) => html.replace(/data-act="exam-[\w-]+"/g, '').replace(/(resume )?practice exam/gi, '');
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

function openPrincipleGroups(bankExtra) {
  page();
  const practice = createPractice(api(), physicsBank({ PRINCIPLES, primaryOf, ...bankExtra }));
  practice.open('u1');
  const panel = document.getElementById('problems');
  panel.querySelector('[data-act="filters"]').click();
  panel.querySelector('[data-filter="group:principle"]').click();
  return panel;
}

test('the panel calls a unit what the course calls it, and "unit" by default', () => {
  for (const [bankExtra, word] of [[{}, 'unit'], [{ unitName: 'exam' }, 'exam']]) {
    page();
    createPractice(api(), physicsBank(bankExtra)).open('u1');
    const html = withoutModeName(document.getElementById('problems').innerHTML);
    assert.match(html, new RegExp(`problems for this ${word}\\.`));
    if (word === 'unit') assert.doesNotMatch(html, /\bexams?\b/i, 'a course with units should not read "exam"');
  }
});

test('the principle view says "unit" and tags each problem with the course\u2019s chapter tag', () => {
  const html = withoutModeName(openPrincipleGroups({ chapterTag: (ch) => `Sec ${ch}` }).innerHTML);
  assert.match(html, /pb-chtag">Sec 1</);
  assert.doesNotMatch(html, /\bexams?\b/i);
  assert.doesNotMatch(html, /pb-chtag">Ch [0-9]/);
});

test('the chapter tag defaults to "Ch n"', () => {
  assert.match(openPrincipleGroups({}).innerHTML, /pb-chtag">Ch [0-9]</);
});

test('a part id with no label prints as itself unless the course names it', async () => {
  const base = PROBLEMS.find((p) => p.id === 'f.1.force');
  const part = base.parts[0];
  const custom = { ...base, id: 't.work', parts: [{ ...part, id: 'w', label: null }, { ...part, id: 'v', label: null }], cases: [] };
  for (const [partNames, want] of [[undefined, 'w'], [{ w: 'ω' }, 'ω']]) {
    page();
    const bank = physicsBank({ PROBLEMS: [...PROBLEMS, custom], problemById: (id) => [...PROBLEMS, custom].find((p) => p.id === id) || null, partNames });
    const practice = createPractice(api(), bank);
    practice.open('u1');
    practice.followUrl('t.work', 1);
    await tick();
    const html = document.getElementById('problems').innerHTML;
    assert.ok(html.includes(`>${want}</`) || html.includes(`>${want}<`), `expected a part labelled ${want} in: ${html.slice(0, 300)}`);
    if (!partNames) assert.ok(!html.includes('ω'), 'a mechanics part "w" must not become omega');
  }
});
