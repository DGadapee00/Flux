import * as THREE from 'three';
import { defineLab, planeCamera } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { graphById } from '../math/graphs1.js';
import { df1, df1left, df1right, df1Slack } from '../math/ndiff.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { agreeTo, quotientNoise } from '../math/agree.js';


function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

export default defineLab({
  id: 'limits',
  exam: 'ch1',
  title: 'Limits',
  hint: 'Slide $x_0$ and $h$ · secant $\\to$ tangent',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: planeCamera,
  camera: { pos: new THREE.Vector3(0, 0, 14), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'curve', label: 'Graph' },
    { key: 'tangent', label: 'Tangent' },
    { key: 'secant', label: 'Secant' },
  ],
  scenarios: SCENARIOS.limits,
  defaultState() {
    return {
      scenarioId: 'quad',
      graphId: 'quad',
      x0: 0.6,
      h: 0.35,
      a: -2,
      b: 2,
      probe: { x: 0.6, y: 0.36, z: 0 },
      xMin: -2.5,
      xMax: 2.5,
      yMin: -0.5,
      yMax: 4.5,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, tangent: true, secant: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>x₀</span>
          <div class="slider-row">
            <input type="range" id="lm-x0" min="-2" max="2" step="0.01" value="0.6" />
            <span class="mono val" id="lm-x0-val">0.60</span>
          </div>
        </label>
        <label class="field">
          <span>h</span>
          <div class="slider-row">
            <input type="range" id="lm-h" min="0.04" max="0.9" step="0.01" value="0.35" />
            <span class="mono val" id="lm-h-val">0.35</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('lm-x0').addEventListener('input', (e) => {
      api.slice().x0 = Number(e.target.value);
      api.bump();
    });
    document.getElementById('lm-h').addEventListener('input', (e) => {
      api.slice().h = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const el = document.getElementById('lm-x0');
    if (!el) return;
    el.min = String(state.a);
    el.max = String(state.b);
    el.value = state.x0;
    document.getElementById('lm-x0-val').textContent = Number(state.x0).toFixed(2);
    document.getElementById('lm-h').value = state.h;
    document.getElementById('lm-h-val').textContent = Number(state.h).toFixed(2);
  },
  applyScenario(id, state) {
    applyData('limits', id, state);
    keepXy(state);
    if (!Number.isFinite(state.h)) state.h = 0.35;
  },
  extent(state) {
    const g = graphById(state.graphId);
    const a = Number.isFinite(state.a) ? state.a : -2;
    const b = Number.isFinite(state.b) ? state.b : 2;
    let m = Math.max(Math.abs(a), Math.abs(b), 1.5);
    for (let i = 0; i <= 24; i++) {
      const y = g.f(a + ((b - a) * i) / 24);
      if (Number.isFinite(y)) m = Math.max(m, Math.abs(y));
    }
    return m;
  },
  recompute(state, computed) {
    keepXy(state);
    const g = graphById(state.graphId);
    const a = Number.isFinite(state.a) ? state.a : -2;
    const b = Number.isFinite(state.b) ? state.b : 2;
    state.a = a;
    state.b = b;
    let x0 = Number.isFinite(state.x0) ? state.x0 : 0.5 * (a + b);
    x0 = Math.max(a, Math.min(b, x0));
    state.x0 = x0;
    const hVis = Math.max(0.04, Number.isFinite(state.h) ? state.h : 0.35);
    state.h = hVis;
    const f0 = g.f(x0);
    const fp = g.fp(x0);
    const dq = df1(g.f, x0, 1e-5);
    const leftD = df1left(g.f, x0, 1e-5);
    const rightD = df1right(g.f, x0, 1e-5);
    const hLim = 1e-4;
    const fL = g.f(x0 - hLim);
    const fR = g.f(x0 + hLim);
    /*
     * These three decide what the coach asserts about f — that a limit exists, that f is continuous
     * at x0, that f'(x0) exists — so their yardsticks matter more than a status light's. They are
     * the function's own vertical scale over the visible window, and the steepness of the one-sided
     * derivatives. A floor of 1, as these carried, called any jump smaller than 0.02 "continuous"
     * no matter how small the function itself was.
     */
    let fScale = 0;
    for (let i = 0; i <= 200; i++) {
      const v = g.f(a + ((b - a) * i) / 200);
      if (Number.isFinite(v)) fScale = Math.max(fScale, Math.abs(v));
    }
    const slopeScale = Math.max(Math.abs(leftD), Math.abs(rightD), Math.abs(fp) || 0);
    const jumpFloor = quotientNoise(fScale, 1, 1);
    const lim =
      Number.isFinite(fL) && Number.isFinite(fR) && agreeTo(fL, fR, fScale, { floor: jumpFloor })
        ? 0.5 * (fL + fR)
        : NaN;
    const cont = Number.isFinite(f0) && Number.isFinite(lim) && agreeTo(f0, lim, fScale, { floor: jumpFloor });
    const diffble =
      Number.isFinite(fp) &&
      Number.isFinite(leftD) &&
      Number.isFinite(rightD) &&
      agreeTo(leftD, rightD, slopeScale, { tol: 0.05, floor: quotientNoise(fScale, 1e-5, 1) });
    const yDraw = Number.isFinite(f0) ? f0 : Number.isFinite(lim) ? lim : 0;
    state.probe = { x: x0, y: yDraw, z: 0 };
    computed.g = g;
    computed.tex = g.tex;
    computed.f0 = f0;
    computed.fp = fp;
    computed.dq = dq;
    computed.leftD = leftD;
    computed.rightD = rightD;
    computed.lim = lim;
    computed.cont = cont;
    computed.diffble = diffble;
    computed.yDraw = yDraw;
    /*
     * The floor is whichever of the quotient's two error sources dominates here: rounding, ε|f|/h,
     * or truncation, measured by doubling the step. Without the second, x³ at the origin reads as a
     * disagreement — f'(0) is exactly 0 while the quotient returns h².
     */
    computed.agree = agreeTo(fp, dq, slopeScale, {
      tol: 0.03,
      floor: Math.max(quotientNoise(fScale, 1e-5, 1), df1Slack(g.f, x0)),
    });
    computed.hVis = hVis;
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const g = computed.g;
    const x0 = state.x0;
    const h = computed.hVis;
    ctx.pool.curve().setVisible(!!show.curve);
    ctx.pool.curve().sync({
      x: (t) => t,
      y: (t) => g.f(t),
      t0: state.a,
      t1: state.b,
      t: x0,
      xp: 1,
      yp: Number.isFinite(computed.fp) ? computed.fp : 0,
      showCurve: !!show.curve,
      showTan: !!show.tangent && Number.isFinite(computed.fp),
      tanLen: 0.9,
    });
    const xL = x0 - h;
    const xR = x0 + h;
    const yL = g.f(xL);
    const yR = g.f(xR);
    const secantOk = Number.isFinite(yL) && Number.isFinite(yR);
    const slope = secantOk ? (yR - yL) / (xR - xL) : 0;
    ctx.pool.lift().setVisible(!!show.secant && secantOk);
    if (show.secant && secantOk) {
      ctx.pool.lift().sync({
        x: (s) => s,
        y: (s) => yL + slope * (s - xL),
        t0: xL,
        t1: xR,
        t: x0,
        xp: 1,
        yp: slope,
        showCurve: true,
        showTan: false,
      });
    }
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, 0, 'x₀');
  },
  law() {
    return [
      "\\displaystyle f'(x_0)=\\lim_{h\\to 0}\\frac{f(x_0+h)-f(x_0)}{h}",
      '\\lim_{x\\to a}f(x)=f(a)\\quad\\text{(continuity)}',
    ];
  },
  liveRows(state, computed) {
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$x_0$', `$${fmt(state.x0)}$`) +
      kv('$f(x_0)$', Number.isFinite(computed.f0) ? `$${fmt(computed.f0)}$` : 'undefined') +
      kv('$\\lim_{x\\to x_0} f$', Number.isFinite(computed.lim) ? `$${fmt(computed.lim)}$` : 'does not exist') +
      kv('continuous at $x_0$', computed.cont ? 'yes' : 'no') +
      kv("$f'(x_0)$ (analytic)", Number.isFinite(computed.fp) ? `$${fmt(computed.fp)}$` : 'undefined') +
      kv('central quotient', Number.isFinite(computed.dq) ? `$${fmt(computed.dq)}$` : '—') +
      kv("$f'_-$ / $f'_+$", `$${fmt(computed.leftD)}$ / $${fmt(computed.rightD)}$`) +
      kv('differentiable', computed.diffble ? 'yes' : 'no')
    );
  },
  readout(state, computed) {
    return cells([
      ['$f(x_0)$', Number.isFinite(computed.f0) ? `$${fmt(computed.f0)}$` : 'undef.'],
      ['limit', Number.isFinite(computed.lim) ? `$${fmt(computed.lim)}$` : '—'],
      ["$f'$", Number.isFinite(computed.fp) ? `$${fmt(computed.fp)}$` : '—'],
      ['routes agree', computed.agree ? 'yes' : computed.diffble ? 'check $h$' : 'see coach'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'A function is continuous at $a$ when $\\lim_{x\\to a}f(x)$ exists and equals $f(a)$. Differentiability is stricter: the difference quotient must have the same one-sided limits. $|x|$ is continuous at $0$ and not differentiable there; the gold secant stays a V as $h\\to 0$.',
    );
    body.push(eq("f'(x_0)=\\lim_{h\\to 0}\\frac{f(x_0+h)-f(x_0)}{h}"));
    if (computed.g.id === 'hole') {
      body.push(
        'This graph has a hole at $x=1$: $f(1)$ is undefined, but the two-sided limit is $2$ (the function is $x+1$ everywhere else). Continuity fails; the limit does not.',
      );
    } else if (computed.g.id === 'abs' && Math.abs(state.x0) < 0.05) {
      body.push(
        `Left derivative $${fmt(computed.leftD)}$, right derivative $${fmt(computed.rightD)}$. They disagree, so $f'(0)$ does not exist.`,
      );
    } else if (computed.g.id === 'cube' && Math.abs(state.x0) < 0.05) {
      body.push(
        "$f'(0)=0$ is necessary for a local min or max, not sufficient. $x^3$ is strictly increasing through the origin.",
      );
    } else if (computed.g.id === 'squeeze') {
      body.push(
        'The squeeze theorem: $-x^2\\le x^2\\sin(1/x)\\le x^2$, so the limit at $0$ is $0$. Defining $f(0)=0$ makes $f$ continuous, and the difference quotient still goes to $0$, so $f\'(0)=0$.',
      );
    } else {
      body.push(
        `The yellow line is the tangent (slope $f'$). The gold chord is the secant of width $2h$. A second route is a central difference at $h=10^{-5}$. ${computed.agree ? 'They agree here.' : 'They disagree when $f$ is not differentiable.'}`,
      );
    }
    return { title: 'Limits, continuity, derivatives', body };
  },
  plot: () => null,
});
