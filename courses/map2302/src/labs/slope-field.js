/** Shows that a slope field fixes tangents locally; uniqueness and global existence need hypotheses.
 * RK4 is checked against independent closed forms (or Gaussian quadrature). Nonunique branches
 * are analytic overlays, not claimed as trajectories found by RK4 starting at zero. */
import { defineLab } from './define.js';
import { integrate,affineResponse,finiteGrowth } from '@flux/subjects/math/ode.js';
import { sceneScale } from '@flux/core/scene3d/frame.js';
import { simpson } from '@flux/subjects/math/quadrature.js';
import { slider,bindSlider } from './widgets.js';import { cells,kv } from '../ui/shared.js';import { fig } from '../ui/format.js';
import { THREE,C,clear,line,dot,label,cameraFor,initFigure,enterFigure,exitFigure,chart } from './figure.js';
const scenarios=[{id:'finite-growth',name:'Positive growth with a finite limit',model:'finite-growth',a:2,b:4,probe:{x:0,y:2,z:0},t:2},{id:'mixing',name:'Mixing: changing volume',model:'mixing',a:1,b:1,probe:{x:0,y:10,z:0},t:20,mix:{V0:60,qin:5,qout:3,ci:.1}},{id:'variable',name:'Integrating factor: variable coefficient',model:'variable',a:1,b:1,probe:{x:0,y:-1,z:0},t:1},{id:'polynomial',name:'Accumulation: y′=3t²',model:'polynomial',a:3,b:1,probe:{x:0,y:0,z:0},t:1},{id:'affine',name:'A sloping input: y′=t−2y',model:'affine',a:2,b:1,probe:{x:0,y:1,z:0},t:1},{id:'separate',name:'Separable: y′=t y',model:'separable',a:1,b:1,probe:{x:0,y:1,z:0},t:1},{id:'nonunique',name:'Nonunique: y′=2√|y|',model:'nonunique',a:1,b:1,probe:{x:0,y:0,z:0},t:1},{id:'blowup',name:'Finite-time blow-up: y′=y²',model:'blowup',a:1,b:1,probe:{x:0,y:1,z:0},t:.5},{id:'gaussian',name:'Integral solution: y′=exp(−t²)',model:'gaussian',a:1,b:1,probe:{x:0,y:1,z:0},t:1}];
export const slopeRhs=s=>(t,y)=>s.model==='affine'?s.b*t-s.a*y:s.model==='separable'?s.a*t*y:s.model==='blowup'?y*y:s.model==='gaussian'?Math.exp(-t*t):s.model==='finite-growth'?s.b*y/(s.a+t)**2:s.model==='polynomial'?s.a*t*t:s.model==='variable'?Math.exp(t-t*t)-2*t*y:s.model==='mixing'?s.mix.qin*s.mix.ci-s.mix.qout*y/(s.mix.V0+(s.mix.qin-s.mix.qout)*(t-s.probe.x)):2*Math.sqrt(Math.abs(y));
export function slopeExact(s,t){const t0=s.probe.x,y0=s.probe.y,dt=t-t0;
 if(s.model==='finite-growth')return finiteGrowth(s.a,s.b,y0,t,t0);
 if(s.model==='polynomial')return y0+s.a*(t**3-t0**3)/3;
 if(s.model==='variable')return Math.exp(t-t*t)+(y0*Math.exp(t0*t0)-Math.exp(t0))*Math.exp(-t*t);
 if(s.model==='mixing'){const {V0,qin,qout,ci}=s.mix,q=qin-qout,V=V0+q*dt;return ci*V+(y0-ci*V0)*(V0/V)**(qout/q);}
 if(s.model==='affine')return affineResponse(s.a,s.b,y0,t,t0);
 if(s.model==='separable')return y0*Math.exp(s.a*(t*t-t0*t0)/2);
 if(s.model==='blowup')return y0/(1-y0*dt);
 if(s.model==='gaussian')return y0+simpson(x=>Math.exp(-x*x),t0,t);
 // Display the zero branch separately from the analytic departing branch.
 return y0===0?0:Math.sign(y0)*(Math.sqrt(Math.abs(y0))+Math.sign(y0)*dt)**2;
}
const apply=(id,s)=>Object.assign(s,structuredClone(scenarios.find(x=>x.id===id)||scenarios[0]),{scenarioId:id,show:{},wait:0});
export default defineLab({id:'slope-field',exam:'u1',title:'Slope field',hint:'Drag the yellow initial point. A tangent is local; change the scenario to test uniqueness.',probe:true,orbit:false,cameraFor,gapLimit:2e-7,scenarios:[scenarios.find(s=>s.id==='affine'),...scenarios.filter(s=>s.id!=='affine')],
 frame(s){if(s.model==='finite-growth')s.probe.x=Math.max(-s.a+.5,s.probe.x);if(s.model==='mixing')return {upm:1,plane:'xy'};let t=s.t;if(s.model==='blowup'&&s.probe.y*(t-s.probe.x)>.7)t=s.probe.x+.7/s.probe.y;return {upm:Math.min(1,2/Math.max(2,Math.abs(s.probe.y),Math.abs(slopeExact(s,t)))),plane:'xy'};},
 defaultState(){const s={};apply('affine',s);return s;},applyScenario:apply,
 controls:()=>slider('sf-a','coefficient a',2,.25,3,.25)+slider('sf-t','evaluation t (dimensionless)',1,.1,1.5,.05),
 bind(api){bindSlider('sf-a',(s,v)=>s.a=v,api);bindSlider('sf-t',(s,v)=>s.t=v,api);},
 syncControls(s){for(const [id,v] of [['sf-a',s.a],['sf-t',s.t]]){const el=document.getElementById(id);if(id==='sf-t')el.max=s.model==='mixing'?30:s.model==='finite-growth'?5:1.5;el.value=v;if(id==='sf-a')el.disabled=!['affine','separable','polynomial','finite-growth'].includes(s.model);}},
 compute(s){let t=s.t;if(s.model==='blowup'&&s.probe.y*(t-s.probe.x)>.7)t=s.probe.x+.7/s.probe.y;const y=slopeExact(s,t),numeric=integrate(slopeRhs(s),s.probe.x,s.probe.y,t,512).end;return {t,y,numeric,slope:slopeRhs(s)(s.probe.x,s.probe.y),departed:Math.max(0,t-s.probe.x-(s.wait||0))**2,gap:Math.abs(y-numeric)/Math.max(1,Math.abs(y))};},
 recompute(s,c){if(s.model==='finite-growth')s.probe.x=Math.max(-s.a+.5,s.probe.x);if(s.model==='nonunique')Object.assign(s.probe,{x:0,y:0,z:0});Object.assign(c,this.compute(s));},init:initFigure,enter:enterFigure,exit:exitFigure,
 syncViews(s,c,ctx){const g=ctx.handle.group;clear(g);ctx.grid.group.visible=s.model!=='mixing';if(s.model==='mixing'){const xs=Array.from({length:101},(_,i)=>s.probe.x+(c.t-s.probe.x)*i/100);chart(g,xs,xs.map(t=>slopeExact(s,t)),{xLabel:'t (min)',yLabel:'dissolved salt (kg)'});label(g,`V(t)=${s.mix.V0}+${s.mix.qin-s.mix.qout} t L`,0,2.7);return;}const u=sceneScale(),f=slopeRhs(s);for(let x=-2/u;x<=2/u;x+=.4/u)for(let y=-2/u;y<=2/u;y+=.4/u){const m=f(x,y);if(!Number.isFinite(m))continue;const d=.12/u/Math.hypot(1,m);line(g,[[(x-d)*u,(y-m*d)*u,0],[(x+d)*u,(y+m*d)*u,0]],C.muted,false);}
 const pts=[];for(let i=0;i<=100;i++){const x=s.probe.x+(c.t-s.probe.x)*i/100,y=slopeExact(s,x);if(Math.abs(y*u)<=2.2)pts.push([x*u,y*u,.02]);}line(g,pts);dot(g,s.probe.x*u,s.probe.y*u);label(g,'t (dimensionless)',1.2,-2.5);label(g,'y (dimensionless)',-1.3,2.5);
 if(s.model==='nonunique'&&Math.abs(s.probe.y)<1e-10){line(g,Array.from({length:61},(_,i)=>{const t=c.t*i/60;return [(s.probe.x+t)*u,Math.max(0,t-(s.wait||0))**2*u,.02];}),C.gold);label(g,'zero branch and departing branch',0,-2.9);}},
 law:()=>[String.raw`y'=f(t,y),\quad y(t_0)=y_0`],liveRows:(s,c)=>kv('slope at initial point',fig(c.slope))+kv('RK4 check',fig(c.numeric)),
 readout:(s,c)=>cells([['y(t)',fig(c.y)],['checked t',fig(c.t)],['departing branch at t',s.model==='nonunique'?fig(c.departed):'not shown']]),
 coach:s=>({title:s.model==='nonunique'?'One initial value, multiple branches':'A local slope does not promise a global solution',body:s.model==='nonunique'?'At zero, f is continuous but its y derivative is unbounded. The blue zero branch and yellow departing branch satisfy the same initial condition. RK4 at zero follows only the zero branch.':'The field gives y′ at each point. Where f and its y derivative are continuous, one initial point selects a locally unique solution. For y′=y² that solution can still blow up in finite time; the displayed interval stops before its pole.'}),
});
