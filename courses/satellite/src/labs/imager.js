import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { imagerChecked, imagerClosed } from '@flux/subjects/em/imaging.js';

/**
 * Imager: what a small telescope in orbit can see on the ground.
 *
 * Shows that two things set the finest detail: the patch of ground one pixel covers, and the blur the
 * aperture's diffraction makes. Smaller pixels or a longer focal length help only until the pixels
 * are finer than the blur; past that, only a larger aperture or a lower orbit does. The Rayleigh spot
 * from the tabulated Airy zero is checked against the zero found from J₁'s integral
 * (packages/subjects/src/em/imaging.js).
 *
 * The camera is this course's round figures for a 6U payload: a 9 cm aperture, 5.5 µm pixels, 4096
 * across, 12 bits.
 */
export const BANDS = Object.freeze({ blue: { name: 'Blue, 450 nm', lam: 450 }, green: { name: 'Green, 550 nm', lam: 550 }, nir: { name: 'Near infrared, 850 nm', lam: 850 } });
const N = 4096;
const BITS = 12;

const SCENARIOS = [
  { id: 'cube', name: 'A 9 cm telescope, 580 mm focal length', hkm: 500, Dcm: 9, fmm: 580, pum: 5.5, band: 'green' },
  { id: 'long', name: 'The same aperture at 1500 mm', hkm: 500, Dcm: 9, fmm: 1500, pum: 5.5, band: 'green' },
  { id: 'wide', name: 'An 18 cm aperture at 580 mm', hkm: 500, Dcm: 18, fmm: 580, pum: 5.5, band: 'green' },
  { id: 'nir', name: 'The long telescope in near infrared', hkm: 500, Dcm: 9, fmm: 1500, pum: 5.5, band: 'nir' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, hkm: sc.hkm, Dcm: sc.Dcm, fmm: sc.fmm, pum: sc.pum, band: sc.band });
}

const KEYS = [['im-h', 'hkm'], ['im-d', 'Dcm'], ['im-f', 'fmm'], ['im-p', 'pum']];
const m = (x) => `${fig(x)} m`;
const params = (state, over = {}) => ({ hkm: state.hkm, Dcm: state.Dcm, fmm: state.fmm, pum: state.pum, lamnm: BANDS[state.band].lam, N, bits: BITS, ...over });

export default defineLab({
  id: 'imager',
  exam: 'u11',
  title: 'Imager',
  hint: 'Shrink the pixels and watch the finest detail improve, then stop at the optics’ blur. Then double the aperture and watch the blur halve.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('cube', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'pum', lo: 1, hi: 15 }),
  controls() {
    return `
      <label class="field"><span>Band</span><select id="im-b">${Object.entries(BANDS).map(([k, b]) => `<option value="${k}">${b.name}</option>`).join('')}</select></label>
      ${slider('im-h', 'Altitude (km)', 500, 300, 800, 10)}
      ${slider('im-d', 'Aperture diameter (cm)', 9, 3, 30, 0.5)}
      ${slider('im-f', 'Focal length (mm)', 580, 100, 3000, 10)}
      ${slider('im-p', 'Pixel pitch (µm)', 5.5, 1, 15, 0.05)}
      <p class="tiny">Looking straight down. ${N} × ${N} pixels of ${BITS} bits. The blur is the Airy pattern's first dark ring, the Rayleigh limit.</p>`;
  },
  bind(api) {
    document.getElementById('im-b')?.addEventListener('change', (e) => {
      api.slice().band = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const b = document.getElementById('im-b');
    if (b) b.value = state.band;
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const c = imagerChecked(params(state));
    const curve = Array.from({ length: 57 }, (_, i) => {
      const p = 1 + i * 0.25;
      return [p, imagerClosed(params(state, { pum: p })).resolves];
    });
    return { ...c, curve };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.55) : [B.free, null];
    // A patch of ground: four pixels on a side, and the blur circle of one point, to scale.
    const side = 4 * Math.max(c.gsd, c.spot);
    const P = sceneIn(B, top, { x0: -side / 2, x1: side / 2, y0: -side / 2, y1: side / 2 }, 24);
    const n = Math.ceil(side / c.gsd / 2);
    for (let i = -n; i <= n; i++) {
      seg(P, [i * c.gsd, -side / 2], [i * c.gsd, side / 2], { color: alpha(C.blue, 0.55), width: 1 });
      seg(P, [-side / 2, i * c.gsd], [side / 2, i * c.gsd], { color: alpha(C.blue, 0.55), width: 1 });
    }
    const ring = Array.from({ length: 97 }, (_, i) => [c.spot * Math.cos((2 * Math.PI * i) / 96), c.spot * Math.sin((2 * Math.PI * i) / 96)]);
    poly(P, ring, { fill: alpha(C.gold, 0.25), stroke: C.gold, width: 2 });
    dot(P, 0, 0, { color: C.gold, r: 3 });
    label(P, `pixel ${m(c.gsd)}`, [-side / 2, side / 2], { color: C.blue, align: 'left', dx: 4, dy: 10 });
    label(P, `blur radius ${m(c.spot)}`, [0, -c.spot], { color: C.gold, dy: 14 });
    if (!bottom) return;
    // The finest detail against pixel pitch: falling with the pixels, then flat at the blur.
    const hi = Math.max(...c.curve.map((p) => p[1])) * 1.1;
    const Q = plotIn(B, bottom, { lo: 1, hi: 15 }, { lo: 0, hi });
    axes(Q, { xLabel: 'pixel pitch (µm)', yLabel: 'finest detail (m)' });
    line(Q, c.curve, { color: C.teal, width: 2.5 });
    seg(Q, [1, c.spot], [15, c.spot], { color: C.gold, width: 1.5, dash: [5, 4] });
    label(Q, 'optics blur', [15, c.spot], { color: C.gold, align: 'right', dy: -10 });
    dot(Q, state.pum, c.resolves, { color: C.pink, r: 6 });
  },
  law: () => [
    String.raw`\text{GSD} = \frac{h\,p}{f}, \qquad \theta_R = 1.22\,\frac{\lambda}{D}`,
    String.raw`Q = \frac{\lambda f}{D\,p}`,
  ],
  liveRows(state, c) {
    return [
      kv('Ground per pixel', m(c.gsd)),
      kv('Optics blur, tabulated zero', m(c.spot)),
      kv('Optics blur, zero found numerically', m(c.spotNum)),
      kv('Finest detail, set by', `${m(c.resolves)}, the ${c.limit}`),
      kv('Q = λf/(Dp), f-number', `${fig(c.Q)}, f/${fig(c.fnum)}`),
      kv('Swath, one image', `${fig(c.swath)} km, ${fig(c.imageMbit)} Mbit`),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['finest detail', m(c.resolves)],
      ['set by', c.limit],
      ['swath', `${fig(c.swath)} km`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Lens and mirror flaws that blur past the diffraction limit, the craft's motion during an exposure, the air between the craft and the ground, and the light each pixel collects, which sets how sharp the image looks against noise.`;
    if (c.limit === 'pixels') {
      return { title: 'The pixels set the detail', body: `Each pixel covers ${m(c.gsd)} of ground, coarser than the ${m(c.spot)} blur the ${fig(state.Dcm)} cm aperture makes. Smaller pixels or a longer focal length would show more, until the pixels pass the blur: Q = ${fig(c.Q)} here, and the two meet at Q = 1/1.22 = 0.82. ${leavesOut}` };
    }
    return { title: 'The optics set the detail', body: `The ${fig(state.Dcm)} cm aperture blurs each point over ${m(c.spot)}, coarser than the ${m(c.gsd)} pixels. Smaller pixels add no detail now; only a larger aperture, a shorter wavelength or a lower orbit would. Q = ${fig(c.Q)}. ${leavesOut}` };
  },
  app: false,
});
