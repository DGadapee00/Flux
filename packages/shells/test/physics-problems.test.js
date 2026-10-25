import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { memoryStorage } from '@flux/core';
import { renderChrome } from '../physics/chrome.js';
import { createPractice } from '../physics/problems.js';
import { installDOM } from './dom.js';
import { PROBLEMS, fullBank } from './fixture/bank.js';

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
