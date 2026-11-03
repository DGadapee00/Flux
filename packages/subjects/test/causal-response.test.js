import test from 'node:test';import assert from 'node:assert/strict';
import { waveCoefficients,fourierSum,coefficientIntegral,inverseTwoPoles,switchedOscillator,rcPulse,rcConvolution } from '../src/math/causal-response.js';
import { integrate } from '../src/math/ode.js';
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=1e-11+tol*Math.max(Math.abs(a),Math.abs(b)),`${a} vs ${b}`);
test('Fourier coefficients agree with independent integrals and scale with amplitude',()=>{
 for(const kind of ['square','saw','triangle'])for(const n of [1,2,3,7])for(const which of ['a','b']){const c=waveCoefficients(kind,2,n);near(c[which],coefficientIntegral(kind,2,3,n,which));near(waveCoefficients(kind,4,n)[which],2*c[which]);}
 near(fourierSum('saw',Math.PI,Math.PI,100,0),0);near(coefficientIntegral('triangle',1,1,1,'a'),-4/Math.PI**2);
});
test('inverse partial fractions remain finite for coincident and nearby poles',()=>{
 for(const b of [1,1+1e-10,2,4]){const a=1,N0=3,N1=2,t=2,r=inverseTwoPoles(a,b,N0,N1,t),n=integrate((t,[x,v])=>[v,-(a+b)*v-a*b*x],0,[N1,N0-(a+b)*N1],t,2048).end;near(r,n[0]);}
 near(inverseTwoPoles(1,3,1,0,1),.5*(Math.exp(-1)-Math.exp(-3)));
});
test('steps and impulses add to existing motion without resetting its clock',()=>{
 const m=2,c=1,k=4,delay=.7,t=2,F=3;
 for(const kind of ['step','impulse','pulse']){let y=integrate((t,[x,v])=>[v,(-c*v-k*x)/m],0,[.5,1],delay,1024).end;if(kind==='impulse')y[1]+=F/m;
 const stop=kind==='pulse'?delay+.4:t;y=integrate((t,[x,v])=>[v,((kind==='impulse'?0:F)-c*v-k*x)/m],delay,y,stop,1024).end;if(stop<t)y=integrate((t,[x,v])=>[v,(-c*v-k*x)/m],stop,y,t,1024).end;
 const r=switchedOscillator(m,c,k,.5,1,t,delay,F,kind,.4);near(r.x,y[0]);near(r.v,y[1]);}
});
test('RC weighted history agrees with pulse closed form, including after switch off',()=>{
 for(const a of [.5,2,4])for(const t of [.1,.7,1.5,3])near(rcPulse(a,3,t,.5,1),rcConvolution(a,3,t,.5,1));
 near(rcPulse(2,2,1),2*rcPulse(2,1,1));
});
test('a 60 kHz carrier is checked with steps resolving its phase, including a switch off',async()=>{
 const {carrierResponse}=await import('../src/math/causal-response.js');const L=.01,w=2*Math.PI*60000,C=1/(L*w*w),R=L*w/20,V=.001,T=.0004,t=.0007;
 let y=integrate((t,[q,I])=>[I,(V*Math.cos(w*t)-R*I-q/C)/L],0,[0,0],T,8192).end;
 y=integrate((t,[q,I])=>[I,(-R*I-q/C)/L],T,y,t,8192).end;const r=carrierResponse(L,R,C,V,w,t,T);assert.ok(Math.abs(r.q-y[0])<1e-6*V*C);assert.ok(Math.abs(r.I-y[1])<1e-6*V*C*w);
 const fine=integrate((t,[q,I])=>[I,(V*Math.cos(w*t)-R*I-q/C)/L],0,[0,0],T,16384).end,coarse=carrierResponse(L,R,C,V,w,T);assert.ok(Math.abs(coarse.q-fine[0])<1e-6*V*C);assert.ok(Math.abs(coarse.I-fine[1])<1e-6*V*C*w);
});
