const BLUE = '#58C4DD';
const YELLOW = '#F4D345';
const GOLD = '#F0AC5F';
// The scene palette (Q in src/scene/manim.js): current is gold, a capacitor is purple, a marked point (A) purple.
const CURRENT = GOLD;
const CAP = '#9A72AC';
const MARK = '#9A72AC';
const RED = '#FC6255';
const WHITE = '#ECE6E2';
const SERIF = "italic 13px KaTeX_Math, 'Latin Modern Math', 'Cambria Math', serif";

/** Resize the backing store to CSS size × DPR so strokes stay crisp; returns a context in CSS pixels. */
function setup(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = canvas.clientWidth || 300;
  const h = canvas.clientHeight || 96;
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

function axes(ctx, w, h, y0, nTicks) {
  ctx.strokeStyle = 'rgba(41,171,202,0.22)';
  ctx.lineWidth = 1;
  for (let i = 1; i < nTicks; i++) {
    const X = 12 + (i / nTicks) * (w - 24);
    ctx.beginPath();
    ctx.moveTo(X, 6);
    ctx.lineTo(X, h - 6);
    ctx.stroke();
  }
  ctx.strokeStyle = WHITE;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(12, y0);
  ctx.lineTo(w - 10, y0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - 10, y0);
  ctx.lineTo(w - 16, y0 - 3.5);
  ctx.lineTo(w - 16, y0 + 3.5);
  ctx.closePath();
  ctx.fillStyle = WHITE;
  ctx.fill();
  for (let i = 1; i < nTicks; i++) {
    const X = 12 + (i / nTicks) * (w - 24);
    ctx.beginPath();
    ctx.moveTo(X, y0 - 3);
    ctx.lineTo(X, y0 + 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function dot(ctx, x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0b0c0e';
  ctx.stroke();
}

export function drawVx(canvas, xs, Vs, probeX, pathAx) {
  if (!canvas) return;
  const { ctx, w, h } = setup(canvas);
  if (!Vs.length) return;
  let vmin = Math.min(...Vs, 0);
  let vmax = Math.max(...Vs, 0);
  if (vmax - vmin < 1e-6) {
    vmax += 1;
    vmin -= 1;
  }
  const xmin = xs[0];
  const xmax = xs[xs.length - 1];
  const xmap = (x) => ((x - xmin) / (xmax - xmin)) * (w - 24) + 12;
  const ymap = (v) => h - 10 - ((v - vmin) / (vmax - vmin)) * (h - 22);
  axes(ctx, w, h, ymap(0), 8);

  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < xs.length; i++) {
    const X = xmap(xs[i]);
    const Y = ymap(Vs[i]);
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  }
  ctx.stroke();

  const bx = xmap(probeX);
  const by = ymap(Vs[nearest(xs, probeX)]);
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = 'rgba(236,230,226,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx, ymap(0));
  ctx.stroke();
  ctx.setLineDash([]);
  dot(ctx, bx, by, YELLOW);
  if (pathAx != null) dot(ctx, xmap(pathAx), ymap(Vs[nearest(xs, pathAx)]), MARK);

  ctx.fillStyle = WHITE;
  ctx.font = SERIF;
  ctx.fillText('V(x)', 14, 16);
}

export function drawAC(canvas, pwr, t) {
  if (!canvas) return;
  const { ctx, w, h } = setup(canvas);
  const Vp = pwr.Vrms * Math.SQRT2;
  const Ip = Vp / pwr.R;
  const f = pwr.f;
  const T = 1 / f;
  const n = 120;
  axes(ctx, w, h, h / 2, 8);

  const curve = (color, fn) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const tt = t - T + (i / n) * T;
      const X = 12 + (i / n) * (w - 24);
      const Y = h / 2 - fn(tt) * (h / 2 - 12);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  };
  curve(BLUE, (tt) => Math.sin(2 * Math.PI * f * tt));
  curve(RED, (tt) => {
    const s = Math.sin(2 * Math.PI * f * tt);
    return (Ip * Vp * s * s) / (Ip * Vp || 1);
  });

  // P_avg = half the peak of P(t)
  const yAvg = h / 2 - 0.5 * (h / 2 - 12);
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = RED;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(12, yAvg);
  ctx.lineTo(w - 12, yAvg);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  ctx.font = SERIF;
  ctx.fillStyle = BLUE;
  ctx.fillText('V(t)', 14, 16);
  ctx.fillStyle = RED;
  ctx.fillText('P(t)', 52, 16);
  ctx.globalAlpha = 0.8;
  ctx.fillText('P avg', w - 50, yAvg - 4);
  ctx.globalAlpha = 1;
}

/** One slow-motion cycle of v(t) (blue) and i(t) (gold), current lagging by φ. */
export function drawVI(canvas, { omega, phi, t }) {
  if (!canvas) return;
  const { ctx, w, h } = setup(canvas);
  const f = omega / (2 * Math.PI);
  const T = 1 / f;
  const n = 120;
  axes(ctx, w, h, h / 2, 8);
  const curve = (color, fn) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const tt = t - T + (i / n) * T;
      const X = 12 + (i / n) * (w - 24);
      const Y = h / 2 - fn(tt) * (h / 2 - 12);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  };
  curve(BLUE, (tt) => Math.sin(omega * tt));
  curve(CURRENT, (tt) => Math.sin(omega * tt - phi));
  ctx.font = SERIF;
  ctx.fillStyle = BLUE;
  ctx.fillText('V(t)', 14, 16);
  ctx.fillStyle = CURRENT;
  ctx.fillText('I(t)', 52, 16);
}

function nearest(xs, x) {
  let best = 0;
  let d = Infinity;
  for (let i = 0; i < xs.length; i++) {
    const dd = Math.abs(xs[i] - x);
    if (dd < d) {
      d = dd;
      best = i;
    }
  }
  return best;
}

/**
 * The Paschen curve, log–log, with the operating point on it.
 *
 * Log axes because the interesting part spans four decades of p·d, and because the minimum — the
 * whole reason the curve is worth drawing — is invisible on linear axes.
 */
export function drawPaschen(canvas, { curve, pd, V, min, sparks }) {
  if (!canvas || !curve?.length) return;
  const { ctx, w, h } = setup(canvas);
  const L = 26;
  const R = 8;
  const T = 8;
  const B = 14;
  const xs = curve.map((q) => Math.log10(q.pd));
  const ys = curve.map((q) => Math.log10(q.V));
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys, Math.log10(Math.max(V, 1)));
  const X = (lg) => L + ((lg - x0) / (x1 - x0 || 1)) * (w - L - R);
  const Y = (lg) => h - B - ((lg - y0) / (y1 - y0 || 1)) * (h - T - B);

  // Decade gridlines.
  ctx.strokeStyle = 'rgba(41,171,202,0.18)';
  ctx.lineWidth = 1;
  for (let d = Math.ceil(x0); d <= Math.floor(x1); d++) {
    ctx.beginPath();
    ctx.moveTo(X(d), T);
    ctx.lineTo(X(d), h - B);
    ctx.stroke();
  }

  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  curve.forEach((q, i) => (i ? ctx.lineTo(X(xs[i]), Y(ys[i])) : ctx.moveTo(X(xs[i]), Y(ys[i]))));
  ctx.stroke();

  // The minimum, which is the feature worth naming.
  if (min) {
    ctx.strokeStyle = 'rgba(244,211,69,0.5)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(X(Math.log10(min.pd)), Y(Math.log10(min.V)));
    ctx.lineTo(X(Math.log10(min.pd)), h - B);
    ctx.stroke();
    ctx.setLineDash([]);
    dot(ctx, X(Math.log10(min.pd)), Y(Math.log10(min.V)), YELLOW);
  }

  if (Number.isFinite(pd) && pd > 0 && Number.isFinite(V) && V > 0) {
    dot(ctx, X(Math.log10(pd)), Y(Math.log10(V)), sparks ? RED : WHITE);
  }

  ctx.fillStyle = WHITE;
  ctx.globalAlpha = 0.6;
  ctx.font = SERIF;
  ctx.fillText('V', 6, T + 10);
  ctx.fillText('pd', w - 22, h - 3);
  ctx.globalAlpha = 1;
}

/** Text with one subscripted letter, as canvas can't: sub(ctx, [['V'], ['C', true]], x, y). */
function sub(ctx, parts, x, y) {
  const base = ctx.font;
  const small = base.replace(/(\d+)px/, (m, n) => `${Math.round(n * 0.75)}px`);
  for (const [text, low] of parts) {
    ctx.font = low ? small : base;
    ctx.fillText(text, x, low ? y + 3 : y);
    x += ctx.measureText(text).width + (low ? 1 : 0);
  }
  ctx.font = base;
  return x;
}

/** A time for an axis label: 3 significant figures, the largest SI prefix that keeps it ≥ 1. */
function secs(t) {
  const a = Math.abs(t);
  const [d, u] = a >= 1 ? [1, 's'] : a >= 1e-3 ? [1e-3, 'ms'] : a >= 1e-6 ? [1e-6, 'μs'] : [1e-9, 'ns'];
  return `${+(t / d).toPrecision(3)} ${u}`;
}

/**
 * RC, two graphs.
 *  curves: V_C (purple, the capacitor) and I (gold, current) as fractions of their full values
 *          against t/τ, with the 63% and 37% marks at one time constant, as the class slides draw them.
 *  ln:     Lab 6's straight line. ln((ε − V_C)/ε) charging, or ln(V_C/V₀) discharging, equals −t/τ:
 *          the readings taken so far (one every half τ) fall on a line of slope −1/τ, with t in seconds.
 * The present moment is marked on both.
 */
export function drawRC(canvas, { curves, n, charging, tau = 1, graph = 'curves' }) {
  if (!canvas || !curves?.length) return;
  const { ctx, w, h } = setup(canvas);
  const span = curves[curves.length - 1].x;
  const L = 34;
  const top = 14;
  const y0 = h - 16;
  const X = (x) => L + (x / span) * (w - L - 12);
  const small = "10px 'Inter', system-ui, sans-serif";

  // One faint gridline per time constant, then the time axis.
  ctx.strokeStyle = 'rgba(41,171,202,0.22)';
  ctx.lineWidth = 1;
  for (let k = 1; k < span; k++) {
    ctx.beginPath();
    ctx.moveTo(X(k), top - 4);
    ctx.lineTo(X(k), y0);
    ctx.stroke();
  }
  ctx.strokeStyle = WHITE;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(L, top - 6);
  ctx.lineTo(L, y0);
  ctx.lineTo(w - 8, y0);
  ctx.stroke();
  ctx.fillStyle = WHITE;
  ctx.font = small;
  ctx.textAlign = 'center';
  for (let k = 1; k < span; k++) ctx.fillText(graph === 'ln' ? secs(k * tau) : `${k}τ`, X(k), h - 3);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;

  const dashed = (pts, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.setLineDash([]);
  };
  const yLabel = (text, y) => {
    ctx.fillStyle = WHITE;
    ctx.globalAlpha = 0.75;
    ctx.font = small;
    ctx.textAlign = 'right';
    ctx.fillText(text, L - 4, y + 3);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  };

  if (graph === 'ln') {
    // ln runs from 0 at t = 0 down to −span at span·τ.
    const Y = (v) => top + (-v / span) * (y0 - top);
    for (const v of [0, -2, -4, -6]) if (v >= -span) yLabel(String(v).replace('-', '−'), Y(v));
    dashed([[X(0), Y(0)], [X(span), Y(-span)]], 'rgba(236,230,226,0.35)');
    if (n != null) {
      for (let x = 0.5; x <= n + 1e-9; x += 0.5) dot(ctx, X(x), Y(-x), CAP);
      dot(ctx, X(n), Y(-n), CAP);
    }
    ctx.font = SERIF;
    ctx.fillStyle = CAP;
    if (charging) sub(ctx, [['ln((ε − V'], ['C', true], [')/ε)']], L + 6, top + 4);
    else sub(ctx, [['ln(V'], ['C', true], ['/V'], ['0', true], [')']], L + 6, top + 4);
    ctx.fillStyle = WHITE;
    ctx.font = small;
    ctx.textAlign = 'right';
    const slope = 1 / tau;
    const sl = slope >= 0.01 && slope < 1e4 ? +slope.toPrecision(3) : slope.toExponential(2);
    ctx.fillText(`slope = −1/τ = −${sl} per s`, w - 12, y0 - 20);
    ctx.fillText(`so τ = ${secs(tau)}`, w - 12, y0 - 7);
    ctx.textAlign = 'left';
    return;
  }

  const Y = (f) => y0 - f * (y0 - top);
  yLabel('100%', Y(1));
  yLabel('63%', Y(1 - Math.exp(-1)));
  yLabel('37%', Y(Math.exp(-1)));
  // The slides' marks: at one time constant a charging V_C is at 63%, and anything decaying is at 37%.
  const guide = 'rgba(252,98,85,0.7)';
  if (charging) dashed([[L, Y(1 - Math.exp(-1))], [X(1), Y(1 - Math.exp(-1))], [X(1), y0]], guide);
  dashed([[L, Y(Math.exp(-1))], [X(1), Y(Math.exp(-1))], [X(1), y0]], guide);

  const curve = (color, key, dash) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    if (dash) ctx.setLineDash([6, 5]);
    ctx.beginPath();
    curves.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p[key])) : ctx.moveTo(X(p.x), Y(p[key]))));
    ctx.stroke();
    ctx.setLineDash([]);
  };
  curve(CAP, 'vc');
  // Discharging, V_C and I fall on the same curve: dash the current so both show.
  curve(CURRENT, 'i', !charging);
  ctx.font = SERIF;
  if (charging) {
    ctx.fillStyle = CAP;
    sub(ctx, [['V'], ['C', true], [' → ε']], w - 64, top + 12);
    ctx.fillStyle = CURRENT;
    ctx.fillText('I', X(0.35), top + 10);
  } else {
    ctx.fillStyle = CAP;
    const x = sub(ctx, [['V'], ['C', true]], X(1.5), Y(0.42));
    ctx.fillStyle = WHITE;
    ctx.fillText(' and ', x, Y(0.42));
    ctx.fillStyle = CURRENT;
    ctx.fillText('I', x + ctx.measureText(' and ').width, Y(0.42));
  }
  if (n == null) return;
  const k = Math.exp(-n);
  ctx.strokeStyle = 'rgba(236,230,226,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X(n), top - 4);
  ctx.lineTo(X(n), y0);
  ctx.stroke();
  dot(ctx, X(n), Y(charging ? 1 - k : k), CAP);
  dot(ctx, X(n), Y(k), CURRENT);
}
