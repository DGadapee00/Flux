import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { CHROME_IDS, renderChrome } from '../physics/chrome.js';
import { installDOM } from './dom.js';

const PHYSICS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../physics');
const OPTS = { code: 'FIX 1000', setupHint: 'Drag the block', unitName: 'Unit' };

/**
 * Ids the shell's own modules create, not the chrome, each with the reason it is allowed.
 *   pb-timer  the practice exam's clock, written into the panel when an exam starts (problems.js)
 */
const OWNED_IDS = ['pb-timer'];

function page() {
  installDOM();
  document.body.innerHTML = '<div id="app"></div>';
  const app = document.getElementById('app');
  renderChrome(app, OPTS);
  return app;
}

test('renderChrome writes every id in CHROME_IDS exactly once', () => {
  const app = page();
  const written = [...app.innerHTML.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...written].sort(), [...CHROME_IDS].sort());
  assert.equal(new Set(written).size, written.length, 'an id is written twice');
  for (const id of CHROME_IDS) assert.ok(document.getElementById(id), id);
});

test('renderChrome writes the three mode buttons in order Practice, Notes, Explore', () => {
  page();
  // The test DOM has no descendant selectors, so scope the lookup by hand.
  const ids = document.querySelector('.mode-switch').querySelectorAll('button').map((b) => b.id);
  assert.deepEqual(ids, ['btn-practice', 'btn-notes', 'btn-explore']);
});

test('renderChrome takes the code, the setup hint and the unit name from the course', () => {
  page();
  assert.equal(document.getElementById('brand-sub').textContent, 'FIX 1000');
  assert.equal(document.getElementById('setup-hint').textContent, 'Drag the block');
  assert.equal(document.getElementById('exam-select').getAttribute('aria-label'), 'Unit');
});

test('every owned id is really written by a shell module', () => {
  const sources = fs.readdirSync(PHYSICS_DIR).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(PHYSICS_DIR, f), 'utf8'));
  for (const id of OWNED_IDS) {
    assert.ok(sources.some((src) => src.includes(`id="${id}"`)), `${id} is listed as owned, but no shell module writes it`);
  }
});

test('every id literal read in packages/shells/physics (getElementById or $) is a chrome id or one the shell creates', () => {
  const known = new Set([...CHROME_IDS, ...OWNED_IDS]);
  for (const file of fs.readdirSync(PHYSICS_DIR).filter((f) => f.endsWith('.js'))) {
    const source = fs.readFileSync(path.join(PHYSICS_DIR, file), 'utf8');
    // Most modules read ids through a local `$('id')` helper, so match that too.
    for (const [, id] of source.matchAll(/(?:getElementById\(|\$\()\s*['"]([^'"]+)['"]\s*\)/g)) {
      assert.ok(known.has(id), `${file} reads #${id}, which renderChrome never writes`);
    }
  }
});
