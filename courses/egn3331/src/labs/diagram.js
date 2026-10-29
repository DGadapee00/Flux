/**
 * Drawing for the labs: a chart (linear or logarithmic axes, polylines, a filled area, dots, labels)
 * and a to-scale drawing (segments, polygons, arrows), inside the part of the screen the panels leave
 * open. Built on @flux/core/plot2d.
 */
import { C, alpha, setup } from '@flux/core/plot2d/plot.js';

export { C, alpha };

const FONT = "11px Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
const FONT_AXIS = "italic 12px Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";

function visible(sel) {
  const el = document.querySelector(sel);
  if (!el || el.hidden) return null;
  const s = getComputedStyle(el);
  if (s.display === 'none' || s.visibility === 'hidden') return null;
  const r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1 ? r : null;
}

/**
 * The rectangle of the canvas no panel covers, in CSS pixels. On a phone that is the band between
 * the header and the bottom sheet; on a desktop, the space between the two columns and above the
 * readout bar.
 */
export function freeRect(w, h) {
  if (typeof document === 'undefined') return { x0: 0, y0: 0, x1: w, y1: h };
  const gap = 10;
  let x0 = gap;
  let x1 = w - gap;
  let y0 = gap;
  let y1 = h - gap;
  if (w <= 720) {
    const head = visible('.brand');
    if (head) y0 = head.bottom + gap;
    const feet = ['#toggles', '#btn-sheet', '#controls', '#eq-panel', '#readout', '#problems'].map(visible).filter(Boolean);
    for (const r of feet) if (r.top > y0 + 40) y1 = Math.min(y1, r.top - gap);
  } else {
    for (const sel of ['.brand', '#eq-panel', '#problems']) {
      const r = visible(sel);
      if (r && r.left < w / 2) x0 = Math.max(x0, r.right + gap);
    }
    const right = visible('#controls');
    if (right) x1 = Math.min(x1, right.left - gap);
    const tog = visible('#toggles');
    if (tog && tog.left < x1 && tog.right > x0) y0 = Math.max(y0, tog.bottom + gap);
    const bar = visible('#readout');
    if (bar && bar.left < x1 && bar.right > x0) y1 = Math.min(y1, bar.top - gap);
    const hint = visible('#hint-bar');
    if (hint) y1 = Math.min(y1, hint.top - gap);
  }
  if (x1 - x0 < 160) {
    x0 = gap;
    x1 = w - gap;
  }
  if (y1 - y0 < 140) {
    y0 = h * 0.25;
    y1 = h * 0.62;
  }
  return { x0, y0, x1, y1 };
}

/** One axis: a map from data to pixels, log or linear. */
function axisMap(lo, hi, p0, p1, log) {
  const f = log ? Math.log10 : (v) => v;
  const a = f(lo);
  const b = f(hi);
  const map = (v) => p0 + ((f(v) - a) / (b - a || 1)) * (p1 - p0);
  map.invert = (p) => {
    const t = a + ((p - p0) / (p1 - p0)) * (b - a);
    return log ? 10 ** t : t;
  };
  map.lo = lo;
  map.hi = hi;
  map.log = log;
  return map;
}

/** Size and clear the canvas, shade the free rectangle, and return it. */
export function begin(canvas) {
  const { ctx, w, h } = setup(canvas);
  const free = freeRect(w, h);
  ctx.save();
  ctx.fillStyle = alpha(C.bg, 0.55);
  ctx.fillRect(free.x0, free.y0, free.x1 - free.x0, free.y1 - free.y0);
  ctx.restore();
  // Recorded for the smoke test, which checks that no panel covers the drawing.
  if (canvas.dataset) canvas.dataset.box = [free.x0, free.y0, free.x1, free.y1].map(Math.round).join(',');
  return { canvas, ctx, w, h, free };
}

/**
 * Split the free rectangle into a drawing and a chart: side by side when the space is wide,
 * stacked when it is tall. `share` is the drawing's part.
 */
export function split(free, share = 0.5) {
  const W = free.x1 - free.x0;
  const H = free.y1 - free.y0;
  if (W > 1.5 * H && W > 560) {
    const xm = free.x0 + W * share;
    return [{ ...free, x1: xm }, { ...free, x0: xm }];
  }
  const ym = free.y0 + H * share;
  return [{ ...free, y1: ym }, { ...free, y0: ym }];
}

/** A chart inside `rect`. `x` and `y` are { lo, hi, log }. */
export function plotIn(B, rect, x, y, pad = { left: 52, right: 14, top: 26, bottom: 40 }) {
  const box = { x0: rect.x0 + pad.left, x1: rect.x1 - pad.right, y0: rect.y0 + pad.top, y1: rect.y1 - pad.bottom };
  const X = axisMap(x.lo, x.hi, box.x0, box.x1, !!x.log);
  const Y = axisMap(y.lo, y.hi, box.y1, box.y0, !!y.log);
  return { ctx: B.ctx, w: B.w, h: B.h, free: rect, box, X, Y };
}

/**
 * A drawing inside `rect`, one scale for both axes so shapes keep their proportions.
 * `bounds` is { x0, x1, y0, y1 } in model units, y up.
 */
export function sceneIn(B, rect, bounds, pad = 18) {
  const box = { x0: rect.x0 + pad, x1: rect.x1 - pad, y0: rect.y0 + pad, y1: rect.y1 - pad };
  const k = Math.min((box.x1 - box.x0) / (bounds.x1 - bounds.x0), (box.y1 - box.y0) / (bounds.y1 - bounds.y0));
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  const mx = (bounds.x0 + bounds.x1) / 2;
  const my = (bounds.y0 + bounds.y1) / 2;
  const X = (v) => cx + (v - mx) * k;
  const Y = (v) => cy - (v - my) * k;
  return { ctx: B.ctx, w: B.w, h: B.h, free: rect, box, X, Y, k };
}

/** Size the canvas and lay out one chart in the whole free rectangle. */
export function layout(canvas, x, y, pad) {
  const B = begin(canvas);
  return plotIn(B, B.free, x, y, pad);
}

/** A filled and stroked polygon through model points. */
export function poly(P, pts, { fill = null, stroke = C.text, width = 1.5, dash = null } = {}) {
  const { ctx, X, Y } = P;
  ctx.save();
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.setLineDash(dash || []);
    ctx.stroke();
  }
  ctx.restore();
}

/** A straight segment between two model points, in pixels' width. */
export function seg(P, a, b, { color = C.text, width = 2, dash = null } = {}) {
  const { ctx, X, Y } = P;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash || []);
  ctx.beginPath();
  ctx.moveTo(X(a[0]), Y(a[1]));
  ctx.lineTo(X(b[0]), Y(b[1]));
  ctx.stroke();
  ctx.restore();
}

/** An arrow of `len` pixels from a model point, along the angle `ang` (radians, y up). */
export function arrow(P, at, ang, len, { color = C.pink, width = 2.5, head = 9, tail = false } = {}) {
  const { ctx, X, Y } = P;
  const x0 = X(at[0]);
  const y0 = Y(at[1]);
  const dx = Math.cos(ang);
  const dy = -Math.sin(ang);
  // tail: the arrow ends at the point; otherwise it starts there.
  const sx = tail ? x0 - dx * len : x0;
  const sy = tail ? y0 - dy * len : y0;
  const ex = sx + dx * len;
  const ey = sy + dy * len;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex - dx * head * 0.8, ey - dy * head * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - dx * head - dy * head * 0.45, ey - dy * head + dx * head * 0.45);
  ctx.lineTo(ex - dx * head + dy * head * 0.45, ey - dy * head - dx * head * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Text at a model point, offset in pixels. */
export function label(P, text, at, { color = C.muted, dx = 0, dy = 0, align = 'center', base = 'middle', bold = false } = {}) {
  const { ctx, X, Y } = P;
  ctx.save();
  ctx.font = bold ? FONT.replace('11px', '600 12px') : FONT;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillText(text, X(at[0]) + dx, Y(at[1]) + dy);
  ctx.restore();
}

/** Tick values: decades and their 2 and 5 multiples on a log axis, round steps on a linear one. */
export function tickValues(map, count = 5) {
  const { lo, hi } = map;
  if (map.log) {
    const out = [];
    const span = Math.log10(hi / lo);
    const mult = span > 4 ? [1] : span > 2 ? [1, 3] : [1, 2, 5];
    for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) {
      for (const m of mult) {
        const v = m * 10 ** e;
        if (v >= lo * (1 - 1e-9) && v <= hi * (1 + 1e-9)) out.push(Number(v.toPrecision(6)));
      }
    }
    return out;
  }
  const raw = (hi - lo) / count;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  const step = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  const out = [];
  const start = Math.ceil(lo / step - 1e-9);
  const end = Math.floor((hi + step * 1e-9) / step);
  for (let i = start; i <= end; i++) {
    const v = i * step;
    out.push(Math.abs(v) <= step * 1e-8 ? 0 : Number(v.toPrecision(10)));
  }
  return out;
}

export function fmtTick(v) {
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) {
    const e = Math.floor(Math.log10(a));
    const m = v / 10 ** e;
    return Math.abs(m - 1) < 1e-9 ? `1e${e}` : `${Number(m.toPrecision(2))}e${e}`;
  }
  return String(Number(v.toPrecision(4))).replace('-', '−');
}

/** Grid, axes and tick labels. */
export function axes(P, { xLabel = '', yLabel = '', xFmt = fmtTick, yFmt = fmtTick } = {}) {
  const { ctx, box, X, Y } = P;
  ctx.font = FONT;
  ctx.lineWidth = 1;
  // A short chart gets fewer ticks, so the labels never touch.
  for (const v of tickValues(Y, Math.max(2, Math.min(5, Math.floor((box.y1 - box.y0) / 30))))) {
    const py = Y(v);
    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    ctx.moveTo(box.x0, py);
    ctx.lineTo(box.x1, py);
    ctx.stroke();
    ctx.fillStyle = C.dim;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(yFmt(v), box.x0 - 5, py);
  }
  const xt = tickValues(X, Math.max(3, Math.floor((box.x1 - box.x0) / 70)));
  for (const v of xt) {
    const px = X(v);
    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    ctx.moveTo(px, box.y0);
    ctx.lineTo(px, box.y1);
    ctx.stroke();
    ctx.fillStyle = C.dim;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(xFmt(v), px, box.y1 + 6);
  }
  ctx.strokeStyle = C.axis;
  ctx.beginPath();
  ctx.moveTo(box.x0, box.y0);
  ctx.lineTo(box.x0, box.y1);
  ctx.lineTo(box.x1, box.y1);
  ctx.stroke();
  ctx.font = FONT_AXIS;
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(xLabel, box.x1, box.y1 + 22);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(yLabel, box.x0 - 40, box.y0 - 8);
}

/** A polyline through [x, y] points; null breaks it. Points outside the box are clipped. */
export function line(P, pts, { color = C.teal, width = 2, dash = null } = {}) {
  const { ctx, box, X, Y } = P;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x0, box.y0 - 2, box.x1 - box.x0, box.y1 - box.y0 + 4);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash || []);
  ctx.beginPath();
  let on = false;
  for (const p of pts) {
    if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) {
      on = false;
      continue;
    }
    const px = X(p[0]);
    const py = Y(p[1]);
    if (on) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
    on = true;
  }
  ctx.stroke();
  ctx.restore();
}

/** Fill between a polyline and the x axis (y = Y.lo). */
export function fillUnder(P, pts, fill) {
  const { ctx, box, X, Y } = P;
  const good = pts.filter((p) => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (good.length < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
  ctx.clip();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(X(good[0][0]), box.y1);
  for (const p of good) ctx.lineTo(X(p[0]), Y(p[1]));
  ctx.lineTo(X(good[good.length - 1][0]), box.y1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function dot(P, x, y, { color = C.yellow, r = 5, ring = null } = {}) {
  const { ctx, X, Y } = P;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(X(x), Y(y), r, 0, 2 * Math.PI);
  ctx.fill();
  if (ring) {
    ctx.strokeStyle = ring;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(X(x), Y(y), r + 3, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

/** Text at a data point, nudged by (dx, dy) pixels and kept inside the box. */
export function note(P, text, x, y, { color = C.muted, dx = 6, dy = -6, align = 'left' } = {}) {
  const { ctx, box, X, Y } = P;
  ctx.font = FONT;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  const wText = ctx.measureText(text).width;
  let px = X(x) + dx;
  if (align === 'left') px = Math.min(px, box.x1 - wText - 2);
  if (align === 'right') px = Math.max(px, box.x0 + wText + 2);
  const py = Math.min(Math.max(Y(y) + dy, box.y0 + 10), box.y1 - 4);
  ctx.fillText(text, px, py);
}
/**
 * A vector drawn to a scale: `v` is [vx, vy] in model units, `k` pixels per unit. Nothing is drawn
 * for a vector shorter than two pixels. `label` is written just past the head.
 */
export function vec(P, at, v, k, { color = C.text, width = 2.5, head = 8, label: text = null, dash = null } = {}) {
  const len = Math.hypot(v[0], v[1]) * k;
  if (!(len > 2)) return;
  const ang = Math.atan2(v[1], v[0]);
  if (dash) {
    const { ctx, X, Y } = P;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width - 0.5;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(X(at[0]), Y(at[1]));
    ctx.lineTo(X(at[0]) + Math.cos(ang) * len, Y(at[1]) - Math.sin(ang) * len);
    ctx.stroke();
    ctx.restore();
  } else {
    arrow(P, at, ang, len, { color, width, head: Math.min(head, len * 0.6) });
  }
  if (text) {
    const { ctx, X, Y } = P;
    ctx.save();
    ctx.font = FONT;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, X(at[0]) + Math.cos(ang) * (len + 11), Y(at[1]) - Math.sin(ang) * (len + 11));
    ctx.restore();
  }
}

/** A circle of radius `r` model units about a model point. */
export function circle(P, at, r, { stroke = C.text, fill = null, width = 1.5, dash = null } = {}) {
  const { ctx, X, Y, k } = P;
  ctx.save();
  ctx.beginPath();
  ctx.arc(X(at[0]), Y(at[1]), Math.max(0.5, r * k), 0, 2 * Math.PI);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.setLineDash(dash || []);
    ctx.stroke();
  }
  ctx.restore();
}

/** A chart in `rect` whose margins shrink when the space is short, as on a phone. */
export function chartIn(B, rect, x, y) {
  const H = rect.y1 - rect.y0;
  const pad = H < 220 ? { left: 40, right: 10, top: 14, bottom: 26 } : { left: 52, right: 14, top: 26, bottom: 40 };
  return plotIn(B, rect, x, y, pad);
}

/**
 * Whether the lab's numbers are hidden: a practice problem not yet solved, or "Work it first".
 * A 2D lab leaves its value-bearing charts and labels out while this is true.
 */
export function hidden() {
  if (typeof document === 'undefined') return false;
  const b = document.body.classList;
  return b.contains('problem-blind') || b.contains('work-first');
}

/*
 * Structural symbols for the member drawings. Sizes are in pixels, so a support reads the same
 * whatever the member's scale; positions are model points.
 */

/** A pin: a triangle under the point, on a hatched ground line. */
export function pinSupport(P, at, { size = 12, color = C.muted } = {}) {
  const { ctx, X, Y } = P;
  const x = X(at[0]);
  const y = Y(at[1]);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = alpha(color, 0.18);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * 0.75, y + size);
  ctx.lineTo(x + size * 0.75, y + size);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  hatch(ctx, x - size, x + size, y + size, color);
  ctx.restore();
}

/** A roller: a triangle on two wheels, free to slide along the ground. */
export function rollerSupport(P, at, { size = 12, color = C.muted } = {}) {
  const { ctx, X, Y } = P;
  const x = X(at[0]);
  const y = Y(at[1]);
  const h = size * 0.7;
  const r = size * 0.18;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = alpha(color, 0.18);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * 0.7, y + h);
  ctx.lineTo(x + size * 0.7, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const dx of [-size * 0.4, size * 0.4]) {
    ctx.beginPath();
    ctx.arc(x + dx, y + h + r, r, 0, 2 * Math.PI);
    ctx.stroke();
  }
  hatch(ctx, x - size, x + size, y + h + 2 * r, color);
  ctx.restore();
}

/** A fixed wall: a thick line from y0 to y1 at x, hatched on the side away from the member. */
export function wall(P, x, y0, y1, { side = -1, color = C.muted } = {}) {
  const { ctx, X, Y } = P;
  const px = X(x);
  const a = Y(y0);
  const b = Y(y1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(px, a);
  ctx.lineTo(px, b);
  ctx.stroke();
  ctx.lineWidth = 1;
  const top = Math.min(a, b);
  const bot = Math.max(a, b);
  for (let y = top; y <= bot; y += 7) {
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + side * 7, y + 7);
    ctx.stroke();
  }
  ctx.restore();
}

function hatch(ctx, x0, x1, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.lineWidth = 1;
  for (let x = x0 + 2; x < x1; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 5, y + 5);
    ctx.stroke();
  }
}

/**
 * A distributed load from x0 to x1 resting on a line at height y: arrows `px` pixels long,
 * pointing down for a positive load, joined along their tails.
 */
export function spread(P, x0, x1, y, { px = 22, color = C.pink, label: text = null, n = null } = {}) {
  const { ctx, X, Y } = P;
  const a = X(x0);
  const b = X(x1);
  if (!(b - a > 2)) return;
  const count = n ?? Math.max(3, Math.round((b - a) / 26));
  const base = Y(y);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(a, base - px);
  ctx.lineTo(b, base - px);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i <= count; i++) {
    const x = x0 + ((x1 - x0) * i) / count;
    arrow(P, [x, y], -Math.PI / 2, px, { color, width: 1.5, head: 6, tail: true });
  }
  if (text) label(P, text, [(x0 + x1) / 2, y], { color, dy: -px - 9 });
}

/** A couple: an arc of radius `r` pixels about a model point, counterclockwise when ccw. */
export function couple(P, at, { r = 16, ccw = true, color = C.pink, label: text = null } = {}) {
  const { ctx, X, Y } = P;
  const x = X(at[0]);
  const y = Y(at[1]);
  const a0 = Math.PI * 0.15;
  const a1 = Math.PI * 1.55;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, -a1, -a0, false);
  ctx.stroke();
  // The head sits at the end the rotation runs toward.
  const end = ccw ? -a1 : -a0;
  const hx = x + r * Math.cos(end);
  const hy = y + r * Math.sin(end);
  const tang = ccw ? end - Math.PI / 2 : end + Math.PI / 2;
  const tx = Math.cos(tang);
  const ty = Math.sin(tang);
  ctx.beginPath();
  ctx.moveTo(hx + tx * 7, hy + ty * 7);
  ctx.lineTo(hx - ty * 4, hy + tx * 4);
  ctx.lineTo(hx + ty * 4, hy - tx * 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (text) label(P, text, at, { color, dy: -r - 9 });
}
