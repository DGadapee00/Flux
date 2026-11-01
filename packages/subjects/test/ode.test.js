import test from 'node:test';import assert from 'node:assert/strict';
import { integrate,affineResponse,firstOrderResponse,cooling,harvestEquilibria } from '../src/math/ode.js';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} vs ${b}`);
test('RK4 scalar/vector agree with analytic decay and a rotating vector',()=>{
 near(integrate((t,y)=>-2*y,0,3,2).end,3*Math.exp(-4));
 const v=integrate((t,[x,y])=>[-y,x],0,[1,0],2).end;near(v[0],Math.cos(2));near(v[1],Math.sin(2));
});
test('Euler global error is first order; an excessive step destabilizes a decaying IVP',()=>{
 const err=n=>Math.abs(integrate((t,y)=>-y,0,1,1,n,'euler').end-Math.exp(-1));near(err(100)/err(200),2,0.01);
 assert.ok(Math.abs(integrate((t,y)=>-y,0,1,6,2,'euler').end)>1);
});
test('integrating factor and complex response checked by independent RK4',()=>{
 for(const a of [.5,1,2])for(const t of [.1,1,4]){
 near(affineResponse(a,3,2,t),integrate((x,y)=>3*x-a*y,0,2,t).end);
 near(firstOrderResponse(a,2,.7,3,t).y,integrate((x,y)=>2*Math.cos(.7*x)-a*y,0,3,t).end);
 }
});
test('cooling has exponential half-time and an independently integrated ambient switch',()=>{
 const k=.001;near(cooling(90,20,k,Math.LN2/k).T,55);
 const s=cooling(90,20,k,900,10,300),mid=integrate((t,T)=>-k*(T-20),0,90,300).end;
 near(s.T,integrate((t,T)=>-k*(T-10),300,mid,900).end);near(cooling(160,20,k,400).half,cooling(90,20,k,400).half);
});
test('harvest roots satisfy the balance and coalesce at the production maximum',()=>{
 for(const H of [0,1,2.5])for(const y of harvestEquilibria(1,10,H).roots)near(y*(1-y/10)-H,0);
 assert.equal(harvestEquilibria(1,10,3).roots.length,0);
});
test('harvesting formula covers two, repeated and absent equilibrium cases',async()=>{
 const {harvestSolution}=await import('../src/math/ode.js');
 for(const H of [0,1,2.5,3])for(const y0 of [1,5,9]){const s=harvestSolution(1,10,H,y0,3);near(s.y,integrate((t,y)=>y*(1-y/10)-H,0,y0,s.t,1024).end,1e-7);}
});
test('a decaying positive growth coefficient has finite cumulative growth',async()=>{
 const {finiteGrowth}=await import('../src/math/ode.js');
 for(const t of [1,3,10])near(finiteGrowth(2,4,2,t),integrate((x,y)=>4*y/(2+x)**2,0,2,t,1024).end);
 near(finiteGrowth(2,4,2,1e9),2*Math.exp(2),1e-8);
});
