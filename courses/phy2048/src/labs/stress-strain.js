/**
 * Shows that below the yield a stretch is FL/(AE), and that unloading from past
 * the yield leaves a permanent set.
 *
 * The closed form is Hooke's law, or the bilinear curve past yield. The check
 * integrates the pillar's own weight in slices, and unloads the yielded wire along E.
 */
import * as THREE from 'three';
import {
  avgShear, axialStress, bilinear, normalStrain, permanentSet, segmentElongation,
} from '@flux/subjects/mechanics/materials.js';
import { G } from '@flux/subjects/mechanics/constants.js';
import { M, QUANTITY_COLORS, fatLine, label, updateFatLine } from '../scene/kit.js';
import {
  bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow,
} from './define.js';

const MODES = [
  ['rod', 'Steel rod in tension'],
  ['pillar', 'Granite pillar'],
  ['shear', 'A shelf in shear'],
  ['yield', 'A wire past yield'],
];

const rod = { mode: 'rod', rodM: 550, rodL: 2, rodA: 3e-5, rodE: 2e11, g: 9.8 };
const pillar = {
  mode: 'pillar', pilSculpt: 10000, pilH: 3, pilA: 0.2, pilRho: 2700, pilE: 4.5e10, g: 9.8,
};
const shelf = { mode: 'shear', shF: 50, shA: 0.27, shL: 1.8, shX: 0.15 };
const yielded = { mode: 'yield', yEps: 0.01, yE: 2e11, yY: 250e6, yEt: 1e10, unloaded: false };

const SCENARIOS = [
  { ...rod, ...pillar, ...shelf, ...yielded, id: 'rod', name: 'A 2.0 m steel rod, 0.30 cm², holding 550 kg', mode: 'rod' },
  { ...rod, ...pillar, ...shelf, ...yielded, id: 'pillar', name: 'Granite 3.0 m below a 10,000 N sculpture', mode: 'pillar' },
  { ...rod, ...pillar, ...shelf, ...yielded, id: 'shelf', name: 'A 50.0 N push, 15.0 cm of shear', mode: 'shear' },
  { ...rod, ...pillar, ...shelf, ...yielded, id: 'yield', name: 'A wire pulled to strain 0.010, then still loaded', mode: 'yield' },
];

function pillarWeight(state, slices) {
  const dh = state.pilH / slices;
  let weight = 0;
  for (let i = 0; i < slices; i += 1) weight += state.pilRho * state.pilA * dh * state.g;
  return weight;
}

function closed(state) {
  const rodForce = state.rodM * state.g;
  const rodStress = axialStress(rodForce, state.rodA);
  const rodDelta = segmentElongation(rodForce, state.rodL, state.rodA, state.rodE);
  const pilForce = pillarWeight(state, 1) + state.pilSculpt;
  const pilStress = axialStress(pilForce, state.pilA);
  const pilStrain = pilStress / state.pilE;
  const shStress = avgShear(state.shF, state.shA);
  const shStrain = normalStrain(state.shX, state.shL);
  const shMod = shStress / shStrain;
  const curve = bilinear(state.yEps, state.yE, state.yY, state.yEt);
  const permanent = state.unloaded ? permanentSet(state.yEps, curve.stress, state.yE) : 0;
  return {
    rodStress, rodDelta, pilStress, pilStrain, shStress, shStrain, shMod,
    yStress: curve.stress, permanent,
  };
}

function integrated(state) {
  const rodForce = state.rodM * state.g;
  const rodStress = rodForce / state.rodA;
  const rodDelta = (rodStress * state.rodL) / state.rodE;
  const pilForce = pillarWeight(state, 4000) + state.pilSculpt;
  const pilStress = pilForce / state.pilA;
  const pilStrain = pilStress / state.pilE;
  const shStress = state.shF / state.shA;
  const shStrain = state.shX / state.shL;
  const shMod = shStress / shStrain;
  const ey = state.yY / state.yE;
  const yStress = state.yEps <= ey
    ? state.yE * state.yEps
    : state.yY + state.yEt * (state.yEps - ey);
  const permanent = state.unloaded ? Math.max(0, state.yEps - yStress / state.yE) : 0;
  return {
    rodStress, rodDelta, pilStress, pilStrain, shStress, shStrain, shMod, yStress, permanent,
  };
}

function curvePoints(state, computed) {
  const pts = [];
  const n = 32;
  const pushLine = (epsMax, stressAt) => {
    const span = Math.max(epsMax, 1e-9);
    for (let i = 0; i <= n; i += 1) {
      const eps = (span * i) / n;
      pts.push(eps, stressAt(eps), 0);
    }
  };
  if (state.mode === 'yield') {
    const epsMax = Math.max(state.yEps * 1.05, state.yY / state.yE);
    pushLine(epsMax, (eps) => bilinear(eps, state.yE, state.yY, state.yEt).stress);
    if (state.unloaded) {
      pts.push(state.yEps, computed.yStress, 0);
      pts.push(computed.permanent, 0, 0);
    }
  } else if (state.mode === 'shear') {
    pushLine(Math.max(computed.shStrain, 1e-4), (eps) => computed.shMod * eps);
  } else if (state.mode === 'pillar') {
    pushLine(Math.max(computed.pilStrain * 1.2, 1e-6), (eps) => state.pilE * eps);
  } else {
    const eps = computed.rodDelta / Math.max(state.rodL, 1e-9);
    pushLine(Math.max(eps * 1.2, 1e-6), (e) => state.rodE * e);
  }
  while (pts.length < 36 * 3) pts.push(pts[pts.length - 3], pts[pts.length - 2], 0);
  return pts.slice(0, 36 * 3);
}

export default defineLab({
  id: 'stress-strain',
  exam: 'u8',
  title: 'Stress and strain',
  hint: 'In the straight part of the curve, stress over strain is the modulus. Past yield, letting go does not restore the length.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.1, 22), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'ss-load',
      scenario: 'rod',
      ask: 'Double the hanging mass and keep the rod. What happens to the elongation?',
      apply(s) { s.rodM *= 2; },
      watch: [{ id: 'delta', label: 'the elongation', get: (c) => c.rodDelta, mode: 'factor' }],
      expect: { delta: 2 },
      why: 'Below the yield, ΔL = FL/(AE). The elongation is proportional to the force, and the force is the weight.',
    },
    {
      id: 'ss-area',
      scenario: 'rod',
      ask: 'Double the cross-sectional area and keep the mass. What happens to the stress?',
      apply(s) { s.rodA *= 2; },
      watch: [{ id: 'stress', label: 'the stress', get: (c) => c.rodStress, mode: 'factor' }],
      expect: { stress: 0.5 },
      why: 'Stress is force over area. The weight did not change, so twice the area cuts the stress in half.',
    },
    {
      id: 'ss-unload',
      scenario: 'yield',
      ask: 'Unload the wire from past the yield, back to zero force. Is a permanent stretch left?',
      apply(s) { s.unloaded = true; },
      watch: [{ id: 'set', label: 'a permanent set', get: (c) => c.permanent > 1e-6, mode: 'bool' }],
      expect: { set: true },
      why: 'The unload follows Young’s modulus, not the path that got there. The strain that remains is the permanent set.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('rod', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('ss-mode', 'Specimen', MODES, 'rod')}
      <div id="ss-rod">${sliderRow('ss-m', 'Hanging mass (kg)', 550, 50, 2000, 10)}${sliderRow('ss-L', 'Length (m)', 2, 0.2, 6, 0.1)}${sliderRow('ss-A', 'Area (cm²)', 0.3, 0.05, 4, 0.01)}${sliderRow('ss-E', 'Young’s modulus (GPa)', 200, 10, 400, 5)}</div>
      <div id="ss-pil">${sliderRow('ss-sc', 'Sculpture (N)', 10000, 0, 50000, 100)}${sliderRow('ss-h', 'Depth (m)', 3, 0.5, 8, 0.1)}${sliderRow('ss-pA', 'Area (m²)', 0.2, 0.05, 1, 0.01)}${sliderRow('ss-rho', 'Density (kg/m³)', 2700, 500, 8000, 50)}${sliderRow('ss-pE', 'Modulus (GPa)', 45, 10, 400, 5)}</div>
      <div id="ss-sh">${sliderRow('ss-F', 'Shear force (N)', 50, 5, 500, 1)}${sliderRow('ss-sA', 'Area (m²)', 0.27, 0.05, 2, 0.01)}${sliderRow('ss-sL', 'Height (m)', 1.8, 0.2, 4, 0.1)}${sliderRow('ss-dx', 'Shift (cm)', 15, 0.1, 40, 0.1)}</div>
      <div id="ss-y">${sliderRow('ss-eps', 'Strain', 0.01, 0.0005, 0.02, 0.0005)}${sliderRow('ss-yE', 'Modulus (GPa)', 200, 50, 400, 10)}${sliderRow('ss-yY', 'Yield (MPa)', 250, 50, 500, 10)}${sliderRow('ss-et', 'Tangent modulus (GPa)', 10, 0, 40, 1)}</div>
    </div>`;
  },
  bind(api) {
    bindSelect(api, 'ss-mode', (s, v) => { s.mode = v; });
    bindSlider(api, 'ss-m', (s, v) => { s.rodM = v; });
    bindSlider(api, 'ss-L', (s, v) => { s.rodL = v; });
    bindSlider(api, 'ss-A', (s, v) => { s.rodA = v * 1e-4; });
    bindSlider(api, 'ss-E', (s, v) => { s.rodE = v * 1e9; });
    bindSlider(api, 'ss-sc', (s, v) => { s.pilSculpt = v; });
    bindSlider(api, 'ss-h', (s, v) => { s.pilH = v; });
    bindSlider(api, 'ss-pA', (s, v) => { s.pilA = v; });
    bindSlider(api, 'ss-rho', (s, v) => { s.pilRho = v; });
    bindSlider(api, 'ss-pE', (s, v) => { s.pilE = v * 1e9; });
    bindSlider(api, 'ss-F', (s, v) => { s.shF = v; });
    bindSlider(api, 'ss-sA', (s, v) => { s.shA = v; });
    bindSlider(api, 'ss-sL', (s, v) => { s.shL = v; });
    bindSlider(api, 'ss-dx', (s, v) => { s.shX = v / 100; });
    bindSlider(api, 'ss-eps', (s, v) => { s.yEps = v; });
    bindSlider(api, 'ss-yE', (s, v) => { s.yE = v * 1e9; });
    bindSlider(api, 'ss-yY', (s, v) => { s.yY = v * 1e6; });
    bindSlider(api, 'ss-et', (s, v) => { s.yEt = v * 1e9; });
  },
  syncControls(state) {
    putSelect('ss-mode', state.mode);
    putSlider('ss-m', state.rodM, 0);
    putSlider('ss-L', state.rodL, 2);
    putSlider('ss-A', state.rodA * 1e4, 2);
    putSlider('ss-E', state.rodE / 1e9, 0);
    putSlider('ss-sc', state.pilSculpt, 0);
    putSlider('ss-h', state.pilH, 1);
    putSlider('ss-pA', state.pilA, 2);
    putSlider('ss-rho', state.pilRho, 0);
    putSlider('ss-pE', state.pilE / 1e9, 0);
    putSlider('ss-F', state.shF, 0);
    putSlider('ss-sA', state.shA, 2);
    putSlider('ss-sL', state.shL, 2);
    putSlider('ss-dx', state.shX * 100, 1);
    putSlider('ss-eps', state.yEps, 4);
    putSlider('ss-yE', state.yE / 1e9, 0);
    putSlider('ss-yY', state.yY / 1e6, 0);
    putSlider('ss-et', state.yEt / 1e9, 0);
    const show = {
      'ss-rod': state.mode === 'rod',
      'ss-pil': state.mode === 'pillar',
      'ss-sh': state.mode === 'shear',
      'ss-y': state.mode === 'yield',
    };
    for (const [id, on] of Object.entries(show)) {
      const el = document.getElementById(id);
      if (el) el.hidden = !on;
    }
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const bar = fatLine([0, -1.4, 0, 0, 1.4, 0], { color: M.blue, width: 8 });
    const curve = fatLine(new Array(36 * 3).fill(0), { color: M.gold, width: 2 });
    const name = label('ΔL', 0, 0, 0, 'graph-axis');
    group.add(bar, curve, name);
    group.visible = false;
    return { group, bar, curve, name };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    Object.assign(computed, closed(state));
  },
  second(state) {
    return integrated(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.bar) return;
    ctx.grid.visible = false;
    const stretch = state.mode === 'rod'
      ? Math.min(0.6, computed.rodDelta * 80)
      : state.mode === 'yield'
        ? (state.unloaded ? computed.permanent : state.yEps) * 40
        : 0.15;
    updateFatLine(h.bar, [-0.15, -1.3, 0, -0.15, 1.2 + stretch, 0]);
    const raw = curvePoints(state, computed);
    let maxS = 1;
    let maxE = 1e-4;
    for (let i = 0; i < raw.length; i += 3) {
      maxE = Math.max(maxE, raw[i]);
      maxS = Math.max(maxS, raw[i + 1]);
    }
    const drawn = [];
    for (let i = 0; i < raw.length; i += 3) {
      drawn.push(0.4 + (raw[i] / maxE) * 3.2, -1.3 + (raw[i + 1] / maxS) * 2.6, 0.02);
    }
    updateFatLine(h.curve, drawn);
    h.name.element.textContent = state.mode === 'shear' ? 'Δx' : state.mode === 'yield' ? 'ε' : 'ΔL';
    h.name.position.set(0.35, 1.35 + stretch, 0);
  },
  law(state) {
    if (state.mode === 'shear') return [String.raw`\mathrm{stress} = F_{\parallel}/A`, String.raw`S = \dfrac{F_{\parallel}/A}{\Delta x/L_0}`];
    if (state.mode === 'yield') {
      const past = state.yEps > state.yY / state.yE;
      return past
        ? [String.raw`\sigma = \sigma_Y + Y_t(\varepsilon - \sigma_Y/Y)`, String.raw`\varepsilon_{\mathrm{set}} = \varepsilon - \sigma/Y`]
        : [String.raw`\sigma = Y\varepsilon`, String.raw`\varepsilon_{\mathrm{set}} = 0`];
    }
    return [String.raw`\sigma = F/A`, String.raw`\Delta L = FL/(AY)`];
  },
  readoutCells(state, computed) {
    if (state.mode === 'pillar') {
      return [
        ['Compressive stress', `${fmt(computed.pilStress)} Pa`],
        ['Strain', fmt(computed.pilStrain)],
      ];
    }
    if (state.mode === 'shear') {
      return [
        ['Shear stress', `${fmt(computed.shStress)} Pa`],
        ['Shear strain', fmt(computed.shStrain)],
        ['Shear modulus', `${fmt(computed.shMod)} Pa`],
      ];
    }
    if (state.mode === 'yield') {
      return [
        ['Stress', `${fmt(computed.yStress)} Pa`],
        ['Permanent strain', fmt(computed.permanent)],
      ];
    }
    return [
      ['Tensile stress', `${fmt(computed.rodStress)} Pa`],
      ['Elongation', `${fmt(computed.rodDelta)} m`],
    ];
  },
  coach(state, computed) {
    if (state.mode === 'pillar') {
      return {
        title: 'The pillar weighs something too',
        body: [
          String.raw`The stress $${fmt(computed.pilStress)}$ Pa includes the sculpture and the granite above this cut. The strain is $${fmt(computed.pilStrain)}$.`,
          'A uniform pillar is most stressed at the base, where the whole column stands on the cut. The modulus is the book’s value for granite, 4.5×10¹⁰ Pa.',
        ],
      };
    }
    if (state.mode === 'shear') {
      return {
        title: 'Shear is a sideways shift',
        body: [
          String.raw`The shear stress is $${fmt(computed.shStress)}$ Pa and the shear strain is $${fmt(computed.shStrain)}$. Their ratio is the shear modulus, $${fmt(computed.shMod)}$ Pa.`,
          'The weight of the bookcase never enters. Only the sideways force, the area it acts on, and the shift it produces.',
        ],
      };
    }
    if (state.mode === 'yield') {
      return {
        title: state.unloaded ? 'The wire did not come back' : 'Still on the way out',
        body: [
          state.unloaded
            ? String.raw`Unloaded, the permanent strain is $${fmt(computed.permanent)}$. The stress went to zero along Young’s modulus, from a point past the yield.`
            : String.raw`At this strain the stress is $${fmt(computed.yStress)}$ Pa. The straight line would have been steeper. The shallow part is past the yield.`,
          'The yield stress and the tangent modulus are givens for this wire. The book’s section describes the shape of this curve and does not print this particular wire.',
        ],
      };
    }
    return {
      title: 'Force per area, not the force',
      body: [
        String.raw`The stress is $${fmt(computed.rodStress)}$ Pa. The rod grows by $${fmt(computed.rodDelta)}$ m. Double the area and the stress is cut in half. Double the force and the stretch doubles.`,
        'This rod is still on the straight part of the curve. The book’s steel modulus is 2.0×10¹¹ Pa, and the book uses g = 9.8 m/s² for the platform’s weight.',
      ],
    };
  },
});
