import assert from 'node:assert/strict';
import test from 'node:test';
import { SUBJECTS } from '../src/index.js';

test('no subject library is extracted yet', () => {
  assert.deepEqual(SUBJECTS, []);
});
