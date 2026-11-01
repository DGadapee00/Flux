/** A shifted characteristic polynomial is (r+α)^2−d², with α=c/(2m),
 * d²=α²−k/m. Cos/sin, a repeated-root limit, or cosh/sinh cover all three cases.
 * C(0)=1, S(0)=0, S′=C make both initial conditions explicit. */
export function freeOscillator(m,c,k,x0,v0,t){
 if(!(m>0&&k>0&&[m,c,k,x0,v0,t].every(Number.isFinite)))throw new RangeError('Finite positive mass/stiffness and finite damping required');
 const wn=Math.sqrt(k/m),alpha=c/(2*m),zeta=alpha/wn,d2=alpha*alpha-wn*wn;
 let x,v,regime=d2>1e-10*wn*wn?'overdamped':d2< -1e-10*wn*wn?'underdamped':'critical';
 if(d2>0&&Math.sqrt(d2)*Math.abs(t)>30){const d=Math.sqrt(d2),r2=alpha>=0?-alpha-d:(k/m)/(-alpha+d),r1=alpha>=0?-(k/m)/(alpha+d):-alpha+d,A=(v0-r2*x0)/(r1-r2),B=(r1*x0-v0)/(r1-r2);x=A*Math.exp(r1*t)+B*Math.exp(r2*t);v=r1*A*Math.exp(r1*t)+r2*B*Math.exp(r2*t);}
 else{const d=Math.sqrt(Math.abs(d2)),u=d*t;let C,S;if(Math.abs(u)<1e-5){C=1+d2*t*t/2+d2*d2*t**4/24;S=t+d2*t**3/6+d2*d2*t**5/120;}else if(d2>0){C=Math.cosh(u);S=Math.sinh(u)/d;}else{C=Math.cos(u);S=Math.sin(u)/d;}const e=Math.exp(-alpha*t);x=e*(x0*C+(v0+alpha*x0)*S);v=e*(v0*C-(wn*wn*x0+alpha*v0)*S);}
 return {x,v,wn,alpha,zeta,regime,energy:.5*m*v*v+.5*k*x*x};
}
/** Re[(Fc−i Fs)e^(iωt)/(k−mω²+i cω)] is a particular solution.
 * At an undamped resonant root, take the repeated-exponential limit, giving t sin/cos.
 * Add the free response that restores the prescribed x(0),v(0). */
export function forcedOscillator(m,c,k,Fc,Fs,w,x0,v0,t){
 const d=k-m*w*w,b=c*w,D=d*d+b*b,resonant=c===0&&w>0&&Math.abs(d)<1e-10*Math.max(k,m*w*w);
 let xp,vp,p0,pv0,amplitude,phase;
 if(resonant){const q=2*m*w;xp=(Fc*t*Math.sin(w*t)-Fs*t*Math.cos(w*t))/q;vp=(Fc*(Math.sin(w*t)+w*t*Math.cos(w*t))-Fs*(Math.cos(w*t)-w*t*Math.sin(w*t)))/q;p0=0;pv0=-Fs/q;amplitude=null;phase=0;}
 else{const P=(Fc*d-Fs*b)/D,Q=(Fc*b+Fs*d)/D;xp=P*Math.cos(w*t)+Q*Math.sin(w*t);vp=w*(-P*Math.sin(w*t)+Q*Math.cos(w*t));p0=P;pv0=w*Q;amplitude=Math.hypot(Fc,Fs)/Math.sqrt(D);phase=Math.atan2(b,d);}
 const free=freeOscillator(m,c,k,x0-p0,v0-pv0,t),x=xp+free.x,v=vp+free.v;
 return {...free,x,v,steady:xp,amplitude,phase,resonant,energy:.5*m*v*v+.5*k*x*x,peakFrequency:Math.sqrt(Math.max(0,k/m-c*c/(2*m*m)))};
}
/** Smooth finite road bump r=B sin²(πt/T), 0≤t≤T. The applied body force is k r+c r′.
 * While on the bump this is a constant plus one sinusoid. At its end continue freely. */
export function bumpOscillator(m,c,k,B,T,x0,v0,t){
 if(!(T>0&&t>=0))throw new RangeError('Positive bump duration and nonnegative time required');
 const w=2*Math.PI/T;
 const during=u=>{const a=forcedOscillator(m,c,k,k*B/2,0,0,0,0,u),b=forcedOscillator(m,c,k,-k*B/2,c*B*w/2,w,0,0,u),f=freeOscillator(m,c,k,x0,v0,u);return {x:a.x+b.x+f.x,v:a.v+b.v+f.v};};
 const at=during(Math.min(t,T)),out=t<=T?{...freeOscillator(m,c,k,0,0,0),...at}:freeOscillator(m,c,k,at.x,at.v,t-T);
 const road=t<T?B*Math.sin(Math.PI*t/T)**2:0,roadV=t<T?B*Math.PI/T*Math.sin(2*Math.PI*t/T):0;
 return {...out,road,roadV,force:k*road+c*roadV,energy:.5*m*out.v*out.v+.5*k*(out.x-road)**2};
}
/** Exponential-response formula, with t or t² at a simple or repeated characteristic root. */
export function exponentialOscillator(m,c,k,F,r,x0,v0,t){
 const p=m*r*r+c*r+k,dp=2*m*r+c,scale=Math.max(1,Math.abs(m*r*r),Math.abs(c*r),Math.abs(k));
 const order=Math.abs(p)>1e-10*scale?0:Math.abs(dp)>1e-10*Math.max(1,c,Math.abs(2*m*r))?1:2;
 const coefficient=order===0?F/p:order===1?F/dp:F/(2*m),e=Math.exp(r*t);
 const xp=coefficient*t**order*e,vp=coefficient*e*((order?order*t**(order-1):0)+r*t**order);
 const p0=order?0:coefficient,pv0=order===0?r*coefficient:order===1?coefficient:0;
 const f=freeOscillator(m,c,k,x0-p0,v0-pv0,t);
 const x=f.x+xp,v=f.v+vp;return {...f,x,v,energy:.5*m*v*v+.5*k*x*x,particular:xp,coefficient,order};
}
/** Match descending powers for a quadratic particular solution A t²+B t+C.
 * The triangular coefficient equations work for either sign of a nonzero k. */
export function quadraticParticular(m,c,k,F2,F1,F0,t){
 if(k===0)throw new RangeError('Zero constant coefficient needs a resonant higher-degree trial');
 const A=F2/k,B=(F1-2*c*A)/k,C=(F0-2*m*A-c*B)/k;
 return {A,B,C,x:A*t*t+B*t+C,v:2*A*t+B};
}
