import { axialStress, requiredArea } from '@flux/subjects/mechanics/materials.js';
import { methodOfSections, solveTruss } from '@flux/subjects/mechanics/truss.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, label, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/** A three-panel Pratt truss, 2 m panels and 2 m deep, loaded at the bottom chord: P at B, 2P at C. */
const J = {
  A: { x: 0, y: 0, z: 0 },
  B: { x: 2, y: 0, z: 0 },
  C: { x: 4, y: 0, z: 0 },
  D: { x: 6, y: 0, z: 0 },
  E: { x: 2, y: 2, z: 0 },
  F: { x: 4, y: 2, z: 0 },
};
const MEMBERS = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['A', 'E'], ['E', 'F'], ['F', 'D'], ['B', 'E'], ['C', 'F'], ['B', 'F']];
/** The chords include the sloped end posts. The web is the verticals and the diagonal. */
const GROUP = { AB: 'chord', BC: 'chord', CD: 'chord', AE: 'chord', EF: 'chord', FD: 'chord', BE: 'web', CF: 'web', BF: 'web' };
const SUPPORTS = { A: 'pin', D: 'rollerY' };
/** The section through BC, BF and EF, keeping the left part. */
const KEEP = ['A', 'B', 'E'];

const SCENARIOS = [
  { id: 'even', name: 'Same area everywhere', P: 20e3, Ac: 400e-6, Aw: 400e-6, sY: 250e6, FS: 2 },
  { id: 'thin-web', name: 'A thin web', P: 20e3, Ac: 400e-6, Aw: 300e-6, sY: 250e6, FS: 2 },
  { id: 'heavy', name: 'Heavy load, aluminium', P: 35e3, Ac: 600e-6, Aw: 450e-6, sY: 270e6, FS: 2.5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, P: sc.P, Ac: sc.Ac, Aw: sc.Aw, sY: sc.sY, FS: sc.FS });
}

const trussOf = (P) => ({ joints: J, members: MEMBERS, supports: SUPPORTS, loads: { B: { x: 0, y: -P }, C: { x: 0, y: -2 * P } } });

/** The members' forces, areas and stresses, by the method of joints. */
export function memberTable(state) {
  const sol = solveTruss(trussOf(state.P));
  return {
    sol,
    rows: MEMBERS.map(([p, q]) => {
      const name = `${p}${q}`;
      const F = sol.forces[name];
      const A = GROUP[name] === 'chord' ? state.Ac : state.Aw;
      return { name, group: GROUP[name], F, A, sigma: axialStress(F, A) };
    }),
  };
}

const biggest = (rows, key) => rows.reduce((a, r) => (Math.abs(r[key]) > Math.abs(a[key]) ? r : a), rows[0]);

export default defineLab({
  id: 'truss-stress',
  exam: 'u1',
  title: 'Truss stress',
  hint: 'Each member is a two-force bar, so σ = F/A. Thin a group of members and watch which one becomes critical.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('even', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Aw', lo: 100e-6, hi: 1000e-6 }),
  controls() {
    return `
      ${slider('ts-P', 'load P (kN), 2P at C', 20, 5, 60, 1)}
      ${slider('ts-Ac', 'chord area (mm²)', 400, 100, 1000, 10)}
      ${slider('ts-Aw', 'web area (mm²)', 400, 100, 1000, 10)}
      ${slider('ts-sY', 'yield stress σ_Y (MPa)', 250, 150, 500, 5)}
      ${slider('ts-FS', 'target factor of safety', 2, 1.2, 4, 0.1)}
      <p class="tiny">The chords include the sloped end posts. The web is the two verticals and the diagonal.</p>`;
  },
  bind(api) {
    bindSlider('ts-P', (s, v) => { s.P = v * 1e3; }, api);
    bindSlider('ts-Ac', (s, v) => { s.Ac = v * 1e-6; }, api);
    bindSlider('ts-Aw', (s, v) => { s.Aw = v * 1e-6; }, api);
    bindSlider('ts-sY', (s, v) => { s.sY = v * 1e6; }, api);
    bindSlider('ts-FS', (s, v) => { s.FS = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('ts-P', state.P / 1e3);
    set('ts-Ac', Math.round(state.Ac * 1e6));
    set('ts-Aw', Math.round(state.Aw * 1e6));
    set('ts-sY', Math.round(state.sY / 1e6));
    set('ts-FS', state.FS);
  },
  compute(state) {
    const { sol, rows } = memberTable(state);
    const sec = methodOfSections(trussOf(state.P), KEEP);
    const scale = Math.max(...rows.map((r) => Math.abs(r.F)), 1);
    let gap = sol.worstResidual / scale;
    for (const c of sec.cut) gap = Math.max(gap, Math.abs(c.force - sol.forces[c.member]) / scale);
    const maxF = biggest(rows, 'F');
    const maxS = biggest(rows, 'sigma');
    const need = (group) => requiredArea(Math.max(...rows.filter((r) => r.group === group).map((r) => Math.abs(r.F))), state.sY, state.FS);
    return {
      rows,
      forces: Object.fromEntries(rows.map((r) => [r.name, r.F])),
      stresses: Object.fromEntries(rows.map((r) => [r.name, r.sigma])),
      section: Object.fromEntries(sec.cut.map((c) => [c.member, c.force])),
      Fmax: Math.abs(maxF.F),
      FmaxMember: maxF.name,
      sigmaMax: Math.abs(maxS.sigma),
      sigmaMaxMember: maxS.name,
      webGoverns: maxS.group === 'web',
      FS: state.sY / Math.abs(maxS.sigma),
      AcNeed: need('chord'),
      AwNeed: need('web'),
      allow: state.sY / state.FS,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.5);
    const S = sceneIn(B, top, { x0: -0.6, x1: 6.6, y0: -1.1, y1: 2.6 });
    const sMax = Math.max(c.sigmaMax, 1);
    for (const r of c.rows) {
      const [p, q] = r.name.split('');
      const col = Math.abs(r.F) < 1 ? C.dim : r.F > 0 ? C.red : C.blue;
      seg(S, [J[p].x, J[p].y], [J[q].x, J[q].y], { color: alpha(col, 0.35 + 0.65 * Math.abs(r.sigma) / sMax), width: 1.5 + 5 * Math.sqrt(r.A / 1000e-6) });
    }
    for (const [n, j] of Object.entries(J)) {
      poly(S, [[j.x - 0.07, j.y - 0.07], [j.x + 0.07, j.y - 0.07], [j.x + 0.07, j.y + 0.07], [j.x - 0.07, j.y + 0.07]], { fill: C.bg, stroke: C.text, width: 1.2 });
      label(S, n, [j.x, j.y], { dy: j.y > 0 ? -14 : 14, dx: n === 'A' ? -10 : n === 'D' ? 10 : 0, color: C.muted });
    }
    poly(S, [[0, -0.08], [-0.25, -0.45], [0.25, -0.45]], { fill: alpha(C.text, 0.12), stroke: C.text });
    poly(S, [[6, -0.08], [5.75, -0.45], [6.25, -0.45]], { fill: alpha(C.text, 0.12), stroke: C.text, dash: [3, 3] });
    const kN = state.P / 1e3;
    arrow(S, [2, -0.12], -Math.PI / 2, 26, { tail: false });
    arrow(S, [4, -0.12], -Math.PI / 2, 40, { tail: false });
    label(S, `${fig(kN)} kN`, [2, -0.12], { dy: 38, color: C.pink });
    label(S, `${fig(2 * kN)} kN`, [4, -0.12], { dy: 52, color: C.pink });

    // |σ| per member, red for tension and blue for compression, against the allowable stress.
    const n = c.rows.length;
    const hi = Math.max(c.sigmaMax, c.allow) / 1e6;
    const P = plotIn(B, bottom, { lo: 0, hi: n }, { lo: 0, hi: hi * 1.18 }, { left: 52, right: 14, top: 20, bottom: 30 });
    axes(P, { xLabel: '', yLabel: '|σ| (MPa)', xFmt: () => '' });
    const { ctx, X, Y } = P;
    c.rows.forEach((r, i) => {
      const x0 = X(i + 0.18);
      const x1 = X(i + 0.82);
      const y = Y(Math.abs(r.sigma) / 1e6);
      ctx.fillStyle = alpha(r.F >= 0 ? C.red : C.blue, r.name === c.sigmaMaxMember ? 0.95 : 0.55);
      ctx.fillRect(x0, y, x1 - x0, Y(0) - y);
      ctx.font = "11px Inter, system-ui, sans-serif";
      ctx.fillStyle = r.name === c.sigmaMaxMember ? C.text : C.dim;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(r.name, (x0 + x1) / 2, Y(0) + 5);
    });
    const ya = Y(c.allow / 1e6);
    ctx.save();
    ctx.strokeStyle = C.yellow;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(0), ya);
    ctx.lineTo(X(n), ya);
    ctx.stroke();
    ctx.restore();
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillStyle = C.yellow;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`σ_Y/FS = ${fig(c.allow / 1e6)} MPa`, X(n), ya - 3);
  },
  law: () => [String.raw`\sigma=\frac{F}{A}`, String.raw`\mathrm{FS}=\frac{\sigma_Y}{\sigma_{\max}}`],
  liveRows(state, c) {
    return [
      kv(`largest force, ${c.FmaxMember}`, `${fig(c.Fmax / 1e3)} kN`),
      kv(`largest stress, ${c.sigmaMaxMember}`, `${fig(c.sigmaMax / 1e6)} MPa`),
      kv('BC by sections', `${fig(c.section.BC / 1e3)} kN`),
      kv('$A$ for the target FS: chords, web', `${fig(c.AcNeed * 1e6)}, ${fig(c.AwNeed * 1e6)} mm²`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['σ max', `${fig(c.sigmaMax / 1e6)} MPa`],
      ['in member', c.sigmaMaxMember],
      ['FS', fig(c.FS)],
      ['F max', `${fig(c.Fmax / 1e3)} kN`],
    ]);
  },
  coach(state, c) {
    if (c.sigmaMaxMember !== c.FmaxMember) {
      return {
        title: 'Stress, not force, decides',
        body: String.raw`${c.FmaxMember} carries the most force, ${fig(c.Fmax / 1e3)} kN. ${c.sigmaMaxMember} has a smaller area, so it carries the most stress: ${fig(c.sigmaMax / 1e6)} MPa.`,
      };
    }
    if (c.FS < state.FS) {
      return { title: 'Below the target', body: String.raw`The factor of safety is ${fig(c.FS)}, under the target ${fig(state.FS)}. Each group needs $A \ge F_{\max}\,\mathrm{FS}/\sigma_Y$.` };
    }
    return { title: 'Two-force members', body: String.raw`Every member is straight and pinned at its ends, so it carries only axial force. The stress is uniform along it: $\sigma = F/A$.` };
  },
});
