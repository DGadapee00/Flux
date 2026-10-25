/** Canvas helpers for the mini-plots: a crisp backing store, axes, a marked point. */

/**
 * The colours the plots share. They match the scene palette (a course's scene/ module), so a quantity
 * keeps its colour from the 3D scene to the mini-plot.
 */
export const PLOT_COLORS = {
  BLUE: '#58C4DD',
  YELLOW: '#F4D345',
  GOLD: '#F0AC5F',
  CURRENT: '#F0AC5F',
  CAP: '#9A72AC',
  MARK: '#9A72AC',
  RED: '#FC6255',
  WHITE: '#ECE6E2',
  SERIF: "italic 13px KaTeX_Math, 'Latin Modern Math', 'Cambria Math', serif",
};

/** Resize the backing store to CSS size × DPR so strokes stay crisp; returns a context in CSS pixels. */
export function setupCanvas(canvas) {
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

export function drawAxes(ctx, w, h, y0, nTicks) {
  ctx.strokeStyle = 'rgba(41,171,202,0.22)';
  ctx.lineWidth = 1;
  for (let i = 1; i < nTicks; i++) {
    const X = 12 + (i / nTicks) * (w - 24);
    ctx.beginPath();
    ctx.moveTo(X, 6);
    ctx.lineTo(X, h - 6);
    ctx.stroke();
  }
  ctx.strokeStyle = PLOT_COLORS.WHITE;
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
  ctx.fillStyle = PLOT_COLORS.WHITE;
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

export function drawDot(ctx, x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0b0c0e';
  ctx.stroke();
}
