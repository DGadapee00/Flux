import * as THREE from 'three';
import { defineLab } from './define.js';
import { Arrow, M, Q, fatLine, disposeTree } from '../scene/manim.js';
import { railgunLaunch } from '../physics/devices.js';
import { kv, cells, qv, eq, tex } from '../ui/shared.js';
import { sciHTML, fmtSpeed } from '../ui/format.js';
import { fmtB } from './biot.js';
import { label, si } from './device-kit.js';

/**
 * Application: the railgun (Ch 46–47). Two rails and a sliding armature make one loop of current.
 * The rails' own field (Biot–Savart, each rail a semi-infinite wire ending at the armature) crosses
 * the armature, and F = IL × B pushes it along the rails. Nothing else: no magnet, no explosive.
 *
 * The scene is a schematic, not to scale: the rails are drawn a fixed length and the spacing grows
 * with w. Seen from above, B points out of the page. Colours follow the scene palette: current gold, B teal, force pink, the supply purple (C).
 * The launch plays slowed down so the few milliseconds it really takes can be watched.
 */
const SCENARIOS = [
  { id: 'course', name: 'Notes example: 1 MA, 2 kg, 6 m rails', I: 1e6, w: 0.1, a: 0.01, m: 2, L: 6 },
  { id: 'navy', name: 'Navy-scale: 2.7 MA, 10 kg, 10 m rails', I: 2.7e6, w: 0.15, a: 0.015, m: 10, L: 10 },
  { id: 'bench', name: 'Tabletop: 20 kA, 5 g, 1 m rails', I: 2e4, w: 0.02, a: 0.002, m: 0.005, L: 1 },
];

const RAIL_X0 = -4.5; // breech, in scene units
const RAIL_X1 = 4.5; // muzzle
const LAUNCH_S = 1.8; // display seconds for the launch itself
const FLIGHT_S = 0.9;
const PAUSE_S = 0.8;

const halfGap = (w) => 0.7 + Math.min(1.1, Math.max(0, (w - 0.02) * 5));


const strip = (html) => html.replace(/<[^>]+>/g, '');

const fmtAmp = (I) => (I >= 1e6 ? `${(I / 1e6).toFixed(2)} MA` : `${(I / 1e3).toFixed(0)} kA`);
const fmtMass = (m) => (m >= 1 ? `${m.toFixed(1)} kg` : `${(m * 1000).toFixed(0)} g`);

export default defineLab({
  id: 'railgun',
  exam: 'e4',
  title: 'Railgun',
  hint: 'Change the current and watch the push grow as I²',
  // Seen from above, like a textbook figure: the launch runs left to right, B points out of the
  // page, and the flat-lab framing fits the drawing to the space beside the panels.
  orbit: false,
  camera: { pos: new THREE.Vector3(0.3, 0.3, 21), target: new THREE.Vector3(0.3, 0.3, 0) },
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
          ${slider('rg-I', 'Current <i>I</i> (log)', 3.5, 6.6, 0.01)}
          ${slider('rg-w', 'Rail spacing <i>w</i>', 0.01, 0.3, 0.005)}
          ${slider('rg-a', 'Rail radius <i>a</i>', 0.001, 0.03, 0.0005)}
          ${slider('rg-m', 'Projectile mass <i>m</i> (log)', -3, 1.5, 0.01)}
          ${slider('rg-L', 'Rail length <i>L</i>', 0.5, 12, 0.5)}
          <p class="tiny">Drawn as a schematic: the rails are not to scale. The launch plays slowed down; the real one lasts the time shown.</p>
        </div>`;
  },
  bind(api) {
    const on = (id, f) =>
      document.getElementById(id).addEventListener('input', (e) => {
        f(api.slice(), Number(e.target.value));
        api.bump();
      });
    on('rg-I', (s, v) => (s.I = 10 ** v));
    on('rg-w', (s, v) => {
      s.w = v;
      s.a = Math.min(s.a, v / 3);
    });
    on('rg-a', (s, v) => (s.a = Math.min(v, s.w / 3)));
    on('rg-m', (s, v) => (s.m = 10 ** v));
    on('rg-L', (s, v) => (s.L = v));
  },
  syncControls(state) {
    const set = (id, v, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = v;
      document.getElementById(`${id}-val`).textContent = text;
    };
    set('rg-I', Math.log10(state.I), fmtAmp(state.I));
    set('rg-w', state.w, `${(state.w * 100).toFixed(1)} cm`);
    set('rg-a', state.a, `${(state.a * 100).toFixed(2)} cm`);
    set('rg-m', Math.log10(state.m), fmtMass(state.m));
    set('rg-L', state.L, `${state.L.toFixed(1)} m`);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const armature = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1, 0.2), new THREE.MeshBasicMaterial({ color: 0xb8b2ae }));
    const slug = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 20), new THREE.MeshBasicMaterial({ color: M.lavender }));
    slug.rotation.z = -Math.PI / 2;
    const fArrow = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 2, Q.F, 0.4, 0.32, 0.06);
    const iArrow = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.5, Q.I, 0.3, 0.26, 0.001);
    const moving = new THREE.Group();
    moving.add(armature, slug, fArrow, iArrow);
    const speed = label('', 0.2, 0, 0);
    const fLabel = label('', 1.4, 0, 0);
    moving.add(speed, fLabel);
    group.add(moving);
    // B between the rails, out of the page: a grid of ⊙ marks, shown only behind the armature.
    const dots = [];
    for (let x = RAIL_X0 + 0.5; x < RAIL_X1 - 0.2; x += 0.8) {
      for (const f of [-0.55, 0, 0.55]) {
        const d = label('<span class="qB rg-dot">⊙</span>', x, 0, 0);
        d.userData = { x, f };
        dots.push(d);
        group.add(d);
      }
    }
    group.visible = false;
    return { group, moving, armature, slug, fArrow, iArrow, speed, fLabel, dots, scene: null, key: '', time: 0 };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
    handle.time = 0;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.rg = railgunLaunch(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.rg;
    if (!h || !c) return;
    ctx.grid.visible = false;
    const key = JSON.stringify([state.I, state.w, state.a, state.m, state.L]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);
    // Seen from above, the rails lie in the page: the upper rail at +ys, the lower at −ys.
    const ys = halfGap(state.w);
    h.ys = ys;
    const railW = 4 + Math.min(6, state.a * 300);
    g.add(fatLine([RAIL_X0, ys, 0, RAIL_X1, ys, 0], { color: Q.I, width: railW }));
    g.add(fatLine([RAIL_X0, -ys, 0, RAIL_X1, -ys, 0], { color: Q.I, width: railW }));
    // The pulsed supply at the breech, a capacitor bank joined to both rails.
    const bank = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2 * ys + 0.7, 0.3), new THREE.MeshBasicMaterial({ color: Q.C, transparent: true, opacity: 0.55 }));
    bank.position.set(RAIL_X0 - 0.6, 0, -0.1);
    g.add(bank);
    g.add(label('<span style="color:var(--purple,#9A72AC)">pulsed<br>supply</span>', RAIL_X0 - 0.6, 0, 0.2));
    // Current: out along the lower rail, across the armature, back along the upper one. Only the
    // rail between the supply and the armature carries it, so afterFrame shows each arrow only once
    // the armature has passed it.
    h.behind = [];
    const behind = (obj, x) => {
      g.add(obj);
      h.behind.push({ obj, x });
    };
    for (const x of [-3.2, -1.9, -0.6, 0.7, 2, 3.3]) {
      behind(new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(x, -ys, 0.05), 0.5, Q.I, 0.3, 0.26, 0.001), x + 0.5);
      behind(new Arrow(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(x + 0.5, ys, 0.05), 0.5, Q.I, 0.3, 0.26, 0.001), x + 0.5);
    }
    // Under the supply, clear of the armature's speed label at the start of the launch.
    g.add(label(qv('qI', `<i>I</i> = ${fmtAmp(state.I)}`), RAIL_X0 - 0.6, -ys - 0.75, 0));
    g.add(label(`<span class="qB"><i>B</i> ⊙ out of the page · ${fmtB(c.Bmid)} midway</span>`, 0.4, ys + 1.05, 0));
    // The rails repel (antiparallel currents): short pink arrows pushing each rail outward, again
    // only where current flows.
    for (const x of [-2.6, -0.2, 2.2]) {
      behind(new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, ys + 0.12, 0), 0.5, Q.F, 0.2, 0.17, 0.028), x);
      behind(new Arrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(x, -ys - 0.12, 0), 0.5, Q.F, 0.2, 0.17, 0.028), x);
    }
    g.add(label(`<span style="color:var(--pink,#D147BD)">rails pushed apart · ${si(c.railRepelPerM, 'N')}/m</span>`, 1.1, -ys - 0.95, 0));
    g.add(label(`<span class="muted">${state.L.toFixed(1)} m of rail, ${(state.w * 100).toFixed(1)} cm apart · not to scale</span>`, 0.4, -ys - 1.45, 0));
    h.armature.scale.set(1, 2 * ys + 0.25, 1);
    h.slug.position.set(0.46, 0, 0);
    h.fArrow.position.set(0.2, 0, 0.1);
    h.fArrow.setLength(0.9 + 1.2 * Math.tanh(c.F / 5e5), 0.36, 0.3);
    h.iArrow.position.set(-0.2, -0.25, 0.1);
    h.speed.position.set(0.1, -ys - 0.5, 0);
    h.fLabel.position.set(0.9, 0.35, 0);
    h.fLabel.element.innerHTML = `<span style="color:var(--pink,#D147BD)"><i>F</i> = ${si(c.F, 'N')}</span>`;
    for (const d of h.dots) d.position.y = d.userData.f * ys * 1.5;
    h.time = 0;
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.rg;
    if (!h || !c || h.ys == null) return;
    h.time = (h.time + dt) % (LAUNCH_S + FLIGHT_S + PAUSE_S);
    const t = h.time;
    const start = RAIL_X0 + 0.35;
    let x;
    let vReal;
    let onRails = true;
    if (t < LAUNCH_S) {
      const f = t / LAUNCH_S;
      x = start + (RAIL_X1 - start) * f * f; // constant acceleration: distance grows as t²
      vReal = c.v * f;
    } else if (t < LAUNCH_S + FLIGHT_S) {
      // Past the muzzle the armature leaves the circuit: no current through it, no push.
      onRails = false;
      x = RAIL_X1 + 1.6 * ((t - LAUNCH_S) / FLIGHT_S);
      vReal = c.v;
    } else {
      x = start;
      vReal = 0;
    }
    h.moving.position.set(x, 0, 0);
    h.moving.visible = t < LAUNCH_S + FLIGHT_S;
    h.fArrow.visible = onRails;
    h.iArrow.visible = onRails;
    h.fLabel.visible = onRails;
    h.speed.element.innerHTML = `<span class="mono">${Math.round(vReal).toLocaleString('en-US')} m/s</span>`;
    for (const d of h.dots) d.visible = onRails && d.userData.x < x - 0.25;
    // Once the armature leaves the rails the circuit is open: no current anywhere, no forces.
    for (const b of h.behind ?? []) b.obj.visible = onRails && b.x < x - 0.15;
  },
  law() {
    return [
      String.raw`\vec{F} = \qI\,\vec{L}\times\vec{B} \;\Rightarrow\; F = \int_a^{w-a} \qI\,B(y)\,dy`,
      String.raw`B(y) = \dfrac{\mu_0 \qI}{4\pi}\left(\dfrac{1}{y} + \dfrac{1}{w-y}\right) \;\Rightarrow\; F = \dfrac{\mu_0 \qI^2}{2\pi}\ln\dfrac{w-a}{a}`,
      String.raw`v = \sqrt{\dfrac{2FL}{m}}`,
    ];
  },
  liveRows(state, computed) {
    const c = computed.rg;
    if (!c) return '';
    return [
      kv(tex(String.raw`B \text{ midway} = \mu_0 \qI/\pi w`), qv('qB', fmtB(c.Bmid))),
      kv(tex(String.raw`F = \tfrac{\mu_0 \qI^2}{2\pi}\ln\tfrac{w-a}{a}`), qv('qF', si(c.F, 'N'))),
      kv(tex(String.raw`a = F/m`), `${sciHTML(c.acc, 2)} m/s² · ${Math.round(c.gees).toLocaleString('en-US')} g`),
      kv(tex(String.raw`v = \sqrt{2FL/m}`), fmtSpeed(c.v)),
      kv(tex(String.raw`t = v/a`), si(c.t, 's')),
      kv(tex(String.raw`K = FL = \tfrac12 mv^2`), si(c.KE, 'J')),
      kv('Rails pushed apart', `${si(c.railRepelPerM, 'N')} per metre`),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.rg;
    if (!c) return '';
    return cells([
      [String.raw`Push $F$`, si(c.F, 'N'), 'qF'],
      [String.raw`Acceleration`, `${Math.round(c.gees).toLocaleString('en-US')} g`, ''],
      [String.raw`Muzzle speed $v$`, fmtSpeed(c.v), ''],
      [String.raw`Kinetic energy`, si(c.KE, 'J'), ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.rg;
    if (!c) return { title: '', body: '' };
    return {
      title: 'A railgun is $\\vec F = I\\vec L\\times\\vec B$, and the rails make their own $\\vec B$',
      body: [
        'The current runs out along one rail, across the armature, and back along the other. Each rail is a long wire ending at the armature, so between the rails both fields point the same way (right-hand rule 2). The armature carries current across that field, so it is pushed along the rails, away from the supply.',
        eq(String.raw`F = \frac{\mu_0 I^2}{2\pi}\ln\frac{w-a}{a} = ${strip(si(c.F, 'N'))}`),
        'The push goes as $I^2$: the current makes the field and then feels it. Double the current and the push is four times as big.',
        'Section 8 of the notes says a magnetic force does no work on a moving charge. So where does the kinetic energy come from? The supply. As the armature moves, its charges move with it across $\\vec B$, and $q\\vec v\\times\\vec B$ pushes them back against the current: a back emf. The supply does work driving the current against it, and the magnetic force passes that work on to the armature.',
        '<b>What the course model leaves out.</b> The current is not steady: a capacitor bank dumps its charge in a pulse (the Exam 3 energy $\\tfrac12CV^2$). The rails repel each other hard, and heat as $I^2R$. Real armatures arc and wear the rails. The back emf, and the field energy left behind the armature, are Ch 48: even with no resistance, at constant current only half of the supply’s work becomes kinetic energy.',
      ],
    };
  },
});
