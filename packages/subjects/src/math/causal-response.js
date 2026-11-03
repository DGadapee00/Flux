import { freeOscillator,forcedOscillator } from './oscillator.js';
import { simpson } from './quadrature.js';
// Orthogonality gives these coefficients on [-L,L]; phase wraps to the midpoint at a jump.
export function waveCoefficients(kind,A,n){
 if(kind==='square')return {a:0,b:n%2?4*A/(Math.PI*n):0};
 if(kind==='saw')return {a:0,b:2*A*(n%2?1:-1)/(Math.PI*n)};
 if(kind==='triangle')return {a:2*A*((n%2?-1:1)-1)/(Math.PI*n)**2,b:0};
 throw new RangeError('wave family');
}
export function periodicWave(kind,A,L,t){const p=((t+L)%(2*L)+2*L)%(2*L)-L;if(kind==='square')return Math.abs(p)<1e-12||Math.abs(Math.abs(p)-L)<1e-12?0:A*Math.sign(p);if(kind==='saw')return Math.abs(Math.abs(p)-L)<1e-12?0:A*p/L;return A*Math.abs(p)/L;}
export function fourierSum(kind,A,L,N,t){let y=kind==='triangle'?A/2:0;for(let n=1;n<=N;n++){const c=waveCoefficients(kind,A,n),w=n*Math.PI/L;y+=c.a*Math.cos(w*t)+c.b*Math.sin(w*t);}return y;}
// Cover-up residues in a numerically stable divided difference, including a repeated pole.
export function inverseTwoPoles(a,b,N0,N1,t){const d=b-a,e=Math.exp(-a*t);if(Math.abs(d*t)<1e-7)return N1*Math.exp(-b*t)+e*(N0-a*N1)*t*(1-d*t/2+d*d*t*t/6);return N1*Math.exp(-b*t)+(N0-a*N1)*e*(-Math.expm1(-d*t))/d;}
// A unit impulse changes velocity by 1/m; a unit step is its time integral.
// Keep the pre-existing homogeneous response on the original clock.
export function switchedOscillator(m,c,k,x0,v0,t,delay,F,kind='step',duration=1){
 const base=freeOscillator(m,c,k,x0,v0,t);let x=base.x,v=base.v;
 const add=(time,sign)=>{if(time<0)return;const r=kind==='impulse'?freeOscillator(m,c,k,0,F/m,time):forcedOscillator(m,c,k,F,0,0,0,0,time);x+=sign*r.x;v+=sign*r.v;};add(t-delay,1);if(kind==='pulse')add(t-delay-duration,-1);return {...base,x,v,energy:.5*m*v*v+.5*k*x*x};
}
export function rcPulse(a,U,t,delay=0,duration=1,kind='pulse'){
 const h=t-delay;if(h<0)return 0;if(kind==='impulse')return U*a*Math.exp(-a*h);
 const on=-U*Math.expm1(-a*h);return kind==='step'||h<=duration?on:-U*Math.expm1(-a*duration)*Math.exp(-a*(h-duration));
}

// Split the jump before quadrature so endpoint sampling never averages the wrong side.
export function coefficientIntegral(kind,A,L,n,which='b'){
 const smooth=(t,side)=>kind==='square'?side*A:kind==='saw'?A*t/L:A*Math.abs(t)/L;
 const trig=t=>which==='a'?Math.cos(n*Math.PI*t/L):Math.sin(n*Math.PI*t/L);
 return (simpson(t=>smooth(t,-1)*trig(t),-L,0,1e-10)+simpson(t=>smooth(t,1)*trig(t),0,L,1e-10))/L;
}
// Quadrature is a second path to the RC pulse response, with the integration interval
// clipped at input switching times. Vin is U on [delay,delay+duration].
export function rcConvolution(a,U,t,delay=0,duration=1){
 const hi=Math.min(t,delay+duration);if(hi<=delay)return 0;
 return simpson(tau=>a*U*Math.exp(-a*(t-tau)),delay,hi,1e-10);
}
// Switch off a real cosine carrier at T by subtracting a phase-matched delayed input.
export function carrierResponse(L,R,C,V,w,t,T=Infinity){
 const a=forcedOscillator(L,R,1/C,V,0,w,0,0,t);
 if(t<T)return {...a,q:a.x,I:a.v};
 const b=forcedOscillator(L,R,1/C,V*Math.cos(w*T),-V*Math.sin(w*T),w,0,0,t-T);
 const q=a.x-b.x,I=a.v-b.v;return {...a,x:q,v:I,q,I,energy:.5*L*I*I+.5*q*q/C};
}
