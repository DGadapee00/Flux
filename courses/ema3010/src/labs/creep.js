import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { ALLOY, creepChecked, creepClosed } from '@flux/subjects/matsci/creep.js';

/**
* Creep: a nickel-superalloy part under constant stress at high temperature, with sliders for the
 * temperature and the stress, the strain drawn against time.
 *
 * Shows that a load below yield still causes permanent strain when the metal is hot: at 850 °C and
 * 200 MPa, under a quarter of yield, the part creeps 2% in 460 hours. 100 K hotter, the life falls
 * to 34 hours. The life from the closed-form strain is checked by marching the creep rate with
 * Runge–Kutta (packages/subjects/src/matsci/creep.js).
 */
const SCENARIOS = [
  { id: 'base', name: '850 °C, 200 MPa', TC: 850, sigma: 200 },
  { id: 'hotter', name: '950 °C, 200 MPa', TC: 950, sigma: 200 },
  { id: 'cooler', name: '750 °C, 200 MPa', TC: 750, sigma: 200 },
  { id: 'heavy', name: '850 °C, 400 MPa', TC: 850, sigma: 400 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, TC: sc.TC, sigma: sc.sigma });
}

const KEYS = [['cr-t', 'TC'], ['cr-s', 'sigma']];

const hours = (h) => (h >= 1e4 ? `${fig(h / 8766)} years` : `${fig(h)} h`);

function strain(B, rect, state, c) {
  const T = c.lifeH * 1.15;
  const P = plotIn(B, rect, { lo: 0, hi: T }, { lo: 0, hi: 2.4 });
  axes(P, { xLabel: 'time (hours)', yLabel: 'strain (%)' });
  seg(P, [0, 100 * ALLOY.limit], [T, 100 * ALLOY.limit], { color: alpha(C.red, 0.8), width: 1.5, dash: [6, 4] });
  label(P, 'retired at 2%', [0, 100 * ALLOY.limit], { color: C.red, align: 'left', dx: 6, dy: -10 });
  const pts = Array.from({ length: 301 }, (_, i) => {
    const t = (T * i) / 300;
    return [t, 100 * c.eps(t * 3600)];
  });
  line(P, pts, { color: C.gold, width: 2.5 });
  dot(P, c.lifeH, 100 * ALLOY.limit, { color: C.pink, r: 6, ring: C.text });
}

function lifePlot(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 700, hi: 1000 }, { lo: 0.01, hi: 1e6, log: true });
  axes(P, { xLabel: 'temperature (°C)', yLabel: 'life (hours)' });
  const pts = Array.from({ length: 121 }, (_, i) => {
    const TC = 700 + (300 * i) / 120;
    return [TC, creepClosed({ TC, sigma: state.sigma }).lifeH];
  });
  line(P, pts, { color: C.gold, width: 2.5 });
  dot(P, state.TC, c.lifeH, { color: C.pink, r: 6, ring: C.text });
  label(P, hours(c.lifeH), [state.TC, c.lifeH], { color: C.text, align: 'left', dx: 10, dy: -8 });
}

export default defineLab({
  id: 'creep',
  exam: 'u4',
  title: 'Creep',
  hint: 'Read the life at 850 °C. Then add 100 K, and then double the stress instead.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('base', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'TC', lo: 700, hi: 1000 }),
  controls() {
    return `
      ${slider('cr-t', "Temperature (°C)", 850, 700, 1000, 5)}
      ${slider('cr-s', "Stress (MPa)", 200, 100, 400, 5)}
      <p class="tiny">Model values for a nickel superalloy: ε̇_s = Aσ⁵exp(−300 kJ/mol / RT), a primary strain of 0.2% that fades over 20 hours, E = 150 GPa, yield near 900 MPa. The part is retired at 2% strain. Left: strain against time. Right: life against temperature at this stress.</p>`;
  },
  bind(api) {

    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {

    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return creepChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      strain(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    strain(B, a, state, c);
    lifePlot(B, b, state, c);
  },
  law: () => [String.raw`\dot\varepsilon_s = A\sigma^n\exp\!\left(-\frac{Q_c}{RT}\right)`, String.raw`\varepsilon(t) = \frac{\sigma}{E} + \varepsilon_p\left(1 - e^{-t/\tau}\right) + \dot\varepsilon_s t`],
  liveRows(state, c) {
    return [
      kv('Steady creep rate', `${fig(c.rate * 3600 * 1e6)} × 10⁻⁶ per hour`),
      kv('Life to 2%', hours(c.lifeH)),
      kv('Stress against yield', `${fig((100 * state.sigma) / ALLOY.sy)}%`),
      kv('Elastic strain', `${fig(100 * c.elastic)}%`),
      kv('Newton against the Runge–Kutta march', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['life', hours(c.lifeH)], ['rate', `${fig(c.rate * 3600 * 1e6)}e-6/h`], ['of yield', `${fig((100 * state.sigma) / ALLOY.sy)}%`], ['at', `${fig(state.TC)} °C`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A third, tertiary stage, where voids and necking speed the strain up before rupture; and the change of mechanism with stress, so n is not one number across the whole range.`;
    return { title: 'Permanent strain below yield', body: `At ${fig(state.TC)} °C atoms diffuse fast enough to let dislocations climb past obstacles, so the part stretches at ${fig(c.rate * 3600 * 1e6)} × 10⁻⁶ per hour under ${fig((100 * state.sigma) / ALLOY.sy)}% of yield and reaches 2% in ${hours(c.lifeH)}. The rate carries exp(−Q/RT), so 100 K changes the life about thirteenfold, and σ⁵ makes twice the stress 32 times the rate. ${leavesOut}` };
  },
  app: false,
});
