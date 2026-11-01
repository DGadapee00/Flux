import test from 'node:test';
import assert from 'node:assert/strict';
import { focus } from '../src/math/focus.js';
test('lens conjugates satisfy the implicit equation and a finite-difference derivative', () => {
  for (const f of [28, 50, 85]) for (const u of [350, 450, 1000, 2000]) {
    const c=focus(f,u), h=u*1e-5;
    assert.ok(Math.abs(1/f-1/u-1/c.v)<1e-14);
    assert.ok(Math.abs(c.sensitivity-(focus(f,u+h).v-focus(f,u-h).v)/(2*h))<1e-9);
    assert.ok(Math.abs(focus(2*f,2*u).v-2*c.v)<1e-10);
    assert.equal(focus(2*f,2*u).sensitivity,c.sensitivity);
  }
  assert.throws(()=>focus(50,50),RangeError);
});
