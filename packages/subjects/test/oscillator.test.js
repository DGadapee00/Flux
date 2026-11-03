import test from 'node:test';import assert from 'node:assert/strict';
import { integrate } from '../src/math/ode.js';import { freeOscillator,forcedOscillator,bumpOscillator,exponentialOscillator } from '../src/math/oscillator.js';
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=1e-12+tol*Math.abs(b),`${a} vs ${b}`);
test('all damping regimes and near-critical limits agree with independent RK4',()=>{
 for(const c of [0,1,4*(1-1e-8),4,4*(1+1e-8),8])for(const t of [.1,1,3]){const r=freeOscillator(1,c,4,.5,1,t),n=integrate((t,[x,v])=>[v,-c*v-4*x],0,[.5,1],t,2048).end;near(r.x,n[0]);near(r.v,n[1]);}
 const stiff=freeOscillator(1,1e6,4,1,0,10);assert.ok(Number.isFinite(stiff.x));assert.ok(stiff.x>0&&stiff.x<1);
});
test('sinusoidal and undamped resonant responses satisfy both initial conditions',()=>{
 for(const c of [0,1,4])for(const w of [0,1,2,3]){const r=forcedOscillator(1,c,4,2,1,w,.2,-.1,3),n=integrate((t,[x,v])=>[v,2*Math.cos(w*t)+Math.sin(w*t)-c*v-4*x],0,[.2,-.1],3,2048).end;near(r.x,n[0]);near(r.v,n[1]);}
});
test('a smooth road bump gives matching analytic and time-domain base excitation',()=>{
 for(const c of [500,2000,5000]){const r=bumpOscillator(300,c,50000,.05,.4,0,0,1),n=integrate((t,[x,v])=>{const road=t<.4?.05*Math.sin(Math.PI*t/.4)**2:0,rv=t<.4?.05*Math.PI/.4*Math.sin(2*Math.PI*t/.4):0;return [v,(50000*(road-x)+c*(rv-v))/300];},0,[0,0],1,8192).end;near(r.x,n[0],1e-6);near(r.v,n[1],1e-6);}
});
test('the exponential formula covers ordinary, simple-root and repeated-root inputs',()=>{
 for(const [c,k,r] of [[3,2,1],[3,2,-1],[2,1,-1]]){const a=exponentialOscillator(1,c,k,2,r,0,0,2),n=integrate((t,[x,v])=>[v,2*Math.exp(r*t)-c*v-k*x],0,[0,0],2,2048).end;near(a.x,n[0]);near(a.v,n[1]);}
});
test('doubling all mechanical coefficients and force preserves the trajectory',()=>{
 const a=forcedOscillator(2,1,8,3,0,1,0,0,2),b=forcedOscillator(4,2,16,6,0,1,0,0,2);near(a.x,b.x);near(a.v,b.v);
});
test('quadratic particular solution satisfies a separately integrated forced equation',async()=>{
 const {quadraticParticular}=await import('../src/math/oscillator.js');
 for(const k of [-1,3]){const start=quadraticParticular(2,1,k,1,2,3,0),r=quadraticParticular(2,1,k,1,2,3,1),n=integrate((t,[x,v])=>[v,(t*t+2*t+3-v-k*x)/2],0,[start.x,start.v],1,2048).end;near(r.x,n[0]);near(r.v,n[1]);}
});
test('growing complex modes remain valid mathematical solutions',()=>{
 const r=freeOscillator(1,-6,13,0,10,.2);near(r.x,5*Math.exp(.6)*Math.sin(.4));
});

test('Lebl section 2.6 Example 2.6.1 beat response reproduces the printed formula',()=>{
 const t=1,r=forcedOscillator(.5,0,8,10,0,Math.PI,0,0,t);near(r.x,20/(16-Math.PI**2)*(Math.cos(Math.PI*t)-Math.cos(4*t)));
});
