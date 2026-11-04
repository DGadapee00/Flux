/** Shows that the transform rules (multiply by t, shift in s, shift in t, periodic inputs) are
 * properties of one integral. Each closed form is checked by quadrature of ∫₀^∞ e^(−st) f(t) dt,
 * split at every jump and truncated where the integrand is below roundoff. */
import { transformRules } from '@flux/subjects/math/ode-methods.js';
import { simpson } from '@flux/subjects/math/quadrature.js';
import { defineLab } from './define.js';
import { slider,bindSlider } from './widgets.js';import { cells,kv } from '../ui/shared.js';import { fig } from '../ui/format.js';
import { C,clear,line,label,map,cameraFor,initFigure,enterFigure,exitFigure,chart } from './figure.js';
const scenarios=[
 {id:'tsin',name:'Multiply by t: t sin 2t',rule:'tsin',p:{b:2},s:1.5},
 {id:'tnexp',name:'Powers and s-shift: t³e^(−t/2)',rule:'tnexp',p:{n:3,a:-.5},s:1},
 {id:'shiftcos',name:'s-shift: e^(−t)cos 3t',rule:'shiftcos',p:{a:-1,b:3},s:.5},
 {id:'delayed',name:'t-shift: u(t−1)(t−1)²',rule:'delayed',p:{c:1},s:2},
 {id:'square',name:'Periodic square wave, period 2',rule:'square',p:{T:2},s:1},
];
const LAW={tsin:String.raw`\mathcal L\{t f\}=-F'(s)`,tnexp:String.raw`\mathcal L\{t^n e^{at}\}=\frac{n!}{(s-a)^{n+1}}`,shiftcos:String.raw`\mathcal L\{e^{at}f\}=F(s-a)`,delayed:String.raw`\mathcal L\{u(t-c)g(t-c)\}=e^{-cs}G(s)`,square:String.raw`\mathcal L\{f\}=\frac{1}{1-e^{-sT}}\int_0^T e^{-st}f\,dt`};
/** Second method: quadrature of the defining integral. */
export function quadrature(sc,s){
 const r=transformRules[sc.rule],end=60/(s-r.abscissa(sc.p)),cuts=[0,...(r.breaks?.(sc.p,end)||[]).filter(x=>x>0&&x<end),end];
 let sum=0;for(let i=1;i<cuts.length;i++)sum+=simpson(t=>Math.exp(-s*t)*r.f(t,sc.p),cuts[i-1],cuts[i],1e-11);return sum;
}
/** One period of the square wave, as the periodic rule writes it. */
const onePeriod=(sc,s)=>(1-Math.exp(-s*sc.p.T/2))/s/(1-Math.exp(-s*sc.p.T));
const sMin=sc=>Math.max(.2,transformRules[sc.rule].abscissa(sc.p)+.2);
const apply=(id,s)=>Object.assign(s,structuredClone(scenarios.find(x=>x.id===id)||scenarios[0]),{scenarioId:id,show:{}});
export default defineLab({id:'laplace-rules',exam:'u3',title:'Transform rules',hint:'Move s. The blue curve is F(s) from the rule; the gold mark is the integral computed directly.',orbit:false,cameraFor,gapLimit:1e-6,scenarios,
 defaultState(){const s={};apply('tsin',s);return s;},applyScenario:apply,
 controls:()=>slider('lr-s','transform variable s',1.5,.2,5,.05),
 bind(api){bindSlider('lr-s',(s,v)=>s.s=v,api);},
 syncControls(s){Object.assign(document.getElementById('lr-s'),{min:sMin(s),value:s.s});},
 compute(s){const sv=Math.max(s.s,sMin(s)),r=transformRules[s.rule],F=r.F(sv,s.p),numeric=quadrature(s,sv);const out={sv,F,numeric,gap:Math.abs(F-numeric)/Math.max(1,Math.abs(F))};
  if(s.rule==='square'){out.period=onePeriod(s,sv);}
  if(s.rule==='tsin'){const h=1e-4,base=v=>2/(v*v+4);out.minusDerivative=-(base(sv+h)-base(sv-h))/(2*h);}
  return out;},
 recompute(s,c){for(const k of Object.keys(c))delete c[k];Object.assign(c,this.compute(s));},init:initFigure,enter:enterFigure,exit:exitFigure,
 syncViews(s,c,ctx){ctx.grid.group.visible=false;const g=ctx.handle.group;clear(g);const lo=sMin(s),hi=5,xs=Array.from({length:121},(_,i)=>lo+(hi-lo)*i/120),r=transformRules[s.rule],ys=xs.map(v=>r.F(v,s.p)),top=Math.max(...ys,c.F)*1.05,bot=Math.min(0,...ys);
  chart(g,xs,ys,{xLabel:'s',yLabel:'F(s)',ymin:bot,ymax:top});const x=map(c.sv,lo,hi),y=map(c.numeric,bot,top,-2,2);line(g,[[x-.12,y,.02],[x+.12,y,.02]],C.gold);line(g,[[x,y-.12,.02],[x,y+.12,.02]],C.gold);
  label(g,'blue: rule; gold: direct integral',0,2.7);},
 plot(s){const lo=sMin(s),xs=Array.from({length:81},(_,i)=>lo+(5-lo)*i/80);return {type:'accum',xs,ys:xs.map(v=>transformRules[s.rule].F(v,s.p)),x:s.s,title:'F(s); s'};},
 law:s=>[LAW[s.rule]],
 liveRows:(s,c)=>kv('direct integral',fig(c.numeric))+(c.period!=null?kv('periodic formula',fig(c.period)):'')+(c.minusDerivative!=null?kv('−d/ds of 2/(s²+4)',fig(c.minusDerivative)):''),
 readout:(s,c)=>cells([['F(s)',fig(c.F)],['s',fig(c.sv)],['defined for s >',fig(transformRules[s.rule].abscissa(s.p))]]),
 coach:s=>({tsin:{title:'Multiplying by t differentiates in s',body:'Differentiate F(s)=∫e^(−st)f dt under the integral sign. The s derivative brings down −t, so L{t f}=−F′(s). For sin 2t, F=2/(s²+4), and −F′=4s/(s²+4)².'},tnexp:{title:'Two rules in one formula',body:'L{tⁿ}=n!/s^(n+1) comes from n uses of the t rule. Multiplying by e^(at) shifts s to s−a. The transform exists only for s>a.'},shiftcos:{title:'An exponential factor shifts s',body:'e^(at) combines with e^(−st) as e^(−(s−a)t), so every s in F becomes s−a. Damping moves the poles of the cosine left, to −1±3i.'},delayed:{title:'A delay multiplies by e^(−cs)',body:'Write the function as u(t−c)g(t−c) with g(t)=t². Changing variable to τ=t−c pulls out e^(−cs). A function written as u(t−c)t² needs rewriting in t−c first.'},square:{title:'A periodic input sums its periods',body:'Split the integral into periods and use e^(−s(t+kT))=e^(−skT)e^(−st). The geometric series gives 1/(1−e^(−sT)) times one period. For this wave the result simplifies to 1/(s(1+e^(−s))).'}})[s.rule],
});
