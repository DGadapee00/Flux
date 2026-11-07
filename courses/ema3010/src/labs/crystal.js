import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, begin, dot, label, line, poly, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { STRUCTURES, crystal, packingByGrid } from '@flux/subjects/matsci/crystal.js';

/**
 * Crystal: hard-sphere atoms in a unit cell, grown until they touch.
 *
 * The drawing is the plane in which the atoms touch: a cube face for simple cubic and FCC, the
 * diagonal plane through the body diagonal for BCC, the basal plane for HCP. Shows that metals do
 * not all pack as tightly as they can: BCC iron fills 68% of space, FCC copper 74%. The packing
 * fraction is checked by counting grid points inside the atoms, and the density from the cell
 * against the measured density (packages/subjects/src/matsci/crystal.js).
 */
export const MATERIALS = {
  po: { name: 'Polonium (α)', R: 0.168, A: 209.0, own: 'sc', rho: 9.196 },
  fe: { name: 'Iron (α)', R: 0.1241, A: 55.85, own: 'bcc', rho: 7.874 },
  cu: { name: 'Copper', R: 0.1278, A: 63.55, own: 'fcc', rho: 8.96 },
  al: { name: 'Aluminum', R: 0.1431, A: 26.98, own: 'fcc', rho: 2.7 },
  mg: { name: 'Magnesium', R: 0.1604, A: 24.31, own: 'hcp', rho: 1.738 },
};

const SCENARIOS = [
  { id: 'cu', name: 'Copper: face-centred cubic', material: 'cu', structure: 'fcc', grow: 1 },
  { id: 'fe', name: 'Iron: body-centred cubic', material: 'fe', structure: 'bcc', grow: 1 },
  { id: 'po', name: 'Polonium: simple cubic', material: 'po', structure: 'sc', grow: 1 },
  { id: 'mg', name: 'Magnesium: hexagonal close-packed', material: 'mg', structure: 'hcp', grow: 1 },
  { id: 'small', name: 'Copper with the atoms at half size', material: 'cu', structure: 'fcc', grow: 0.5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, material: sc.material, structure: sc.structure, grow: sc.grow });
}

/** Atom centres in the drawn plane, in units of a, and the plane's width and height. */
function section(structure, a) {
  if (structure === 'bcc') {
    const w = Math.SQRT2;
    return { w, h: 1, atoms: [[0, 0], [w, 0], [0, 1], [w, 1], [w / 2, 0.5]], touch: [[0, 0], [w, 1]] };
  }
  if (structure === 'fcc') return { w: 1, h: 1, atoms: [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]], touch: [[0, 0], [1, 1]] };
  if (structure === 'hcp') {
    const atoms = [[0, 0]];
    for (let k = 0; k < 6; k++) atoms.push([Math.cos((k * Math.PI) / 3), Math.sin((k * Math.PI) / 3)]);
    return { w: 2, h: Math.sqrt(3), atoms, touch: [[-1, 0], [1, 0]], hex: true };
  }
  return { w: 1, h: 1, atoms: [[0, 0], [1, 0], [0, 1], [1, 1]], touch: [[0, 0], [1, 0]] };
}

export default defineLab({
  id: 'crystal',
  exam: 'u1',
  title: 'Crystal',
  hint: 'Grow the atoms until they touch, then read the packing fraction. Iron is body-centred and leaves 32% of space empty; copper is face-centred and leaves 26%.',
  gapLimit: 1e-2,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('cu', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'grow', lo: 0.5, hi: 1 }),
  controls() {
    return `
      <label class="field"><span>Element</span><select id="cr-mat">${Object.entries(MATERIALS).map(([id, m]) => `<option value="${id}">${m.name}</option>`).join('')}</select></label>
      <label class="field"><span>Structure</span><select id="cr-st">${Object.entries(STRUCTURES).map(([id, s]) => `<option value="${id}">${s.name}</option>`).join('')}</select></label>
      ${slider('cr-grow', 'Atom size, as a share of touching', 1, 0.5, 1, 0.01)}
      <p class="tiny">Hard spheres of the element's atomic radius. The measured density is shown only for the element's own structure.</p>`;
  },
  bind(api) {
    document.getElementById('cr-mat')?.addEventListener('change', (e) => {
      const s = api.slice();
      s.material = e.target.value;
      s.structure = MATERIALS[s.material].own;
      api.bump();
    });
    document.getElementById('cr-st')?.addEventListener('change', (e) => {
      api.slice().structure = e.target.value;
      api.bump();
    });
    bindSlider('cr-grow', (s, v) => { s.grow = v; }, api);
  },
  syncControls(state) {
    const m = document.getElementById('cr-mat');
    if (m) m.value = state.material;
    const st = document.getElementById('cr-st');
    if (st) st.value = state.structure;
    const g = document.getElementById('cr-grow');
    if (g && document.activeElement !== g) g.value = String(state.grow);
  },
  compute(state) {
    const m = MATERIALS[state.material] || MATERIALS.cu;
    const c = crystal({ structure: state.structure, R: m.R, A: m.A, grow: state.grow });
    const grid = packingByGrid(state.structure, m.R, state.grow);
    const own = state.structure === m.own;
    return {
      ...c,
      materialName: m.name,
      R: m.R,
      grid,
      gap: Math.abs(grid - c.apf) / c.apf,
      own,
      measured: own ? m.rho : null,
      densityError: own ? (c.density - m.rho) / m.rho : null,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const sec = section(state.structure, c.a);
    const pad = 0.6;
    const x0 = sec.hex ? -1 - pad : -pad;
    const x1 = sec.hex ? 1 + pad : sec.w + pad;
    const y0 = sec.hex ? -sec.h / 2 - pad : -pad;
    const y1 = sec.hex ? sec.h / 2 + pad + 0.35 : sec.h + pad + 0.35;
    const P = sceneIn(B, B.free, { x0, x1, y0, y1 }, 14);
    // Distances in the drawing are in units of a; the atoms' radius in those units:
    const rr = c.r / c.a;
    if (sec.hex) {
      const hex = [];
      for (let k = 0; k <= 6; k++) hex.push([Math.cos((k * Math.PI) / 3), Math.sin((k * Math.PI) / 3)]);
      line(P, hex, { color: alpha(C.text, 0.5), width: 1.5 });
    } else {
      poly(P, [[0, 0], [sec.w, 0], [sec.w, sec.h], [0, sec.h]], { fill: null, stroke: alpha(C.text, 0.5), width: 1.5 });
    }
    for (const [x, y] of sec.atoms) {
      const circle = [];
      for (let k = 0; k <= 60; k++) circle.push([x + rr * Math.cos((2 * Math.PI * k) / 60), y + rr * Math.sin((2 * Math.PI * k) / 60)]);
      poly(P, circle, { fill: alpha(C.gold, 0.35), stroke: C.gold, width: 1.5 });
      dot(P, x, y, { color: C.gold, r: 2 });
    }
    line(P, sec.touch, { color: alpha(C.teal, 0.9), width: 2, dash: [5, 4] });
    const top = sec.hex ? sec.h / 2 + pad : sec.h + pad;
    label(P, `${c.name}: a = ${fig(c.a)} nm, touching ${c.touch}`, [(x0 + x1) / 2, top + 0.1], { color: C.muted });
  },
  law: () => [String.raw`\text{APF} = \frac{N\,\tfrac43\pi R^3}{V_\text{cell}}, \qquad \rho = \frac{N A}{V_\text{cell} N_A}`, String.raw`a_\text{SC} = 2R, \quad a_\text{BCC} = \frac{4R}{\sqrt3}, \quad a_\text{FCC} = 2\sqrt2\,R`],
  liveRows(state, c) {
    return [
      kv('Atoms per cell, neighbours', `${c.N}, ${c.coordination}`),
      kv('Lattice parameter a', `${fig(c.a)} nm`),
      kv('Packing fraction', fig(c.apf)),
      kv('Second route: grid points inside an atom', fig(c.grid)),
      kv('Density from the cell', `${fig(c.density)} g/cm³`),
      kv('Measured density', c.own ? `${fig(c.measured)} g/cm³ (${fig(100 * c.densityError)}%)` : 'not this element’s structure'),
      kv('Grid against closed form', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['structure', state.structure.toUpperCase()],
      ['packing', `${fig(100 * c.apf)}%`],
      ['a', `${fig(c.a)} nm`],
      ['density', `${fig(c.density)} g/cm³`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Atoms are not hard spheres, and the radius depends on the structure: iron's atoms sit slightly further apart when it turns face-centred above 912 °C. Real crystals also hold vacancies and other defects.`;
    let title = `${c.name} packs ${fig(100 * c.apf)}% of space`;
    let body = `In ${c.name.toLowerCase()} the atoms touch ${c.touch}, which sets a = ${fig(c.a)} nm. ${c.N} atoms fill the cell, so the packing fraction is ${fig(c.apf)} and the density ${fig(c.density)} g/cm³${c.own ? `, within ${fig(Math.abs(100 * c.densityError))}% of the measured ${fig(c.measured)}` : ''}.`;
    if (state.structure === 'bcc') {
      title = 'Not every metal packs as tightly as it can';
      body = `Body-centred cubic fills 68% of space, against 74% for face-centred cubic and HCP. Iron is BCC at room temperature anyway: other things, such as the bonding between d electrons, decide the structure, not packing alone. ${body}`;
    } else if (state.grow < 0.999) {
      title = 'Smaller atoms, the same cell';
      body = `At ${fig(100 * state.grow)}% of the touching size the atoms fill only ${fig(100 * c.apf)}% of the cell: the fraction falls as the cube of the radius. Grow them back to touching for the real packing.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
