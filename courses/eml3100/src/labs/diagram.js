/**
 * Drawing for the property diagrams: linear or logarithmic axes, polylines, a filled area, dots and
 * labels, inside the part of the screen the panels leave open. Built on @flux/core/plot2d.
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

/**
 * Size the canvas and lay out a plot inside the free rectangle.
 * `x` and `y` are { lo, hi, log }. Returns the context and the maps X and Y.
 */
export function layout(canvas, x, y, pad = { left: 52, right: 14, top: 26, bottom: 40 }) {
  const { ctx, w, h } = setup(canvas);
  const free = freeRect(w, h);
  const box = { x0: free.x0 + pad.left, x1: free.x1 - pad.right, y0: free.y0 + pad.top, y1: free.y1 - pad.bottom };
  // Recorded for the smoke test, which checks that no panel covers the plot.
  if (canvas.dataset) canvas.dataset.box = [box.x0 - pad.left, box.y0 - pad.top, box.x1 + pad.right, box.y1 + pad.bottom].map(Math.round).join(',');
  const X = axisMap(x.lo, x.hi, box.x0, box.x1, !!x.log);
  const Y = axisMap(y.lo, y.hi, box.y1, box.y0, !!y.log);
  ctx.save();
  ctx.fillStyle = alpha(C.bg, 0.55);
  ctx.fillRect(free.x0, free.y0, free.x1 - free.x0, free.y1 - free.y0);
  ctx.restore();
  return { ctx, w, h, free, box, X, Y };
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
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(Number(v.toPrecision(10)));
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
export function axes(P, { xLabel = '', yLabel = '', xFmt = fmtTick, yFmt = fmtTick, yCount = 5 } = {}) {
  const { ctx, box, X, Y } = P;
  ctx.font = FONT;
  ctx.lineWidth = 1;
  for (const v of tickValues(Y, yCount)) {
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
 * Open the stage once: size the canvas, record the free rectangle for the smoke check, and shade it.
 * A later chart must not call `layout`, which clears the canvas again.
 */
export function stage(canvas) {
  const { ctx, w, h } = setup(canvas);
  const free = freeRect(w, h);
  if (canvas.dataset) canvas.dataset.box = [free.x0, free.y0, free.x1, free.y1].map(Math.round).join(',');
  ctx.save();
  ctx.fillStyle = alpha(C.bg, 0.55);
  ctx.fillRect(free.x0, free.y0, free.x1 - free.x0, free.y1 - free.y0);
  ctx.restore();
  return { ctx, w, h, free };
}

/** Machine on the left when the free rectangle is wide, otherwise the machine above the chart. */
export function panes(free, share = 0.62) {
  const W = free.x1 - free.x0;
  const H = free.y1 - free.y0;
  const gap = 8;
  if (W > H * 1.35 && W > 680) {
    const xm = free.x0 + W * share;
    return [{ ...free, x1: xm - gap / 2 }, { ...free, x0: xm + gap / 2 }];
  }
  const ym = free.y0 + H * share;
  return [{ ...free, y1: ym - gap / 2 }, { ...free, y0: ym + gap / 2 }];
}

/** One scale for both axes, y up, so a drawn machine keeps its shape. */
export function fit(ctx, rect, bounds, pad = 10) {
  const box = {
    x0: rect.x0 + pad,
    x1: rect.x1 - pad,
    y0: rect.y0 + pad,
    y1: rect.y1 - pad,
  };
  const bw = Math.max(1, box.x1 - box.x0);
  const bh = Math.max(1, box.y1 - box.y0);
  const k = Math.min(bw / (bounds.x1 - bounds.x0), bh / (bounds.y1 - bounds.y0));
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  const mx = (bounds.x0 + bounds.x1) / 2;
  const my = (bounds.y0 + bounds.y1) / 2;
  const X = (v) => cx + (v - mx) * k;
  const Y = (v) => cy - (v - my) * k;
  return { ctx, box, rect, X, Y, k };
}

/** A chart inside `rect`. The return value is what `axes`, `line` and `dot` already take. */
export function chart(ctx, rect, x, y, pad = { left: 46, right: 12, top: 16, bottom: 34 }) {
  const box = {
    x0: rect.x0 + pad.left,
    x1: Math.max(rect.x0 + pad.left + 8, rect.x1 - pad.right),
    y0: rect.y0 + pad.top,
    y1: Math.max(rect.y0 + pad.top + 8, rect.y1 - pad.bottom),
  };
  const X = axisMap(x.lo, x.hi, box.x0, box.x1, !!x.log);
  const Y = axisMap(y.lo, y.hi, box.y1, box.y0, !!y.log);
  return { ctx, box, X, Y, free: rect };
}

/** Clip following draws to a pane. */
export function clip(ctx, rect) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x0, rect.y0, Math.max(0, rect.x1 - rect.x0), Math.max(0, rect.y1 - rect.y0));
  ctx.clip();
}
