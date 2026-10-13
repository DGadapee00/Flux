import assert from 'node:assert/strict';
import test from 'node:test';
import { breakable, createTex, escapeHTML, mathPieces } from '../src/tex.js';

test('escapeHTML escapes the five characters problem prose contains', () => {
  assert.equal(escapeHTML(`a < b & "c" 'd'`), 'a &lt; b &amp; &quot;c&quot; &#39;d&#39;');
  assert.equal(escapeHTML(null), '');
});

test('inline dollars leave a doubled dollar as text, and macros stay per caller', () => {
  const em = createTex({ '\\eps': '\\varepsilon_0' });
  const other = createTex({ '\\eps': 'E' });
  assert.match(em.tex('\\eps'), /ε/);
  assert.match(other.tex('\\eps'), />E</);
  const html = em.mathText('$$x$$');
  assert.equal(html.includes('class="disp"'), false);
  assert.match(html, />x</);
  assert.match(em.mathProse('$q < 0$ and r > R'), /q/);
  assert.match(em.mathProse('$q < 0$ and r > R'), /&gt;/);
  assert.equal(em.texError('x'), '');
  assert.notEqual(em.texError('{'), '');
});

test('display dollars wrap a long equation and break a long comma list', () => {
  const stats = createTex({ '\\xbar': '\\bar{x}' }, { displayDollars: true });
  const shown = stats.mathText('$$\\xbar$$');
  assert.match(shown, /class="disp"/);
  assert.match(shown, /class="d-full"/);
  assert.match(shown, /class="d-wrap" hidden/);
  assert.match(shown, /mover/);
  const list = '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12';
  assert.match(stats.mathText(`$${list}$`), /allowbreak/);
  assert.equal(stats.mathText('$x$').includes('allowbreak'), false);
  assert.deepEqual(mathPieces('a $x$ and $$y$$'), [
    { src: 'x', display: false },
    { src: 'y', display: true },
  ]);
  assert.equal(mathPieces('no math').length, 0);
  assert.equal(mathPieces('$open').length, 1);
  assert.equal(mathPieces('$open')[0].unclosed, true);
  assert.match(breakable('a,b'), /\\displaystyle a,\\allowbreak b/);
});

test('fitMath swaps in the wrapping copy only when the display is wider than its column', () => {
  const els = {
    full: { hidden: false },
    wrap: { hidden: true },
  };
  const box = {
    scrollWidth: 40,
    clientWidth: 10,
    className: '',
    querySelector(sel) {
      if (sel === '.d-full') return els.full;
      if (sel === '.d-wrap') return els.wrap;
      return null;
    },
    classList: {
      toggle(name, on) {
        box.className = on ? name : '';
      },
    },
  };
  const root = { querySelectorAll: () => [box] };
  const { fitMath } = createTex();
  fitMath(root);
  assert.equal(els.full.hidden, true);
  assert.equal(els.wrap.hidden, false);
  assert.equal(box.className, 'wrapped');
  box.scrollWidth = 8;
  fitMath(root);
  assert.equal(els.full.hidden, false);
  assert.equal(els.wrap.hidden, true);
  assert.equal(box.className, '');
});
