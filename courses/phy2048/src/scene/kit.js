/**
 * What the labs draw with: the palette and line helpers from core, a scene label, and a graph panel.
 * Colour means one quantity in every lab: position blue, velocity white, acceleration pink, force
 * pink too when forces arrive, and a marked instant yellow.
 */
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { M, fatLine, fatSegments, updateFatLine, disposeTree } from '@flux/core/scene3d/manim.js';

export { CSS2DObject, M, disposeTree, fatLine, fatSegments, updateFatLine };
export { Arrow } from '@flux/core/scene3d/manim.js';

/** What each plotted quantity is called on screen, and its colour. */
export const QUANTITY_COLORS = { x: M.blue, v: M.white, a: M.pink, mark: M.yellow };

/** An HTML label pinned to a point in the scene. */
export function label(html, x, y, z = 0, cls = 'circuit-label') {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, z);
  return o;
}

/** A solid dot, for a marked point on a curve or a particle on a line. */
export function dot(color, radius = 0.12) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 14), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
}

/** A step for axis ticks that gives about `target` of them: 1, 2 or 5 times a power of ten. */
export function niceStep(span, target = 5) {
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag;
}

/** A range [lo, hi] that holds the values, with a little room, and zero when it is near. */
export function niceRange(values, { pad = 0.12, includeZero = true } = {}) {
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (includeZero) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  if (!(hi - lo > 1e-9)) {
    lo -= 1;
    hi += 1;
  }
  const room = (hi - lo) * pad;
  return [lo - room, hi + room];
}

const fmtTick = (v) => (Math.abs(v) < 1e-9 ? '0' : String(Number(v.toPrecision(3))).replace('-', '−'));

/**
 * A graph panel at scene position (x, y), w wide and h tall, plotting f(t) over [t0, t1].
 * It owns its curve, its zero line, its tick labels and one marked point; the lab calls `set`
 * each time its numbers change. Everything is reused between calls, so nothing is allocated per frame.
 */
export function createGraph(parent, { x, y, w, h, color, name, xName = '', samples = 161, ticks = 6 }) {
  const group = new THREE.Group();
  parent.add(group);
  const frame = fatLine([x, y, 0, x + w, y, 0, x + w, y + h, 0, x, y + h, 0, x, y, 0], { color: M.greyDark, width: 1.5 });
  const zero = fatLine([x, y, 0, x + w, y, 0], { color: M.grey, width: 1, opacity: 0.7 });
  const curve = fatLine(new Array(samples * 3).fill(0), { color, width: 3.5 });
  const secant = fatLine([x, y, 0, x + 1, y, 0], { color: M.yellow, width: 2.5 });
  const drop = fatLine([x, y, 0, x, y + 1, 0], { color: M.yellow, width: 1, opacity: 0.55 });
  const marker = dot(M.yellow, 0.11);
  const markerB = dot(M.yellow, 0.085);
  // The label renderer centres every label on its point, so a title is placed a little in from the edge.
  const title = label(name, x + 0.55, y + h + 0.3, 0, 'graph-title');
  const axis = label(xName, x + w / 2, y - 0.8, 0, 'graph-axis');
  axis.visible = !!xName;
  const tickLabels = Array.from({ length: ticks + 4 }, () => label('', x, y, 0));
  group.add(frame, zero, curve, secant, drop, marker, markerB, title, axis, ...tickLabels);
  for (const o of [secant, drop, marker, markerB]) o.visible = false;
  const tmp = new Array(samples * 3);
  const state = { t0: 0, t1: 1, lo: -1, hi: 1 };

  const sx = (t) => x + ((t - state.t0) / (state.t1 - state.t0)) * w;
  const sy = (val) => y + ((val - state.lo) / (state.hi - state.lo)) * h;

  /** Draw f over [t0, t1] in the value range [lo, hi]. */
  function set({ t0, t1, lo, hi, f, name: text }) {
    Object.assign(state, { t0, t1, lo, hi });
    if (text) title.element.innerHTML = text;
    for (let i = 0; i < samples; i += 1) {
      const t = t0 + ((t1 - t0) * i) / (samples - 1);
      tmp[i * 3] = sx(t);
      tmp[i * 3 + 1] = sy(f(t));
      tmp[i * 3 + 2] = 0.02;
    }
    updateFatLine(curve, tmp);
    const zy = sy(0);
    zero.visible = zy > y && zy < y + h;
    if (zero.visible) updateFatLine(zero, [x, zy, 0, x + w, zy, 0]);
    // Tick labels: time along the foot, value up the left side.
    let n = 0;
    const put = (text2, px, py, cls) => {
      const l = tickLabels[n++];
      if (!l) return;
      l.element.textContent = text2;
      l.element.className = cls;
      l.position.set(px, py, 0);
      l.visible = true;
    };
    const stepT = niceStep(t1 - t0, 6);
    for (let t = Math.ceil(t0 / stepT) * stepT; t <= t1 + 1e-9; t += stepT) put(fmtTick(t), sx(t), y - 0.3, 'graph-tick x');
    const stepV = niceStep(hi - lo, 3);
    for (let v = Math.ceil(lo / stepV) * stepV; v <= hi + 1e-9 && n < tickLabels.length; v += stepV) {
      const py = sy(v);
      if (py > y + 0.2 && py < y + h - 0.2) put(fmtTick(v), x - 0.38, py, 'graph-tick y');
    }
    for (; n < tickLabels.length; n += 1) tickLabels[n].visible = false;
  }

  /** Mark the point (t, val) on the curve, with a dashed drop to the time axis. */
  function mark(t, val) {
    marker.position.set(sx(t), sy(val), 0.05);
    marker.visible = true;
    updateFatLine(drop, [sx(t), y, 0, sx(t), sy(val), 0]);
    drop.visible = true;
  }

  /** A line through (ta, va) and (tb, vb): a secant, or a tangent when they are close. */
  function line(ta, va, tb, vb) {
    secant.visible = true;
    markerB.position.set(sx(tb), sy(vb), 0.05);
    markerB.visible = true;
    const k = (vb - va) / (tb - ta);
    // Extend the chord a little each side so a short one is still a visible line.
    const span = (state.t1 - state.t0) * 0.12;
    const t1 = Math.max(tb, ta) + span;
    const t0 = Math.min(ta, tb) - span;
    updateFatLine(secant, [sx(t0), sy(va + k * (t0 - ta)), 0.03, sx(t1), sy(va + k * (t1 - ta)), 0.03]);
  }

  function clearLine() {
    secant.visible = false;
    markerB.visible = false;
  }

  function clearMark() {
    marker.visible = false;
    drop.visible = false;
  }

  function show(on) {
    group.visible = on;
  }

  function dispose() {
    parent.remove(group);
    disposeTree(group);
  }

  return { group, set, mark, line, clearLine, clearMark, show, dispose, sx, sy };
}

/** Point an arrow from (x0, y0) to (x1, y1) in the plane z. A zero-length arrow is hidden. */
export function placeArrow(arrow, x0, y0, x1, y1, z = 0.04) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy);
  arrow.position.set(x0, y0, z);
  arrow.visible = L > 1e-6;
  if (!arrow.visible) return;
  arrow.setDirection(new THREE.Vector3(dx / L, dy / L, 0));
  arrow.setLength(L);
}

/**
 * Place a label beside the segment (x0, y0)–(x1, y1), on the side away from the point (xo, yo), or on
 * the left (side 1) or right (side −1) of it when that point is on the line.
 * The label renderer centres a label on its point, so the offset grows with the label's half-width
 * when the segment is steep: about 0.1 scene units per character of its longest line.
 */
export function labelBeside(lab, html, x0, y0, x1, y1, xo, yo, side = 1) {
  lab.element.innerHTML = html;
  const L = Math.hypot(x1 - x0, y1 - y0) || 1;
  let nx = -(y1 - y0) / L;
  let ny = (x1 - x0) / L;
  const mx = 0.5 * (x0 + x1);
  const my = 0.5 * (y0 + y1);
  // A third point on the line itself (a flat triangle) cannot pick a side, so `side` does.
  const toward = nx * (xo - mx) + ny * (yo - my);
  if (Math.abs(toward) < 0.2 ? side < 0 : toward > 0) {
    nx = -nx;
    ny = -ny;
  }
  const chars = Math.max(...html.replace(/<(?!br)[^>]+>/g, '').split(/<br\s*\/?>/).map((line) => line.length));
  const lines = html.split(/<br\s*\/?>/).length;
  const off = 0.3 + Math.abs(nx) * 0.1 * chars + Math.abs(ny) * 0.22 * lines;
  lab.position.set(mx + nx * off, my + ny * off, 0);
}
