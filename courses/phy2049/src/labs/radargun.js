import * as THREE from 'three';
import { defineLab } from './define.js';
import { Q, M, fatLine, updateFatLine, disposeTree, Arrow } from '../scene/manim.js';
import { radarGun } from '../physics/devices.js';
import { kv, cells, qv, eq, tex } from '../ui/shared.js';
import { label, si } from './device-kit.js';

/**
 * Application: the police radar gun (Ch 53, the Doppler shift). The gun sends microwaves at f
 * toward a car moving at v. The car receives f(1 + v/c) as a moving observer and reflects it as a
 * moving source, so the echo returns shifted by Δf = 2fv/c. The gun mixes the echo with its own
 * signal, counts the beat Δf, and reports v = cΔf/2f.
 *
 * A flat side view. The outgoing wave (yellow) runs from the gun to the car along the top, the echo
 * (yellow, fainter) runs back along the bottom. The real shift is a few parts in ten million, far
 * too small to see, so the echo's crests are drawn closer together (approaching) or farther apart
 * (receding) by an exaggerated amount that grows with |v|. The car's arrow (white) is its velocity.
 */
const SCENARIOS = [
  { id: 'notes', name: 'Notes example: K band 24.15 GHz, car closing at 30 m/s', f: 24.15e9, v: 30, d: 300 },
  { id: 'highway', name: 'Highway: X band 10.525 GHz, 35 m/s (78 mph) closing', f: 10.525e9, v: 35, d: 600 },
  { id: 'receding', name: 'Going away: Ka band 34.7 GHz, car leaving at 25 m/s', f: 34.7e9, v: -25, d: 200 },
];

const XG = -3.4; // gun's mouth
const XC = 2.3; // car's front
const YO = 0.75; // outgoing wave's axis
const YE = -0.75; // echo's axis
const AMP = 0.28;
const LAM = 0.55; // drawn wavelength of the outgoing wave
const N_PTS = 160;

/** Gun frequencies to 4 figures (24.15 GHz); beats with the 3-figure SI prefix (4.83 kHz). */
const fmtHz = (x) => (Math.abs(x) >= 1e9 ? `${Number((x / 1e9).toPrecision(4))} GHz` : si(x, 'Hz'));
const fmtV = (v) => `${Number(Math.abs(v).toPrecision(3))} m/s (${Number(Math.abs(v / 0.44704).toPrecision(3))} mph)`;

/** The drawn echo wavelength: shorter for a car closing in, longer for one going away (exaggerated). */
const echoLam = (v) => LAM / (1 + 0.6 * Math.tanh(v / 40));

function wavePoints(x0, x1, y, lam, phase, dir) {
  const out = [];
  for (let i = 0; i < N_PTS; i++) {
    const x = x0 + ((x1 - x0) * i) / (N_PTS - 1);
    out.push(x, y + AMP * Math.sin((2 * Math.PI * (x - dir * phase)) / lam), 0.02);
  }
  return out;
}

export default defineLab({
  id: 'radargun',
  exam: 'e6',
  title: 'Radar gun',
  hint: 'The echo off a moving car comes back shifted: Δf = 2fv/c',
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0, 20), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS.map(({ id, name }) => ({ id, name })),
  defaultState() {
    const { name, ...sc } = SCENARIOS[0];
    return { scenarioId: sc.id, ...sc, show: {}, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const { name, ...sc } = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
  },
  controls() {
    const slider = (id, text, min, max, step) => `
          <label class="field">
            <span>${text}</span>
            <div class="slider-row">
              <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" />
              <span class="mono val" id="${id}-val"></span>
            </div>
          </label>`;
    return `
        <div class="lab-block">
          ${slider('rg-f', 'Gun frequency <i>f</i>', 5, 40, 0.025)}
          ${slider('rg-v', 'Car velocity <i>v</i> (+ toward the gun)', -60, 60, 0.5)}
          ${slider('rg-d', 'Distance to the car <i>d</i>', 50, 1000, 10)}
          <p class="tiny">The echo's crests are drawn bunched or stretched far more than they are: the real shift is a few parts in ten million.</p>
        </div>`;
  },
  bind(api) {
    const on = (id, key, k) =>
      document.getElementById(id).addEventListener('input', (e) => {
        api.slice()[key] = Number(e.target.value) * k;
        api.bump();
      });
    on('rg-f', 'f', 1e9);
    on('rg-v', 'v', 1);
    on('rg-d', 'd', 1);
  },
  syncControls(state) {
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('rg-f', state.f / 1e9, fmtHz(state.f));
    set('rg-v', state.v, `${state.v > 0 ? '+' : ''}${Number(state.v.toPrecision(3))} m/s`);
    set('rg-d', state.d, `${Math.round(state.d)} m`);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const out = fatLine(wavePoints(XG, XC - 0.1, YO, LAM, 0, 1), { color: Q.E, width: 3 });
    const echo = fatLine(wavePoints(XG, XC - 0.1, YE, LAM, 0, -1), { color: Q.E, width: 3, opacity: 0.6 });
    group.add(out, echo);
    group.visible = false;
    return { group, out, echo, phase: 0, scene: null, key: '', lamEcho: LAM };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.rg = radarGun(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.rg;
    if (!h || !c) return;
    ctx.grid.visible = false;
    const key = JSON.stringify([state.f, state.v, state.d]);
    if (key === h.key) return;
    h.key = key;
    h.lamEcho = echoLam(state.v);
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    // The gun: a body and a grip, in gold.
    const box = (x0, y0, x1, y1, color, width = 3) => fatLine([x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0, x0, y0, 0], { color, width });
    g.add(box(XG - 1.1, -1.1, XG, 1.1, Q.I));
    g.add(box(XG - 0.85, -2.1, XG - 0.35, -1.1, Q.I));
    g.add(label('<b>radar gun</b>', XG - 0.55, 1.5, 0));
    // The car: body, cabin and wheels, facing the gun.
    const XB = XC + 2.1;
    g.add(fatLine([XC, -0.9, 0, XC, 0.1, 0, XC + 0.5, 0.25, 0, XC + 0.85, 0.95, 0, XB - 0.45, 0.95, 0, XB - 0.15, 0.25, 0, XB, 0.2, 0, XB, -0.9, 0, XC, -0.9, 0], { color: M.white, width: 3 }));
    for (const xw of [XC + 0.55, XB - 0.55]) {
      const ring = [];
      for (let k = 0; k <= 24; k++) ring.push(xw + 0.3 * Math.cos((k / 24) * 2 * Math.PI), -0.95 + 0.3 * Math.sin((k / 24) * 2 * Math.PI), 0.01);
      g.add(fatLine(ring, { color: M.grey, width: 3 }));
    }
    // The car's velocity: toward the gun (left) for v > 0.
    if (Math.abs(state.v) > 0.05) {
      const len = 0.4 + 1.1 * Math.min(1, Math.abs(state.v) / 60);
      const dir = new THREE.Vector3(state.v > 0 ? -1 : 1, 0, 0);
      const x0 = state.v > 0 ? XB - 0.3 : XC + 0.3;
      g.add(new Arrow(dir, new THREE.Vector3(x0, 1.45, 0.03), len, Q.v, 0.3, 0.22, 0.04));
    }
    g.add(label(`<span style="white-space:nowrap"><i>v</i> = ${Number(Math.abs(state.v).toPrecision(3))} m/s ${state.v > 0 ? 'closing' : state.v < 0 ? 'away' : ''}</span>`, XC + 0.9, 2.05, 0));
    // Labels on the two waves and the beat at the gun.
    g.add(label(`<span style="color:var(--yellow,#F4D345);white-space:nowrap"><i>f</i> = ${fmtHz(state.f)}, λ = ${si(c.lambda, 'm')}</span>`, -0.55, 0, 0));
    g.add(label(`<span style="color:var(--yellow,#F4D345);white-space:nowrap">echo <i>f</i> ${c.shift >= 0 ? '+' : '−'} ${fmtHz(Math.abs(c.shift))}</span>`, -0.55, YE - 0.62, 0));
    g.add(label(qv('qF', `<span style="white-space:nowrap">beat Δ<i>f</i> = ${fmtHz(Math.abs(c.shift))}</span>`), XG - 0.55, -2.55, 0));
    g.add(label(`<span class="muted" style="white-space:nowrap">echo after ${si(c.delay, 's')}</span>`, XC + 1.05, -1.75, 0));
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    if (!h || !computed.rg) return;
    h.phase = (h.phase + Math.min(dt, 0.05) * 0.5) % 1000;
    updateFatLine(h.out, wavePoints(XG, XC - 0.1, YO, LAM, h.phase, 1));
    updateFatLine(h.echo, wavePoints(XG, XC - 0.1, YE, h.lamEcho, h.phase, -1));
  },
  law() {
    return [String.raw`f_{\text{car}} = f\left(1+\tfrac{v}{c}\right),\quad f_{\text{echo}} \approx f\left(1+\tfrac{v}{c}\right)^2`, String.raw`\Delta f = \dfrac{2fv}{c} \;\Rightarrow\; v = \dfrac{c\,\Delta f}{2f}`];
  },
  liveRows(state, computed) {
    const c = computed.rg;
    if (!c) return '';
    return [
      kv(tex(String.raw`\lambda = c/f`), si(c.lambda, 'm')),
      kv(tex(String.raw`\Delta f = 2fv/c`), qv('qF', `${c.shift >= 0 ? '+' : '−'}${fmtHz(Math.abs(c.shift))}`)),
      kv(tex(String.raw`\Delta f/f`), `${(c.frac * 1e7).toFixed(2)} × 10⁻⁷`),
      kv(tex(String.raw`v = c\,\Delta f/2f`), fmtV(c.vRead)),
      kv(tex(String.raw`t = 2d/c`), si(c.delay, 's')),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.rg;
    if (!c) return '';
    return cells([
      [String.raw`Beat $\Delta f$`, fmtHz(Math.abs(c.shift)), 'qF'],
      [String.raw`Speed read`, fmtV(c.vRead), ''],
      [String.raw`Wavelength`, si(c.lambda, 'm'), ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.rg;
    if (!c) return { title: '', body: '' };
    return {
      title: 'A radar gun hears the Doppler shift twice',
      body: [
        'The gun sends microwaves at $f$. The car runs into the crests as a moving observer and receives $f(1+v/c)$. It reflects them as a moving source, which shifts them again, so the echo returns at about $f(1+2v/c)$:',
        eq(String.raw`\Delta f = \frac{2fv}{c} = \text{${c.shift >= 0 ? '' : '−'}${fmtHz(Math.abs(c.shift))}}`),
        `That is ${(Math.abs(c.frac) * 1e7).toFixed(2)} parts in ten million. No receiver measures a ${fmtHz(state.f)} frequency that finely. Instead the gun mixes the echo with its own signal: the two beat at $\\Delta f$, a few kilohertz, which is easy to count. Double the speed and the beat doubles. A car closing in raises the echo's frequency; one going away lowers it.`,
        '<b>What the course model leaves out.</b> The gun sees only the part of the car’s velocity along the beam: aimed at an angle θ to the road, it reads $v\\cos\\theta$, always a little low. The beam spreads, so in traffic it reflects off several cars at once, and the gun reports the strongest or fastest echo. A car is not a flat mirror; it scatters the beam in all directions and only a tiny fraction returns. And the exact echo is $f(1+\\beta)/(1-\\beta)$, which differs from the course formula by about one part in ten million of the shift.',
      ],
    };
  },
});
