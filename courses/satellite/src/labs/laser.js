import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { laserChecked, laserClosed } from '@flux/subjects/em/lasercom.js';

/**
 * Laser link: a narrow beam from orbit landing on a ground telescope.
 *
 * Shows the trade at the heart of laser communication. A wider transmit aperture makes a narrower
 * beam and puts more power on the telescope, but the beam must then be pointed more finely: a
 * 10 mm aperture at 1550 nm spreads only 99 µrad, and the 349 µrad a star-tracked craft holds by
 * body pointing alone (Unit 3) misses it entirely. The caught share by series is checked against the
 * beam integrated over the telescope (packages/subjects/src/em/lasercom.js).
 *
 * Wavelengths and data rates are those NASA's small spacecraft report lists for small laser
 * terminals (Table 9-4); the 40 cm ground telescope is OCSD's (report, 9.3). Apertures and power are
 * this course's round figures.
 */
export const WAVES = Object.freeze({ nm1550: { name: '1550 nm', lam: 1550 }, nm1064: { name: '1064 nm', lam: 1064 } });
export const RATES = Object.freeze([10, 100, 200, 1000]);

const SCENARIOS = [
  { id: 'cube', name: 'A 10 mm terminal, pointed true', wave: 'nm1550', Dtmm: 10, PW: 1, dkm: 1000, Drcm: 40, epsur: 0, rate: 200 },
  { id: 'jitter', name: 'The same with 20 µrad of pointing error', wave: 'nm1550', Dtmm: 10, PW: 1, dkm: 1000, Drcm: 40, epsur: 20, rate: 200 },
  { id: 'body', name: 'Pointed by the body alone, 349 µrad off', wave: 'nm1550', Dtmm: 10, PW: 1, dkm: 1000, Drcm: 40, epsur: 349, rate: 200 },
  { id: 'wide', name: 'A 1 mm terminal, 349 µrad off', wave: 'nm1550', Dtmm: 1, PW: 1, dkm: 1000, Drcm: 40, epsur: 349, rate: 200 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, wave: sc.wave, Dtmm: sc.Dtmm, PW: sc.PW, dkm: sc.dkm, Drcm: sc.Drcm, epsur: sc.epsur, rate: sc.rate });
}

const KEYS = [['lc-t', 'Dtmm'], ['lc-p', 'PW'], ['lc-d', 'dkm'], ['lc-r', 'Drcm'], ['lc-e', 'epsur']];
const params = (state, over = {}) => ({ lamnm: WAVES[state.wave].lam, Dtmm: state.Dtmm, PW: state.PW, dkm: state.dkm, Drcm: state.Drcm, epsur: state.epsur, rateMbps: state.rate, ...over });
const dbm = (x) => (Number.isFinite(x) ? `${fig(x)} dBm` : 'nothing');
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (x) => {
  if (x === 0) return '0';
  const [mant, e] = x.toExponential(2).split('e');
  return Number(e) >= -2 && Number(e) <= 3 ? `${fig(x)}` : `${mant} × 10${String(Number(e)).split('').map((ch) => SUP[ch]).join('')}`;
};

export default defineLab({
  id: 'laser',
  exam: 'u11',
  title: 'Laser link',
  hint: 'Point the beam off by more and more and watch the received power fall off a cliff. Then shrink the transmit aperture: the beam widens, forgives more, and delivers less.',
  gapLimit: 1e-7,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('cube', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'epsur', lo: 0, hi: 400 }),
  controls() {
    return `
      <label class="field"><span>Wavelength</span><select id="lc-w">${Object.entries(WAVES).map(([k, w]) => `<option value="${k}">${w.name}</option>`).join('')}</select></label>
      <label class="field"><span>Data rate</span><select id="lc-b">${RATES.map((r) => `<option value="${r}">${r} Mbit/s</option>`).join('')}</select></label>
      ${slider('lc-t', 'Transmit aperture (mm)', 10, 1, 30, 0.5)}
      ${slider('lc-p', 'Transmit power (W)', 1, 0.1, 5, 0.1)}
      ${slider('lc-d', 'Range (km)', 1000, 400, 2000, 10)}
      ${slider('lc-r', 'Ground telescope (cm)', 40, 10, 100, 1)}
      ${slider('lc-e', 'Pointing error (µrad)', 0, 0, 400, 1)}
      <p class="tiny">A Gaussian beam whose waist is half the transmit aperture. No losses in the optics or the air are counted.</p>`;
  },
  bind(api) {
    document.getElementById('lc-w')?.addEventListener('change', (e) => {
      api.slice().wave = e.target.value;
      api.bump();
    });
    document.getElementById('lc-b')?.addEventListener('change', (e) => {
      api.slice().rate = Number(e.target.value);
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const w = document.getElementById('lc-w');
    if (w) w.value = state.wave;
    const b = document.getElementById('lc-b');
    if (b) b.value = String(state.rate);
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const c = laserChecked(params(state));
    const curve = Array.from({ length: 81 }, (_, i) => {
      const e = i * 5;
      const k = laserClosed(params(state, { epsur: e }));
      return [e, Math.max(k.dBm, -120)];
    });
    return { ...c, curve, lossShown: Number.isFinite(c.lossDB) ? c.lossDB : 999 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.55) : [B.free, null];
    // The footprint on the ground, to scale: the beam's 1/e² ring and twice it, and the telescope.
    const reach = Math.max(2.2 * c.w, c.s + 1.2 * c.w);
    const P = sceneIn(B, top, { x0: -reach, x1: reach, y0: -reach, y1: reach }, 22);
    const ring = (cx, r) => Array.from({ length: 97 }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / 96), r * Math.sin((2 * Math.PI * i) / 96)]);
    poly(P, ring(c.s, 2 * c.w), { fill: alpha(C.red, 0.06), stroke: alpha(C.red, 0.5), width: 1, dash: [4, 4] });
    poly(P, ring(c.s, c.w), { fill: alpha(C.red, 0.18), stroke: C.red, width: 2 });
    dot(P, 0, 0, { color: C.teal, r: 5, ring: C.teal });
    label(P, 'telescope', [0, 0], { color: C.teal, align: 'left', dx: 12, dy: -4 });
    label(P, `beam ${fig(2 * c.w)} m across`, [c.s, c.w], { color: C.red, dy: -10 });
    if (!bottom) return;
    const Q = plotIn(B, bottom, { lo: 0, hi: 400 }, { lo: -120, hi: Math.max(0, c.curve[0][1] + 10) });
    axes(Q, { xLabel: 'pointing error (µrad)', yLabel: 'received (dBm)' });
    line(Q, c.curve, { color: C.teal, width: 2.5 });
    const half = c.halfLoss * 1e6;
    if (half <= 400) {
      seg(Q, [half, -120], [half, c.curve[0][1]], { color: C.gold, width: 1.5, dash: [5, 4] });
      label(Q, '3 dB', [half, c.curve[0][1]], { color: C.gold, align: 'left', dx: 4, dy: 12 });
    }
    dot(Q, state.epsur, Math.max(c.dBm, -120), { color: C.pink, r: 6 });
  },
  law: () => [
    String.raw`\theta = \frac{\lambda}{\pi w_0}, \qquad w = \theta d`,
    String.raw`P_r = P_t\left(1 - e^{-2r^2/w^2}\right) \ \text{(on target)}`,
  ],
  liveRows(state, c) {
    return [
      kv('Beam divergence, half-angle', `${fig(c.theta * 1e6)} µrad`),
      kv('Beam radius at the ground', `${fig(c.w)} m`),
      kv('Beam centre off the telescope', `${fig(c.s)} m`),
      kv('Share caught, series', sci(c.share)),
      kv('Share caught, integrated', sci(c.shareNum)),
      kv('Received power', dbm(c.dBm)),
      kv('Photons per bit', sci(c.photonsPerBit)),
      kv('Pointing error that costs 3 dB', `${fig(c.halfLoss * 1e6)} µrad`),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['received', dbm(c.dBm)],
      ['pointing loss', c.lossShown > 200 ? 'link lost' : `${fig(c.lossShown)} dB`],
      ['photons/bit', sci(c.photonsPerBit)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Clouds, which stop the link outright, and turbulence, which makes the spot dance and breathe; losses in the optics; the beacon and the scan that find the ground station first; and the receiver's own noise.`;
    if (c.lossShown > 20) {
      return { title: 'The beam misses', body: `The beam is ${fig(2 * c.w)} m across at the ground, and a ${fig(state.epsur)} µrad pointing error puts its centre ${fig(c.s)} m off the telescope. Almost nothing arrives: ${dbm(c.dBm)}. A narrow beam needs a fine-steering mirror, or a wider beam that delivers less. ${leavesOut}` };
    }
    if (c.lossShown > 3) {
      return { title: 'Pointing is costing the link', body: `The ${fig(state.epsur)} µrad error loses ${fig(c.lossShown)} dB. Errors past ${fig(c.halfLoss * 1e6)} µrad cost more than half the power, and the loss grows as the square of the error. ${leavesOut}` };
    }
    return { title: 'A narrow beam delivers', body: `A ${fig(state.Dtmm)} mm aperture at ${WAVES[state.wave].name} spreads only ${fig(c.theta * 1e6)} µrad, so ${sci(c.share)} of the ${fig(state.PW)} W lands on the ${fig(state.Drcm)} cm telescope: ${dbm(c.dBm)}, ${sci(c.photonsPerBit)} photons for each bit at ${state.rate} Mbit/s. Keep the pointing error under ${fig(c.halfLoss * 1e6)} µrad to lose less than 3 dB. ${leavesOut}` };
  },
  app: false,
});
