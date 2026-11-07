import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { SURFACES, T_SUN, planck, radiation } from '@flux/subjects/heat/radiation.js';

/**
 * Radiation: Planck's spectrum at a chosen temperature, with a real surface's emissivity laid over it,
 * and the Sun's spectrum for comparison.
 *
 * Shows that a white surface is not cool in every band: white paint reflects most sunlight, which is
 * short-wave, but is nearly black in the infrared, where a room-temperature surface glows. So a
 * white plate in full sunlight settles near 275 K, a black one near 394 K, and a shiny metal one,
 * which cannot shed its heat by radiating, near 512 K. The total σT⁴, the peak and the band
 * fractions are checked by integrating and searching Planck's law (packages/subjects/src/heat/
 * radiation.js).
 */
const SCENARIOS = [
  { id: 'white', name: 'White paint at room temperature', surface: 'white', T: 300 },
  { id: 'sun', name: 'The Sun’s surface, 5778 K', surface: 'black', T: 5778 },
  { id: 'metal', name: 'Polished aluminum at room temperature', surface: 'metal', T: 300 },
  { id: 'selective', name: 'A selective absorber, as on a solar collector', surface: 'solarcell', T: 400 },
  { id: 'hot', name: 'A glowing coil at 1200 K', surface: 'black', T: 1200 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, surface: sc.surface, lT: Math.log10(sc.T) });
}

const L0 = -1; // log₁₀ λ in µm, from 0.1 µm
const L1 = 2; // to 100 µm

export default defineLab({
  id: 'radiation',
  exam: 'u2',
  title: 'Radiation',
  hint: 'Set white paint at room temperature: its emissivity is low where sunlight is and high where it glows. Then compare the plate temperatures in sunlight.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('white', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lT', lo: Math.log10(200), hi: Math.log10(6000) }),
  controls() {
    return `
      <label class="field"><span>Surface</span><select id="rd-surf">${Object.entries(SURFACES).map(([id, s]) => `<option value="${id}">${s.name}</option>`).join('')}</select></label>
      ${slider('rd-lT', 'Temperature T = 10 to the power (K)', 2.48, 2.3, 3.78, 0.005)}
      <p class="tiny">Two-band models: one emissivity below 3 µm, where sunlight is, and one above. Teal: a black body at T. Gold: what the surface emits. Dashed: the Sun's spectrum, scaled.</p>`;
  },
  bind(api) {
    document.getElementById('rd-surf')?.addEventListener('change', (e) => {
      api.slice().surface = e.target.value;
      api.bump();
    });
    bindSlider('rd-lT', (s, v) => { s.lT = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('rd-surf');
    if (el) el.value = state.surface;
    const t = document.getElementById('rd-lT');
    if (t && document.activeElement !== t) t.value = String(state.lT);
  },
  compute(state) {
    return { ...radiation(state.surface, 10 ** state.lT), surface: SURFACES[state.surface] };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = plotIn(B, B.free, { lo: L0, hi: L1 }, { lo: 0, hi: 1.15 });
    axes(P, { xLabel: 'log₁₀ λ (µm)', yLabel: 'relative E_bλ, and ε_λ' });
    const peakT = planck(c.peak, c.T);
    const peakSun = planck(2897.77 / T_SUN, T_SUN);
    const body = [];
    const real = [];
    const sun = [];
    const eps = (lam) => (lam < c.surface.cut ? c.surface.short : c.surface.long);
    for (let i = 0; i <= 300; i++) {
      const ll = L0 + ((L1 - L0) * i) / 300;
      const lam = 10 ** ll;
      body.push([ll, planck(lam, c.T) / peakT]);
      real.push([ll, (eps(lam) * planck(lam, c.T)) / peakT]);
      sun.push([ll, planck(lam, T_SUN) / peakSun]);
    }
    line(P, sun, { color: alpha(C.yellow, 0.6), width: 1.5, dash: [5, 4] });
    line(P, body, { color: C.teal, width: 2 });
    line(P, real, { color: C.gold, width: 2.5 });
    const lc = Math.log10(c.surface.cut);
    line(P, [[L0, c.surface.short], [lc, c.surface.short], [lc, c.surface.long], [L1, c.surface.long]], { color: C.pink, width: 2 });
    if (c.surface.short !== c.surface.long) label(P, `ε = ${c.surface.short}`, [L0, c.surface.short], { color: C.pink, dy: -10, align: 'left', dx: 4 });
    label(P, `ε = ${c.surface.long}`, [L1, c.surface.long], { color: C.pink, dy: -10, align: 'right', dx: -4 });
    seg(P, [Math.log10(c.peak), 0], [Math.log10(c.peak), 1], { color: alpha(C.teal, 0.5), width: 1, dash: [3, 3] });
    dot(P, Math.log10(c.peak), 1, { color: C.teal, r: 4 });
    label(P, `peak ${fig(c.peak)} µm`, [Math.log10(c.peak), 1.06], { color: C.teal });
    if (Math.abs(Math.log10(c.peak / 0.5)) > 0.3) label(P, 'sunlight', [Math.log10(1.1), 0.45], { color: C.yellow, align: 'left' });
  },
  law: () => [String.raw`E_{b\lambda} = \frac{C_1}{\lambda^5\left(e^{C_2/\lambda T} - 1\right)}`, String.raw`E_b = \sigma T^4, \qquad \lambda_\text{max}T = 2898\ \mu\text{m·K}`, String.raw`\alpha_s S = \varepsilon\,\sigma T^4`],
  liveRows(state, c) {
    return [
      kv('T', `${fig(c.T)} K`),
      kv('Black body σT⁴', `${fig(c.Eb)} W/m²`),
      kv('Second route: ∫ Planck dλ', `${fig(c.EbNum)} W/m²`),
      kv('Peak, Wien / by search', `${fig(c.peak)} / ${fig(c.peakNum)} µm`),
      kv('Surface emissivity at T', fig(c.eps)),
      kv('It emits', `${fig(c.emitted)} W/m²`),
      kv('Solar absorptivity α', fig(c.alphaSolar)),
      kv('A plate of it in full sunlight', `${fig(c.plateT)} K (${fig(c.plateT - 273.15)} °C)`),
      kv('Largest difference', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['peak', `${fig(c.peak)} µm`],
      ['σT⁴', `${fig(c.Eb)} W/m²`],
      ['α / ε', `${fig(c.alphaSolar)} / ${fig(c.plateEps)}`],
      ['plate in sunlight', `${fig(c.plateT)} K`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real surfaces change emissivity smoothly with wavelength and with direction, and age in sunlight. Satellite radiators use coatings chosen for exactly this split: low α, high ε.`;
    let title = 'Every surface glows; the wavelength depends on T';
    let body = `At ${fig(c.T)} K the peak is at ${fig(c.peak)} µm and a black body emits ${fig(c.Eb)} W/m², growing as T⁴.`;
    if (state.surface === 'white') {
      title = 'White in sunlight, black in the infrared';
      body = `White paint absorbs only ${fig(100 * c.alphaSolar)}% of sunlight, which is short-wave, but emits ${fig(c.plateEps)} of a black body's glow at room temperature, which is long-wave. In full sun a white plate settles at ${fig(c.plateT)} K; a black one would reach 394 K.`;
    } else if (state.surface === 'metal') {
      title = 'Shiny metal in sunlight gets hot';
      body = `Polished aluminum absorbs little sunlight, α = ${fig(c.alphaSolar)}, but it emits even less, ε = ${fig(c.plateEps)}. It cannot shed what it absorbs, so in full sun it settles at ${fig(c.plateT)} K: hotter than black paint.`;
    } else if (state.surface === 'solarcell') {
      title = 'A selective absorber traps sunlight';
      body = `It absorbs ${fig(100 * c.alphaSolar)}% of sunlight but emits only ${fig(c.plateEps)} of a black body's glow, so in full sun it reaches ${fig(c.plateT)} K: the trick behind solar water heaters.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
