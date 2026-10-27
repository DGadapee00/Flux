/**
 * Schematic symbols for the labs whose circuits read better as a diagram than as a board: wires,
 * resistors, LEDs and a battery, between model points. Model units are arbitrary, y up.
 */
import { C, alpha, label, seg } from './diagram.js';

/** A wire through model points, with optional dots at junctions. */
export function wire(P, pts, { color = alpha(C.text, 0.8), dots = [] } = {}) {
  for (let k = 1; k < pts.length; k += 1) seg(P, pts[k - 1], pts[k], { color, width: 2 });
  for (const d of dots) junction(P, d, color);
}

export function junction(P, at, color = alpha(C.text, 0.8)) {
  const { ctx, X, Y } = P;
  ctx.beginPath();
  ctx.arc(X(at[0]), Y(at[1]), 3.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Rotate the context so that +x runs from a to b, and return the length in pixels. */
function along(P, a, b) {
  const { ctx, X, Y } = P;
  const dx = X(b[0]) - X(a[0]);
  const dy = Y(b[1]) - Y(a[1]);
  ctx.translate(X(a[0]), Y(a[1]));
  ctx.rotate(Math.atan2(dy, dx));
  return Math.hypot(dx, dy);
}

/** A resistor: a zigzag in the middle of the segment a–b, with leads to its ends. */
export function resistor(P, a, b, { text = '', color = C.text, side = 1, vary = false, light = false } = {}) {
  const { ctx } = P;
  ctx.save();
  const L = along(P, a, b);
  const body = Math.min(L * 0.6, 44);
  const x0 = (L - body) / 2;
  const h = 6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(x0, 0);
  for (let k = 0; k < 6; k += 1) ctx.lineTo(x0 + (body * (k + 0.5)) / 6, k % 2 ? h : -h);
  ctx.lineTo(x0 + body, 0);
  ctx.lineTo(L, 0);
  ctx.stroke();
  // A sensor: an arrow through the body (its resistance varies); light falling on it for an LDR.
  if (vary) {
    ctx.beginPath();
    ctx.moveTo(x0 - 2, h + 8);
    ctx.lineTo(x0 + body + 2, -h - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0 + body + 2, -h - 8);
    ctx.lineTo(x0 + body - 6, -h - 6);
    ctx.lineTo(x0 + body - 1, -h + 1);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  if (light) {
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 1.5;
    for (const dx of [0.25, 0.6]) {
      const x = x0 + body * dx;
      ctx.beginPath();
      ctx.moveTo(x - 12, -h - 18);
      ctx.lineTo(x - 2, -h - 6);
      ctx.moveTo(x - 2, -h - 6);
      ctx.lineTo(x - 7, -h - 8);
      ctx.moveTo(x - 2, -h - 6);
      ctx.lineTo(x - 3, -h - 11);
      ctx.stroke();
    }
  }
  ctx.restore();
  if (text) {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const vertical = Math.abs(b[0] - a[0]) < Math.abs(b[1] - a[1]);
    label(P, text, m, vertical ? { color: C.muted, dx: 12 * side, align: side > 0 ? 'left' : 'right' } : { color: C.muted, dy: -14 * side });
  }
}

/**
 * An LED from anode `a` to cathode `b`: a triangle pointing the way current flows, a bar at the
 * cathode, and a glow in the LED's colour that grows with `glow` (1 at its rated current). `open`
 * draws it broken, as a failed part.
 */
export function led(P, a, b, { color = C.red, glow = 0, open = false } = {}) {
  const { ctx } = P;
  ctx.save();
  const L = along(P, a, b);
  const s = Math.min(13, L * 0.3);
  const m = L / 2;
  const g = Math.max(0, Math.min(1.6, glow));
  if (g > 0.01 && !open) {
    const r = s * (1.3 + 1.8 * g);
    const grad = ctx.createRadialGradient(m, 0, s * 0.3, m, 0, r);
    grad.addColorStop(0, alpha(color, Math.min(0.8, 0.3 + 0.4 * g)));
    grad.addColorStop(1, alpha(color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = alpha(C.text, 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(m - s * 0.7, 0);
  ctx.moveTo(m + s * 0.7, 0);
  ctx.lineTo(L, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(m - s * 0.7, -s * 0.8);
  ctx.lineTo(m - s * 0.7, s * 0.8);
  ctx.lineTo(m + s * 0.7, 0);
  ctx.closePath();
  ctx.fillStyle = open ? alpha(C.muted, 0.25) : alpha(color, g > 0.01 ? 0.9 : 0.3);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(m + s * 0.7, -s * 0.8);
  ctx.lineTo(m + s * 0.7, s * 0.8);
  ctx.stroke();
  if (open) {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(m - s, -s);
    ctx.lineTo(m + s, s);
    ctx.moveTo(m - s, s);
    ctx.lineTo(m + s, -s);
    ctx.stroke();
  }
  ctx.restore();
}

/** A battery from − at `a` to + at `b`: a long plate on the + side, a short one on the − side. */
export function battery(P, a, b, { text = '' } = {}) {
  const { ctx } = P;
  ctx.save();
  const L = along(P, a, b);
  const m = L / 2;
  ctx.strokeStyle = alpha(C.text, 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(m - 4, 0);
  ctx.moveTo(m + 4, 0);
  ctx.lineTo(L, 0);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = C.text;
  ctx.beginPath();
  ctx.moveTo(m + 4, -14);
  ctx.lineTo(m + 4, 14);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(m - 4, -7);
  ctx.lineTo(m - 4, 7);
  ctx.stroke();
  ctx.restore();
  if (text) label(P, text, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], { color: C.text, dx: -22, align: 'right' });
}
