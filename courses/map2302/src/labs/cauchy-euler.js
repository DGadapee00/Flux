/** Shows that a Cauchy–Euler equation is a constant-coefficient equation in ln x, and that
 * reduction of order builds a second solution from a known one. Closed forms in x are checked by
 * RK4 of the variable-coefficient equation in x. */
import { cauchyEuler,reductionExample } from '@flux/subjects/math/ode-methods.js';
import { integrate } from '@flux/subjects/math/ode.js';
import { defineLab } from './define.js';
import { slider,bindSlider } from './widgets.js';import { cells,kv } from '../ui/shared.js';import { fig } from '../ui/format.js';
import { C,clear,dot,label,map,cameraFor,initFigure,enterFigure,exitFigure,chart } from './figure.js';
const scenarios=[
 {id:'distinct',name:'Distinct roots: x²y″−2xy′+2y=0',model:'euler',a:-2,b:2,x0:1,y0:1,v0:0,x:3},
 {id:'repeated',name:'Repeated root: x²y″−xy′+y=0',model:'euler',a:-1,b:1,x0:1,y0:1,v0:0,x:3},
 {id:'complex',name:'Complex roots: x²y″+xy′+4y=0',model:'euler',a:1,b:4,x0:1,y0:1,v0:0,x:3},
 {id:'reduction',name:'Reduction of order: xy″−(x+1)y′+y=0',model:'reduction',a:0,b:0,x0:1,y0:2,v0:1,x:2.5},
];
export function closed(s,x){return s.model==='reduction'?reductionExample(s.x0,s.y0,s.v0,x):cauchyEuler(s.a,s.b,s.x0,s.y0,s.v0,x);}
export function rk(s,x,n=4096){const f=s.model==='reduction'?(u,[y,v])=>[v,((u+1)*v-y)/u]:(u,[y,v])=>[v,(-s.a*u*v-s.b*y)/(u*u)];return integrate(f,s.x0,[s.y0,s.v0],x,n).end;}
const apply=(id,s)=>Object.assign(s,structuredClone(scenarios.find(x=>x.id===id)||scenarios[0]),{scenarioId:id,show:{}});
export default defineLab({id:'cauchy-euler',exam:'u2',title:'Cauchy–Euler equations',hint:'Change b to move between root cases. The blue curve is the closed form in x; gold dots are RK4.',orbit:false,cameraFor,gapLimit:1e-6,scenarios,
 defaultState(){const s={};apply('distinct',s);return s;},applyScenario:apply,
 controls:()=>slider('ce-b','coefficient b',2,-2,6,.25)+slider('ce-v0','initial slope y′(1)',0,-2,2,.1)+slider('ce-x','end point x',3,1.1,6,.05),
 bind(api){for(const [id,k] of [['ce-b','b'],['ce-v0','v0'],['ce-x','x']])bindSlider(id,(s,v)=>s[k]=v,api);},
 syncControls(s){for(const [id,k] of [['ce-b','b'],['ce-v0','v0'],['ce-x','x']])document.getElementById(id).value=s[k];document.getElementById('ce-b').disabled=s.model==='reduction';},
 compute(s){const x=Math.max(s.x0+.05,s.x),r=closed(s,x),[y,v]=rk(s,x);const out={...r,x,numeric:y,gap:Math.max(Math.abs(r.y-y),Math.abs(r.v-v))/Math.max(1,Math.abs(r.y))};
  if(s.model==='euler'){out.p=s.a-1;out.r1=r.kind==='complex'?r.roots[0]:r.roots[0];out.r2=r.kind==='complex'?r.roots[1]:r.roots[1];}
  return out;},
 recompute(s,c){for(const k of Object.keys(c))delete c[k];Object.assign(c,this.compute(s));},init:initFigure,enter:enterFigure,exit:exitFigure,
 syncViews(s,c,ctx){ctx.grid.group.visible=false;const g=ctx.handle.group;clear(g);const xs=Array.from({length:121},(_,i)=>s.x0+(c.x-s.x0)*i/120),ys=xs.map(x=>closed(s,x).y),lo=Math.min(0,...ys),hi=Math.max(1,...ys);
  chart(g,xs,ys,{xLabel:'x',yLabel:'y',ymin:lo,ymax:hi});for(let i=1;i<=8;i++){const x=s.x0+(c.x-s.x0)*i/8;dot(g,map(x,xs[0],xs.at(-1)),map(rk(s,x,512)[0],lo,hi,-2,2),C.gold,true,.05);}
  label(g,'blue: closed form; gold: RK4 in x',0,2.7);},
 plot(s,c){const xs=Array.from({length:81},(_,i)=>s.x0+(c.x-s.x0)*i/80);return {type:'accum',xs,ys:xs.map(x=>closed(s,x).y),x:c.x,title:'y; x'};},
 law:s=>s.model==='reduction'?[String.raw`y=u\,y_1,\quad y_1=e^x`,String.raw`x u''+(x-1)u'=0`]:[String.raw`x^2y''+a x y'+b y=0`,String.raw`y=x^r:\ r^2+(a-1)r+b=0`],
 liveRows:(s,c)=>kv('RK4 value',fig(c.numeric))+(s.model==='euler'?kv('indicial roots',c.kind==='complex'?`${fig(c.r1)} ± ${fig(c.r2)}i`:`${fig(c.r1)}, ${fig(c.r2)}`)+kv('discriminant',fig(c.disc)):kv('c₁ eˣ + c₂ (x+1)',`${fig(c.c1)}, ${fig(c.c2)}`)),
 readout:(s,c)=>cells([['y(x)',fig(c.y)],['x',fig(c.x)],['case',s.model==='euler'?c.kind:'reduction']]),
 coach:s=>s.model==='reduction'?{title:'One known solution gives the second',body:'Put y=u eˣ. The u terms cancel because eˣ already solves the equation, leaving a first-order equation for u′. It gives u′=Cxe^(−x) and a second solution x+1. Their Wronskian is a multiple of xeˣ. It is nonzero away from x=0, so the IVP needs x₀≠0.'}:{title:'Powers of x replace exponentials',body:'Each term x^k y^(k) keeps the degree of xʳ, so y=xʳ reduces the equation to r²+(a−1)r+b=0. With x=eˢ the equation becomes Y″+(a−1)Y′+bY=0 in s. A repeated root gives xʳ ln x, and complex roots give x^α cos(β ln x) and x^α sin(β ln x). The solutions live on x>0.'},
});
