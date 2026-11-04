/** UNF supplement for Unit 1: exact equations, substitutions and first-order models.
 * Original questions. Each worked case reproduces a worked example derived by hand in the Unit 1
 * notes; second() recomputes every answer by another route (RK4, a line integral, a balance). */
import { problem,range,choice,kase,num } from '../kit.js';
import { integrate } from '@flux/subjects/math/ode.js';import { simpson } from '@flux/subjects/math/quadrature.js';
import { G } from '@flux/subjects/mechanics/constants.js';
import { exactCubic,factorQuadratic,homogeneousRatio,bernoulliSquare,twoTanks,building,linearDrag,quadraticDrag } from '@flux/subjects/math/ode-methods.js';
import { citation } from '../../data/textbook.js';
const N=sec=>`Flux notes, Unit 1 §${sec} worked example (derived by hand, checked by RK4)`;
const base={exam:'u1',ch:'1'};
const nc=spec=>problem({...base,kind:'numeric',...spec,src:citation(spec.topics[0])});
const cc=spec=>problem({...base,kind:'conceptual',...spec,src:citation(spec.topics[0])});
const part=(id,get,label,traps)=>num(id,get,'',{label,tol:.003,abs:1e-9,traps});
const pick=(id,label,opts,correct)=>({id,kind:'choice',label,multi:false,options:opts.map(([value,label,why])=>({value,label,why})),correct});
const cs=(src,v,want)=>kase(src,v,want,{note:'The case is the notes worked example; its numbers were derived there and checked by RK4.'});
const W=2*Math.PI/24;
const exactY=$=>exactCubic.solve(1,$.y0,$.x);
export default [
 cc({id:'u1.exact-test',title:'Test for exactness before integrating',topics:['exact'],
  vars:{form:choice(['a','(2xy+1)dx+(x²+3y²)dy=0'],['b','(3xy+y²)dx+(x²+xy)dy=0'],['c','y dx+(2x−yeʸ)dy=0'],['d','(y cos x+2x)dx+(sin x+1)dy=0'])},
  text:T=>`Classify ${T.form}.`,
  parts:[pick('kind','classification',[
   ['exact','Exact: M_y=N_x','The cross partials agree, so a potential F with F_x=M and F_y=N exists.'],
   ['mux','Not exact; a factor μ(x) works','(M_y−N_x)/N depends on x alone, so μ=exp∫(M_y−N_x)/N dx.'],
   ['muy','Not exact; a factor μ(y) works','(N_x−M_y)/M depends on y alone, so μ=exp∫(N_x−M_y)/M dy.'],
  ],$=>({a:'exact',b:'mux',c:'muy',d:'exact'})[$.form])],
  hints:['Compute M_y and N_x before anything else.','If they differ, divide their difference by N, then by M, and see which ratio has one variable.'],
  steps:$=>[({a:'M_y=2x and N_x=2x agree.',b:'M_y=3x+2y and N_x=2x+y differ; (M_y−N_x)/N=1/x, so μ=x.',c:'M_y=1 and N_x=2 differ; (N_x−M_y)/M=1/y, so μ=y.',d:'M_y=cos x and N_x=cos x agree.'})[$.form]],
  second:$=>{const h=1e-6,F={a:[(x,y)=>2*x*y+1,(x,y)=>x*x+3*y*y],b:[(x,y)=>3*x*y+y*y,(x,y)=>x*x+x*y],c:[(x,y)=>y,(x,y)=>2*x-y*Math.exp(y)],d:[(x,y)=>y*Math.cos(x)+2*x,(x,y)=>Math.sin(x)+1]}[$.form];
   const [x,y]=[.7,1.3],My=(F[0](x,y+h)-F[0](x,y-h))/(2*h),Nx=(F[1](x+h,y)-F[1](x-h,y))/(2*h);if(Math.abs(My-Nx)<1e-6)return {kind:'exact'};
   // A ratio of one variable gives the same value when the other variable moves.
   const rx=(a,b)=>((F[0](a,b+h)-F[0](a,b-h))-(F[1](a+h,b)-F[1](a-h,b)))/(2*h)/F[1](a,b);return {kind:Math.abs(rx(x,y)-rx(x,y+.4))<1e-5?'mux':'muy'};},
  cases:[cs(N('11'),{form:'b'},{kind:'mux'})]}),
 nc({id:'u1.exact-level',title:'A potential fixes the level and the value',topics:['exact'],lab:'exact-substitution',level:2,
  vars:{y0:range(.5,2,.5),x:range(1.5,2.5,.5),order:choice(['level','Find the level C first, then y'],['value','Find y; report C on the way'])},
  text:(T)=>`Solve (2xy+1)dx+(x²+3y²)dy=0 with y(1)=${T.y0}. ${T.order}. Report C=F(1,${T.y0}) and y(${T.x}).`,
  parts:[part('C',$=>1+$.y0+$.y0**3,'level C',[[ $=>1+$.y0,'Dropped g(y): integrating M in x leaves a function of y to find from N.'],[$=>1+2*$.y0+$.y0**3,'Double counting: ∫M dx and ∫N dy share the x²y term once, not twice.']]),
   part('y',exactY,'y at the end point',[[ $=>(1+$.y0+$.y0**3-$.x)/($.x*$.x),'Missing y³ in F: solve x²y+x+y³=C, not x²y+x=C.'],[$=>$.y0,'The level is constant along the curve; y itself changes.']])],
  hints:['Integrate M=2xy+1 in x and add g(y).','Differentiate in y and match N to find g. Then F(x,y)=C gives a cubic in y with one real root.'],
  steps:($,f)=>[String.raw`$F=x^2y+x+y^3$ and $C=F(1,${f($.y0)})=${f(1+$.y0+$.y0**3)}$.`,`Solve ${f($.x*$.x)}y+${f($.x)}+y³=${f(1+$.y0+$.y0**3)} for its real root: y=${f(exactY($))}.`],
  second:$=>({C:simpson(x=>exactCubic.M(x,0),0,1)+simpson(y=>exactCubic.N(1,y),0,$.y0),y:integrate((x,y)=>-exactCubic.M(x,y)/exactCubic.N(x,y),1,$.y0,$.x,2048).end}),
  sim:{scenario:'exact',setup(s,$){Object.assign(s,{x0:1,y0:$.y0,x:$.x});},read:c=>({C:c.C,y:c.y})},
  cases:[cs(N('11'),{y0:1,x:2,order:'level'},{C:3,y:exactCubic.solve(1,1,2)})]}),
 nc({id:'u1.factor-solve',title:'Multiply by μ, then find the level curve',topics:['exact'],lab:'exact-substitution',level:3,
  vars:{y0:range(.5,1.5,.5),x:range(1.5,2.5,.5),route:choice(['mu','using μ=x'],['test','after testing (M_y−N_x)/N'])},
  text:T=>`The equation (3xy+y²)dx+(x²+xy)dy=0 has y(1)=${T.y0}. Make it exact ${T.route} and find y(${T.x}).`,
  parts:[part('y',$=>factorQuadratic.solve(1,$.y0,$.x),'y at the end point',[[ $=>{const a=$.x,b=1.5*$.x*$.x,c=-(1.5*$.y0+$.y0*$.y0);return (-b+Math.sqrt(b*b-4*a*c))/(2*a);},'No factor: x y²+1.5x²y is not a potential for the original form, since M_y≠N_x.'],[$=>{const C=factorQuadratic.F(1,$.y0);return (-($.x**3)-Math.sqrt($.x**6+2*$.x*$.x*C))/($.x*$.x);},'Wrong branch: the root must pass through the initial point.']])],
  hints:['(M_y−N_x)/N=1/x, so μ=x.','After multiplying, integrate to F=x³y+x²y²/2 and solve the quadratic in y.'],
  steps:($,f)=>[String.raw`With $\mu=x$, $F=x^3y+x^2y^2/2$ and $C=1+${f($.y0)}^2/2\cdot1=${f(factorQuadratic.F(1,$.y0))}$.`,`Quadratic formula, positive branch: y=${f(factorQuadratic.solve(1,$.y0,$.x))}.`],
  second:$=>({y:integrate((x,y)=>-factorQuadratic.M(x,y)/factorQuadratic.N(x,y),1,$.y0,$.x,2048).end}),
  sim:{scenario:'factor',setup(s,$){Object.assign(s,{x0:1,y0:$.y0,x:$.x});},read:c=>({y:c.y})},
  cases:[cs(N('11'),{y0:1,x:2,route:'mu'},{y:.179449})]}),
 nc({id:'u1.homogeneous',title:'Put v=y/x and separate',topics:['substitution'],lab:'exact-substitution',level:2,
  vars:{y0:range(1,2,.5),x:range(1.5,3,.5),ask:choice(['y','y'],['v','the ratio v=y/x'])},
  text:T=>`Solve y′=(x²+y²)/(xy) with y(1)=${T.y0}. Report ${T.ask} at x=${T.x}.`,
  parts:[part('r',$=>{const y=homogeneousRatio.solve(1,$.y0,$.x);return $.ask==='y'?y:y/$.x;},'requested value',[[ $=>{const y=$.x*Math.sqrt((1+$.y0**2)*$.x*$.x-1);return $.ask==='y'?y:y/$.x;},'Missing v term: y=vx gives y′=v+xv′, not xv′.'],[$=>{const v=Math.sqrt($.y0**2+2*Math.log($.x));return $.ask==='y'?v:v*$.x;},$=>$.ask==='y'?'Undo the substitution: y=vx, not v.':'v is y/x; this value is y.']])],
  hints:['Write the right side as v+1/v with v=y/x.','Use y′=v+xv′, separate v dv=dx/x, and apply v(1)=y₀.'],
  steps:($,f)=>[String.raw`$xv'=1/v$, so $v^2=${f($.y0**2)}+2\ln x$.`,`At x=${f($.x)}, v=${f(homogeneousRatio.solve(1,$.y0,$.x)/$.x)} and y=${f(homogeneousRatio.solve(1,$.y0,$.x))}.`],
  second:$=>{const y=integrate(homogeneousRatio.f,1,$.y0,$.x,2048).end;return {r:$.ask==='y'?y:y/$.x};},
  sim:{scenario:'homogeneous',setup(s,$){Object.assign(s,{x0:1,y0:$.y0,x:$.x});},read:(c,s,$)=>({r:$.ask==='y'?c.y:c.v})},
  cases:[cs(N('12'),{y0:1,x:2,ask:'y'},{r:3.08953})]}),
 nc({id:'u1.bernoulli',title:'w=1/y makes a Bernoulli equation linear',topics:['substitution'],lab:'exact-substitution',level:2,
  vars:{y0:range(.5,1.5,.25),x:range(1.2,1.6,.2),ask:choice(['y','the value y(x)'],['pole','the x where the solution blows up'])},
  text:T=>`Solve y′+y/x=xy² with y(1)=${T.y0}. Find ${T.ask}${T.ask==='the value y(x)'?` at x=${T.x}`:''}.`,
  parts:[part('r',$=>$.ask==='y'?bernoulliSquare.solve(1,$.y0,$.x):bernoulliSquare.pole(1,$.y0),'requested value',[[ $=>$.ask==='y'?$.x*(1/$.y0+1-$.x):1/$.y0,$=>$.ask==='y'?'This is w=1/y. Invert it to get y.':'K=1/(x₀y₀)+x₀; the x₀ term is missing.'],[$=>{if($.ask==='y'){const D=1/$.y0+1/3;return $.x/(D-$.x**3/3);}return (1/$.y0+1)/2;},$=>$.ask==='y'?'Sign error: with w=1/y the equation is w′−w/x=−x.':'K/2 is where w peaks, not where it reaches zero.']])],
  valid:$=>$.x<bernoulliSquare.pole(1,$.y0)-.15,
  hints:['Divide by y² and put w=1/y.','Solve w′−w/x=−x with the factor 1/x, then invert.'],
  steps:($,f)=>[String.raw`$(w/x)'=-1$, so $w=x(K-x)$ with $K=${f(bernoulliSquare.pole(1,$.y0))}$.`,`y=1/(x(K−x)); it blows up at x=K.`],
  second:$=>{if($.ask==='y')return {r:integrate(bernoulliSquare.f,1,$.y0,$.x,2048).end};
   // The pole of y is the zero of w=1/y. Integrate w′=w/x−x by RK4 and bisect on its sign.
   const w=x=>integrate((u,w)=>w/u-u,1,1/$.y0,x,1024).end;let lo=1,hi=4;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(w(m)>0)lo=m;else hi=m;}return {r:(lo+hi)/2};},
  sim:{scenario:'bernoulli',setup(s,$){Object.assign(s,{x0:1,y0:$.y0,x:$.x});},read:(c,s,$)=>({r:$.ask==='y'?c.y:c.pole})},
  cases:[cs(N('12'),{y0:1,x:1.4,ask:'pole'},{r:2})]}),
 cc({id:'u1.substitution-kind',title:'Match the equation to its substitution',topics:['substitution'],
  vars:{eq:choice(['h','y′=(y−x)/(y+x)'],['b','y′+y=eˣy³'],['z','y′=(x+y+1)²'],['s','y′=(x+2y−3)/(2x+y−3)'])},
  text:T=>`Which substitution turns ${T.eq} into a solvable equation?`,
  parts:[pick('sub','substitution',[
   ['v','v=y/x','The right side depends on y/x only, so the equation is homogeneous.'],
   ['w','w=y^(1−n)','It has the form y′+Py=Qyⁿ with n≠0,1: a Bernoulli equation.'],
   ['z','z=ax+by','The right side is a function of one linear combination of x and y.'],
   ['shift','shift the origin, then v=y/x','Two linear expressions with constants: move to the point where both vanish.'],
  ],$=>({h:'v',b:'w',z:'z',s:'shift'})[$.eq])],
  hints:['Check whether the right side changes when x and y are both scaled.','Look for a power of y on the right, or a single combination ax+by.'],
  steps:$=>[({h:'Scaling x and y leaves (y−x)/(y+x) unchanged.',b:'n=3, so w=y^(−2) gives a linear equation.',z:'z=x+y+1 gives z′=1+z², which separates.',s:'x+2y−3=0 and 2x+y−3=0 meet at (1,1). Shift there; the constants vanish.'})[$.eq]],
  second:$=>({sub:({h:'v',b:'w',z:'z',s:'shift'})[$.eq]}),
  cases:[cs(N('12'),{eq:'b'},{sub:'w'})]}),
 nc({id:'u1.two-tanks',title:'Salt flows from one tank into the next',topics:['first-order-models'],lab:'first-order-models',level:2,
  vars:{q:range(2,6,1),V1:range(80,120,20),V2:range(40,60,10),a0:range(10,30,10),t:range(5,20,5),ask:choice(['salt','salt in tank 2 (kg) at the given time'],['peak','time (min) when tank 2 holds the most salt'])},
  text:T=>`Tank 1 holds ${T.V1} L with ${T.a0} kg of salt; tank 2 holds ${T.V2} L of fresh water. Fresh water enters tank 1 at ${T.q} L/min, tank 1 drains into tank 2 at that rate, and tank 2 drains at that rate. Find the ${T.ask}${T.ask.startsWith('salt')?` at ${T.t} min`:''}.`,
  parts:[part('r',$=>{const r=twoTanks($.q,$.V1,$.V2,$.a0,0,$.t);return $.ask==='salt'?r.b:r.peak;},'requested value',[[ $=>{const r=twoTanks($.q,$.V1,$.V2,$.a0,0,$.t);return $.ask==='salt'?r.a:1/r.k1;},$=>$.ask==='salt'?'This is tank 1. Tank 2 gains what tank 1 loses.':'1/k₁ is tank 1’s time constant, not the peak of tank 2.'],[$=>{const k1=$.q/$.V1,k2=$.q/$.V2;return $.ask==='salt'?k1*$.a0*$.t*Math.exp(-k1*$.t):Math.log(k2/k1)/(k1-k2);},$=>$.ask==='salt'?'Both tanks have their own rate: k₂=q/V₂, not q/V₁.':'Sign error: t*=ln(k₁/k₂)/(k₁−k₂) is positive.']])],
  hints:['Write a′=−k₁a and b′=k₁a−k₂b with k=q/V.','Solve a first, then use it as the input to b. For the peak, set b′=0.'],
  steps:($,f)=>{const r=twoTanks($.q,$.V1,$.V2,$.a0,0,$.t);return [`k₁=${f(r.k1)}, k₂=${f(r.k2)} per min.`,String.raw`$b=k_1a_0(e^{-k_1t}-e^{-k_2t})/(k_2-k_1)$; peak at $\ln(k_1/k_2)/(k_1-k_2)=${f(r.peak)}$ min.`];},
  second:$=>{if($.ask==='salt')return {r:integrate((t,[a,b])=>[-$.q*a/$.V1,$.q*a/$.V1-$.q*b/$.V2],0,[$.a0,0],$.t,2048).end[1]};
   // The peak is where b′=k₁a−k₂b changes sign; bisect on RK4 values.
   const db=t=>{const [a,b]=integrate((u,[a,b])=>[-$.q*a/$.V1,$.q*a/$.V1-$.q*b/$.V2],0,[$.a0,0],t,1024).end;return $.q*a/$.V1-$.q*b/$.V2;};let lo=0.01,hi=200;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(db(m)>0)lo=m;else hi=m;}return {r:(lo+hi)/2};},
  sim:{scenario:'tanks',setup(s,$){Object.assign(s,{q:$.q,V1:$.V1,V2:$.V2,a0:$.a0,b0:0,t:$.t});},read:(c,s,$)=>({r:$.ask==='salt'?c.y:c.peak})},
  cases:[cs(N('13'),{q:5,V1:100,V2:50,a0:20,t:12,ask:'salt'},{r:4.95235})]}),
 nc({id:'u1.building',title:'A building on a daily temperature cycle',topics:['first-order-models'],lab:'first-order-models',level:2,
  vars:{K:range(.1,.4,.1),M0:range(5,15,5),B:range(4,10,2),H:range(1,3,1),ask:choice(['mean','mean indoor temperature (°C)'],['swing','indoor daily swing amplitude (°C)'],['lag','time lag behind the outdoors (h)'])},
  text:T=>`Outdoors follows M=${T.M0}−${T.B} cos(πt/12) °C, t in hours. The building loses heat at K=${T.K} per hour and a furnace adds ${T.H} °C per hour. Once the start-up transient has died out, find the ${T.ask}.`,
  parts:[part('r',$=>{const r=building($.K,$.M0,$.B,$.H,W,0,0);return $.ask==='mean'?r.mean:$.ask==='swing'?r.swing:r.lag;},'requested value',[[ $=>$.ask==='mean'?$.M0+$.H:$.ask==='swing'?$.B:Math.atan(W/$.K),$=>$.ask==='mean'?'The furnace raises the level by H/K, not H.':$.ask==='swing'?'The walls attenuate the outdoor swing by 1/√(1+(ω/K)²).':'atan(ω/K) is a phase in radians; divide by ω for hours.'],[$=>$.ask==='mean'?$.M0:$.ask==='swing'?$.B/(1+(W/$.K)**2):Math.atan($.K/W)/W,$=>$.ask==='mean'?'The furnace term H is missing.':$.ask==='swing'?'Gain needs a square root: 1/√(1+(ω/K)²).':'The lag angle is atan(ω/K), not atan(K/ω).']])],
  hints:['Write T′=K(M−T)+H, a linear equation with constant coefficient K.','Constant inputs set the mean; the cosine input gives gain 1/√(1+(ω/K)²) and phase atan(ω/K).'],
  steps:($,f)=>{const r=building($.K,$.M0,$.B,$.H,W,0,0);return [`ω=π/12 per hour and ω/K=${f(W/$.K)}.`,`Mean ${f(r.mean)} °C, swing ${f(r.swing)} °C, lag ${f(r.lag)} h.`];},
  second:$=>{// Run RK4 for ten days, then project the last day onto 1, cos ωt and sin ωt.
   const f=(t,T)=>$.K*($.M0-$.B*Math.cos(W*t)-T)+$.H,start=integrate(f,0,$.M0+$.H/$.K,216,8192).end,day=integrate(f,216,start,240,2400);
   let mean=0,P=0,Q=0;for(let i=1;i<day.ts.length;i++){const h=day.ts[i]-day.ts[i-1],g=k=>[day.ys[k],day.ys[k]*Math.cos(W*day.ts[k]),day.ys[k]*Math.sin(W*day.ts[k])];const a=g(i-1),b=g(i);mean+=h*(a[0]+b[0])/48;P+=h*(a[1]+b[1])/24;Q+=h*(a[2]+b[2])/24;}
   // Indoor = mean − A cos(ωt−φ), so P=−A cos φ and Q=−A sin φ; the lag is φ/ω.
   return {r:$.ask==='mean'?mean:$.ask==='swing'?Math.hypot(P,Q):Math.atan2(-Q,-P)/W};},
  sim:{scenario:'building',setup(s,$){Object.assign(s,{K:$.K,M0:$.M0,B:$.B,H:$.H,T0:$.M0,t:30});},read:(c,s,$)=>({r:$.ask==='mean'?c.mean:$.ask==='swing'?c.swing:c.lag})},
  cases:[cs(N('13'),{K:.2,M0:10,B:8,H:2,ask:'swing'},{r:4.857})]}),
 nc({id:'u1.drag',title:'Gravity against drag',topics:['first-order-models'],lab:'first-order-models',level:2,
  vars:{model:choice(['linear','linear drag bv'],['quadratic','quadratic drag cv²']),m:range(2,6,2),k:range(.2,.6,.2),t:range(2,6,2)},
  text:T=>`A ${T.m} kg body falls from rest with ${T.model}, coefficient ${T.k} (kg/s for bv, kg/m for cv²). Use g=9.81 m/s². Find its terminal speed and its speed after ${T.t} s.`,
  parts:[part('vt',$=>$.model==='linear'?$.m*G/$.k:Math.sqrt($.m*G/$.k),'terminal speed (m/s)',[[ $=>$.model==='linear'?$.m*G*$.k:$.m*G/$.k,$=>$.model==='linear'?'Terminal speed balances mg=bv, so v=mg/b.':'Quadratic drag needs a square root: v=√(mg/c).'],[$=>$.model==='linear'?$.k/($.m*G):$.k/($.m*G),'Inverted ratio: drag balances weight at v_t, so v_t grows with m.']]),
   part('v',$=>$.model==='linear'?linearDrag($.m,$.k,G,0,$.t).v:quadraticDrag($.m,$.k,G,0,$.t).v,'speed at the given time (m/s)',[[ $=>G*$.t,'Drag is missing: g t is free fall.'],[$=>$.model==='linear'?$.m*G/$.k*Math.exp(-$.k*$.t/$.m):Math.sqrt($.m*G/$.k)*Math.tanh($.t),$=>$.model==='linear'?'From rest the speed is v_t(1−e^(−bt/m)), which starts at zero.':'The tanh argument is g t/v_t, not t.']])],
  hints:['Set v′=0 to find the terminal speed.','Linear drag: integrating factor. Quadratic drag: separate and use partial fractions, which gives tanh.'],
  steps:($,f)=>[`v_t=${f($.model==='linear'?$.m*G/$.k:Math.sqrt($.m*G/$.k))} m/s.`,`v(${f($.t)})=${f($.model==='linear'?linearDrag($.m,$.k,G,0,$.t).v:quadraticDrag($.m,$.k,G,0,$.t).v)} m/s.`],
  second:$=>{const drag=$.model==='linear'?v=>$.k*v:v=>$.k*v*v,v=integrate((t,v)=>G-drag(v)/$.m,0,0,$.t,2048).end,vt=integrate((t,v)=>G-drag(v)/$.m,0,0,400*$.m/$.k,20000).end;return {vt,v};},
  sim:{scenario:'linear',setup(s,$){Object.assign(s,{model:$.model,m:$.m,b:$.k,c:$.k,v0:0,t:$.t});},read:c=>({vt:c.vt,v:c.y})},
  cases:[cs(N('13'),{model:'linear',m:2,k:.5,t:4},{vt:39.24,v:24.80})]}),
 cc({id:'u1.drag-sign',title:'Quadratic drag must oppose the motion',topics:['first-order-models'],
  vars:{dir:choice(['up','thrown upward, with up positive'],['down','falling, with down positive'])},
  text:T=>`A ball is ${T.dir}. Which equation models quadratic drag for this whole stage of motion?`,
  parts:[pick('eq','model',[
   ['upeq','m v′=−mg−cv|v|','With up positive, gravity is −mg and drag −cv|v| opposes any velocity.'],
   ['downeq','m v′=mg−cv²','With down positive and v>0, drag −cv² opposes the fall.'],
   ['wrong','m v′=−mg+cv²','This drag pushes along the motion when the ball rises, adding energy.'],
  ],$=>$.dir==='up'?'upeq':'downeq')],
  hints:['Pick the positive direction, then write gravity with its sign.','Drag always points against velocity.'],
  steps:$=>[$.dir==='up'?'Rising: v>0, gravity and drag both point down.':'Falling with down positive: gravity +mg, drag −cv².'],
  second:$=>({eq:$.dir==='up'?'upeq':'downeq'}),
  cases:[cs(N('13'),{dir:'down'},{eq:'downeq'})]}),
];
