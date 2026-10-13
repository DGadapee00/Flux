import * as THREE from 'three';
import { defineLab } from './define.js';
import { Arrow, M, Q, fatLine, disposeTree } from '../scene/manim.js';
import { cyclotron, IONS, spectrometerRadius, AMU } from '../physics/devices.js';
import { kv, cells, qv, eq, tex } from '../ui/shared.js';
import { fmtV, sciHTML, fmtHz } from '../ui/format.js';
import { fmtB } from './biot.js';
import { label, si } from './device-kit.js';

/**
 * Application: the cyclotron and the mass spectrometer (Ch 46). Both turn on r = mv/qB.
 *
 * Cyclotron: the time for a lap, 2πm/qB, does not depend on speed. So a voltage that alternates at
 * one fixed frequency kicks the ion every time it crosses the gap between the two dees, and its
 * orbit spirals out until it reaches the edge with K = (qBR)²/2m. The dees are hollow metal, so
 * there is no electric field inside them: the voltage reverses while the ion is shielded, and an
 * electrostatic deflector at the rim pulls it out of the field at the end.
 *
 * Mass spectrometer: ions accelerated through ΔV enter B and turn half circles of radius
 * √(2mV/q)/B, so where each lands sorts them by mass.
 *
 * Top views, drawn as schematics, B out of the page (⊙). The spiral shows fewer, wider laps than a
 * real machine makes (the lap count is in the readout); every lap takes the same display time,
 * because every real lap takes the same time.
 */
const SCENARIOS = [
  { id: 'tabletop', name: 'Cyclotron, tabletop: 14 cm dees, 1.3 T', kind: 'cyclotron', ion: 'p', B: 1.3, R: 0.14, V: 4000 },
  { id: 'isotope', name: 'Cyclotron, hospital isotope maker: 31 cm, 1.9 T', kind: 'cyclotron', ion: 'p', B: 1.9, R: 0.31, V: 40000 },
  { id: 'spectrometer', name: 'Mass spectrometer: 1000 V, 2 T (the Ch 46 example)', kind: 'spectrometer', ion: 'C12', Vacc: 1000, Bs: 2 },
];

const RD = 4; // dee radius, scene units
const GAP = 0.18;
const HALF_S = 0.42; // display seconds per half lap, the same for every lap
const SPEC_IONS = ['C12', 'N14', 'O16', 'Zn64', 'Zn66'];
const ION_LABEL = { C12: '¹²C⁺', N14: '¹⁴N⁺', O16: '¹⁶O⁺', Zn64: '⁶⁴Zn⁺', Zn66: '⁶⁶Zn⁺', p: 'proton', d: 'deuteron' };


const mm = (r) => `${(r * 1000).toFixed(1)} mm`;
const SUPS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** A mass in kg as 1.99×10⁻²⁶ kg (format.js's sciHTML rounds numbers this small to 0). */
const kg = (m) => {
  const [a, e] = m.toExponential(2).split('e');
  return `${a}×10${String(Number(e)).replace(/./g, (ch) => SUPS[ch])} kg`;
};

/**
 * The display spiral: n half circles, alternating dees, radius growing as √k like the real one.
 * After the last crossing the ion makes a quarter turn in the next dee to the rim, where the
 * deflector's field cancels the magnetic turn and it leaves along the tangent.
 */
function spiral(n) {
  const pts = [];
  const halves = [];
  // Clockwise (a positive ion, B out of the page): top to bottom in the right dee, bottom to top in the left.
  const arc = (right, r, a0, a1, steps) => {
    const seg = [];
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * (a1 - a0);
      seg.push(right ? [GAP / 2 + r * Math.cos(a), r * Math.sin(a)] : [-GAP / 2 - r * Math.cos(a), -r * Math.sin(a)]);
    }
    return seg;
  };
  let r = 0;
  for (let k = 1; k <= n; k++) {
    r = RD * 0.94 * Math.sqrt(k / n);
    const seg = arc(k % 2 === 1, r, Math.PI / 2, -Math.PI / 2, 40);
    halves.push(seg);
    for (const p of seg) pts.push(p[0], p[1], 0.05);
  }
  const lastRight = (n + 1) % 2 === 1; // the dee it enters after the last crossing
  const quarter = arc(lastRight, r, Math.PI / 2, 0, 20);
  for (const p of quarter) pts.push(p[0], p[1], 0.05);
  const q = quarter[quarter.length - 1];
  const out = [q[0], q[1] + (lastRight ? -3.2 : 3.2)];
  pts.push(out[0], out[1], 0.05);
  return { pts, halves, quarter, exit: [q, out], rim: q, lastRight };
}

/** The coach's "leaves out" paragraph: relativity, sized for the current settings. */
function relativity(c) {
  const pc = ((c.vmax / 3e8) * 100).toFixed(1);
  const slip = Math.round(c.slipDeg);
  let verdict;
  if (slip < 90) verdict = 'small enough for a fixed frequency to keep up.';
  else if (slip < 180) verdict = 'so the frequency must be tuned with care to keep up.';
  else verdict = 'more than half a cycle, so the ion would reach the gap while the voltage pushed it backward. A real machine this size makes $B$ grow slightly toward the rim so that every lap still takes the same time, as hospital cyclotrons do.';
  // K = (qBR)²/2m against the relativistic K for the same momentum qBR.
  const x = c.vmax / 3e8;
  const err = x * x / 2 / (Math.sqrt(1 + x * x) - 1) - 1;
  const high = err > 0.02 ? ` At this speed $K = (qBR)^2/2m$ itself comes out ${Math.round(err * 100)}% high.` : '';
  return `<b>What the course model leaves out.</b> Relativity: a fast ion's lap takes a little longer than $2\\pi m/qB$. Here the ion reaches ${pc}% of $c$, and its last lap takes ${(c.lapGrowth * 100).toFixed(2)}% longer than its first. Over ${Math.round(c.turns).toLocaleString('en-US')} laps those delays add up to about ${slip}° of the voltage's cycle, ${verdict}${high} Real fields are also shaped to keep the beam from drifting up or down.`;
}

export default defineLab({
  id: 'cyclotron',
  exam: 'e4',
  title: 'Cyclotron',
  hint: 'Raise B: the laps stay in step, and the ion leaves with more energy',
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0, 17), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS.map(({ id, name }) => ({ id, name })),
  defaultState() {
    const { name, ...sc } = SCENARIOS[0];
    return { scenarioId: sc.id, Vacc: 1000, Bs: 2, ...sc, show: {}, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const { name, ...sc } = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
  },
  controls() {
    const slider = (id, text, min, max, step, kinds) => `
          <label class="field" data-kinds="${kinds}">
            <span>${text}</span>
            <div class="slider-row">
              <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" />
              <span class="mono val" id="${id}-val"></span>
            </div>
          </label>`;
    return `
        <div class="lab-block">
          <div class="seg" id="cy-kind">
            <button type="button" data-kind="cyclotron">Cyclotron</button>
            <button type="button" data-kind="spectrometer">Mass spectrometer</button>
          </div>
          <div class="seg" id="cy-ion" data-kinds="cyclotron">
            <button type="button" data-ion="p">Proton</button>
            <button type="button" data-ion="d">Deuteron</button>
          </div>
          <div class="seg" id="cy-sion" data-kinds="spectrometer">
            ${SPEC_IONS.map((id) => `<button type="button" data-sion="${id}">${ION_LABEL[id]}</button>`).join('')}
          </div>
          ${slider('cy-B', 'Field <i>B</i>', 0.2, 3, 0.05, 'cyclotron')}
          ${slider('cy-R', 'Dee radius <i>R</i>', 0.05, 0.6, 0.01, 'cyclotron')}
          ${slider('cy-V', 'Gap voltage <i>V</i> (log)', 2.5, 5, 0.01, 'cyclotron')}
          ${slider('cy-Vacc', 'Accelerating voltage Δ<i>V</i>', 200, 5000, 50, 'spectrometer')}
          ${slider('cy-Bs', 'Field <i>B</i>', 0.2, 3, 0.05, 'spectrometer')}
          <p class="tiny" data-kinds="cyclotron">The spiral is drawn with fewer, wider laps than the real one; the readout has the real count. The yellow bar at the rim is the deflector: its electric field pulls the ion out of the magnetic field.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const seg = (id, attr, f) =>
      $(id).addEventListener('click', (e) => {
        const b = e.target.closest(`[data-${attr}]`);
        if (!b) return;
        f(api.slice(), b.dataset[attr]);
        api.bump();
      });
    seg('cy-kind', 'kind', (s, v) => {
      s.kind = v;
      if (v === 'spectrometer' && !SPEC_IONS.includes(s.ion)) s.ion = 'C12';
      if (v === 'cyclotron' && !['p', 'd'].includes(s.ion)) s.ion = 'p';
    });
    seg('cy-ion', 'ion', (s, v) => (s.ion = v));
    seg('cy-sion', 'sion', (s, v) => (s.ion = v));
    const on = (id, f) =>
      $(id).addEventListener('input', (e) => {
        f(api.slice(), Number(e.target.value));
        api.bump();
      });
    on('cy-B', (s, v) => (s.B = v));
    on('cy-R', (s, v) => (s.R = v));
    on('cy-V', (s, v) => (s.V = 10 ** v));
    on('cy-Vacc', (s, v) => (s.Vacc = v));
    on('cy-Bs', (s, v) => (s.Bs = v));
  },
  syncControls(state) {
    document.querySelectorAll('#lab-controls [data-kinds]').forEach((el) => {
      el.hidden = !el.dataset.kinds.split(' ').includes(state.kind);
    });
    document.querySelectorAll('#cy-kind [data-kind]').forEach((b) => b.classList.toggle('active', b.dataset.kind === state.kind));
    document.querySelectorAll('#cy-ion [data-ion]').forEach((b) => b.classList.toggle('active', b.dataset.ion === state.ion));
    document.querySelectorAll('#cy-sion [data-sion]').forEach((b) => b.classList.toggle('active', b.dataset.sion === state.ion));
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('cy-B', state.B, fmtB(state.B));
    set('cy-R', state.R, `${(state.R * 100).toFixed(0)} cm`);
    set('cy-V', Math.log10(state.V), si(state.V, 'V'));
    set('cy-Vacc', state.Vacc, fmtV(state.Vacc));
    set('cy-Bs', state.Bs, fmtB(state.Bs));
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const ion = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: Q.pos }));
    ion.position.z = 0.2;
    group.add(ion);
    group.visible = false;
    return { group, ion, scene: null, key: '', time: 0, path: null, eArrows: [] };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
    handle.time = 0;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    if (state.kind === 'spectrometer') {
      const P = IONS[state.ion] ?? IONS.C12;
      const all = SPEC_IONS.map((id) => ({ id, m: IONS[id].m, r: spectrometerRadius(IONS[id].m, IONS[id].q, state.Vacc, state.Bs) }));
      const v = Math.sqrt((2 * P.q * state.Vacc) / P.m);
      computed.cy = { kind: 'spectrometer', P, r: spectrometerRadius(P.m, P.q, state.Vacc, state.Bs), v, all, massU: P.m / AMU };
    } else {
      computed.cy = { kind: 'cyclotron', ...cyclotron(state) };
    }
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.cy;
    if (!h || !c) return;
    ctx.grid.visible = false;
    const key = JSON.stringify([state.kind, state.ion, state.B, state.R, state.V, state.Vacc, state.Bs]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    h.eArrows = [];
    h.time = 0;
    if (c.kind === 'cyclotron') {
      // The two dees: hollow half-drums, drawn as filled half discs with a gap between them.
      for (const side of [1, -1]) {
        const shape = new THREE.Shape();
        shape.absarc(0, 0, RD, -Math.PI / 2, Math.PI / 2, false);
        shape.lineTo(0, -RD);
        const dee = new THREE.Mesh(new THREE.ShapeGeometry(shape, 48), new THREE.MeshBasicMaterial({ color: 0x3a3f4a, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
        dee.scale.x = side;
        dee.position.x = (side * GAP) / 2;
        g.add(dee);
      }
      g.add(label('<span class="muted">dee</span>', 2.2, -RD + 0.55, 0.1));
      g.add(label('<span class="muted">dee</span>', -2.2, -RD + 0.55, 0.1));
      for (const [x, y] of [[-2.8, -2.2], [2.8, 2.2], [2.8, -2.6], [-2.8, 2.6], [-1.3, -3.3], [1.3, 3.3]]) g.add(label('<span class="qB rg-dot">⊙</span>', x, y, 0.1));
      g.add(label(`<span class="qB"><i>B</i> ⊙ ${fmtB(state.B)}, out of the page</span>`, -1.9, RD + 0.45, 0));
      // E across the gap: three yellow arrows that flip with the voltage.
      for (const y of [-2.4, 0, 2.4]) {
        const a = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-GAP / 2 - 0.25, y, 0.1), GAP + 0.5, Q.E, 0.2, 0.16, 0.025);
        g.add(a);
        h.eArrows.push(a);
      }
      g.add(label(`<span style="color:var(--yellow,#F4D345)">gap voltage ${si(state.V, 'V')}, alternating at ${fmtHz(c.f)}</span>`, 0, -RD - 0.55, 0));
      // The display spiral, then a quarter turn to the rim and out past the deflector.
      // An even number of half laps, so the ion always leaves down the right side, clear of the
      // panels and labels.
      const n0 = Math.max(6, Math.min(22, Math.round(c.crossings)));
      const n = n0 + (n0 % 2);
      const sp = spiral(n);
      g.add(fatLine(sp.pts, { color: Q.pos, width: 2, opacity: 0.45 }));
      h.path = { halves: sp.halves, quarter: sp.quarter, exit: sp.exit };
      const side = sp.lastRight ? 1 : -1;
      const dx = sp.rim[0] + side * 0.28;
      g.add(fatLine([dx, 0, 0.06, dx, -side * 1.7, 0.06], { color: Q.E, width: 4 }));
      g.add(label(`<span class="mono">leaves at ${c.KmaxMeV.toFixed(2)} MeV</span>`, sp.exit[1][0] - 0.4, sp.exit[1][1] - 0.75, 0));
    } else {
      // Mass spectrometer: the ions start at rest on the + plate below the slit, are accelerated
      // straight up through a hole in the − plate, and enter the field region above the slit.
      const rMax = Math.max(...c.all.map((a) => a.r));
      const k = 3.7 / rMax; // scene units per metre of radius
      h.k = k;
      const y0 = -2.6;
      const x0 = -3.3;
      const plate = (y, color) => {
        g.add(fatLine([x0 - 0.8, y, 0, x0 - 0.1, y, 0], { color, width: 4 }));
        g.add(fatLine([x0 + 0.1, y, 0, x0 + 0.8, y, 0], { color, width: 4 }));
      };
      g.add(fatLine([x0, y0 - 1.4, 0, x0, y0, 0], { color: M.grey, width: 1.5, dashed: true }));
      plate(y0 - 1.4, Q.pos);
      plate(y0 - 0.5, Q.neg);
      g.add(label(`<span class="qV">Δ<i>V</i> = ${fmtV(state.Vacc)}</span>`, x0 - 1.7, y0 - 0.95, 0));
      // Detector along the slit's line, and the field region above it.
      g.add(fatLine([x0, y0, 0, x0 + 2 * rMax * k + 0.6, y0, 0], { color: M.greyDark, width: 5 }));
      const box = [x0, y0, 0, x0, y0 + rMax * k + 0.7, 0, x0 + 2 * rMax * k + 0.6, y0 + rMax * k + 0.7, 0, x0 + 2 * rMax * k + 0.6, y0, 0];
      g.add(fatLine(box, { color: M.teal, width: 1.2, opacity: 0.35, dashed: true }));
      g.add(label(`<span class="qB"><i>B</i> ⊙ ${fmtB(state.Bs)}</span>`, x0 + 1.2, y0 + rMax * k + 1.05, 0));
      g.add(label('<span class="muted">detector</span>', x0 + 2 * rMax * k - 0.3, y0 + 0.3, 0));
      for (const a of c.all) {
        const r = a.r * k;
        const pts = [];
        // Enters moving up at (x0, y0) and turns right (a positive ion, B out of the page, v up: F = qv×B points +x).
        for (let i = 0; i <= 60; i++) {
          const th = Math.PI - (i / 60) * Math.PI;
          pts.push(x0 + r + r * Math.cos(th), y0 + r * Math.sin(th), 0.05);
        }
        const on = a.id === state.ion;
        g.add(fatLine(pts, { color: Q.pos, width: on ? 3 : 1.5, opacity: on ? 0.9 : 0.35 }));
        // Landing labels on three staggered rows, so neighbouring isotopes do not overlap.
        g.add(label(`<span class="${on ? 'mono' : 'muted'}">${ION_LABEL[a.id]} ${mm(2 * a.r)}</span>`, x0 + 2 * r, y0 - 0.45 - (SPEC_IONS.indexOf(a.id) % 3) * 0.42, 0));
      }
      h.spec = { x0, y0, r: c.r * k };
    }
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.cy;
    if (!h || !c) return;
    h.time += Math.min(dt, 0.05);
    if (c.kind === 'cyclotron' && h.path) {
      const n = h.path.halves.length;
      const QUARTER_S = HALF_S / 2;
      const total = n * HALF_S + QUARTER_S + 0.8 + 0.6;
      const t = h.time % total;
      let p;
      const k = Math.floor(t / HALF_S);
      const at = (seg, f) => seg[Math.min(seg.length - 1, Math.round(f * (seg.length - 1)))];
      // The gap voltage is a sine at the orbit frequency. It peaks as the ion crosses and passes
      // through zero while the ion is deep inside a dee, where the metal shields it from E.
      const gapField = (right, f) => {
        const amp = Math.cos(Math.PI * f); // +1 at the crossing into this dee, −1 at the next
        const sign = (right ? 1 : -1) * Math.sign(amp || 1);
        const len = 0.14 + 0.54 * Math.abs(amp);
        for (const a of h.eArrows) {
          a.setDirection(new THREE.Vector3(sign, 0, 0));
          a.setLength(len, 0.2, 0.16);
          a.position.x = (-sign * len) / 2;
          a.visible = Math.abs(amp) > 0.15;
        }
      };
      if (k < n) {
        const f = (t - k * HALF_S) / HALF_S;
        p = at(h.path.halves[k], f);
        gapField(k % 2 === 0, f);
      } else if (t < n * HALF_S + QUARTER_S) {
        const f = (t - n * HALF_S) / QUARTER_S;
        p = at(h.path.quarter, f);
        gapField(n % 2 === 0, f / 2);
      } else if (t < n * HALF_S + QUARTER_S + 0.8) {
        const f = (t - n * HALF_S - QUARTER_S) / 0.8;
        const [a, b] = h.path.exit;
        p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      } else {
        p = [GAP, 0];
      }
      h.ion.visible = true;
      h.ion.position.set(p[0], p[1], 0.2);
    } else if (c.kind === 'spectrometer' && h.spec) {
      const { x0, y0, r } = h.spec;
      const t = h.time % 3.2;
      let x;
      let y;
      if (t < 0.8) {
        // From rest on the + plate: a constant force to the − plate (distance grows as t²), then
        // no field until the slit.
        const f = t / 0.8;
        x = x0;
        y = f < 0.6 ? y0 - 1.4 + 0.9 * (f / 0.6) ** 2 : y0 - 0.5 + 0.5 * ((f - 0.6) / 0.4);
      } else if (t < 2.6) {
        const th = Math.PI - ((t - 0.8) / 1.8) * Math.PI;
        x = x0 + r + r * Math.cos(th);
        y = y0 + r * Math.sin(th);
      } else {
        x = x0 + 2 * r;
        y = y0;
      }
      h.ion.visible = true;
      h.ion.position.set(x, y, 0.2);
    }
  },
  law(state) {
    if (state.kind === 'spectrometer') {
      return [String.raw`q\,\Delta \qV = \tfrac12 mv^2 \qquad qvB = \dfrac{mv^2}{r}`, String.raw`r = \dfrac{1}{B}\sqrt{\dfrac{2m\,\Delta \qV}{q}} \qquad m = \dfrac{qB^2r^2}{2\,\Delta \qV}`];
    }
    return [String.raw`qvB = \dfrac{mv^2}{r} \;\Rightarrow\; r = \dfrac{mv}{qB}, \quad f = \dfrac{qB}{2\pi m}`, String.raw`K_{\max} = \dfrac{(qBR)^2}{2m}`];
  },
  liveRows(state, computed) {
    const c = computed.cy;
    if (!c) return '';
    if (c.kind === 'spectrometer') {
      return [
        kv(tex(String.raw`v = \sqrt{2q\,\Delta\qV/m}`), `${(c.v / 1000).toFixed(1)} km/s`),
        kv(tex(String.raw`r = mv/qB`), mm(c.r)),
        kv('Lands at $2r$', mm(2 * c.r)),
        kv(tex(String.raw`m = qB^2r^2/2\Delta\qV`), `${c.massU.toFixed(1)} u = ${kg(c.P.m)}`),
      ].join('');
    }
    return [
      kv(tex(String.raw`f = qB/2\pi m`), fmtHz(c.f)),
      kv('Every lap takes $T = 1/f$', si(c.T, 's')),
      kv('Energy per gap crossing, $qV$', `${si(state.V, 'eV')}`),
      kv(tex(String.raw`K_{\max} = (qBR)^2/2m`), `${c.KmaxMeV.toFixed(2)} MeV`),
      kv(tex(String.raw`v_{\max} = qBR/m`), `${sciHTML(c.vmax, 2)} m/s = ${((c.vmax / 3e8) * 100).toFixed(1)}% of c`),
      kv('Laps to get there', Math.round(c.turns).toLocaleString('en-US')),
      kv('Time inside', si(c.tOut, 's')),
      kv('Relativity: last lap longer by', `${(c.lapGrowth * 100).toFixed(2)}% · ${Math.round(c.slipDeg)}° behind by the edge`),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.cy;
    if (!c) return '';
    if (c.kind === 'spectrometer') {
      return cells([
        [`Ion`, ION_LABEL[state.ion], ''],
        [String.raw`Radius $r$`, mm(c.r), ''],
        [`Lands at`, mm(2 * c.r), ''],
        [`Mass`, `${c.massU.toFixed(1)} u`, ''],
      ]);
    }
    return cells([
      [String.raw`Frequency $f$`, fmtHz(c.f), ''],
      [String.raw`Final energy`, `${c.KmaxMeV.toFixed(2)} MeV`, ''],
      [String.raw`Final speed`, `${((c.vmax / 3e8) * 100).toFixed(1)}% of c`, ''],
      [`Laps`, Math.round(c.turns).toLocaleString('en-US'), ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.cy;
    if (!c) return { title: '', body: '' };
    if (c.kind === 'spectrometer') {
      return {
        title: 'A mass spectrometer weighs ions by the circle they turn',
        body: [
          'The electric field gives every ion the same energy, $q\\Delta V$. The magnetic field then bends each into a half circle, $qvB = mv^2/r$. Put together:',
          eq(String.raw`r = \frac{1}{B}\sqrt{\frac{2m\,\Delta V}{q}}`),
          `Heavier ions turn wider circles, as $\\sqrt m$. Here the ${ION_LABEL[state.ion]} ion lands ${mm(2 * c.r)} from the slit. Isotopes of one element land apart: that is how carbon dating counts ¹⁴C, and how isotopes are separated.`,
          '<b>What the course model leaves out.</b> Real ions leave the source with a spread of energies and directions, which blurs each landing spot; instruments add focusing to sharpen them. Doubly charged ions land where an ion of half the mass would.',
        ],
      };
    }
    return {
      title: 'A cyclotron works because the lap time does not depend on speed',
      body: [
        'In the field the ion circles with $r = mv/qB$. A faster ion turns a bigger circle, so the lap is longer, but it covers it faster. The two cancel:',
        eq(String.raw`T = \frac{2\pi r}{v} = \frac{2\pi m}{qB}, \qquad f = ${(c.f / 1e6).toFixed(1)}\ \text{MHz}`),
        `So a voltage alternating at one fixed frequency kicks the ion every time it crosses the gap, and the orbit spirals out. The dees are hollow metal, so there is no electric field inside them (Exam 2): the voltage reverses while the ion is shielded, and only the gap does work on it. It leaves at the dees' edge with $K = (qBR)^2/2m$ = ${c.KmaxMeV.toFixed(2)} MeV, whatever the gap voltage. A bigger voltage only means fewer laps.`,
        relativity(c),
      ],
    };
  },
});
