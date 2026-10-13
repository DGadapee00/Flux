import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { surfaceById } from '../math/surfaces.js';
import { curveById } from '../math/curves.js';
import {
  chainAlong,
  gQuotient,
  chainMap,
  hQuotientS,
  hQuotientT,
  innerById,
} from '../math/chain.js';
import { gradNumeric } from '../math/ndiff.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';
import { agreeTo, quotientNoise } from '../math/agree.js';


function clampT(state) {
  const lo = Number.isFinite(state.t0) ? state.t0 : 0;
  const hi = Number.isFinite(state.t1) ? state.t1 : 1;
  const t = Number.isFinite(state.t) ? state.t : lo;
  state.t = Math.max(lo, Math.min(hi, t));
}

function clampS(state) {
  const lo = Number.isFinite(state.sMin) ? state.sMin : 0.3;
  const hi = Number.isFinite(state.sMax) ? state.sMax : 2;
  const s = Number.isFinite(state.s) ? state.s : lo;
  state.s = Math.max(lo, Math.min(hi, s));
}

export default defineLab({
  id: 'chain',
  exam: 'ch2',
  title: 'Chain',
  hint: 'Slide $t$ · $g=f\\circ\\gamma$',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(9.2, 6.4, 10.5), target: new THREE.Vector3(0, 0.6, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'surface', label: 'Surface' },
    { key: 'contours', label: 'Level curves' },
    { key: 'curve', label: '$\\gamma$ on the floor' },
    { key: 'lift', label: 'Lifted curve' },
    { key: 'tangent', label: 'Tangent' },
  ],
  legend: { id: 'f', title: '$f(x,y)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.chain,
  defaultState() {
    return {
      scenarioId: 'xy-circle',
      mode: 'curve',
      surfaceId: 'xy',
      curveId: 'circle',
      innerId: 'polar',
      params: { a: 1, b: 1, c: 0 },
      t: Math.PI / 3,
      t0: 0,
      t1: 2 * Math.PI,
      s: 1,
      sMin: 0.3,
      sMax: 2,
      probe: { x: 0.5, y: 0.866, z: 0 },
      xMin: -2,
      xMax: 2,
      yMin: -2,
      yMax: 2,
      show: { surface: true, contours: false, curve: true, lift: true, tangent: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field" id="ch-s-field">
          <span>s</span>
          <div class="slider-row">
            <input type="range" id="ch-s" min="0.3" max="2" step="0.01" value="1" />
            <span class="mono val" id="ch-s-val">1.00</span>
          </div>
        </label>
        <label class="field">
          <span>t</span>
          <div class="slider-row">
            <input type="range" id="ch-t" min="0" max="6.2832" step="0.01" value="1.047" />
            <span class="mono val" id="ch-t-val">1.05</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('ch-t').addEventListener('input', (e) => {
      api.slice().t = Number(e.target.value);
      api.bump();
    });
    document.getElementById('ch-s').addEventListener('input', (e) => {
      api.slice().s = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const tEl = document.getElementById('ch-t');
    const sEl = document.getElementById('ch-s');
    const sField = document.getElementById('ch-s-field');
    if (!tEl) return;
    const map = state.mode === 'map';
    if (sField) sField.hidden = !map;
    tEl.min = String(state.t0);
    tEl.max = String(state.t1);
    tEl.value = state.t;
    document.getElementById('ch-t-val').textContent = Number(state.t).toFixed(2);
    if (sEl) {
      sEl.min = String(state.sMin);
      sEl.max = String(state.sMax);
      sEl.value = state.s;
      document.getElementById('ch-s-val').textContent = Number(state.s).toFixed(2);
    }
  },
  applyScenario(id, state) {
    applyData('chain', id, state);
    if (state.mode === 'map') {
      const inn = innerById(state.innerId);
      state.sMin = inn.sMin;
      state.sMax = inn.sMax;
      state.t0 = inn.tMin;
      state.t1 = inn.tMax;
      state.s = inn.s0;
      state.t = inn.tStart;
    } else {
      state.mode = 'curve';
      const c = curveById(state.curveId);
      state.t0 = c.t0;
      state.t1 = c.t1;
      state.t = c.tStart ?? 0.5 * (c.t0 + c.t1);
    }
  },
  extent(state) {
    return Math.max(
      Math.abs(state.xMin),
      Math.abs(state.xMax),
      Math.abs(state.yMin),
      Math.abs(state.yMax),
      2.5,
    );
  },
  recompute(state, computed) {
    const surf = surfaceById(state.surfaceId);
    const p = state.params;
    computed.surf = surf;
    computed.tex = surf.tex(p);
    computed.mode = state.mode === 'map' ? 'map' : 'curve';

    if (computed.mode === 'map') {
      clampS(state);
      clampT(state);
      const inn = innerById(state.innerId);
      const an = chainMap(surf, inn, state.s, state.t, p);
      const hsQ = hQuotientS(surf, inn, state.s, state.t, p);
      const htQ = hQuotientT(surf, inn, state.s, state.t, p);
      const fn = (xx, yy) => surf.f(xx, yy, p);
      const gN = gradNumeric(fn, an.x, an.y);
      const hsN = gN.x * an.xs + gN.y * an.ys;
      const htN = gN.x * an.xt + gN.y * an.yt;
      state.probe = { x: an.x, y: an.y, z: 0 };
      computed.inner = inn;
      computed.x = an.x;
      computed.y = an.y;
      computed.f = an.f;
      computed.fx = an.fx;
      computed.fy = an.fy;
      computed.xs = an.xs;
      computed.ys = an.ys;
      computed.xt = an.xt;
      computed.yt = an.yt;
      computed.h = an.h;
      computed.hs = an.hs;
      computed.ht = an.ht;
      computed.hsQ = hsQ;
      computed.htQ = htQ;
      computed.hsN = hsN;
      computed.htN = htN;
      computed.gp = an.ht;
      /*
       * The yardstick is the size of the chain rule's own terms, |f_x x_s| + |f_y y_s|, not the
       * size of their sum. The sum is exactly what cancels — at a point where f_x x_s ≈ −f_y y_s
       * the derivative is near zero while both terms are large, and that is precisely where a sign
       * error hides.
       */
      const sS = Math.abs(an.fx * an.xs) + Math.abs(an.fy * an.ys);
      const sT = Math.abs(an.fx * an.xt) + Math.abs(an.fy * an.yt);
      const nq = quotientNoise(an.h, 1e-5, 1);
      computed.agree =
        agreeTo(an.hs, hsQ, sS, { floor: nq }) &&
        agreeTo(an.ht, htQ, sT, { floor: nq }) &&
        agreeTo(an.hs, hsN, sS, { floor: nq }) &&
        agreeTo(an.ht, htN, sT, { floor: nq });
      return;
    }

    clampT(state);
    const c = curveById(state.curveId);
    const an = chainAlong(surf, c, state.t, p);
    const gpQ = gQuotient(surf, c, state.t, p);
    const fn = (xx, yy) => surf.f(xx, yy, p);
    const gN = gradNumeric(fn, an.x, an.y);
    const gpN = gN.x * an.xp + gN.y * an.yp;
    state.probe = { x: an.x, y: an.y, z: 0 };
    computed.curve = c;
    computed.x = an.x;
    computed.y = an.y;
    computed.xp = an.xp;
    computed.yp = an.yp;
    computed.f = an.f;
    computed.fx = an.fx;
    computed.fy = an.fy;
    computed.g = an.g;
    computed.gp = an.gp;
    computed.gpQ = gpQ;
    computed.gpN = gpN;
    // Same yardstick as the two-variable branch: the size of the terms, not of their sum.
    const sT1 = Math.abs(an.fx * an.xp) + Math.abs(an.fy * an.yp);
    const nq1 = quotientNoise(an.g, 1e-5, 1);
    computed.agree =
      agreeTo(an.gp, gpQ, sT1, { floor: nq1 }) && agreeTo(an.gp, gpN, sT1, { floor: nq1 });
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const surf = computed.surf;
    const p = state.params;
    const f = (x, y) => surf.f(x, y, p);
    ctx.pool.surface().setVisible(true);
    ctx.pool.surface().sync({
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      probe: state.probe,
      fP: computed.f,
      show: show.surface !== false,
    });
    ctx.pool.contours().setVisible(!!show.contours);
    ctx.pool.contours().sync({
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      show: !!show.contours,
    });

    const map = computed.mode === 'map';
    const polar = map && computed.inner?.id === 'polar';
    ctx.pool.polarGrid().setVisible(!!polar);
    if (polar) {
      ctx.pool.polarGrid().sync({ rMax: Math.max(state.sMax, 2), show: true });
    }

    if (map) {
      const inn = computed.inner;
      const s0 = state.s;
      ctx.pool.curve().setVisible(true);
      ctx.pool.curve().sync({
        x: (tt) => inn.x(s0, tt),
        y: (tt) => inn.y(s0, tt),
        t0: inn.tMin,
        t1: inn.tMax,
        t: state.t,
        xp: computed.xt,
        yp: computed.yt,
        showCurve: show.curve !== false,
        showTan: !!show.tangent,
      });
      ctx.pool.lift().setVisible(true);
      ctx.pool.lift().sync({
        x: (tt) => inn.x(s0, tt),
        y: (tt) => inn.y(s0, tt),
        z: (tt) => surf.f(inn.x(s0, tt), inn.y(s0, tt), p),
        t0: inn.tMin,
        t1: inn.tMax,
        t: state.t,
        xp: computed.xt,
        yp: computed.yt,
        zp: computed.ht,
        showCurve: show.lift !== false,
        showTan: !!show.tangent,
      });
    } else {
      const c = computed.curve;
      ctx.pool.curve().setVisible(true);
      ctx.pool.curve().sync({
        x: c.x,
        y: c.y,
        t0: c.t0,
        t1: c.t1,
        t: state.t,
        xp: computed.xp,
        yp: computed.yp,
        showCurve: show.curve !== false,
        showTan: !!show.tangent,
      });
      ctx.pool.lift().setVisible(true);
      ctx.pool.lift().sync({
        x: c.x,
        y: c.y,
        z: (s) => surf.f(c.x(s), c.y(s), p),
        t0: c.t0,
        t1: c.t1,
        t: state.t,
        xp: computed.xp,
        yp: computed.yp,
        zp: computed.gp,
        showCurve: show.lift !== false,
        showTan: !!show.tangent,
      });
    }

    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, computed.f, map ? 'g(s,t)' : 'γ(t)');
  },
  law(state) {
    if (state?.mode === 'map') {
      return [
        'h_s = f_x x_s + f_y y_s',
        'h_t = f_x x_t + f_y y_t',
      ];
    }
    return [
      "g'(t) = f_x x' + f_y y'",
      'g = f \\circ \\gamma',
    ];
  },
  liveRows(state, computed) {
    if (computed.mode === 'map') {
      return (
        kv('$f$', `$${computed.tex}$`) +
        kv('$g(s,t)$', `$${computed.inner.tex}$`) +
        kv('$(s,t)$', `$(${fmt(state.s)}, ${fmt(state.t)})$`) +
        kv('$(x,y)$', `$(${fmt(computed.x)}, ${fmt(computed.y)})$`) +
        kv('$\\nabla f$', `$(${fmt(computed.fx)}, ${fmt(computed.fy)})$`) +
        kv('$h_s$ (chain)', `$${fmt(computed.hs)}$`) +
        kv('$h_s$ (quotient)', `$${fmt(computed.hsQ)}$`) +
        kv('$h_t$ (chain)', `$${fmt(computed.ht)}$`) +
        kv('$h_t$ (quotient)', `$${fmt(computed.htQ)}$`)
      );
    }
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$\\gamma$', `$${computed.curve.tex}$`) +
      kv('$t$', `$${fmt(state.t)}$`) +
      kv('$\\gamma(t)$', `$(${fmt(computed.x)}, ${fmt(computed.y)})$`) +
      kv("$\\gamma'(t)$", `$(${fmt(computed.xp)}, ${fmt(computed.yp)})$`) +
      kv('$\\nabla f$', `$(${fmt(computed.fx)}, ${fmt(computed.fy)})$`) +
      kv("$g'$ (chain)", `$${fmt(computed.gp)}$`) +
      kv("$g'$ (quotient of $g$)", `$${fmt(computed.gpQ)}$`) +
      kv("$g'$ (numeric $\\nabla f\\cdot\\gamma'$)", `$${fmt(computed.gpN)}$`)
    );
  },
  readout(state, computed) {
    if (computed.mode === 'map') {
      return cells([
        ['$h$', `$${fmt(computed.h)}$`],
        ['$h_s$', `$${fmt(computed.hs)}$`],
        ['$h_t$', `$${fmt(computed.ht)}$`],
        ['routes agree', computed.agree ? 'yes' : 'check $h$'],
      ]);
    }
    return cells([
      ['$g(t)$', `$${fmt(computed.g)}$`],
      ["$g'$", `$${fmt(computed.gp)}$`],
      ['$\\nabla f\\cdot\\gamma\'$', `$${fmt(computed.gpN)}$`],
      ['routes agree', computed.agree ? 'yes' : 'check $h$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    if (computed.mode === 'map') {
      body.push(
        'The inner map is $g(s,t)=(x(s,t), y(s,t))$, and $h=f\\circ g$. Theorem 16 says each partial of $h$ is $\\nabla f$ dotted with the corresponding inner partials.',
      );
      body.push(eq('h_s = f_x x_s + f_y y_s,\\qquad h_t = f_x x_t + f_y y_t'));
      body.push(
        `A second route differentiates $h$ itself in $s$ and in $t$; a third dots a numeric gradient with $(x_s,y_s)$ and $(x_t,y_t)$. ${computed.agree ? 'The three routes agree at this $(s,t)$.' : 'The difference quotient is still catching up.'}`,
      );
      return { title: 'Chain rule, two variables', body };
    }
    body.push(
      'The composite $g(t)=f(\\gamma(t))$ is $f$ sampled along the curve. Theorem 15 says $g\'(t)=f_x x\'+f_y y\'$, which is also $\\nabla f\\cdot\\gamma\'$. The gold curve is that path lifted onto the graph; its tangent is $g\'$.',
    );
    body.push(eq("g'(t)=f_x x'(t)+f_y y'(t)"));
    body.push(
      `A second route differentiates $g$ itself with a difference quotient; a third dots the numeric gradient with $\\gamma'$. ${computed.agree ? 'All three agree at this $t$.' : 'The difference quotient is still catching up.'}`,
    );
    return { title: 'Chain rule along $\\gamma$', body };
  },
  plot: () => null,
});
