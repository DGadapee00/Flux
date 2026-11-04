/** Shows that variation of parameters works for forcing that undetermined coefficients cannot
 * guess, such as sec t or eᵗ/t. The closed forms are checked by RK4; the general-forcing scenario
 * evaluates the variation-of-parameters integral by quadrature and checks it by RK4. */
import { secantForced,repeatedForced,thirdOrderSecant } from '@flux/subjects/math/ode-methods.js';
import { integrate } from '@flux/subjects/math/ode.js';import { simpson } from '@flux/subjects/math/quadrature.js';
import { defineLab } from './define.js';
import { slider,bindSlider } from './widgets.js';import { cells,kv } from '../ui/shared.js';import { fig } from '../ui/format.js';
import { C,clear,dot,label,map,cameraFor,initFigure,enterFigure,exitFigure,chart } from './figure.js';
const scenarios=[
 {id:'secant',name:'y″+y=sec t',model:'secant',t0:0,y0:0,v0:0,t:1.2,tmax:1.5},
 {id:'repeated',name:'y″−2y′+y=eᵗ/t (repeated root)',model:'repeated',t0:1,y0:0,v0:0,t:2,tmax:3},
 {id:'general',name:'y″+y=1/(1+t²) by the integral',model:'general',t0:0,y0:0,v0:0,t:4,tmax:8},
 {id:'third',name:'Third order: y‴+y′=sec t',model:'third',t0:0,y0:0,v0:0,t:1.2,tmax:1.5},
];
const gForce=t=>1/(1+t*t);
/** y_p(t)=∫₀ᵗ sin(t−τ) f(τ) dτ comes from u₁=−∫y₂f/W, u₂=∫y₁f/W with y₁=cos, y₂=sin, W=1. */
const generalVP=(s,t)=>{const u1=-simpson(u=>Math.sin(u)*gForce(u),0,t,1e-11),u2=simpson(u=>Math.cos(u)*gForce(u),0,t,1e-11);return {y:s.y0*Math.cos(t)+s.v0*Math.sin(t)+u1*Math.cos(t)+u2*Math.sin(t),u1,u2,W:1};};
export function closed(s,t){
 if(s.model==='secant'){const r=secantForced(s.y0,s.v0,t);return {y:r.y,u1:r.u1,u2:r.u2,W:1};}
 if(s.model==='repeated'){const r=repeatedForced(s.t0,s.y0,s.v0,t);return {y:r.y,u1:-t,u2:Math.log(t),W:r.W};}
 if(s.model==='third'){const r=thirdOrderSecant(t);return {y:r.y,W:1};}
 return generalVP(s,t);
}
export function rk(s,t){
 if(s.model==='third')return integrate((u,[y,v,a])=>[v,a,1/Math.cos(u)-v],0,[0,0,0],t,4096).end[0];
 const f=s.model==='secant'?(u,[y,v])=>[v,1/Math.cos(u)-y]:s.model==='repeated'?(u,[y,v])=>[v,Math.exp(u)/u+2*v-y]:(u,[y,v])=>[v,gForce(u)-y];
 return integrate(f,s.t0,[s.y0,s.v0],t,4096).end[0];
}
const apply=(id,s)=>Object.assign(s,structuredClone(scenarios.find(x=>x.id===id)||scenarios[0]),{scenarioId:id,show:{}});
const clampT=s=>Math.min(Math.max(s.t,s.t0+.05),s.tmax);
export default defineLab({id:'variation',exam:'u2',title:'Variation of parameters',hint:'Move the end time toward the edge of the interval. The blue curve is the formula; gold dots are RK4.',orbit:false,cameraFor,gapLimit:1e-6,scenarios,
 defaultState(){const s={};apply('secant',s);return s;},applyScenario:apply,
 controls:()=>slider('vp-y0','initial value y(t₀)',0,-1,1,.1)+slider('vp-v0','initial slope y′(t₀)',0,-1,1,.1)+slider('vp-t','end time t',1.2,.05,8,.01),
 bind(api){for(const [id,k] of [['vp-y0','y0'],['vp-v0','v0'],['vp-t','t']])bindSlider(id,(s,v)=>s[k]=v,api);},
 syncControls(s){for(const [id,k] of [['vp-y0','y0'],['vp-v0','v0']]){const el=document.getElementById(id);el.value=s[k];el.disabled=s.model==='third';}const t=document.getElementById('vp-t');Object.assign(t,{min:s.t0+.05,max:s.tmax,value:s.t});},
 compute(s){if(s.model==='third'){s.y0=0;s.v0=0;}const t=clampT(s),r=closed(s,t),numeric=rk(s,t);return {...r,t,numeric,gap:Math.abs(r.y-numeric)/Math.max(1,Math.abs(r.y))};},
 recompute(s,c){for(const k of Object.keys(c))delete c[k];Object.assign(c,this.compute(s));},init:initFigure,enter:enterFigure,exit:exitFigure,
 syncViews(s,c,ctx){ctx.grid.group.visible=false;const g=ctx.handle.group;clear(g);const xs=Array.from({length:121},(_,i)=>s.t0+(c.t-s.t0)*i/120),ys=xs.map(t=>closed(s,t).y),lo=Math.min(0,...ys),hi=Math.max(.5,...ys);
  chart(g,xs,ys,{xLabel:'t',yLabel:'y',ymin:lo,ymax:hi});const pts=xs.filter((_,i)=>i%15===0);for(const t of pts){const y=t===s.t0?s.y0:rk(s,t);dot(g,map(t,xs[0],xs.at(-1)),map(y,lo,hi,-2,2),C.gold,true,.05);}
  label(g,'blue: variation of parameters; gold: RK4 of the equation',0,2.7);},
 plot(s,c){const xs=Array.from({length:81},(_,i)=>s.t0+(c.t-s.t0)*i/80);return {type:'accum',xs,ys:xs.map(t=>closed(s,t).y),x:c.t,title:'y; t'};},
 law:s=>s.model==='third'?[String.raw`y_p=\sum_i u_i y_i,\quad W\,u_i'=W_i\,f`]:[String.raw`y_p=u_1y_1+u_2y_2`,String.raw`u_1'=-\frac{y_2 f}{W},\quad u_2'=\frac{y_1 f}{W}`],
 liveRows:(s,c)=>kv('RK4 value',fig(c.numeric))+kv('Wronskian W',fig(c.W))+(c.u1!=null?kv('u₁ / u₂',`${fig(c.u1)} / ${fig(c.u2)}`):''),
 readout:(s,c)=>cells([['y(t)',fig(c.y)],['t',fig(c.t)],['W',fig(c.W)]]),
 coach:s=>s.model==='secant'?{title:'No trial guess fits sec t',body:'Derivatives of sec t never close into a finite family, so undetermined coefficients has no trial. Variation of parameters uses y₁=cos t, y₂=sin t and W=1. It gives u₁=ln(cos t) and u₂=t. The answer exists only on |t|<π/2, where sec t is finite.'}:s.model==='repeated'?{title:'The method is the same with a repeated root',body:'y₁=eᵗ and y₂=teᵗ have W=e^(2t). Then u₁′=−1 and u₂′=1/t. Start at t₀=1, since eᵗ/t is undefined at zero.'}:s.model==='general'?{title:'An integral is an acceptable answer',body:'For 1/(1+t²) the integrals have no elementary closed form. The variation-of-parameters formula still gives y as an integral, which quadrature evaluates. RK4 on the equation itself gives the same values.'}:{title:'Order three needs a 3×3 Wronskian',body:'With y₁=1, y₂=cos t, y₃=sin t, Cramer’s rule gives each uᵢ′ as a ratio of determinants. The result equals the kernel integral ∫(1−cos(t−τ))sec τ dτ.'},
});
