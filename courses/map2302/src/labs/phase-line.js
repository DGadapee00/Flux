/** Shows that crossing a harvest threshold destroys equilibria, rather than moving a stable point forever.
 * Quadratic roots/signs and a separated Riccati solution are checked by RK4 and the balance residual. */
import { harvestEquilibria,harvestSolution,integrate } from '@flux/subjects/math/ode.js';import { defineLab } from './define.js';
import { slider,bindSlider } from './widgets.js';import { cells,kv } from '../ui/shared.js';import { fig } from '../ui/format.js';import { C,clear,line,dot,label,map,cameraFor,initFigure,enterFigure,exitFigure } from './figure.js';
const scenarios=[{id:'natural',name:'Logistic growth without harvest',r:1,K:10,H:0,y0:2,t:3},{id:'harvest',name:'Two equilibria with moderate harvest',r:1,K:10,H:1,y0:8,t:3},{id:'over',name:'Harvest exceeds maximum production',r:1,K:10,H:3,y0:8,t:3}];
const apply=(id,s)=>Object.assign(s,scenarios.find(x=>x.id===id)||scenarios[0],{scenarioId:id,show:{}});
export default defineLab({id:'phase-line',exam:'u1',title:'Phase line',hint:'Increase the constant harvest. The two equilibrium dots can collide and vanish.',orbit:false,cameraFor,gapLimit:1e-6,scenarios,
 defaultState(){const s={};apply('natural',s);return s;},applyScenario:apply,
 controls:()=>slider('pl-H','harvest H (model units/s)',0,0,3,.1)+slider('pl-y','initial y (model units)',2,1,9,.25),
 bind(api){bindSlider('pl-H',(s,v)=>s.H=v,api);bindSlider('pl-y',(s,v)=>s.y0=v,api);},syncControls(s){document.getElementById('pl-H').value=s.H;document.getElementById('pl-y').value=s.y0;},
 compute(s){const eq=harvestEquilibria(s.r,s.K,s.H),sol=harvestSolution(s.r,s.K,s.H,s.y0,s.t),f=y=>s.r*y*(1-y/s.K)-s.H,numeric=integrate((t,y)=>f(y),0,s.y0,sol.t,512).end;
 return {y:sol.y,t:sol.t,numeric,count:eq.roots.length,roots:eq.roots,critical:eq.critical,initialRate:f(s.y0),gap:Math.max(Math.abs(sol.y-numeric)/Math.max(1,Math.abs(sol.y)),...eq.roots.map(y=>Math.abs(f(y))))};},
 recompute(s,c){Object.assign(c,this.compute(s));},init:initFigure,enter:enterFigure,exit:exitFigure,syncViews(s,c,ctx){ctx.grid.group.visible=false;const g=ctx.handle.group;clear(g);line(g,[[-3,0,0],[3,0,0]],C.ink,false);for(let y=0;y<=10;y+=1){const x=map(y,0,10),dy=s.r*y*(1-y/s.K)-s.H,dir=Math.sign(dy);if(dir){line(g,[[x-.16*dir,0,0],[x+.16*dir,0,0]],C.gold,false);line(g,[[x+.06*dir,.08,0],[x+.16*dir,0,0],[x+.06*dir,-.08,0]],C.gold,false);}}
 for(const y of c.roots)dot(g,map(y,0,10),0,C.blue);dot(g,map(s.y0,0,10),-.8,C.gold,false);label(g,'phase line: y (model units)',0,.65);label(g,'initial value',map(s.y0,0,10),-1.2);label(g,`Hcrit = ${fig(c.critical)} model units/s`,0,1.7);
 const pts=[];for(let i=0;i<=100;i++){const t=c.t*i/100,y=harvestSolution(s.r,s.K,s.H,s.y0,t).y;pts.push([map(t,0,c.t),map(y,-10,10,-2,-.2),0]);}line(g,pts,C.blue);label(g,'trajectory below; time increases right',0,-2.4);},
 law:()=>[String.raw`y'=r y(1-y/K)-H`],liveRows:(s,c)=>kv('initial rate',fig(c.initialRate))+kv('RK4 at checked time',fig(c.numeric)),readout:(s,c)=>cells([['equilibrium roots',String(c.count)],['y(t)',fig(c.y)],['maximum sustainable H',fig(c.critical)]]),
 coach:(s,c)=>({title:c.count?'Arrows determine stability':'No equilibrium remains',body:'Roots of r y(1−y/K)−H mark zero slope. The lower root is unstable and the upper root stable when distinct. They merge at H=rK/4; above it every arrow points downward. A smooth autonomous trajectory cannot cross an equilibrium in finite time. A negative signed trajectory means the constant-harvest population model has been used past depletion, not a negative real population.'}),
});
