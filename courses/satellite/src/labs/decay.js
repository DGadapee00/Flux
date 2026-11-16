import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { CD, Z_END, decayChecked, density } from '@flux/subjects/mechanics/orbitdecay.js';

/**
 * Orbital decay: a satellite's orbit sinking through an upper atmosphere that the Sun heats.
 *
 * Shows that drag is set by the Sun as much as by the satellite. The same craft at 500 km lasts
 * about 13 years when the Sun is quiet and under 3 when it is active, because a hotter thermosphere
 * is taller and puts more air at the craft's height. The decay also speeds up as the orbit falls,
 * because the air thickens by e every scale height. The closed form uses Dawson's integral; the
 * second method steps the orbit down by Runge–Kutta in time
 * (packages/subjects/src/mechanics/orbitdecay.js).
 *
 * The 6U craft is 12 kg with 0.06 m² facing the flow: this course's round figures.
 */
const SCENARIOS = [
  { id: 'moderate', name: 'A 6U craft at 500 km, a middling Sun', z0: 500, f107: 147, m: 12, A: 0.06 },
  { id: 'quiet', name: 'The same craft, a quiet Sun', z0: 500, f107: 70, m: 12, A: 0.06 },
  { id: 'active', name: 'The same craft, an active Sun', z0: 500, f107: 250, m: 12, A: 0.06 },
  { id: 'high', name: 'The craft at 600 km', z0: 600, f107: 147, m: 12, A: 0.06 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, z0: sc.z0, f107: sc.f107, m: sc.m, A: sc.A });
}

const KEYS = [['dc-z', 'z0'], ['dc-f', 'f107'], ['dc-m', 'm'], ['dc-a', 'A']];
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** 6.14 × 10⁻¹³ */
const sci = (x, n = 3) => {
  const [m, e] = x.toExponential(n - 1).split('e');
  return `${m} × 10${String(Number(e)).split('').map((ch) => SUP[ch]).join('')}`;
};
const yrs = (y) => (y < 1 ? `${fig(12 * y)} months` : `${fig(y)} years`);

export default defineLab({
  id: 'decay',
  exam: 'u9',
  title: 'Orbital decay',
  hint: 'Move the solar flux from quiet to active and watch the life at 500 km shrink fivefold. Then raise the start altitude by 100 km.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('moderate', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'z0', lo: 300, hi: 700 }),
  controls() {
    return `
      ${slider('dc-z', 'Start altitude (km)', 500, 300, 700, 5)}
      ${slider('dc-f', 'Solar flux F10.7', 147, 70, 250, 1)}
      ${slider('dc-m', 'Mass (kg)', 12, 1, 30, 0.5)}
      ${slider('dc-a', 'Area facing the flow (m²)', 0.06, 0.01, 0.2, 0.005)}
      <p class="tiny">A circular orbit, drag coefficient ${CD}. The Sun's activity is held at one value for the whole life; a real solar cycle swings every eleven years. Life ends at ${Z_END} km, where re-entry takes days.</p>`;
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
    const B = (CD * state.A) / state.m;
    return { B, ...decayChecked({ z0: state.z0, B, f107: state.f107 }) };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.6) : [B.free, null];
    const tMax = Math.max(c.years * 1.08, 1);
    const P = plotIn(B, top, { lo: 0, hi: tMax }, { lo: Z_END - 20, hi: state.z0 + 30 });
    axes(P, { xLabel: 'years', yLabel: 'altitude (km)' });
    for (const [t, text, color] of [[5, '5 years', C.gold], [25, '25 years', C.pink]]) {
      if (t > tMax) continue;
      seg(P, [t, Z_END - 20], [t, state.z0 + 30], { color, width: 1.5, dash: [5, 4] });
      label(P, text, [t, state.z0 + 30], { color, align: 'left', dx: 4, dy: 12 });
    }
    line(P, c.trace, { color: C.teal, width: 2.5 });
    label(P, `down in ${yrs(c.years)}`, [c.years, Z_END], { color: C.teal, align: 'right', dx: -6, dy: -10 });
    if (!bottom) return;
    // Density with height for a quiet, the chosen and an active Sun.
    const Q = plotIn(B, bottom, { lo: 1e-15, hi: 1e-10, log: true }, { lo: 200, hi: 700 });
    axes(Q, { xLabel: 'air density (kg/m³)', yLabel: 'altitude (km)' });
    const curve = (f) => Array.from({ length: 51 }, (_, i) => {
      const z = 200 + i * 10;
      return [density(z, f), z];
    });
    line(Q, curve(70), { color: alpha(C.blue, 0.8), width: 1.5, dash: [4, 4] });
    line(Q, curve(250), { color: alpha(C.red, 0.8), width: 1.5, dash: [4, 4] });
    line(Q, curve(state.f107), { color: C.gold, width: 2.5 });
    seg(Q, [1e-15, state.z0], [1e-10, state.z0], { color: C.muted, width: 1, dash: [2, 3] });
    label(Q, 'quiet Sun', [density(650, 70), 650], { color: C.blue, align: 'right', dx: -6 });
    label(Q, 'active Sun', [density(650, 250), 650], { color: C.red, align: 'left', dx: 6 });
  },
  law: () => [
    String.raw`\rho = \rho_r\, e^{-(z - z_r)/H}, \qquad H = \frac{kT_\infty}{mg}`,
    String.raw`\frac{da}{dt} = -\frac{C_D A}{m}\,\rho\,\sqrt{\mu a}`,
  ],
  liveRows(state, c) {
    return [
      kv('Thermosphere temperature, scale height', `${fig(c.T)} K, ${fig(c.H)} km`),
      kv('Air density at the start', `${sci(c.rho0)} kg/m³`),
      kv('C_D A/m', `${fig(c.B)} m²/kg`),
      kv('Falling at the start', `${fig(c.rate0)} km a year`),
      kv('Life, closed form', `${c.years.toFixed(3)} years`),
      kv('Life, stepped', `${c.stepped.toFixed(3)} years`),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['life', yrs(c.years)],
      ['falling now', `${fig(c.rate0)} km/yr`],
      ['scale height', `${fig(c.H)} km`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The solar cycle's swing during the life, the day–night bulge of the air, storms that heat it in hours, a craft that tumbles or points and so changes its area, and air below 300 km that is heavier than atomic oxygen.`;
    const rules = c.years > 25
      ? `That is past the 25-year guideline for clearing low orbit, so the craft needs a way down.`
      : c.years > 5
        ? `That meets the 25-year guideline but not the FCC's 5-year rule of 2022.`
        : `That comes down inside 5 years.`;
    if (state.f107 >= 200) {
      return { title: 'An active Sun pulls it down', body: `At F10.7 = ${fig(state.f107)} the thermosphere is ${fig(c.T)} K and its scale height ${fig(c.H)} km, so more air reaches ${fig(state.z0)} km: ${sci(c.rho0, 2)} kg/m³. The orbit lasts ${yrs(c.years)}. ${rules} ${leavesOut}` };
    }
    if (state.f107 <= 90) {
      return { title: 'A quiet Sun lets it linger', body: `At F10.7 = ${fig(state.f107)} the thermosphere cools to ${fig(c.T)} K and shrinks to a ${fig(c.H)} km scale height. Air at ${fig(state.z0)} km thins to ${sci(c.rho0, 2)} kg/m³ and the orbit lasts ${yrs(c.years)}. ${rules} ${leavesOut}` };
    }
    return { title: 'Slow at first, then fast', body: `The craft falls ${fig(c.rate0)} km in its first year. The air thickens by e every ${fig(c.H)} km, so each step down speeds the next: the orbit lasts ${yrs(c.years)}, most of it near the start. ${rules} ${leavesOut}` };
  },
  app: false,
});
