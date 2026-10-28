import {
  cantileverTipDeflection, deflectionGap, integrateFixed, integrateSimple, rectInertia,
  simplePointDeflection, simpleUniformDeflection,
} from '@flux/subjects/mechanics/elastic.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that the beam is lowest where the slope is zero. On an off-center
 * point load that station is not the station of peak moment.
 *
 * Second method: trapezoid integration of M/EI, with the support conditions
 * put back in after the integral.
 */

const KN = 1000;
const E = 200e9;

const SCENARIOS = [
  { id: 'cantilever', name: 'Cantilever, tip load', P: 2e3, w: 5e3, L: 2, a: 1, b: 0.04, h: 0.08 },
  { id: 'uniform', name: 'Simple span, uniform load', P: 10e3, w: 5e3, L: 4, a: 2, b: 0.04, h: 0.08 },
  { id: 'offset', name: 'Point load at quarter span', P: 10e3, w: 5e3, L: 4, a: 1, b: 0.04, h: 0.08 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, P: sc.P, w: sc.w, L: sc.L, a: sc.a, b: sc.b, h: sc.h, E });
}

function shape(state) {
  const L = Math.max(state.L, 0.2);
  const EI = state.E * rectInertia(Math.max(state.b, 1e-4), Math.max(state.h, 1e-4));
  if (state.scenarioId === 'uniform') {
    const beam = simpleUniformDeflection(state.w, L, EI);
    return { ...beam, L, EI, a: L / 2, kind: 'simple', loadAt: null };
  }
  if (state.scenarioId === 'offset') {
    const a = Math.min(Math.max(state.a, 1e-3), L - 1e-3);
    const beam = simplePointDeflection(state.P, L, a, EI);
    return { ...beam, L, EI, a, kind: 'simple', loadAt: a };
  }
  const beam = cantileverTipDeflection(state.P, L, EI);
  return { ...beam, L, EI, a: L, under: beam.drop, kind: 'fixed', loadAt: L, slopeTip: beam.slopeTip };
}

export default defineLab({
  id: 'curve',
  exam: 'u8',
  title: 'Elastic curve',
  hint: 'On a simple span the beam is lowest where the slope is zero. On a cantilever the free end drops farthest, and the slope there is not zero.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('cantilever', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    if (state.scenarioId === 'uniform') return { key: 'w', lo: 1e3, hi: 12e3 };
    if (state.scenarioId === 'offset') return { key: 'a', lo: 0.3, hi: 3.7 };
    return { key: 'P', lo: 500, hi: 20e3 };
  },
  controls() {
    return `
      ${slider('cv-p', 'point load (kN)', 2, 0.5, 20, 0.1)}
      ${slider('cv-w', 'uniform load (kN/m)', 5, 1, 12, 0.1)}
      ${slider('cv-l', 'span (m)', 2, 1, 8, 0.1)}
      ${slider('cv-a', 'load position from the left (m)', 1, 0.2, 7, 0.05)}
      <p class="tiny">Upward deflection is positive. A downward load gives a negative curve. The section is a rectangle and E is 200 GPa.</p>`;
  },
  bind(api) {
    bindSlider('cv-p', (s, v) => { s.P = v * KN; }, api);
    bindSlider('cv-w', (s, v) => { s.w = v * KN; }, api);
    bindSlider('cv-l', (s, v) => { s.L = v; }, api);
    bindSlider('cv-a', (s, v) => { s.a = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('cv-p', state.P / KN);
    set('cv-w', state.w / KN);
    set('cv-l', state.L);
    set('cv-a', state.a);
    const uniform = state.scenarioId === 'uniform';
    const offset = state.scenarioId === 'offset';
    showField('cv-p', !uniform);
    showField('cv-w', uniform);
    showField('cv-a', offset);
  },
  compute(state) {
    const beam = shape(state);
    const curve = beam.kind === 'fixed'
      ? integrateFixed(beam.moment, beam.L, beam.EI, 2000, beam.breaks || [])
      : integrateSimple(beam.moment, beam.L, beam.EI, 2000, beam.breaks || []);
    const EI = beam.EI;
    return {
      drop: beam.drop,
      xMax: beam.xMax,
      under: beam.under ?? beam.drop,
      stationGap: Math.abs(beam.xMax - beam.a),
      slopeTip: beam.slopeTip ?? beam.at(beam.L).slope,
      a: beam.a,
      L: beam.L,
      limitW: (16 * EI) / (75 * beam.L ** 3),
      gap: deflectionGap(beam.at, curve),
    };
  },
  draw(canvas, state) {
    const B = begin(canvas);
    const beam = shape(state);
    const pts = [];
    let yLo = 0;
    let yHi = 0;
    for (let i = 0; i <= 40; i++) {
      const x = (beam.L * i) / 40;
      const y = beam.at(x).y * 1000;
      pts.push([x, y]);
      yLo = Math.min(yLo, y);
      yHi = Math.max(yHi, y);
    }
    const pad = Math.max(yHi - yLo, 1) * 0.12;
    const P = plotIn(B, B.free, { lo: 0, hi: beam.L }, { lo: yLo - pad, hi: yHi + pad });
    axes(P, { xLabel: 'x (m)', yLabel: 'deflection (mm)' });
    line(P, pts, { color: C.gold, width: 3 });
    const zero = beam.kind === 'fixed' ? 0 : beam.xMax;
    line(P, [[zero, yLo - pad], [zero, yHi + pad]], { color: C.teal, width: 2, dash: [5, 4] });
    if (beam.loadAt != null && Math.abs(beam.loadAt - zero) > 1e-6) {
      line(P, [[beam.loadAt, yLo - pad], [beam.loadAt, yHi + pad]], { color: C.pink, width: 2, dash: [2, 3] });
    }
    dot(P, beam.xMax, beam.at(beam.xMax).y * 1000, { color: C.gold, r: 5 });
  },
  law(state) {
    if (state.scenarioId === 'uniform') return [String.raw`\delta=\frac{5wL^4}{384EI}`];
    if (state.scenarioId === 'offset') return [String.raw`\frac{dy}{dx}=0`];
    return [String.raw`\delta=\frac{PL^3}{3EI}`];
  },
  liveRows(state, c) {
    return [
      kv('downward deflection', `${fig(c.drop * 1000)} mm`),
      kv('lowest point', `${fig(c.xMax)} m`),
      kv('span', `${fig(c.L)} m`),
      kv('section', `${fig(state.b * 1000)} × ${fig(state.h * 1000)} mm`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['down', `${fig(c.drop * 1000)} mm`],
      ['at', `${fig(c.xMax)} m`],
      ['span', `${fig(c.L)} m`],
      ['slope', `${fig(c.slopeTip)} rad`],
    ]);
  },
  coach(state, c) {
    if (state.scenarioId === 'offset') {
      return {
        title: 'The lowest point is not under the load',
        body: `The load sits at ${fig(c.a)} m and drops ${fig(c.under * 1000)} mm. The curve is lowest at ${fig(c.xMax)} m, ${fig(c.drop * 1000)} mm down. The teal line is zero slope. The pink line is the load.`,
      };
    }
    if (state.scenarioId === 'cantilever') {
      return {
        title: 'The free end drops farthest',
        body: `The tip drops ${fig(c.drop * 1000)} mm and its slope is ${fig(c.slopeTip)} rad. The slope is zero at the wall, the teal line, where the deflection is also zero. A free end can be the lowest point without a zero slope.`,
      };
    }
    return {
      title: 'The slope is zero at the bottom of the curve',
      body: `Midspan drops ${fig(c.drop * 1000)} mm. Up is positive, so the gold curve hangs below the axis. The teal line is midspan, where the slope is zero and the moment is largest.`,
    };
  },
});
