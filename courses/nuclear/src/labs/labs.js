import * as M from '@flux/subjects/physics/foundations.js';
import { LESSONS } from '../data/lessons.js';
import { defineLab } from './define2d.js';
import { slider,bindSlider } from './widgets.js';
import { begin,plotIn,axes,line,dot,label,poly,split,C,alpha } from './diagram.js';
import { cells,kv } from '../ui/shared.js';
const f=x=>typeof x==='boolean'?(x?'yes':'no'):x==null?'not defined':Number(x.toPrecision(4)).toString();
const samples=(fn,a,b,n=160)=>Array.from({length:n+1},(_,i)=>{const x=a+(b-a)*i/n;return [x,fn(x)];});
function plotData(meta,s,c){
 const chart=(x,y,xlo,xhi,ylo,yhi,points,cursor,extra={})=>({x,y,xlo,xhi,ylo,yhi,points,cursor,...extra});
 switch(meta.id){
  case 'relativity':return [chart('v/c','Lorentz factor',0,.98,0,6,samples(x=>1/Math.sqrt(1-x*x),0,.98),[s.beta,c.gamma],{caption:'The speed axis stops below c.'})];
  case 'photoelectric':return [chart('Wavelength, nm','Maximum electron energy, eV',150,800,0,8,samples(x=>Math.max(0,M.HC_EV_NM/x-s.work),150,800),[s.wavelength,c.kinetic],{vertical:c.cutoff,caption:'Beyond the cutoff: no ideal single-photon emission.'})];
  case 'matter-wave':return [chart('Kinetic energy, eV','Electron wavelength, nm',10,500,0,.42,samples(x=>M.H/Math.sqrt(2*M.ME*x*M.Q)*1e9,10,500),[s.energy,c.wavelength])];
  case 'hydrogen':return [chart('Principal level n','Energy, eV',.5,8.5,-15,1,Array.from({length:8},(_,i)=>[i+1,-13.605693122994/(i+1)**2]),[s.upper,c.upperEnergy],{levels:true,second:[s.lower,c.lowerEnergy],caption:'Level energies, not literal electron orbits.'})];
  case 'packet':{
   const density=x=>Math.exp(-x*x/(2*s.sigma*s.sigma))/(Math.sqrt(2*Math.PI)*s.sigma),amp=x=>Math.sqrt(density(x))*Math.cos(s.k*x);
   return [chart('Position, nm','Probability density, 1/nm',-4*s.sigma,4*s.sigma,0,1.1/(Math.sqrt(2*Math.PI)*s.sigma),samples(density,-4*s.sigma,4*s.sigma),[s.sigma,density(s.sigma)],{caption:'Area gives probability. Carrier phase does not change this density.'}),chart('Position, nm','Real amplitude, nm^(-1/2)',-4*s.sigma,4*s.sigma,-1.1*Math.sqrt(density(0)),1.1*Math.sqrt(density(0)),samples(amp,-4*s.sigma,4*s.sigma,320),[0,amp(0)],{caption:'The real amplitude is not a probability density.'})];
  }
  case 'well':{
   const amp=x=>Math.sqrt(2/s.width)*Math.sin(s.n*Math.PI*x/s.width);
   return [chart('Position, nm','Wavefunction, nm^(-1/2)',0,s.width,-1.15*Math.sqrt(2/s.width),1.15*Math.sqrt(2/s.width),samples(amp,0,s.width,320),[s.width/2,amp(s.width/2)],{caption:`Infinite walls at both ends. Interior nodes: ${c.nodes}.`}),chart('Position, nm','Probability density, 1/nm',0,s.width,0,2.2/s.width,samples(x=>amp(x)**2,0,s.width,320),[s.width/2,amp(s.width/2)**2])];
  }
  case 'tunnel':return [chart('Position, nm','Real amplitude, relative',-.6,s.width+.6,-2.2,2.2,samples(x=>M.tunnelWave(x,c,s.width)[0],-.6,s.width+.6,400),[s.width,M.tunnelWave(s.width,c,s.width)[0]],{barrier:[0,s.width],caption:`Shaded region: ${s.barrier} eV barrier; incident energy ${s.energy} eV.`})];
  case 'spin':return [chart('Analyzer angle, degrees','Probability of + outcome',0,180,0,1,samples(x=>Math.cos((s.theta-x)*Math.PI/360)**2,0,180),[s.analyzer,c.plus],{caption:'Only two measured outcomes; the mean can lie between them.'})];
  case 'binding':return [chart('Supplied mass defect, u','Total binding energy, MeV',0,.1,0,100,samples(x=>x*931.49410372,0,.1),[s.defect,c.energy],{caption:'A conversion of supplied inputs, not a nuclear mass prediction.'})];
  case 'decay':{const max=Math.max(5*s.halfLife,s.time);return [chart('Time, s','Expected nuclei',0,max,0,s.initial*1.05,samples(x=>s.initial*Math.exp(-c.lambda*x),0,max),[s.time,c.remaining],{caption:'An expectation curve; individual decay records fluctuate.'})];}
  case 'attenuation':return [chart('Path thickness, cm','Uncollided intensity',0,10,0,s.intensity*1.05,samples(x=>s.intensity*Math.exp(-s.mu*x),0,10),[s.depth,c.transmitted],{caption:'Narrow monoenergetic beam. The coefficient is a classroom input.'})];
  default:{const mean=s.gross,lo=Math.max(0,Math.floor(mean-4*Math.sqrt(mean))),hi=Math.ceil(mean+4*Math.sqrt(mean));const pmf=n=>{let log=-mean+n*Math.log(mean);for(let j=2;j<=n;j++)log-=Math.log(j);return Math.exp(log);};return [chart('Counts in one exposure','Poisson probability',lo,hi,0,pmf(Math.floor(mean))*1.2,Array.from({length:hi-lo+1},(_,i)=>[lo+i,pmf(lo+i)]),[mean,pmf(mean)],{discrete:true,caption:'Reference distribution: mean estimated from the observed gross count.'})];}
 }
}
const predictions={
 relativity:[['beta',.8,'time','bigger','Increasing speed increases the lab interval for the same proper interval.'],['beta',.8,'contracted','smaller','Moving lengths contract more at a higher relative speed.']],
 photoelectric:[['wavelength',600,'energy','smaller','Photon energy decreases as wavelength increases.'],['wavelength',600,'kinetic','smaller','The chosen photon falls below the work function at this longer wavelength.']],
 'matter-wave':[['energy',400,'wavelength','smaller','Momentum grows as the square root of kinetic energy, so wavelength falls.'],['energy',400,'speed','bigger','For a fixed nonrelativistic mass, speed grows with the square root of kinetic energy.']],
 hydrogen:[['upper',4,'photon','bigger','The upper level is less tightly bound, so the energy drop to the fixed lower level is larger.'],['upper',4,'wavelength','smaller','The larger energy difference produces a shorter photon wavelength.']],
 packet:[['sigma',1,'dk','smaller','A broader Gaussian in position is narrower in wave number.'],['sigma',1,'meanMomentum','same','The carrier wave number fixes the mean momentum; the envelope width fixes its spread.']],
 well:[['width',2,'energy','smaller','The energy falls as the inverse square of the width.'],['width',2,'nodes','same','The number of interior nodes depends on n, not the physical width.']],
 tunnel:[['width',.5,'transmission','smaller','The evanescent region is wider, reducing transmission for these below-barrier inputs.'],['barrier',10,'transmission','smaller','The barrier is farther above the incident energy.']],
 spin:[['theta',120,'plus','smaller','With the analyzer fixed, this prepared state has a smaller overlap with its plus state.'],['theta',120,'minus','bigger','The two probabilities sum to one.']],
 binding:[['defect',.06,'energy','bigger','The supplied mass defect doubles.'],['A',8,'perNucleon','smaller','The same total binding energy is divided among more nucleons in this illustrative input comparison.']],
 decay:[['time',40,'fraction','smaller','More time permits more expected decay.'],['initial',2000,'activity','bigger','At the same time and half-life, doubling the starting population doubles activity.']],
 attenuation:[['depth',10,'fraction','smaller','The uncollided beam crosses more material.'],['intensity',2000,'fraction','same','Initial intensity changes magnitude, not the attenuation fraction.']],
 counting:[['gross',240,'rate','bigger','The background and equal exposure stay fixed while the gross count increases.'],['gross',240,'sigma','bigger','The plug-in Poisson variance estimate adds gross and background counts.']]
};
function makeLab(meta){
 const defaults=()=>Object.fromEntries(meta.inputs.map(i=>[i.key,i.default]));
 return defineLab({id:meta.id,exam:meta.exam,title:meta.labTitle,app:false,hint:meta.idea,gapLimit:2e-4,
 defaultState:()=>({...defaults(),scenarioId:'base'}),
 scenarios:[{id:'base',name:'Starting setup'},{id:'lower',name:'Lower first parameter'},{id:'upper',name:'Upper first parameter'}],
 applyScenario(id,s){Object.assign(s,defaults(),{scenarioId:id});if(id==='lower')s[meta.inputs[0].key]=meta.inputs[0].min;if(id==='upper')s[meta.inputs[0].key]=meta.inputs[0].max;},
 controls(){return meta.inputs.map(i=>slider(`physics-${i.key}`,i.label,i.default,i.min,i.max,i.step)).join('')+`<p class="tiny">${meta.limits}</p>`;},
 bind(api){for(const i of meta.inputs)bindSlider(`physics-${i.key}`,(s,v)=>s[i.key]=v,api);},
 syncControls(s){for(const i of meta.inputs){const e=document.getElementById(`physics-${i.key}`);if(e&&document.activeElement!==e)e.value=s[i.key];}},
 compute:s=>M[meta.model](s),
 predictions:predictions[meta.id].map(([key,value,watch,expect,why],i)=>({id:`${meta.id}-${i}`,scenario:'base',ask:`Change ${meta.inputs.find(i=>i.key===key).label} to ${value}, holding the other inputs fixed. What happens to ${meta.outputs.find(o=>o.key===watch).label.toLowerCase()}?`,apply(s){s[key]=value;},watch:[{id:watch,label:meta.outputs.find(o=>o.key===watch).label,get:c=>c[watch]}],mode:'dir',expect:{[watch]:expect},why})),
 draw(canvas,s,c){const B=begin(canvas),figures=plotData(meta,s,c),wide=B.free.x1-B.free.x0>560,high=B.free.y1-B.free.y0>340;const boxes=figures.length>1&&(wide||high)?split(B.free):[B.free];
  for(let i=0;i<boxes.length;i++){const v=figures[i],P=plotIn(B,boxes[i],{lo:v.xlo,hi:v.xhi},{lo:v.ylo,hi:v.yhi});axes(P,{xLabel:v.x,yLabel:v.y});if(v.barrier)poly(P,[[v.barrier[0],v.ylo],[v.barrier[1],v.ylo],[v.barrier[1],v.yhi],[v.barrier[0],v.yhi]],{fill:alpha(C.gold,.14),stroke:alpha(C.gold,.5),width:1});if(v.vertical&&v.vertical>v.xlo&&v.vertical<v.xhi)line(P,[[v.vertical,v.ylo],[v.vertical,v.yhi]],{color:C.gold,dash:[4,4]});
   if(v.levels)for(const [x,y]of v.points){line(P,[[x-.3,y],[x+.3,y]],{color:C.teal,width:2});label(P,`n=${x}`,[x,y],{dy:-11});}else if(v.discrete)for(const [x,y]of v.points)line(P,[[x,0],[x,y]],{color:C.teal,width:2});else line(P,v.points,{color:C.teal,width:2});
   dot(P,...v.cursor,{color:C.yellow,r:5,ring:C.text});if(v.second)dot(P,...v.second,{color:C.pink,r:5});
  }
 },
 law:()=>[meta.eq],
 liveRows:(s,c)=>meta.outputs.map(o=>kv(o.label,`${f(c[o.key])}${o.unit?' '+o.unit:''}`)).join('')+(meta.id==='photoelectric'?kv('Photoemission',c.emits?'ideal emission':'no photoemission'):'')+kv('Independent check, relative error',c.gap.toExponential(2)),
 readout:(s,c)=>cells(meta.outputs.slice(0,4).map(o=>[o.label,`${f(c[o.key])}${o.unit?' '+o.unit:''}`])),
 coach:()=>({title:'Interpret the model',body:meta.limits})
 });
}
export const LABS=Object.fromEntries(LESSONS.map(s=>[s.id,makeLab(s)]));
