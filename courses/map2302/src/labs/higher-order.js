/** Shows that an nth-order constant-coefficient equation needs n independent solutions and n
 * initial values, and that an annihilator predicts the trial for a polynomial-exponential input.
 * The root-built solution is checked by RK4 of the companion first-order system, and the
 * determinant Wronskian is checked against Abel's formula. */
import { higherOrder,basisFromRoots,wronskian } from '@flux/subjects/math/ode-methods.js';
import { integrate } from '@flux/subjects/math/ode.js';
import { defineLab } from './define.js';
import { slider,bindSlider } from './widgets.js';import { cells,kv } from '../ui/shared.js';import { fig } from '../ui/format.js';
import { C,clear,dot,label,map,cameraFor,initFigure,enterFigure,exitFigure,chart } from './figure.js';
const scenarios=[
 {id:'distinct',name:'Three real roots: (D+1)(D+2)(D+3)y=0',roots:[{re:-1,m:1},{re:-2,m:1},{re:-3,m:1}],init:[1,0,0],t:3,tmax:6},
 {id:'mixed',name:'Real and complex: (D+1)(D²+2D+5)y=0',roots:[{re:-1,m:1},{re:-1,im:2,m:1}],init:[1,0,0],t:3,tmax:6},
 {id:'repeated',name:'Repeated complex pair: (D²+1)²y=0',roots:[{re:0,im:1,m:2}],init:[0,1,0,0],t:6,tmax:12},
 {id:'annihilator',name:'Annihilator: y‴+y′=2t+3e^(−t)',roots:[{re:0,m:1},{re:0,im:1,m:1}],init:[0,0,0],forced:true,t:3,tmax:6},
];
/** D²(D+1) annihilates 2t+3e^(−t). Roots 0 (from D²) repeat the root 0 of D³+D, so the trial is t(At+B)+Ce^(−t);
 * matching gives A=1, B=0, C=−3/2. */
const particular=(j,t)=>[t*t-1.5*Math.exp(-t),2*t+1.5*Math.exp(-t),2-1.5*Math.exp(-t)][j];
const forcing=t=>2*t+3*Math.exp(-t);
export function closed(s,t){return higherOrder(s.roots,s.init,t,s.forced?particular:undefined);}
export function companion(s,t,n=4096){
 const poly=closed(s,0).poly,order=poly.length-1;
 return integrate((u,y)=>{const top=-poly.slice(1).reduce((acc,a,i)=>acc+a*y[order-1-i],0)+(s.forced?forcing(u):0);return [...y.slice(1),top];},0,s.init,t,n).end;
}
const apply=(id,s)=>Object.assign(s,structuredClone(scenarios.find(x=>x.id===id)||scenarios[0]),{scenarioId:id,show:{}});
const polyTeX=p=>{const n=p.length-1;return p.map((a,i)=>{const k=n-i;if(!a)return '';const c=Math.abs(a)===1&&k?'':String(Math.abs(a));return `${a<0?'-':i?'+':''}${c}${k?k===1?'D':`D^${k}`:''}`;}).join('')+'=0';};
export default defineLab({id:'higher-order',exam:'u2',title:'Higher-order equations',hint:'Change the initial slope and the end time. Each extra order needs one more initial value.',orbit:false,cameraFor,gapLimit:1e-6,scenarios,
 defaultState(){const s={};apply('distinct',s);return s;},applyScenario:apply,
 controls:()=>slider('ho-v','initial slope y′(0)',0,-2,2,.1)+slider('ho-t','end time t (dimensionless)',3,.1,12,.05),
 bind(api){bindSlider('ho-v',(s,v)=>s.init[1]=v,api);bindSlider('ho-t',(s,v)=>s.t=v,api);},
 syncControls(s){document.getElementById('ho-v').value=s.init[1];Object.assign(document.getElementById('ho-t'),{max:s.tmax,value:s.t});},
 compute(s){const r=closed(s,s.t),n=companion(s,s.t),B=basisFromRoots(s.roots),W0=wronskian(B,0),W=wronskian(B,s.t),abel=W0*Math.exp(-r.poly[1]*s.t);
  return {y:r.y,derivs:r.derivs,order:B.length,poly:r.poly,numeric:n[0],W,W0,abel,gap:Math.max(...r.derivs.map((d,i)=>Math.abs(d-n[i])),Math.abs(W-abel))/Math.max(1,Math.abs(r.y),Math.abs(W0))};},
 recompute(s,c){for(const k of Object.keys(c))delete c[k];Object.assign(c,this.compute(s));},init:initFigure,enter:enterFigure,exit:exitFigure,
 syncViews(s,c,ctx){ctx.grid.group.visible=false;const g=ctx.handle.group;clear(g);const xs=Array.from({length:161},(_,i)=>s.t*i/160),ys=xs.map(t=>closed(s,t).y),lo=Math.min(0,...ys),hi=Math.max(.5,...ys);
  chart(g,xs,ys,{xLabel:'t',yLabel:'y',ymin:lo,ymax:hi});for(let i=1;i<=8;i++){const t=s.t*i/8;dot(g,map(t,0,s.t),map(companion(s,t,512)[0],lo,hi,-2,2),C.gold,true,.05);}
  label(g,'blue: root basis; gold: RK4 of the first-order system',0,2.7);},
 plot(s){const xs=Array.from({length:81},(_,i)=>s.t*i/80);return {type:'accum',xs,ys:xs.map(t=>closed(s,t).y),x:s.t,title:'y; t'};},
 law:s=>[`${polyTeX(closed(s,0).poly).replace('=0',s.forced?'\\;y=2t+3e^{-t}':'\\;y=0')}`,String.raw`W(t)=W(0)\,e^{-a_{n-1}t}`],
 liveRows:(s,c)=>kv('order n',String(c.order))+kv('RK4 value',fig(c.numeric))+kv('Wronskian / Abel',`${fig(c.W)} / ${fig(c.abel)}`),
 readout:(s,c)=>cells([['y(t)',fig(c.y)],['W(0)',fig(c.W0)],['t',fig(s.t)]]),
 coach:s=>s.forced?{title:'The annihilator names the trial',body:'D² kills 2t and D+1 kills 3e^(−t). Applying D²(D+1) to both sides gives a homogeneous equation with roots 0, 0, 0, −1, ±i. Drop the roots that y‴+y′ already has (0, ±i). What is left, t and t² from the repeated 0 and e^(−t), is the trial: At²+Bt+Ce^(−t).'}:{title:'n roots, n solutions, n initial values',body:'Each root of the characteristic polynomial gives a solution. A root of multiplicity m also gives t, t², …, t^(m−1) times it. The Wronskian of these n functions is never zero, and Abel’s formula says it changes only by the factor e^(−a_(n−1)t).'},
});
