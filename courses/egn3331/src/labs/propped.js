import { beamSketch } from './elements.js';
import {
  cantileverUniformDeflection, deflectionGap, integrateFixed, proppedGap, proppedUniform, rectInertia,
} from '@flux/subjects/mechanics/elastic.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { arrow, axes, begin, C, chartIn, dot, hidden, label, line, panes, plotIn, sceneIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that a redundant prop is fixed by compatibility, not by equilibrium alone.
 * Holding the tip up changes the wall moment from wL²/2 to wL²/8.
 *
 * Second method: finite differences on EI y'' = M, with the prop reaction unknown.
 * The released beam is checked by integrating M/EI from the wall.
 */

const KN = 1000;
const E = 200e9;

const SCENARIOS = [
  { id: 'held', name: 'Propped, 4 kN/m', w: 4e3, L: 3, b: 0.04, h: 0.08, released: false },
  { id: 'long', name: 'Propped, twice the span', w: 4e3, L: 6, b: 0.04, h: 0.08, released: false },
  { id: 'free', name: 'Prop removed', w: 4e3, L: 3, b: 0.04, h: 0.08, released: true },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, w: sc.w, L: sc.L, b: sc.b, h: sc.h, E, released: sc.released,
  });
}

function shape(state) {
  const L = Math.max(state.L, 0.3);
  const EI = state.E * rectInertia(Math.max(state.b, 1e-4), Math.max(state.h, 1e-4));
  if (state.released) {
    const beam = cantileverUniformDeflection(state.w, L, EI);
    return {
      at: beam.at,
      moment: beam.moment,
      R: 0,
      Mwall: -state.w * L * L / 2,
      xMax: L,
      drop: beam.drop,
      tipDrop: beam.drop,
      L,
      EI,
      released: true,
    };
  }
  const beam = proppedUniform(state.w, L, EI);
  return { ...beam, tipDrop: 0, L, EI, released: false };
}

/** The beam on its supports, bent so its largest drop is an eighth of the span, and its loads. */

function member(B, rect, state, c, veiled) {
  const beam = shape(state);
  const L = beam.L;
  let low = 1e-12;
  for (let i = 0; i <= 40; i++) low = Math.max(low, Math.abs(beam.at((L * i) / 40).y));
  const k = (0.12 * L) / low;
  const S = sceneIn(B, rect, { x0: -0.08 * L, x1: 1.1 * L, y0: -0.3 * L, y1: 0.18 * L }, 8);
  beamSketch(S, L, {
    yAt: (x) => k * beam.at(x).y,
    supports: beam.released ? [['fixed', 0]] : [['fixed', 0], ['roller', L]],
    udl: [0, L],
  });
  if (!beam.released) arrow(S, [L, -0.07 * L], Math.PI / 2, 26, { color: C.text, width: 2, tail: true });
  if (!veiled) {
    if (!beam.released) label(S, `R ${fig(c.R / 1e3)} kN`, [L, -0.07 * L], { color: C.text, dy: 14, dx: -6, align: 'right' });
    label(S, `wall ${fig(c.Mwall / 1e3)} kN·m`, [0, 0.1 * L], { color: C.dim, align: 'left', dx: 8, dy: -6 });
  }
}

export default defineLab({
  id: 'propped',
  exam: 'u8',
  title: 'Propped cantilever',
  hint: 'Equilibrium cannot find the prop. The tip is not allowed to move, and that one sentence fixes the redundant reaction.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('held', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    return { key: 'w', lo: 500, hi: 12e3 };
  },
  controls() {
    return `
      ${slider('pr-w', 'uniform load (kN/m)', 4, 0.5, 12, 0.1)}
      ${slider('pr-l', 'span (m)', 3, 1.5, 6, 0.1)}
      ${slider('pr-h', 'depth (mm)', 80, 40, 160, 1)}
      <p class="tiny">Fixed at the left, simple support at the right, unless the prop is removed. E is 200 GPa. The width is 40 mm.</p>`;
  },
  bind(api) {
    bindSlider('pr-w', (s, v) => { s.w = v * KN; }, api);
    bindSlider('pr-l', (s, v) => { s.L = v; }, api);
    bindSlider('pr-h', (s, v) => { s.h = v / 1000; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('pr-w', state.w / KN);
    set('pr-l', state.L);
    set('pr-h', state.h * 1000);
  },
  compute(state) {
    const beam = shape(state);
    const gap = beam.released
      ? deflectionGap(beam.at, integrateFixed(beam.moment, beam.L, beam.EI, 2000))
      : proppedGap(state.w, beam.L, beam.EI, 200).gap;
    return {
      R: beam.R,
      Mwall: beam.Mwall,
      drop: beam.drop,
      tipDrop: beam.tipDrop,
      xMax: beam.xMax,
      L: beam.L,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.4, { long: true });
    member(B, D, state, c, veiled);
    if (veiled) return;
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
    const P = chartIn(B, R, { lo: 0, hi: beam.L }, { lo: yLo - pad, hi: yHi + pad });
    axes(P, { xLabel: 'x (m)', yLabel: 'deflection (mm)' });
    line(P, pts, { color: C.gold, width: 3 });
    const mark = beam.released ? 0 : beam.xMax;
    line(P, [[mark, yLo - pad], [mark, yHi + pad]], { color: C.teal, width: 2, dash: [5, 4] });
    if (!beam.released) {
      line(P, [[beam.L, yLo - pad], [beam.L, yHi + pad]], { color: C.pink, width: 2, dash: [2, 3] });
    }
    dot(P, beam.xMax, beam.at(beam.xMax).y * 1000, { color: C.gold, r: 5 });
  },
  law(state) {
    if (state.released) return [String.raw`\delta=\frac{wL^4}{8EI}`];
    return [String.raw`R=\frac{3wL}{8}`];
  },
  liveRows(state, c) {
    return [
      kv('prop reaction', `${fig(c.R / KN)} kN`),
      kv('wall moment', `${fig(c.Mwall / KN)} kN·m`),
      kv('largest drop', `${fig(c.drop * 1000)} mm`),
      kv('lowest point', `${fig(c.xMax)} m`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['R', `${fig(c.R / KN)} kN`],
      ['M wall', `${fig(c.Mwall / KN)} kN·m`],
      ['down', `${fig(c.drop * 1000)} mm`],
      ['at', `${fig(c.xMax)} m`],
    ]);
  },
  coach(state, c) {
    if (state.released) {
      return {
        title: 'Without the prop the tip carries the whole drop',
        body: `The wall moment is ${fig(c.Mwall / KN)} kN·m, which is wL²/2. The tip drops ${fig(c.drop * 1000)} mm. The prop holds that tip, and the wall moment becomes a quarter of this value.`,
      };
    }
    return {
      title: 'The wall moment is a quarter of the free cantilever',
      body: `The prop pushes up with ${fig(c.R / KN)} kN. The wall moment is ${fig(c.Mwall / KN)} kN·m. The curve is lowest at ${fig(c.xMax)} m, not at midspan, and it drops ${fig(c.drop * 1000)} mm. The pink line is the prop.`,
    };
  },
});
