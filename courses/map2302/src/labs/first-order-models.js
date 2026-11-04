/** Shows that a first-order model is a balance: mass in minus mass out, heat gained minus heat
 * lost, gravity minus drag. Each closed form is checked by RK4 of the balance itself. */
import { twoTanks,building,linearDrag,quadraticDrag } from '@flux/subjects/math/ode-methods.js';
import { integrate } from '@flux/subjects/math/ode.js';
import { G } from '@flux/subjects/mechanics/constants.js';
import { defineLab } from './define.js';
import { slider,bindSlider } from './widgets.js';import { cells,kv } from '../ui/shared.js';import { fig } from '../ui/format.js';
import { C,clear,line,label,map,cameraFor,initFigure,enterFigure,exitFigure,chart } from './figure.js';
const W=2*Math.PI/24;
const scenarios=[
 {id:'tanks',name:'Two tanks in series',model:'tanks',q:5,V1:100,V2:50,a0:20,b0:0,t:12,tmax:60},
 {id:'building',name:'A heated building on a daily cycle',model:'building',K:.2,M0:10,B:8,H:2,T0:15,t:30,tmax:72},
 {id:'linear',name:'Fall with linear drag',model:'linear',m:2,b:.5,v0:0,t:4,tmax:30},
 {id:'quadratic',name:'Skydiver with quadratic drag',model:'quadratic',m:80,c:.25,v0:0,t:6,tmax:30},
];
/** The closed form: first value is the plotted quantity, the rest are readouts. */
export function model(s,t){
 if(s.model==='tanks'){const r=twoTanks(s.q,s.V1,s.V2,s.a0,s.b0,t);return {y:r.b,y2:r.a,peak:r.peak,k1:r.k1,k2:r.k2};}
 if(s.model==='building'){const r=building(s.K,s.M0,s.B,s.H,W,s.T0,t);return {y:r.T,y2:r.outdoor,mean:r.mean,swing:r.swing,lag:r.lag};}
 if(s.model==='linear'){const r=linearDrag(s.m,s.b,G,s.v0,t);return {y:r.v,y2:r.x,vt:r.vt,tau:r.tau};}
 const r=quadraticDrag(s.m,s.c,G,s.v0,t);return {y:r.v,y2:r.x,vt:r.vt};
}
/** The second method: RK4 of the balance equations as written. */
export function balance(s,t){
 if(s.model==='tanks'){const [a,b]=integrate((u,[a,b])=>[-s.q*a/s.V1,s.q*a/s.V1-s.q*b/s.V2],0,[s.a0,s.b0],t,2048).end;return {y:b,y2:a};}
 if(s.model==='building'){const T=integrate((u,T)=>s.K*(s.M0-s.B*Math.cos(W*u)-T)+s.H,0,s.T0,t,4096).end;return {y:T,y2:s.M0-s.B*Math.cos(W*t)};}
 const drag=s.model==='linear'?v=>s.b*v:v=>s.c*v*v;const [x,v]=integrate((u,[x,v])=>[v,G-drag(v)/s.m],0,[0,s.v0],t,2048).end;return {y:v,y2:x};
}
const KEY={tanks:'q',building:'K',linear:'b',quadratic:'c'};
const P={tanks:['flow rate q (L/min)',1,10,.5],building:['loss rate K (1/h)',.05,.5,.05],linear:['drag b (kg/s)',.2,2,.1],quadratic:['drag c (kg/m)',.1,.5,.05]};
const UNITS={tanks:['t (min)','salt in tank 2 (kg)'],building:['t (h)','indoor T (°C)'],linear:['t (s)','speed (m/s)'],quadratic:['t (s)','speed (m/s)']};
const apply=(id,s)=>Object.assign(s,structuredClone(scenarios.find(x=>x.id===id)||scenarios[0]),{scenarioId:id,show:{}});
export default defineLab({id:'first-order-models',exam:'u1',title:'Tanks, buildings and falls',hint:'Move the rate that drains or resists. Watch the peak, the daily swing or the terminal speed change.',orbit:false,cameraFor,gapLimit:1e-6,scenarios,
 defaultState(){const s={};apply('tanks',s);return s;},applyScenario:apply,
 controls:()=>slider('fm-p','rate',5,1,10,.5)+slider('fm-t','time',12,0,60,.5),
 bind(api){bindSlider('fm-p',(s,v)=>{s[KEY[s.model]]=v;},api);bindSlider('fm-t',(s,v)=>s.t=v,api);},
 syncControls(s){const [lab,lo,hi,step]=P[s.model],p=document.getElementById('fm-p'),t=document.getElementById('fm-t');Object.assign(p,{min:lo,max:hi,step,value:s[KEY[s.model]]});p.closest('label').querySelector('span').textContent=lab;Object.assign(t,{max:s.tmax,value:s.t});t.closest('label').querySelector('span').textContent=UNITS[s.model][0];},
 compute(s){const r=model(s,s.t),n=balance(s,s.t);return {...r,numeric:n.y,numeric2:n.y2,gap:Math.max(Math.abs(r.y-n.y),Math.abs(r.y2-n.y2))/Math.max(1,Math.abs(r.y),Math.abs(r.y2))};},
 recompute(s,c){for(const k of Object.keys(c))delete c[k];Object.assign(c,this.compute(s));},init:initFigure,enter:enterFigure,exit:exitFigure,
 syncViews(s,c,ctx){ctx.grid.group.visible=false;const g=ctx.handle.group;clear(g);const end=Math.max(s.t*1.25,s.tmax/2),xs=Array.from({length:161},(_,i)=>end*i/160),ys=xs.map(t=>model(s,t).y);
  const extra=s.model==='building'?xs.map(t=>model(s,t).y2):s.model==='tanks'?xs.map(t=>model(s,t).y2):null,lo=Math.min(0,...ys,...(extra||[])),hi=Math.max(1,...ys,...(extra||[]));
  chart(g,xs,ys,{xLabel:UNITS[s.model][0],yLabel:UNITS[s.model][1],ymin:lo,ymax:hi});if(extra)line(g,xs.map((t,i)=>[map(t,0,end),map(extra[i],lo,hi,-2,2),.01]),C.gold);
  line(g,[[map(s.t,0,end),-2,.02],[map(s.t,0,end),2,.02]],C.muted);
  label(g,s.model==='tanks'?'blue: tank 2; gold: tank 1':s.model==='building'?'blue: indoor; gold: outdoor':'blue: speed',0,2.7);},
 plot(s){const xs=Array.from({length:121},(_,i)=>s.tmax*i/120);return {type:'accum',xs,ys:xs.map(t=>model(s,t).y),x:s.t,title:`${UNITS[s.model][1]}; ${UNITS[s.model][0]}`};},
 law:s=>s.model==='tanks'?[String.raw`a'=-\frac{q}{V_1}a`,String.raw`b'=\frac{q}{V_1}a-\frac{q}{V_2}b`]:s.model==='building'?[String.raw`T'=K\,(M(t)-T)+H`,String.raw`M=M_0-B\cos\omega t`]:s.model==='linear'?[String.raw`m v'=mg-bv`]:[String.raw`m v'=mg-cv^2`],
 liveRows:(s,c)=>kv('RK4 of the balance',fig(c.numeric))+(s.model==='tanks'?kv('peak time in tank 2 (min)',fig(c.peak)):s.model==='building'?kv('mean / daily swing (°C)',`${fig(c.mean)} / ${fig(c.swing)}`):kv('terminal speed (m/s)',fig(c.vt))),
 readout:(s,c)=>cells(s.model==='tanks'?[['tank 2 (kg)',fig(c.y)],['tank 1 (kg)',fig(c.y2)],['t (min)',fig(s.t)]]:s.model==='building'?[['indoor (°C)',fig(c.y)],['outdoor (°C)',fig(c.y2)],['lag (h)',fig(c.lag)]]:[['speed (m/s)',fig(c.y)],['distance (m)',fig(c.y2)],['terminal (m/s)',fig(c.vt)]]),
 coach:s=>s.model==='tanks'?{title:'Tank 2 rises, peaks and drains',body:'Tank 1 only loses salt, so it decays at q/V₁. Tank 2 gains what tank 1 loses and drains at q/V₂. Its salt peaks when inflow equals outflow, at t=ln(k₁/k₂)/(k₁−k₂). The model assumes each tank is well mixed.'}:s.model==='building'?{title:'The inside follows the outside, smaller and later',body:'Newton cooling with a daily outdoor cycle is a linear equation with sinusoidal input. The steady swing is B/√(1+(ω/K)²) and it lags by atan(ω/K)/ω hours. Heating raises the mean by H/K. A leakier building, with larger K, tracks the outdoors more closely.'}:{title:'Drag sets a terminal speed',body:s.model==='linear'?'Linear drag is a first-order linear equation in v. Speed approaches mg/b with time constant m/b. Distance is the integral of speed.':'Quadratic drag is separable. Speed approaches √(mg/c) as a tanh curve. Linear drag suits slow, small objects; quadratic drag suits a person or a ball in air.'},
});
