/**
 * SVG pictures for the four tracks. Geometry comes from the anim modules.
 * t = 0 is the still frame. t = 1 is the frame the hover animation holds.
 */

import { climb, LEVELS, levelRadius } from './math.js';
import { solveTruss } from './mechanics.js';
import { attachMotion } from './motion.js';
import { connectingLines, NEGATIVE, POSITIVE, probePath } from './physics.js';
import { statsScene } from './stats.js';

const SVG = 'http://www.w3.org/2000/svg';

const E = '#f4d345';
const TEAL = '#5cd0b3';
const PINK = '#d147bd';
const WHITE = '#ffffff';
const RED = '#fc6255';
const BLUE = '#58c4dd';
const MUTED = '#8f8983';
const AXIS = 'rgba(236, 230, 226, 0.45)';

/**
 * @param {string} name
 * @param {Record<string, string|number>} attrs
 */
function svgEl(name, attrs) {
  const node = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

/**
 * @param {number} hex
 */
function channel(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/**
 * @param {string} from
 * @param {string} to
 * @param {number} t
 */
function mix(from, to, t) {
  const a = channel(from);
  const b = channel(to);
  const u = Math.min(1, Math.max(0, t));
  const parts = a.map((value, i) => Math.round(value + (b[i] - value) * u));
  return `#${parts.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * @param {number} x
 * @param {number} y
 * @param {{x0:number,x1:number,y0:number,y1:number}} bounds
 * @param {number} width
 * @param {number} height
 * @param {number} [pad]
 */
function project(x, y, bounds, width, height, pad = 18) {
  const sx = (width - 2 * pad) / (bounds.x1 - bounds.x0);
  const sy = (height - 2 * pad) / (bounds.y1 - bounds.y0);
  return {
    x: pad + (x - bounds.x0) * sx,
    y: pad + (bounds.y1 - y) * sy,
  };
}

/**
 * @param {{x:number,y:number}[]} points
 * @param {{x0:number,x1:number,y0:number,y1:number}} bounds
 * @param {number} width
 * @param {number} height
 */
function polyline(points, bounds, width, height) {
  return points
    .map((point) => {
      const p = project(point.x, point.y, bounds, width, height);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');
}

/**
 * @param {HTMLElement} host
 * @param {string} trackId
 */
export function mountStage(host, trackId) {
  const svg = svgEl('svg', { viewBox: '0 0 320 168', role: 'presentation' });
  svg.setAttribute('aria-hidden', 'true');
  host.append(svg);
  const paint = PAINT[trackId];
  if (!paint) {
    throw new Error(`no animation for track ${trackId}`);
  }
  const frame = paint(svg);
  frame(0);
  return frame;
}

/** @type {Record<string, (svg: SVGSVGElement) => (t: number) => void>} */
const PAINT = {
  physics: paintPhysics,
  math: paintMath,
  mechanics: paintMechanics,
  stats: paintStats,
};

/**
 * @param {SVGSVGElement} svg
 */
function paintPhysics(svg) {
  const width = 320;
  const height = 168;
  const bounds = { x0: -1.7, x1: 1.7, y0: -1.05, y1: 1.05 };
  const lines = connectingLines();
  for (const line of lines) {
    svg.append(
      svgEl('polyline', {
        points: polyline(line, bounds, width, height),
        fill: 'none',
        stroke: E,
        'stroke-width': 1.4,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        opacity: 0.8,
      }),
    );
  }
  charge(svg, POSITIVE, '+', RED, bounds, width, height);
  charge(svg, NEGATIVE, '−', BLUE, bounds, width, height);
  const probe = svgEl('circle', { r: 4.5, fill: WHITE, opacity: 0 });
  svg.append(probe);
  const path = probePath();
  return (t) => {
    const index = Math.min(path.length - 1, Math.round(t * (path.length - 1)));
    const point = project(path[index].x, path[index].y, bounds, width, height);
    probe.setAttribute('cx', point.x.toFixed(1));
    probe.setAttribute('cy', point.y.toFixed(1));
    probe.setAttribute('opacity', t === 0 ? '0' : '1');
  };
}

/**
 * @param {SVGSVGElement} svg
 * @param {{x:number,y:number}} at
 * @param {string} mark
 * @param {string} fill
 * @param {{x0:number,x1:number,y0:number,y1:number}} bounds
 * @param {number} width
 * @param {number} height
 */
function charge(svg, at, mark, fill, bounds, width, height) {
  const point = project(at.x, at.y, bounds, width, height);
  svg.append(svgEl('circle', { cx: point.x, cy: point.y, r: 11, fill }));
  const text = svgEl('text', {
    x: point.x,
    y: point.y + 4,
    'text-anchor': 'middle',
    fill: '#0b0c0e',
    'font-size': 14,
    'font-family': 'Inter, sans-serif',
    'font-weight': 700,
  });
  text.textContent = mark;
  svg.append(text);
}

/**
 * @param {SVGSVGElement} svg
 */
function paintMath(svg) {
  const width = 320;
  const height = 168;
  const bounds = { x0: -1.55, x1: 1.55, y0: -1.2, y1: 1.2 };
  const cx = project(0, 0, bounds, width, height).x;
  const cy = project(0, 0, bounds, width, height).y;
  const scale = (width - 36) / (bounds.x1 - bounds.x0);
  for (const level of LEVELS) {
    const radius = levelRadius(level) * scale;
    svg.append(
      svgEl('circle', {
        cx,
        cy,
        r: radius,
        fill: 'none',
        stroke: TEAL,
        'stroke-width': 1.4,
        opacity: 0.35 + level,
      }),
    );
  }
  const path = climb();
  const shaft = svgEl('line', { stroke: E, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
  const head = svgEl('polygon', { fill: E });
  svg.append(shaft, head);
  return (t) => {
    const index = Math.min(path.length - 1, Math.round(t * (path.length - 1)));
    const here = path[index];
    const g = { x: -2 * here.x * here.f, y: -2 * here.y * here.f };
    const mag = Math.hypot(g.x, g.y) || 1;
    const tip = project(here.x + (0.28 * g.x) / mag, here.y + (0.28 * g.y) / mag, bounds, width, height);
    const tail = project(here.x, here.y, bounds, width, height);
    shaft.setAttribute('x1', tail.x.toFixed(1));
    shaft.setAttribute('y1', tail.y.toFixed(1));
    shaft.setAttribute('x2', tip.x.toFixed(1));
    shaft.setAttribute('y2', tip.y.toFixed(1));
    const ang = Math.atan2(tip.y - tail.y, tip.x - tail.x);
    const wing = 7;
    const back = 9;
    const left = {
      x: tip.x - back * Math.cos(ang) + wing * Math.sin(ang),
      y: tip.y - back * Math.sin(ang) - wing * Math.cos(ang),
    };
    const right = {
      x: tip.x - back * Math.cos(ang) - wing * Math.sin(ang),
      y: tip.y - back * Math.sin(ang) + wing * Math.cos(ang),
    };
    head.setAttribute('points', `${tip.x.toFixed(1)},${tip.y.toFixed(1)} ${left.x.toFixed(1)},${left.y.toFixed(1)} ${right.x.toFixed(1)},${right.y.toFixed(1)}`);
  };
}

/**
 * @param {SVGSVGElement} svg
 */
function paintMechanics(svg) {
  const truss = solveTruss();
  const width = 320;
  const height = 168;
  const bounds = { x0: -0.45, x1: 2.45, y0: -0.55, y1: 2.15 };
  const members = truss.members.map((member) => {
    const from = project(member.from.x, member.from.y, bounds, width, height);
    const to = project(member.to.x, member.to.y, bounds, width, height);
    const line = svgEl('line', {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      stroke: MUTED,
      'stroke-width': 4,
      'stroke-linecap': 'round',
    });
    svg.append(line);
    return { line, tension: member.tension };
  });
  for (const joint of [truss.A, truss.B, truss.C]) {
    const point = project(joint.x, joint.y, bounds, width, height);
    svg.append(svgEl('circle', { cx: point.x, cy: point.y, r: 4.5, fill: '#ece6e2' }));
  }
  const pin = project(truss.A.x, truss.A.y, bounds, width, height);
  svg.append(
    svgEl('polygon', {
      points: `${pin.x},${pin.y + 8} ${pin.x - 8},${pin.y + 20} ${pin.x + 8},${pin.y + 20}`,
      fill: 'none',
      stroke: AXIS,
      'stroke-width': 1.4,
    }),
  );
  const roller = project(truss.B.x, truss.B.y, bounds, width, height);
  svg.append(
    svgEl('circle', {
      cx: roller.x,
      cy: roller.y + 14,
      r: 5,
      fill: 'none',
      stroke: AXIS,
      'stroke-width': 1.4,
    }),
  );
  const load = svgEl('line', { stroke: PINK, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
  const loadHead = svgEl('polygon', { fill: PINK });
  svg.append(load, loadHead);
  return (t) => {
    const drop = Math.min(1, t / 0.45);
    const colorT = Math.max(0, (t - 0.35) / 0.65);
    // Peak joint is at y = 1.2. The arrow point lands on the top of that joint.
    const tipY = 1.85 + (1.3 - 1.85) * drop;
    const tailY = tipY + 0.42;
    const tip = project(truss.C.x, tipY, bounds, width, height);
    const tail = project(truss.C.x, tailY, bounds, width, height);
    load.setAttribute('x1', tail.x.toFixed(1));
    load.setAttribute('y1', tail.y.toFixed(1));
    load.setAttribute('x2', tip.x.toFixed(1));
    load.setAttribute('y2', tip.y.toFixed(1));
    loadHead.setAttribute(
      'points',
      `${tip.x.toFixed(1)},${(tip.y + 1).toFixed(1)} ${(tip.x - 6).toFixed(1)},${(tip.y - 10).toFixed(1)} ${(tip.x + 6).toFixed(1)},${(tip.y - 10).toFixed(1)}`,
    );
    for (const member of members) {
      const target = member.tension >= 0 ? BLUE : RED;
      member.line.setAttribute('stroke', mix(MUTED, target, colorT));
    }
  };
}

/**
 * @param {SVGSVGElement} svg
 */
function paintStats(svg) {
  const scene = statsScene();
  const left = 28;
  const right = 304;
  const top = 16;
  const base = 142;
  const slot = (right - left) / scene.counts.length;
  const peak = Math.max(...scene.counts, ...scene.curve.map((point) => point.y));
  // Ghost outlines at full height, so the resting card already shows the histogram's shape.
  for (const [index, count] of scene.counts.entries()) {
    const h = (count / peak) * (base - top);
    svg.append(
      svgEl('rect', {
        x: left + index * slot + 2,
        y: base - h,
        width: Math.max(1, slot - 4),
        height: h,
        fill: 'none',
        stroke: TEAL,
        'stroke-width': 1,
        opacity: 0.35,
      }),
    );
  }
  const bars = scene.counts.map((count, index) => {
    const rect = svgEl('rect', {
      x: left + index * slot + 2,
      y: base,
      width: Math.max(1, slot - 4),
      height: 0,
      fill: TEAL,
    });
    svg.append(rect);
    return { rect, count };
  });
  svg.append(svgEl('line', { x1: left, y1: base, x2: right, y2: base, stroke: AXIS, 'stroke-width': 1.2 }));
  const curve = svgEl('polyline', {
    fill: 'none',
    stroke: E,
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    opacity: 0,
  });
  const points = scene.curve
    .map((point) => {
      const x = left + ((point.x - scene.x0) / (scene.x1 - scene.x0)) * (right - left);
      const y = base - (point.y / peak) * (base - top);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  curve.setAttribute('points', points);
  svg.append(curve);
  return (t) => {
    const barT = Math.min(1, t / 0.7);
    const curveT = Math.max(0, (t - 0.4) / 0.6);
    for (const bar of bars) {
      const h = (bar.count / peak) * (base - top) * barT;
      bar.rect.setAttribute('height', h.toFixed(2));
      bar.rect.setAttribute('y', (base - h).toFixed(2));
    }
    curve.setAttribute('opacity', String(curveT));
  };
}

/**
 * Wire a card's picture to the motion rules.
 * @param {HTMLElement} card
 * @param {HTMLElement} host
 * @param {string} trackId
 */
export function mountCardAnimation(card, host, trackId) {
  const frame = mountStage(host, trackId);
  attachMotion(card, { onFrame: frame });
}
