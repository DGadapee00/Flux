/**
 * A small 2D plotting kit on Canvas 2D: scales, axes, bars, curves, shaded areas, points.
 * Drawn at the device's pixel ratio so strokes stay sharp on a phone. No dependencies.
 *
 * Colours follow the app's meanings (PLAN.md §3): population / H₀ blue, sample / statistic
 * gold, sampling distribution teal, H₁ / effect pink, Type I red, Type II purple, captured green.
 */
export const C = {
  bg: '#121316',
  text: '#ece6e2',
  muted: '#aaa39e',
  dim: '#8f8983',
  grid: 'rgba(236, 230, 226, 0.07)',
  axis: 'rgba(236, 230, 226, 0.45)',
  blue: '#58c4dd',
  teal: '#5cd0b3',
  gold: '#f0ac5f',
  yellow: '#f4d345',
  pink: '#d147bd',
  red: '#fc6255',
  purple: '#9a72ac',
  green: '#83c167',
};

export const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const FONT = "11px Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
const FONT_LABEL = "italic 12px Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";

/** Size the backing store to CSS size × DPR; returns a context in CSS pixels. */
export function setup(canvas) {
  const dpr = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 3);
  const w = canvas.clientWidth || 360;
  const h = canvas.clientHeight || 270;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return { ctx, w, h };
}

/** A linear map from a data interval to a pixel interval, with its inverse. */
export function scale(d0, d1, r0, r1) {
  const k = (r1 - r0) / (d1 - d0 || 1);
  const f = (v) => r0 + (v - d0) * k;
  f.invert = (p) => d0 + (p - r0) / k;
  f.domain = [d0, d1];
  f.range = [r0, r1];
  return f;
}

/** Round tick values covering [lo, hi], about `count` of them. */
export function ticks(lo, hi, count = 5) {
  if (!(hi > lo)) return [lo];
  const raw = (hi - lo) / count;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  const step = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  const out = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(Number(v.toPrecision(12)));
  return out;
}

const fmtTick = (v) => {
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) return v.toExponential(0);
  return String(Number(v.toPrecision(6))).replace('-', '−');
};

/**
 * A plot area: margins inside the canvas and the x and y scales for it. `y` may be omitted for
 * a plot with no vertical axis (a density drawn to fit).
 */
export function area(w, h, { x, y, left = 40, right = 12, top = 20, bottom = 36 }) {
  const box = { x0: left, x1: w - right, y0: top, y1: h - bottom };
  return { ...box, x: scale(x[0], x[1], box.x0, box.x1), y: y ? scale(y[0], y[1], box.y1, box.y0) : null, w, h };
}

/** Axes, grid and tick labels. */
export function axes(ctx, A, { xTicks = true, yTicks = true, xLabel = '', yLabel = '', xFmt = fmtTick, yFmt = fmtTick, xCount = 6, yCount = 4 } = {}) {
  ctx.font = FONT;
  ctx.lineWidth = 1;
  if (yTicks && A.y) {
    for (const v of ticks(A.y.domain[0], A.y.domain[1], yCount)) {
      const py = A.y(v);
      ctx.strokeStyle = C.grid;
      ctx.beginPath();
      ctx.moveTo(A.x0, py);
      ctx.lineTo(A.x1, py);
      ctx.stroke();
      ctx.fillStyle = C.dim;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(yFmt(v), A.x0 - 5, py);
    }
  }
  ctx.strokeStyle = C.axis;
  ctx.beginPath();
  ctx.moveTo(A.x0, A.y1 + 0.5);
  ctx.lineTo(A.x1, A.y1 + 0.5);
  ctx.stroke();
  if (A.y && yTicks) {
    ctx.beginPath();
    ctx.moveTo(A.x0 - 0.5, A.y0);
    ctx.lineTo(A.x0 - 0.5, A.y1);
    ctx.stroke();
  }
  if (xTicks) {
    const list = Array.isArray(xTicks) ? xTicks : ticks(A.x.domain[0], A.x.domain[1], xCount);
    ctx.fillStyle = C.dim;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const v of list) {
      const px = A.x(v);
      if (px < A.x0 - 1 || px > A.x1 + 1) continue;
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(px, A.y1);
      ctx.lineTo(px, A.y1 + 4);
      ctx.stroke();
      ctx.fillText(xFmt(v), px, A.y1 + 6);
    }
  }
  ctx.font = FONT_LABEL;
  ctx.fillStyle = C.muted;
  if (xLabel) {
    // Under the tick labels, not beside them: at the right end it would sit on the last tick.
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(xLabel, A.x1, A.y1 + 20);
  }
  if (yLabel) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(yLabel, 4, 1);
  }
}

/** Bars from [x0, x1, height] triples. */
export function bars(ctx, A, list, { fill = alpha(C.blue, 0.55), stroke = null, gap = 0 } = {}) {
  for (const [a, b, v, f] of list) {
    const px0 = A.x(a) + gap / 2;
    const px1 = A.x(b) - gap / 2;
    const py = A.y(v);
    ctx.fillStyle = f || fill;
    ctx.fillRect(px0, py, Math.max(0.5, px1 - px0), A.y(0) - py);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(px0 + 0.5, py + 0.5, Math.max(0, px1 - px0 - 1), A.y(0) - py - 1);
    }
  }
}

/** A function curve y = fn(x) over [lo, hi]. Non-finite values break the line. */
export function curve(ctx, A, fn, lo = A.x.domain[0], hi = A.x.domain[1], { color = C.teal, width = 2, dash = null, n = 240 } = {}) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash || []);
  ctx.beginPath();
  let on = false;
  for (let i = 0; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n;
    const y = fn(x);
    if (!Number.isFinite(y)) {
      on = false;
      continue;
    }
    const py = Math.max(A.y0 - 2, Math.min(A.y1, A.y(y)));
    if (on) ctx.lineTo(A.x(x), py);
    else ctx.moveTo(A.x(x), py);
    on = true;
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Fill the area under y = fn(x) between a and b. */
export function shade(ctx, A, fn, a, b, fill, n = 160) {
  const lo = Math.max(a, A.x.domain[0]);
  const hi = Math.min(b, A.x.domain[1]);
  if (!(hi > lo)) return;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(A.x(lo), A.y(0));
  for (let i = 0; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n;
    const y = fn(x);
    ctx.lineTo(A.x(x), Math.max(A.y0 - 2, A.y(Number.isFinite(y) ? y : 0)));
  }
  ctx.lineTo(A.x(hi), A.y(0));
  ctx.closePath();
  ctx.fill();
}

/** A vertical marker line with an optional label at the top. */
export function vline(ctx, A, x, { color = C.text, dash = [4, 4], label = '', width = 1.5, align = 'center' } = {}) {
  const px = A.x(x);
  if (px < A.x0 - 1 || px > A.x1 + 1) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash || []);
  ctx.beginPath();
  ctx.moveTo(px, A.y0);
  ctx.lineTo(px, A.y1);
  ctx.stroke();
  ctx.setLineDash([]);
  if (label) {
    // Beside the line, not on it: to its right, or to its left near the right edge.
    ctx.font = FONT;
    ctx.fillStyle = color;
    const right = px > A.x1 - 60;
    ctx.textAlign = right ? 'right' : 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, right ? px - 5 : px + 5, Math.max(1, A.y0 - 15));
  }
}

/** A line segment in data coordinates. */
export function segment(ctx, A, x0, y0, x1, y1, { color = C.text, width = 1.5, dash = null } = {}) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash || []);
  ctx.beginPath();
  ctx.moveTo(A.x(x0), A.y(y0));
  ctx.lineTo(A.x(x1), A.y(y1));
  ctx.stroke();
  ctx.setLineDash([]);
}

export function dot(ctx, A, x, y, { color = C.blue, r = 4, ring = null } = {}) {
  ctx.beginPath();
  ctx.arc(A.x(x), A.y(y), r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (ring) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = ring;
    ctx.stroke();
  }
}

/** Text at a data point, or at pixel coordinates with `px`. */
export function label(ctx, text, x, y, { color = C.muted, align = 'left', baseline = 'alphabetic', font = FONT } = {}) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

/** Counts of `values` in `bins` equal-width bins over [lo, hi]; values outside are dropped. */
export function histogram(values, lo, hi, nbins) {
  const counts = new Float64Array(nbins);
  const k = nbins / (hi - lo);
  for (let i = 0; i < values.length; i++) {
    const j = Math.floor((values[i] - lo) * k);
    if (j >= 0 && j < nbins) counts[j]++;
    else if (values[i] === hi) counts[nbins - 1]++;
  }
  return counts;
}

/** Mean and standard deviation (n − 1) of a typed array. */
export function meanSd(values) {
  let s = 0;
  for (let i = 0; i < values.length; i++) s += values[i];
  const m = s / values.length;
  let v = 0;
  for (let i = 0; i < values.length; i++) v += (values[i] - m) ** 2;
  return { mean: m, sd: Math.sqrt(v / (values.length - 1)) };
}
