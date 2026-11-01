/** Shows that an antiderivative needs endpoint subtraction, and different methods can produce the same area. */
import { simpson } from '@flux/subjects/math/quadrature.js';
import { cells, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { GraphView } from '../scene/graph-integral.js';
import { TECHNIQUES } from '../math/techniques.js';
import { fitArcCamera, plotWindow } from './arc.js';
import { defineLab } from './define.js';
const SCENARIOS = Object.entries(TECHNIQUES).map(([id, v]) => ({ id, name: v.name }));
/** The profile in use: a problem's own { name, tex, f, F, a, b } when it set one, else the scenario's. */
const prof = (s) => s.custom || TECHNIQUES[s.scenarioId] || TECHNIQUES.exp;
function apply(id, s) {
  Object.assign(s, {
    custom: null,
    scenarioId: TECHNIQUES[id] ? id : 'exp',
    fraction: 1,
    view: { plane: 'xy', upm: 1 },
    show: {},
  });
}
export default defineLab({
  id: 'technique',
  exam: 'c4',
  title: 'Integral workbench',
  frame: true,
  orbit: false,
  scenarios: SCENARIOS,
  hint: 'The teal height is the integrand. Gold strips fill the integral to the selected upper endpoint.',
  defaultState() {
    const s = {};
    apply('exp', s);
    return s;
  },
  applyScenario: apply,
  extent(s) {
    const v=prof(s); let low=0,high=0;
    for(let i=0;i<=80;i++){const y=v.f(v.a+(v.b-v.a)*i/80);low=Math.min(low,y);high=Math.max(high,y);}
    const pad=.12*Math.max(1,high-low);
    Object.assign(s,{xMin:v.a-.1*(v.b-v.a),xMax:v.b+.1*(v.b-v.a),yMin:low-pad,yMax:high+pad});
    return Math.max(Math.abs(s.xMin),Math.abs(s.xMax),Math.abs(s.yMin),Math.abs(s.yMax));
  },
  cameraFor(s) { const c=fitArcCamera(s,plotWindow()); return {pos:c.pos,target:c.target}; },
  controls: () =>
    `<div class="lab-block"><label class="field"><span>Fraction of interval</span><div class="slider-row"><input id="technique-fraction" type="range" min="0.1" max="1" step="0.05"></div></label></div>`,
  bind(api) {
    document.getElementById('technique-fraction').addEventListener('input', (e) => {
      api.slice().fraction = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(s) {
    document.getElementById('technique-fraction').value = s.fraction;
  },
  recompute(s, c) {
    const v = prof(s);
    c.a = v.a;
    c.b = v.a + (v.b - v.a) * s.fraction;
    c.integral = v.F(c.b) - v.F(c.a);
    c.check = simpson(v.f, c.a, c.b);
    c.height = v.f(c.b);
    c.width = c.b - c.a;
  },
  init(ctx) {
    return { view: new GraphView(ctx.scene) };
  },
  enter(ctx, h) {
    h.view.setVisible(true);
  },
  exit(ctx, h) {
    h.view.setVisible(false);
  },
  syncViews(s, c, ctx) {
    const v = prof(s),
      g = ctx.handle.view;
    g.syncCurve('curve', v.f, v.a, v.b);
    g.syncHatch(v.f, c.a, c.b, true);
    g.syncBound(c.b, c.height);
  },
  law: (s) => [String.raw`f(x)=${prof(s).tex}`, String.raw`I(b)=F(b)-F(a),\quad F'=f`],
  liveRows: (s, c) =>
    kv('lower', fmt(c.a)) +
    kv('upper', fmt(c.b)) +
    kv('antiderivative difference', fmt(c.integral)) +
    kv('quadrature', fmt(c.check)),
  readout: (s, c) =>
    cells([
      ['integral', fmt(c.integral)],
      ['quadrature', fmt(c.check)],
      ['height', fmt(c.height)],
      ['width', fmt(c.width)],
    ]),
  coach: () => ({
    title: 'A method is a route, not the value',
    body: [
      'Parts reverses the product rule. Substitution reverses the chain rule. Trig identities and partial fractions rewrite the same function. The integral is unchanged by a valid rewrite.',
      'An antiderivative difference and adaptive quadrature provide independent calculations. These profiles have no poles inside their intervals. The plotted height is the integrand; length and surface examples plot their slant-weighted integrands, not the generating object.',
      'What the course model leaves out: finite strips only illustrate a limiting area. Their screen resolution is not the accuracy of the quadrature readout.',
    ],
  }),
});
