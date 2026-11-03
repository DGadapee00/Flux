import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import * as THREE from 'three';
import { ANSWER_LAYER } from '@flux/core/scene3d/manim.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * EXAMPLE LAB. Replace it with the course's first real lab; keep the shape.
 *
 * Shows that a tank's fill time depends on the net rate, inflow minus outflow, not on the inflow
 * alone, so a small drain stretches the fill time far more than its size suggests.
 *
 * Every lab has: scenarios with real numbers, sliders, a pure `compute` that returns every number
 * the panels show, a second method that checks the first (`gap`, held to a limit by labs-check),
 * predictions, and an explainer. An application lab's explainer ends with "What the course model
 * leaves out." (DECISIONS.md, D30). PHY 2049's labs are the benchmark (D32).
 */
const SCENARIOS = [
  { id: 'fill', name: 'Filling with a small drain', V0: 0, Vcap: 0.3, qin: 0.0005, qout: 0.0001 },
  { id: 'slow', name: 'Nearly balanced', V0: 0.1, Vcap: 0.3, qin: 0.0003, qout: 0.0002 },
  { id: 'drain', name: 'Draining', V0: 0.2, Vcap: 0.3, qin: 0.0001, qout: 0.0006 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, V0: sc.V0, Vcap: sc.Vcap, qin: sc.qin, qout: sc.qout, t:0, anim:{playing:false} });
}

/** Closed form. V(t) = V0 + (qin − qout) t until the tank is full or empty. */
export function tankTime(V0, Vcap, qin, qout) {
  const net = qin - qout;
  if (net > 0) return { net, event: 'full', T: (Vcap - V0) / net };
  if (net < 0) return { net, event: 'empty', T: V0 / -net };
  return { net, event: 'steady', T: 0 };
}

/** Second method: march the volume forward in small steps until it crosses the limit. */
function marched(V0, Vcap, qin, qout) {
  const { net, event, T } = tankTime(V0, Vcap, qin, qout);
  if (event === 'steady' || T === 0) return T;
  const n = 20000;
  const dt = (2 * T) / n;
  let V = V0;
  for (let i = 0; i < n; i++) {
    const next = V + net * dt;
    const crossed = event === 'full' ? next >= Vcap : next <= 0;
    if (crossed) return i * dt + ((event === 'full' ? Vcap : 0) - V) / net;
    V = next;
  }
  return Infinity;
}

export default defineLab({
  id: 'tank',
  exam: 'u1',
  title: 'Tank',
  hint: 'Change the inflow and the drain. The fill time follows the difference between them.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('fill', s);
    return s;
  },
  applyScenario: apply,
  orbit: false,
  cameraFor(){const phone=typeof window!=='undefined'&&innerWidth<=720;return {pos:new THREE.Vector3(3,phone?.2:1,16),target:new THREE.Vector3(0,phone?-.8:0,0)};},
  sweep: () => ({ key: 'qin', lo: 0, hi: 0.002 }),
  controls() {
    return `
      ${slider('tk-in', 'inflow (L/s)', 0.5, 0, 2, 0.05)}
      ${slider('tk-out', 'drain (L/s)', 0.1, 0, 2, 0.05)}
      ${slider('tk-t', 'elapsed time (s)',0,0,1200,1)}
      <label class="field"><span>Animate water level (accelerated)</span><input id="tk-play" type="checkbox"></label>
      <p class="tiny">Chosen example inputs. Constant rates; capacity 300 L. The drawing shows the fraction full, not measured tank dimensions.</p>`;
  },
  bind(api) {
    bindSlider('tk-t',(s,v)=>{s.t=v;},api);
    document.getElementById('tk-play').addEventListener('change',e=>{api.slice().anim.playing=e.target.checked;api.bump();});
    bindSlider('tk-in', (s, v) => { s.qin = v / 1000; }, api);
    bindSlider('tk-out', (s, v) => { s.qout = v / 1000; }, api);
  },
  syncControls(state) {
    document.getElementById('tk-play').checked=state.anim.playing;
    const time=document.getElementById('tk-t');time.max=Math.max(1200,tankTime(state.V0,state.Vcap,state.qin,state.qout).T);time.value=state.t;
    for (const [id, val] of [['tk-in', state.qin * 1000], ['tk-out', state.qout * 1000]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const { V0, Vcap, qin, qout } = state;
    const r = tankTime(V0, Vcap, qin, qout);
    const Tnum = marched(V0, Vcap, qin, qout);
    const gap = r.T === 0 ? 0 : Math.abs(Tnum - r.T) / r.T;
    return { V0, Vcap, qin, qout, net: r.net, event: r.event, T: r.T, Tnum, gap, Vend: r.event === 'full' ? Vcap : r.event === 'empty' ? 0 : V0 };
  },
  recompute(s,c){Object.assign(c,this.compute(s));c.volume=Math.min(s.Vcap,Math.max(0,s.V0+c.net*s.t));},
  init(ctx){const group=new THREE.Group();ctx.scene.add(group);const wall=new THREE.Mesh(new THREE.CylinderGeometry(1,1,3,32,1,true),new THREE.MeshBasicMaterial({color:0x58c4dd,wireframe:true,transparent:true,opacity:.3}));group.add(wall);const water=new THREE.Mesh(new THREE.CylinderGeometry(.97,.97,1,48),new THREE.MeshBasicMaterial({color:0x58c4dd,transparent:true,opacity:.65}));water.layers.set(ANSWER_LAYER);group.add(water);return {group,water};},
  enter(ctx,h){h.group.visible=true;},exit(ctx,h){h.group.visible=false;},
  syncViews(s,c,ctx){ctx.grid.group.visible=false;const water=ctx.handle.water,f=c.volume/s.Vcap;water.visible=f>0;water.scale.y=3*f;water.position.y=-1.5+1.5*f;},
  tick(dt,s,c){if(!s.anim.playing||c.T<=0)return false;s.t=Math.min(c.T,s.t+dt*c.T/12);if(s.t>=c.T)s.anim.playing=false;return true;},
  plot(s,c){const end=c.T||600;return {type:'accum',xs:[0,end],ys:[s.V0,c.Vend],x:Math.min(s.t,end),title:'V(t) in m³; t in s'};},
  law: () => [String.raw`V(t) = V_0 + (q_{in} - q_{out})\,t`],
  liveRows(state, c) {
    return [
      kv('net rate $q_{in} - q_{out}$', `${fig(c.net * 1000)} L/s`),
      kv('closed form', `${fig(c.T)} s`),
      kv('stepped forward', `${fig(c.Tnum)} s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['volume now', `${fig(c.volume*1000)} L`],
      ['net rate', `${fig(c.net * 1000)} L/s`],
      [c.event === 'empty' ? 'time to empty' : 'time to fill', c.event === 'steady' ? 'never' : `${fig(c.T)} s`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real drains slow down as the level falls, because the outflow through an opening grows with the square root of the water's depth. Here both rates are constant, so the volume is a straight line in time.`;
    if (c.event === 'steady') return { title: 'Balanced', body: `Inflow equals the drain, so the volume never changes. ${leavesOut}` };
    return {
      title: c.event === 'full' ? 'The net rate sets the fill time' : 'The tank is emptying',
      body: String.raw`The volume changes at $${fig(c.net * 1000)}$ L/s, the difference of the two rates. ${leavesOut}`,
    };
  },
  app: false,
});
