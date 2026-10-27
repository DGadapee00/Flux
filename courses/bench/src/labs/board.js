/**
 * Drawing a half-size breadboard and what is plugged into it, for every Bench lab. Model units are
 * hole pitches (0.1 in, 2.54 mm), y up. Rows run left to right; columns a–e sit above the centre
 * channel and f–j below it; a + and a − rail run along the top and along the bottom.
 */
import { BOARD, netOf } from '@flux/subjects/em/breadboard.js';
import { C, alpha, label, poly, seg } from './diagram.js';

const COL_Y = { a: 12, b: 11, c: 10, d: 9, e: 8, f: 6, g: 5, h: 4, i: 3, j: 2 };
const RAIL_Y = { 'T+': 15, 'T-': 14, 'B+': 0, 'B-': -1 };

/** The board, the supply to its left, and room for a meter below it. */
export const BOUNDS = { x0: -6.0, x1: BOARD.rows + 1.2, y0: -7.6, y1: 16.6 };
export const BOUNDS_NO_METER = { x0: -6.0, x1: BOARD.rows + 1.2, y0: -2.2, y1: 16.6 };

/** Where a hole is, in model units. */
export function holeXY(hole) {
  const rail = /^([TB][+-])(\d+)$/.exec(hole);
  if (rail) return [Number(rail[2]), RAIL_Y[rail[1]]];
  const m = /^([a-j])(\d+)$/.exec(hole);
  return [Number(m[2]), COL_Y[m[1]]];
}

/** Every hole on the board, by name. */
function allHoles() {
  const out = [];
  for (let r = 1; r <= BOARD.rows; r += 1) {
    for (const c of BOARD.left + BOARD.right) out.push(`${c}${r}`);
    for (const rail of Object.keys(RAIL_Y)) out.push(`${rail}${r}`);
  }
  return out;
}
const HOLES = allHoles();

/**
 * The board itself: its body, the rails with their stripes, the holes, and the row numbers.
 * `lit` maps a net to a colour; the holes of that net are filled with it.
 */
export function drawBoard(P, { split = false, lit = {} } = {}) {
  const { ctx, X, Y, k } = P;
  poly(P, [[0.2, -1.8], [BOARD.rows + 0.8, -1.8], [BOARD.rows + 0.8, 15.8], [0.2, 15.8]], { fill: alpha('#e9e4dc', 0.11), stroke: alpha(C.text, 0.25), width: 1 });
  // The centre channel and the gaps between the rails and the rows.
  poly(P, [[0.2, 6.75], [BOARD.rows + 0.8, 6.75], [BOARD.rows + 0.8, 7.25], [0.2, 7.25]], { fill: alpha(C.bg, 0.8), stroke: null });
  for (const [name, y] of Object.entries(RAIL_Y)) {
    const plus = name.endsWith('+');
    const line = (x0, x1) => seg(P, [x0, y + (plus ? 0.45 : -0.45) * (name.startsWith('T') ? 1 : -1)], [x1, y + (plus ? 0.45 : -0.45) * (name.startsWith('T') ? 1 : -1)], { color: plus ? C.red : C.blue, width: 1.5 });
    if (split) {
      line(0.6, BOARD.rows / 2 + 0.3);
      line(BOARD.rows / 2 + 0.7, BOARD.rows + 0.4);
    } else {
      line(0.6, BOARD.rows + 0.4);
    }
    label(P, plus ? '+' : '−', [-0.2, y], { color: plus ? C.red : C.blue, bold: true });
  }
  const r = Math.max(1.4, Math.min(3.2, k * 0.17));
  for (const h of HOLES) {
    const [x, y] = holeXY(h);
    const net = netOf(h, { split });
    ctx.beginPath();
    ctx.arc(X(x), Y(y), lit[net] ? r * 1.25 : r, 0, Math.PI * 2);
    ctx.fillStyle = lit[net] || alpha(C.bg, 0.95);
    ctx.fill();
  }
  // Row numbers every five rows, and the column letters at the left.
  for (let row = 5; row <= BOARD.rows; row += 5) label(P, String(row), [row, 7], { color: C.dim });
  for (const [c, y] of Object.entries(COL_Y)) label(P, c, [0.45, y], { color: C.dim });
}

/** The colour bands of a resistor value: two digits and a multiplier (the E12 values use two). */
const BAND = ['#1b1b1b', '#7a4a24', '#d83b2f', '#f08a24', '#f2d22e', '#3b9a3f', '#2f64d8', '#8a4fc2', '#8c8c8c', '#f2f2f2'];
export function bands(ohms) {
  const e = Math.floor(Math.log10(ohms)) - 1;
  const two = Math.round(ohms / 10 ** e);
  return [Math.floor(two / 10), two % 10, e].map((d) => BAND[Math.max(0, Math.min(9, d))]);
}

/** A part on the board: its legs to their holes, and its body midway. */
export function drawPart(P, part, { color = null, faded = false } = {}) {
  const { ctx, X, Y, k } = P;
  const a = holeXY(part.a);
  const b = holeXY(part.b);
  const op = faded ? 0.35 : 1;
  if (part.type === 'W') {
    const c = color || (part.color === 'black' ? '#2d2f33' : part.color === 'red' ? C.red : C.green);
    // A jumper bows a little off the board so it reads as a wire, not a printed line.
    const mx = (X(a[0]) + X(b[0])) / 2;
    const my = (Y(a[1]) + Y(b[1])) / 2 - Math.min(14, 0.2 * Math.hypot(X(b[0]) - X(a[0]), Y(b[1]) - Y(a[1])));
    ctx.save();
    ctx.globalAlpha = op;
    ctx.strokeStyle = c;
    ctx.lineWidth = Math.max(2, k * 0.22);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(X(a[0]), Y(a[1]));
    ctx.quadraticCurveTo(mx, my, X(b[0]), Y(b[1]));
    ctx.stroke();
    if (part.color === 'black') {
      ctx.strokeStyle = alpha(C.text, 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  if (part.type === 'R') {
    ctx.save();
    ctx.globalAlpha = op;
    seg(P, a, b, { color: alpha(C.text, 0.75), width: Math.max(1.2, k * 0.08) });
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const ang = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
    const len = Math.min(2.6, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.7) * k;
    const wid = 0.75 * k;
    ctx.translate(X(mx), Y(my));
    ctx.rotate(ang);
    ctx.fillStyle = color || '#d9c7a3';
    ctx.beginPath();
    ctx.roundRect(-len / 2, -wid / 2, len, wid, wid / 2.5);
    ctx.fill();
    bands(part.value).forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(-len / 2 + len * (0.2 + 0.18 * i), -wid / 2, len * 0.09, wid);
    });
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(len / 2 - len * 0.2, -wid / 2, len * 0.07, wid);
    ctx.restore();
  }
}

/** The supply, drawn left of the board, with straight leads to its two rail holes. */
export function drawSupply(P, part, { name = 'supply', text = '' } = {}) {
  poly(P, [[-5.9, 10.6], [-1.4, 10.6], [-1.4, 13.8], [-5.9, 13.8]], { fill: alpha(C.bg, 0.95), stroke: alpha(C.text, 0.5), width: 1.2 });
  label(P, name, [-3.7, 14.6], { color: C.muted });
  label(P, text, [-3.65, 12.2], { color: C.text });
  const plus = holeXY(part.b);
  const minus = holeXY(part.a);
  seg(P, [-1.4, 13.2], plus, { color: C.red, width: 2.5 });
  seg(P, [-1.4, 11.2], minus, { color: '#2d2f33', width: 2.5 });
  seg(P, [-1.4, 11.2], minus, { color: alpha(C.text, 0.45), width: 1 });
}

/** A test lead from a point to a hole, drawn as a soft curve with a probe tip. */
export function lead(P, from, to, color, outline = false) {
  const { ctx, X, Y, k } = P;
  const x0 = X(from[0]);
  const y0 = Y(from[1]);
  const x1 = X(to[0]);
  const y1 = Y(to[1]);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, k * 0.2);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.bezierCurveTo(x0, (y0 + y1) / 2 + 20, x1, (y0 + y1) / 2 - 20, x1, y1);
  ctx.stroke();
  if (outline) {
    ctx.strokeStyle = alpha(C.text, 0.55);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x1, y1, Math.max(3, k * 0.28), 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = alpha(C.text, 0.8);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** A multimeter face below the board: its reading, its mode, and its two jacks. */
export function drawMeter(P, { reading, mode, warn = false }) {
  const box = [[9, -7.4], [22, -7.4], [22, -2.6], [9, -2.6]];
  poly(P, box, { fill: alpha('#f2c230', 0.16), stroke: alpha('#f2c230', 0.7), width: 1.5 });
  poly(P, [[10, -4.9], [21, -4.9], [21, -3.1], [10, -3.1]], { fill: alpha(C.bg, 0.95), stroke: null });
  label(P, reading, [15.5, -4], { color: warn ? C.red : C.teal, bold: true });
  label(P, mode, [15.5, -6.1], { color: C.muted });
  return { red: [20.5, -6.4], black: [10.5, -6.4] };
}
