import assert from 'node:assert/strict';
import test from 'node:test';
import { createEngine } from '../src/problems/engine.js';

const plain = createEngine().sig;
const hibbeler = createEngine({ sig: { leadingOne: true } }).sig;

test('the default count stays three figures', () => {
  assert.equal(plain(1.234), '1.23');
  assert.equal(plain(9.876), '9.88');
  assert.equal(hibbeler(9.876), '9.88');
});

test('a leading 1 keeps one extra figure when the course asks for it', () => {
  assert.equal(hibbeler(1.234), '1.234');
  assert.equal(hibbeler(12.345), '12.35');
  assert.equal(hibbeler(0.012345), '0.01235');
  assert.equal(hibbeler(1.234e6), '1.234 × 10⁶');
});

test('an explicit figure count is not bumped', () => {
  assert.equal(hibbeler(1.234, 3), '1.23');
});
