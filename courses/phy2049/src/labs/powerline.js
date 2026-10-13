import * as THREE from 'three';
import { defineLab } from './define.js';
import { Q, M, fatLine, disposeTree } from '../scene/manim.js';
import { transmission, LINE_METALS } from '../physics/devices.js';
import { kv, cells, qv, eq, tex } from '../ui/shared.js';
import { fmtR } from '../ui/format.js';
import { label, si, points } from './device-kit.js';

/**
 * Application: power lines (Ch 41–42). A power station sends P to a town at voltage V. The current
 * is I = P/V, the line's resistance R = ρ(2L)/A (there and back), and the line heats at I²R. The
 * share lost, PR/V², falls as the square of the voltage, which is the whole case for high-voltage
 * transmission.
 *
 * A side view, drawn as a schematic. Current is gold: the dots on the wires are spaced by how much
 * current flows (more current, more dots), and the wires glow redder as the line's loss grows. The
 * town's lights show the share of P that arrives.
 */
const SCENARIOS = [
  { id: 'hv', name: '100 MW over 100 km at 345 kV', P: 100e6, V: 345e3, L: 100e3, A: 4e-4, metal: 'aluminum' },
  { id: 'lv', name: 'The same 100 MW at 34.5 kV', P: 100e6, V: 34.5e3, L: 100e3, A: 4e-4, metal: 'aluminum' },
  { id: 'feeder', name: 'A town feeder: 10 MW, 10 km, 13.8 kV', P: 10e6, V: 13.8e3, L: 10e3, A: 4e-4, metal: 'aluminum' },
];
const VOLTS = [13.8e3, 34.5e3, 138e3, 345e3, 765e3];

const X0 = -5.2; // station
const X1 = 5.2; // town
const Y_OUT = 1.1; // outgoing wire
const Y_BACK = 0.55; // return wire
const N_DOTS = 90;

/** The share of P lost, or "over 100%" when I²R would exceed P and the setting is impossible. */
const share = (c) => (c.possible ? `${(c.frac * 100).toFixed(c.frac < 0.1 ? 2 : 1)}%` : 'over 100%');

export default defineLab({
  id: 'powerline',
  exam: 'e3',
  title: 'Power lines',
  hint: 'Lower the voltage and watch the line eat the power',
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0.3, 23), target: new THREE.Vector3(0, 0.3, 0) },
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
          <div class="seg" id="pl-volts">
            ${VOLTS.map((v) => `<button type="button" data-v="${v}">${v >= 1e5 ? Math.round(v / 1e3) : (v / 1e3).toFixed(1)} kV</button>`).join('')}
          </div>
          ${slider('pl-V', 'Line voltage <i>V</i> (log)', 3, 6, 0.01)}
          ${slider('pl-P', 'Power sent <i>P</i> (log)', 5, 9, 0.01)}
          ${slider('pl-L', 'Distance <i>L</i>', 1, 500, 1)}
          ${slider('pl-A', 'Conductor area <i>A</i>', 50, 1000, 10)}
          <div class="seg" id="pl-metal">
            ${Object.values(LINE_METALS)
              .map((m) => `<button type="button" data-metal="${m.id}">${m.name}</button>`)
              .join('')}
          </div>
          <p class="tiny">DC, one pair of conductors there and back. Real lines are three-phase AC; the loss still goes as I²R.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('pl-volts').addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      api.slice().V = Number(b.dataset.v);
      api.bump();
    });
    $('pl-metal').addEventListener('click', (e) => {
      const b = e.target.closest('[data-metal]');
      if (!b) return;
      api.slice().metal = b.dataset.metal;
      api.bump();
    });
    const on = (id, f) =>
      $(id).addEventListener('input', (e) => {
        f(api.slice(), Number(e.target.value));
        api.bump();
      });
    on('pl-V', (s, v) => (s.V = 10 ** v));
    on('pl-P', (s, v) => (s.P = 10 ** v));
    on('pl-L', (s, v) => (s.L = v * 1e3));
    on('pl-A', (s, v) => (s.A = v * 1e-6));
  },
  syncControls(state) {
    document.querySelectorAll('#pl-volts [data-v]').forEach((b) => b.classList.toggle('active', Math.abs(Number(b.dataset.v) - state.V) < 1));
    document.querySelectorAll('#pl-metal [data-metal]').forEach((b) => b.classList.toggle('active', b.dataset.metal === state.metal));
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('pl-V', Math.log10(state.V), si(state.V, 'V'));
    set('pl-P', Math.log10(state.P), si(state.P, 'W'));
    set('pl-L', state.L / 1e3, `${Math.round(state.L / 1e3)} km`);
    set('pl-A', state.A * 1e6, `${Math.round(state.A * 1e6)} mm²`);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const dots = points(N_DOTS, Q.I, 6);
    group.add(dots);
    group.visible = false;
    return { group, dots, phase: 0, scene: null, key: '', windows: [] };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.pl = transmission(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.pl;
    if (!h || !c) return;
    ctx.grid.visible = false;
    const key = JSON.stringify([state.P, state.V, state.L, state.A, state.metal]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    // Ground.
    g.add(fatLine([X0 - 1.2, -1.2, 0, X1 + 1.2, -1.2, 0], { color: M.greyDark, width: 2 }));
    // The station: a block with a stack.
    const station = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 0.4), new THREE.MeshBasicMaterial({ color: 0x4a4f5a }));
    station.position.set(X0 - 0.3, -0.45, 0);
    g.add(station);
    const stack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.1, 0.3), new THREE.MeshBasicMaterial({ color: 0x5a606c }));
    stack.position.set(X0 - 0.7, 0.8, 0);
    g.add(stack);
    g.add(label(`<span class="muted">station</span><br><span class="mono">${si(state.P, 'W')} at ${si(state.V, 'V')}</span>`, X0 + 1.1, -1.75, 0));
    // Towers.
    for (let i = 0; i <= 4; i++) {
      const x = X0 + 1 + (i * (X1 - X0 - 2)) / 4;
      g.add(fatLine([x - 0.35, -1.2, 0, x, 1.45, 0, x + 0.35, -1.2, 0], { color: M.grey, width: 2, opacity: 0.7 }));
      g.add(fatLine([x - 0.45, Y_OUT, 0, x + 0.45, Y_OUT, 0], { color: M.grey, width: 2, opacity: 0.7 }));
      g.add(fatLine([x - 0.4, Y_BACK, 0, x + 0.4, Y_BACK, 0], { color: M.grey, width: 2, opacity: 0.7 }));
    }
    // The wires, redder as the loss grows (gold at none, red once a quarter of P is lost).
    const heat = Math.min(1, c.frac / 0.25);
    const wire = new THREE.Color(Q.I).lerp(new THREE.Color(M.red), heat);
    const width = 3 + 3 * heat;
    g.add(fatLine([X0 + 0.4, Y_OUT, 0, X1 - 0.4, Y_OUT, 0], { color: wire.getHex(), width }));
    g.add(fatLine([X0 + 0.4, Y_BACK, 0, X1 - 0.4, Y_BACK, 0], { color: wire.getHex(), width }));
    g.add(label(qv('qI', `<i>I</i> = <i>P</i>/<i>V</i> = ${si(c.I, 'A')}`), 0, Y_OUT + 1.45, 0));
    g.add(
      label(
        c.possible
          ? `<span style="color:var(--red,#FC6255)">line heat <i>I</i>²<i>R</i> = ${si(c.loss, 'W')} · ${share(c)} of <i>P</i></span>`
          : `<span style="color:var(--red,#FC6255)"><i>I</i>²<i>R</i> would be ${si(c.loss, 'W')}, more than <i>P</i>: impossible</span>`,
        0,
        Y_OUT + 0.85,
        0,
      ),
    );
    g.add(label(`<span class="muted">${Math.round(state.L / 1e3)} km there and back · <i>R</i> = ${fmtR(c.R)}</span>`, 0, Y_BACK - 0.5, 0));
    // The town: three houses whose windows light with the share of P that arrives.
    const lit = c.possible ? Math.max(0, c.delivered / state.P) : 0;
    h.windows = [];
    for (let i = 0; i < 3; i++) {
      const x = X1 - 0.2 + (i - 1) * 0.75;
      const hgt = 0.7 + 0.2 * (i % 2);
      const house = new THREE.Mesh(new THREE.BoxGeometry(0.6, hgt, 0.3), new THREE.MeshBasicMaterial({ color: 0x3a3f4a }));
      house.position.set(x, -1.2 + hgt / 2, 0);
      g.add(house);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.2), new THREE.MeshBasicMaterial({ color: M.yellow, transparent: true, opacity: 0.1 + 0.9 * lit, toneMapped: false }));
      win.position.set(x, -1.2 + hgt * 0.6, 0.16);
      g.add(win);
    }
    g.add(
      label(
        c.possible
          ? `<span class="muted">town gets</span><br><span class="mono">${si(c.delivered, 'W')}</span>`
          : `<span style="color:var(--red,#FC6255)">can't send ${si(state.P, 'W')}<br>at ${si(state.V, 'V')} on this line</span>`,
        X1 - 0.9,
        -1.8,
        0,
      ),
    );
    // Dots: as many on the line as the current's size calls for, on a log scale, at least a few.
    h.nShown = Math.max(6, Math.min(N_DOTS, Math.round(12 * Math.log10(1 + c.I / 10))));
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    if (!h || h.nShown == null) return;
    h.phase = (h.phase + Math.min(dt, 0.05) * 0.12) % 1;
    const pos = h.dots.geometry.attributes.position.array;
    const span = X1 - 0.4 - (X0 + 0.4);
    const half = Math.ceil(h.nShown / 2);
    // Draw only the dots in use: parking the rest off to one side would still project into view.
    h.dots.geometry.setDrawRange(0, h.nShown);
    for (let i = 0; i < h.nShown; i++) {
      // Out along the upper wire, back along the lower one.
      const out = i < half;
      const k = out ? i / half : (i - half) / (h.nShown - half);
      const f = (k + h.phase) % 1;
      pos[i * 3] = out ? X0 + 0.4 + f * span : X1 - 0.4 - f * span;
      pos[i * 3 + 1] = out ? Y_OUT : Y_BACK;
      pos[i * 3 + 2] = 0.05;
    }
    h.dots.geometry.attributes.position.needsUpdate = true;
  },
  law() {
    return [String.raw`\qI = \dfrac{\qP}{\qV} \qquad \qR = \dfrac{\rho\,(2L)}{A}`, String.raw`\qP_{\text{lost}} = \qI^2\qR = \dfrac{\qP^2\qR}{\qV^2} \qquad \dfrac{\qP_{\text{lost}}}{\qP} = \dfrac{\qP\qR}{\qV^2}`];
  },
  liveRows(state, computed) {
    const c = computed.pl;
    if (!c) return '';
    return [
      kv(tex(String.raw`\qI = \qP/\qV`), qv('qI', si(c.I, 'A'))),
      kv(tex(String.raw`\qR = \rho(2L)/A`), qv('qR', fmtR(c.R))),
      kv(tex(String.raw`\qP_{\text{lost}} = \qI^2\qR`), qv('qP', si(c.loss, 'W'))),
      kv('Share lost', share(c)),
      kv(tex(String.raw`\text{Drop along the line } \qI\qR`), `${si(c.drop, 'V')}${c.possible ? '' : ', more than V'}`),
      kv('Arrives', c.possible ? si(c.delivered, 'W') : `impossible: at most V/R = ${si(state.V / c.R, 'A')} can flow`),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.pl;
    if (!c) return '';
    return cells([
      [String.raw`Current $I$`, si(c.I, 'A'), 'qI'],
      [String.raw`Line $R$`, fmtR(c.R), 'qR'],
      [String.raw`Lost $I^2R$`, si(c.loss, 'W'), 'qP'],
      [`Share lost`, share(c), ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.pl;
    if (!c) return { title: '', body: '' };
    return {
      title: 'Power lines run at high voltage because the loss goes as $1/V^2$',
      body: [
        'The town needs a power $P$. At voltage $V$ that takes a current $I = P/V$. The line has resistance, so it turns $I^2R$ into heat along the way:',
        eq(String.raw`\frac{P_{\text{lost}}}{P} = \frac{I^2R}{P} = \frac{PR}{V^2}`),
        c.possible
          ? `Ten times the voltage, a tenth of the current, a hundredth of the loss. Here ${share(c)} of the power heats the wires. Don't use $V^2/R$ with the line voltage: only the drop $IR$ = ${si(c.drop, 'V')} is across the line's resistance. Transformers step the voltage up at the station and back down near your house (Exam 5).`
          : `Ten times the voltage, a tenth of the current, a hundredth of the loss. Here the formula gives $I^2R$ = ${si(c.loss, 'W')}, more than the ${si(state.P, 'W')} being sent, and a drop $IR$ = ${si(c.drop, 'V')} larger than the ${si(state.V, 'V')} at the station. Neither can happen: at this voltage the line cannot carry this power at all. Even with the town's end shorted, the station could push only $V/R$ = ${si(state.V / c.R, 'A')} through it, short of the ${si(c.I, 'A')} needed. Transformers step the voltage up at the station and back down near your house (Exam 5).`,
        '<b>What the course model leaves out.</b> Real lines are three-phase AC, so the current is an rms value and the wires also have inductance. Very high voltages lose some power to corona discharge into the air, the same effect as at a sharp charged conductor. And the lines sag as they heat.',
      ],
    };
  },
});
