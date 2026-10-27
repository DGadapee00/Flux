import assert from 'node:assert/strict';
import test from 'node:test';
import { netOf, relaxBoard, solveBoard } from '../src/em/breadboard.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('holes join in strips of five, and rails run the length of the board', () => {
  assert.equal(netOf('a10'), 'L10');
  assert.equal(netOf('e10'), 'L10');
  assert.equal(netOf('f10'), 'R10');
  assert.equal(netOf('T+3'), netOf('T+28'));
  assert.notEqual(netOf('T+3', { split: true }), netOf('T+28', { split: true }));
  assert.throws(() => netOf('k3'));
  assert.throws(() => netOf('a31'));
});

// 5 V on the rails, 1 kΩ from row 10 to row 14, 2 kΩ from row 14 to row 18.
const series = [
  { id: 'V', type: 'V', a: 'T-1', b: 'T+1', value: 5 },
  { id: 'w1', type: 'W', a: 'T+10', b: 'a10' },
  { id: 'R1', type: 'R', a: 'c10', b: 'c14', value: 1000 },
  { id: 'R2', type: 'R', a: 'd14', b: 'd18', value: 2000 },
  { id: 'w2', type: 'W', a: 'a18', b: 'T-18' },
];

test('a series pair: 5/3 mA, and the middle row at 10/3 V, by both methods', () => {
  const s = solveBoard(series, { ground: 'T-' });
  close(s.I.R1, 5 / 3000, 1e-6);
  close(s.V.L14, 10 / 3, 1e-6);
  const r = relaxBoard(series, { ground: 'T-' });
  close(r.I.R1, 5 / 3000, 1e-9);
  close(r.V.L14, 10 / 3, 1e-9);
});

test('a resistor with both legs in one row carries nothing', () => {
  const along = series.map((p) => (p.id === 'R2' ? { ...p, a: 'b14', b: 'd14' } : p));
  const s = solveBoard(along, { ground: 'T-' });
  close(s.I.R2, 0);
  close(s.I.R1, 0);
  assert.ok(s.floating.length === 0 || !s.floating.includes('T-'));
});

test('a split rail is a dead end: no current, and the whole chain sits at the supply voltage', () => {
  const far = series.map((p) => (p.id === 'w2' ? { ...p, b: 'T-28' } : p));
  const s = solveBoard(far, { ground: 'T-:L', split: true });
  close(s.I.R1, 0);
  close(s.V.L18, 5, 1e-6);
  const r = relaxBoard(far, { ground: 'T-:L', split: true });
  close(r.V.L18, 5, 1e-9);
});

test('parts joined to nothing on the ground side float', () => {
  const parts = [...series, { id: 'R9', type: 'R', a: 'f25', b: 'f28', value: 100 }];
  const s = solveBoard(parts, { ground: 'T-' });
  assert.deepEqual(s.floating.sort(), ['R25', 'R28']);
  close(s.I.R9, 0);
});

test('a source with internal resistance sags under load', () => {
  const parts = [
    { id: 'V', type: 'V', a: 'T-1', b: 'T+1', value: 5, r: 0.5 },
    { id: 'RL', type: 'R', a: 'T+5', b: 'T-5', value: 10 },
  ];
  const s = solveBoard(parts, { ground: 'T-' });
  close(s.V['T+'], 5 * 10 / 10.5, 1e-9);
  const r = relaxBoard(parts, { ground: 'T-' });
  close(r.V['T+'], 5 * 10 / 10.5, 1e-9);
});

test('a source with internal resistance may sit between any two nets', () => {
  // A 9 V battery with 1.5 Ω on the rails, 10 kΩ + 10 kΩ, and a 1 V, 1 kΩ test source across the lower
  // resistor, its − end on row 14 rather than on ground.
  const parts = [
    { id: 'B', type: 'V', a: 'T-1', b: 'T+1', value: 9, r: 1.5 },
    { id: 'R1', type: 'R', a: 'T+10', b: 'c14', value: 10000 },
    { id: 'R2', type: 'R', a: 'd14', b: 'T-18', value: 10000 },
    { id: 'M', type: 'V', a: 'a14', b: 'T-20', value: 1, r: 1000 },
  ];
  const m = solveBoard(parts, { ground: 'T-' });
  const r = relaxBoard(parts, { ground: 'T-' });
  for (const id of ['R1', 'R2']) close(r.I[id], m.I[id], 1e-8);
  close(r.V.L14, m.V.L14, 1e-9);
});
