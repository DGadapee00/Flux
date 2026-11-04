/** Shows that an exact equation's solutions are level curves of a potential, and that a
 * substitution turns a nonlinear equation into one already solved. Each closed form (a level
 * curve or a back-substituted formula) is checked by RK4 of the original slope equation. */
import { exactCubic,factorQuadratic,homogeneousRatio,bernoulliSquare } from '@flux/subjects/math/ode-methods.js';
import { integrate } from '@flux/subjects/math/ode.js';
import { defineLab } from './define.js';
import { slider,bindSlider } from './widgets.js';import { cells,kv } from '../ui/shared.js';import { fig } from '../ui/format.js';
import { C,clear,dot,label,map,cameraFor,initFigure,enterFigure,exitFigure,chart } from './figure.js';
const scenarios=[
 {id:'exact',name:'Exact: (2xy+1)dx+(x²+3y²)dy=0',model:'exact',x0:0,y0:1,x:1.5,xmax:3},
 {id:'factor',name:'Integrating factor μ=x: (3xy+y²)dx+(x²+xy)dy=0',model:'factor',x0:1,y0:1,x:2,xmax:3},
 {id:'homogeneous',name:'Homogeneous: y′=(x²+y²)/(xy)',model:'homogeneous',x0:1,y0:1,x:2,xmax:3},
 {id:'bernoulli',name:'Bernoulli: y′+y/x=xy²',model:'bernoulli',x0:1,y0:1,x:1.5,xmax:1.9},
];
const MODELS={exact:exactCubic,factor:factorQuadratic};
export const slopeOf=s=>s.model==='homogeneous'?homogeneousRatio.f:s.model==='bernoulli'?bernoulliSquare.f:(x,y)=>-MODELS[s.model].M(x,y)/MODELS[s.model].N(x,y);
export function closedForm(s,x){
 if(s.model==='homogeneous')return homogeneousRatio.solve(s.x0,s.y0,x);
 if(s.model==='bernoulli')return bernoulliSquare.solve(s.x0,s.y0,x);
 return MODELS[s.model].solve(s.x0,s.y0,x);
}
/** The Bernoulli solution has a pole at K=1/(x₀y₀)+x₀; keep the checked point short of it. */
const limitX=s=>s.model==='bernoulli'?Math.min(s.xmax,bernoulliSquare.pole(s.x0,s.y0)-.1):s.xmax;
const apply=(id,s)=>Object.assign(s,structuredClone(scenarios.find(x=>x.id===id)||scenarios[0]),{scenarioId:id,show:{}});
export default defineLab({id:'exact-substitution',exam:'u1',title:'Exact and substitution',hint:'Change the starting value and the end point. The blue curve is the closed form; RK4 integrates the slope equation on its own.',orbit:false,cameraFor,gapLimit:1e-6,scenarios,
 defaultState(){const s={};apply('exact',s);return s;},applyScenario:apply,
 controls:()=>slider('ex-y0','starting value y₀',1,.5,2,.05)+slider('ex-x','end point x',1.5,.5,3,.05),
 bind(api){bindSlider('ex-y0',(s,v)=>s.y0=v,api);bindSlider('ex-x',(s,v)=>s.x=v,api);},
 syncControls(s){const y=document.getElementById('ex-y0'),x=document.getElementById('ex-x');y.value=s.y0;x.min=s.x0+.1;x.max=limitX(s);x.value=s.x;},
 compute(s){const x=Math.min(Math.max(s.x,s.x0+.1),limitX(s)),y=closedForm(s,x),numeric=integrate(slopeOf(s),s.x0,s.y0,x,2048).end,m=MODELS[s.model];
  const out={x,y,numeric,gap:Math.abs(y-numeric)/Math.max(1,Math.abs(y)),slope:slopeOf(s)(s.x0,s.y0)};
  if(m){out.C=m.F(s.x0,s.y0);out.Fend=m.F(x,numeric);out.My=m.My(s.x0,s.y0);out.Nx=m.Nx(s.x0,s.y0);out.exact=Math.abs(out.My-out.Nx)<1e-12;}
  if(s.model==='factor'){out.muMy=s.x0*m.My(s.x0,s.y0);out.muNx=m.N(s.x0,s.y0)+s.x0*m.Nx(s.x0,s.y0);}
  if(s.model==='homogeneous'){out.v0=s.y0/s.x0;out.v=y/x;}
  if(s.model==='bernoulli'){out.w=1/y;out.pole=bernoulliSquare.pole(s.x0,s.y0);}
  return out;},
 recompute(s,c){for(const k of Object.keys(c))delete c[k];Object.assign(c,this.compute(s));},init:initFigure,enter:enterFigure,exit:exitFigure,
 syncViews(s,c,ctx){ctx.grid.group.visible=false;const g=ctx.handle.group;clear(g);const xs=Array.from({length:121},(_,i)=>s.x0+(c.x-s.x0)*i/120),ys=xs.map(x=>closedForm(s,x));const lo=Math.min(0,...ys),hi=Math.max(1,...ys);
  chart(g,xs,ys,{xLabel:'x',yLabel:'y',ymin:lo,ymax:hi});for(let i=0;i<=8;i++){const x=s.x0+(c.x-s.x0)*i/8,y=integrate(slopeOf(s),s.x0,s.y0,x,256).end;dot(g,map(x,xs[0],xs.at(-1)),map(y,lo,hi,-2,2),C.gold,true,.05);}
  label(g,'blue: closed form; gold: RK4 of the slope equation',0,2.7);},
 plot(s,c){const xs=Array.from({length:81},(_,i)=>s.x0+(c.x-s.x0)*i/80);return {type:'accum',xs,ys:xs.map(x=>closedForm(s,x)),x:c.x,title:'y; x'};},
 law:s=>s.model==='exact'?[String.raw`M\,dx+N\,dy=0`,String.raw`M_y=N_x\Rightarrow F(x,y)=C`]:s.model==='factor'?[String.raw`\mu M\,dx+\mu N\,dy=0`,String.raw`(\mu M)_y=(\mu N)_x`]:s.model==='homogeneous'?[String.raw`y=vx,\quad x v'=\frac{1}{v}`]:[String.raw`w=y^{1-n}`,String.raw`w'+(1-n)P w=(1-n)Q`],
 liveRows:(s,c)=>kv('slope at start',fig(c.slope))+kv('RK4 value',fig(c.numeric))+(c.C!=null?kv('F at start / F on RK4 end',`${fig(c.C)} / ${fig(c.Fend)}`):'')+(c.v!=null?kv('v=y/x at start / end',`${fig(c.v0)} / ${fig(c.v)}`):'')+(c.w!=null?kv('w=1/y at end',fig(c.w)):''),
 readout:(s,c)=>cells([['y(x)',fig(c.y)],['x',fig(c.x)],s.model==='exact'||s.model==='factor'?['M_y / N_x',`${fig(c.My)} / ${fig(c.Nx)}`]:s.model==='bernoulli'?['pole at x',fig(c.pole)]:['v=y/x',fig(c.v)]]),
 coach:s=>s.model==='exact'?{title:'A solution stays on one level curve',body:'When M_y=N_x the left side is the differential of one function F. Along any solution dF=0, so F keeps its starting value. The RK4 end point lands on the same level of F.'}:s.model==='factor'?{title:'The test fails until a factor is found',body:'Here M_y=3x+2y and N_x=2x+y differ, so the form is not exact. (M_y−N_x)/N=1/x depends on x alone, which gives μ=x. After multiplying, the cross partials agree and a potential exists.'}:s.model==='homogeneous'?{title:'The ratio v=y/x carries the equation',body:'The right side depends only on y/x. Writing y=vx turns the equation into x v′=1/v, which separates. Undo the substitution before reading y.'}:{title:'w=1/y makes the equation linear',body:'For n=2, w=y^(1−n)=1/y. The new equation is first-order linear, so an integrating factor solves it. The answer for y has a pole where w crosses zero, so the solution interval ends there.'},
});
