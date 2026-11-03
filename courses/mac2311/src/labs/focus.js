/** Shows that moving the subject twice as far does not halve the lens-to-sensor distance.
 * A 50 mm camera lens supplies a real inverse-function and implicit-derivative application. */
import { cells, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { focus } from '@flux/subjects/math/focus.js';
import { CSS2DObject } from '../scene/createScene.js';
import { GraphView } from '../scene/graph.js';
import * as THREE from 'three';
import { mathToWorld, sceneScale } from '../engine/frame.js';
import { defineLab } from './define.js';
const SCENARIOS = [
  { id: 'close', name: '50 mm lens · subject at 0.45 m', f: 50, u: 450 },
  { id: 'portrait', name: '50 mm lens · subject at 1 m', f: 50, u: 1000 },
  { id: 'tele', name: '85 mm lens · subject at 1 m', f: 85, u: 1000 },
];
export default defineLab({
  id: 'focus',
  exam: 'c1',
  title: 'Camera focus',
  orbit: false,
  frame: true,
  cameraFor(s) {
    const p = mathToWorld((focus(s.f,s.u).v-s.u)/2, 0, 0, sceneScale());
    return { pos: new THREE.Vector3(p.x, p.y, p.z + (typeof window !== 'undefined' && window.innerWidth <= 720 ? 22 : 14)), target: p };
  },
  hint: 'A thin lens focuses the subject onto the white sensor. Distances are in mm.',
  extent:s=>Math.max(s.u/2,220),
  scenarios: SCENARIOS,
  defaultState: () => ({ ...SCENARIOS[0], scenarioId: 'close', view: { plane: 'xy', upm: 0.02 }, show: {} }),
  applyScenario(id, s) {
    const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
    Object.assign(s, sc, { scenarioId: sc.id });
  },
  controls: () =>
    `<div class="lab-block"><label class="field"><span>Object distance u (mm)</span><div class="slider-row"><input id="focus-u" type="range" min="200" max="2000" step="10"></div></label><label class="field"><span>Focal length f (mm)</span><div class="slider-row"><input id="focus-f" type="range" min="28" max="85" step="1"></div></label></div>`,
  bind(api) {
    for (const key of ['u', 'f'])
      document.getElementById(`focus-${key}`).addEventListener('input', (e) => {
        api.slice()[key] = Number(e.target.value);
        api.bump();
        api.reframe?.();
      });
  },
  syncControls(s) {
    for (const key of ['u', 'f']) document.getElementById(`focus-${key}`).value = s[key];
  },
  recompute(s, c) {
    Object.assign(c, focus(s.f, s.u));
  },
  init(ctx) {
    const view=new GraphView(ctx.scene);
    const labels=['Subject','Lens','Sensor'].map(text=>{const el=document.createElement('span');el.className='axis-label';el.textContent=text;const label=new CSS2DObject(el);view.group.add(label);return label;});
    return {view,labels};
  },
  enter(ctx,h){h.view.setVisible(true);},
  exit(ctx,h){h.view.setVisible(false);},
  syncViews(s,c,ctx){
    const h=200, image=-h*c.v/s.u, g=ctx.handle.view;
    g.syncCurve(()=>0,0,1,false);
    g.syncRod(0,-h*1.2,0,h*1.2);
    g.syncLine('tangent',c.v,-h*1.2,c.v,h*1.2);
    g.syncLine('secant',-s.u,0,c.v+80,0);
    g.syncGuides([{x0:-s.u,y0:h,x1:0,y1:h},{x0:0,y0:h,x1:c.v,y1:image},{x0:-s.u,y0:h,x1:c.v,y1:image}]);
    g.syncBox('wire',[{x0:-s.u,y0:0,x1:-s.u,y1:h},{x0:-s.u-h*.08,y0:h*.84,x1:-s.u,y1:h},{x0:-s.u+h*.08,y0:h*.84,x1:-s.u,y1:h}]);
    g.syncBox('peak',[{x0:c.v,y0:0,x1:c.v,y1:image}]);
    [[-s.u,-h*.3],[0,h*1.4],[c.v+70,-h*.3]].forEach(([x,y],i)=>ctx.handle.labels[i].position.copy(mathToWorld(x,y,0,sceneScale())));
  },
  law: () => ['1/f=1/u+1/v', 'dv/du=-f^2/(u-f)^2'],
  liveRows: (s, c) =>
    kv('f', `${fmt(s.f)} mm`) +
    kv('u', `${fmt(s.u)} mm`) +
    kv('v', `${fmt(c.v)} mm`) +
    kv('dv/du', fmt(c.sensitivity)),
  readout: (s, c) =>
    cells([
      ['image distance', `${fmt(c.v)} mm`],
      ['sensitivity', fmt(c.sensitivity)],
      ['image scale', fmt(c.magnification)],
    ]),
  coach: (s, c) => ({
    title: 'Why focusing becomes delicate nearby',
    body: [
      'Solve the thin-lens equation for the image distance. Differentiating gives a negative slope: moving the object away moves the sharp image toward the lens.',
      `At this setup, a 1 mm object displacement changes image distance by about ${fmt(c.sensitivity)} mm. This rate is local; a large move needs the full rational function. The drawn subject is an assumed 200 mm high; its inverted image follows the ray intersections.`,
      'Nominal focal length: Nikon AF NIKKOR 50mm f/1.8D and AF NIKKOR 85mm f/1.8D product specifications. The 0.45 m minimum focus of the 50 mm lens motivates the close preset; all other subject distances are chosen teaching inputs. <a href="https://imaging.nikon.com/imaging/lineup/lens/f-mount/singlefocal/normal/af_50mmf_18d/" target="_blank" rel="noopener">50 mm specifications</a>.',
      '<b>What the course model leaves out.</b> A real lens has several elements and moving principal planes. The formula ignores aberrations, sensor thickness, focus breathing and the lens barrel’s focus mechanism.',
    ],
  }),
});
