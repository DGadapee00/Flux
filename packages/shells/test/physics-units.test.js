import assert from 'node:assert/strict';
import test from 'node:test';
import { renderChrome } from '../physics/chrome.js';
import { createUnits } from '../physics/units.js';
import { installDOM } from './dom.js';

const OPTS = { code: 'FIX 1000', setupHint: '', unitName: 'Unit' };

function page() {
  installDOM();
  document.body.innerHTML = '<div id="app"></div>';
  renderChrome(document.getElementById('app'), OPTS);
}

test('the units panel lists the rows for a lab', () => {
  page();
  const units = createUnits({
    unitsForLab: () => [{ sym: 'F', name: 'force', unit: 'N' }],
    labMeta: { demo: { title: 'Demo' } },
  });
  units.onLab('demo');
  units.toggle();
  const html = document.getElementById('units-ref').innerHTML;
  assert.ok(html.includes('Units — Demo'), html);
  assert.ok(html.includes('force'), html);
  assert.equal(units.isOpen(), true);
});

test('the units panel opens empty without throwing when a lab has no quantities', () => {
  page();
  const units = createUnits({ unitsForLab: () => [], labMeta: {} });
  units.onLab('unknown');
  units.toggle();
  assert.ok(document.getElementById('units-ref').innerHTML.includes('No units listed for this lab.'));
});

test('onOpen is optional', () => {
  page();
  const units = createUnits({ unitsForLab: () => [], labMeta: {} });
  assert.doesNotThrow(() => units.toggle());
});

test('the units panel runs with no unitsForLab and no labMeta', () => {
  page();
  const units = createUnits({});
  units.onLab('anything');
  assert.doesNotThrow(() => units.toggle());
  assert.ok(document.getElementById('units-ref').innerHTML.includes('No units listed for this lab.'));
});

test('a unitsForLab that returns nothing is an empty list', () => {
  page();
  const units = createUnits({ unitsForLab: () => undefined, labMeta: {} });
  units.onLab('anything');
  assert.doesNotThrow(() => units.toggle());
  assert.ok(document.getElementById('units-ref').innerHTML.includes('No units listed for this lab.'));
});
