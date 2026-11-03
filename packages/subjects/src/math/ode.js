/** Fixed-step scalar/vector ODE integration. RK4 matches the Taylor expansion through h^4;
 * its four slopes sample the beginning, two midpoint estimates and the end. Euler uses the
 * tangent at the beginning only. Neither method discovers all branches of a nonunique IVP. */
export function integrate(f,t0,y0,t1,n=256,method='rk4') {
  if(!Number.isInteger(n)||n<1||n>100000||!['rk4','euler'].includes(method))throw new RangeError('Valid step count and method required');
  const vector=Array.isArray(y0), a=vector?[...y0]:[y0];
  if(![t0,t1,...a].every(Number.isFinite))throw new RangeError('Finite initial data required');
  const rhs=(t,v)=>{const r=f(t,vector?v:v[0]);return vector?r:[r];};
  const add=(v,k,h)=>v.map((x,i)=>x+h*k[i]);
  const h=(t1-t0)/n,ts=[t0],ys=[vector?[...a]:a[0]];let y=a;
  for(let i=0;i<n;i++){
    const t=t0+i*h,k1=rhs(t,y);
    if(method==='euler')y=add(y,k1,h);
    else{const k2=rhs(t+h/2,add(y,k1,h/2)),k3=rhs(t+h/2,add(y,k2,h/2)),k4=rhs(t+h,add(y,k3,h));y=y.map((v,j)=>v+h*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6);}
    if(!y.every(Number.isFinite))throw new RangeError('Trajectory left finite arithmetic; restrict the domain or refine the step');
    ts.push(t0+(i+1)*h);ys.push(vector?[...y]:y[0]);
  }
  return {ts,ys,end:ys.at(-1)};
}
/** Integrating factor e^(at): integrate (e^(at)y)'=b t e^(at). */
export function affineResponse(a,b,y0,t,t0=0){
  if(Math.abs(a)<1e-10)return y0+b*(t*t-t0*t0)/2;
  const p=x=>b*(x/a-1/(a*a));return p(t)+(y0-p(t0))*Math.exp(-a*(t-t0));
}
/** Re[A e^(iωt)/(a+iω)] plus the free solution fixing y(0). */
export function firstOrderResponse(a,A,w,y0,t){
  if(a<=0||w<0)throw new RangeError('Positive decay and nonnegative angular frequency required');
  const d=a*a+w*w,gain=1/Math.sqrt(d),phase=Math.atan2(w,a),amp=A*gain;
  const steady=A*(a*Math.cos(w*t)+w*Math.sin(w*t))/d;
  return {y:steady+(y0-A*a/d)*Math.exp(-a*t),steady,amp,gain,phase};
}
/** Conservation of sensible heat with a fitted constant k. Each ambient segment has its own
 * equilibrium; temperature stays continuous when ambient changes. Time is seconds. */
export function cooling(T0,Ta,k,t,Ta2=Ta,switchAt=t){
  if(k<=0||t<0||switchAt<0)throw new RangeError('Positive cooling coefficient and nonnegative times required');
  const tA=Math.min(t,switchAt),mid=Ta+(T0-Ta)*Math.exp(-k*tA);
  const T=t<=switchAt?mid:Ta2+(mid-Ta2)*Math.exp(-k*(t-switchAt));
  return {T,half:Math.LN2/k,rate:-k*(T-(t<switchAt?Ta:Ta2))};
}
/** Logistic equilibrium roots from r y(1-y/K)-H=0. No real roots above maximum production. */
export function harvestEquilibria(r,K,H){
  const critical=r*K/4,d=1-4*H/(r*K);
  return {critical,roots:d<0?[]:[K*(1-Math.sqrt(d))/2,K*(1+Math.sqrt(d))/2]};
}
/** Set z=y−K/2. Then z′=α−βz², α=rK/4−H, β=r/K. Separation gives
 * exponential, rational or tangent branches. Return only the interval before its first pole. */
export function harvestSolution(r,K,H,y0,t){
 const a=r*K/4-H,b=r/K,z0=y0-K/2;let z,limit=Infinity;
 if(Math.abs(a)<1e-12){if(z0<0)limit=-1/(b*z0);t=Math.min(t,.8*limit);z=z0/(1+b*z0*t);}
 else if(a>0){const v=Math.sqrt(a/b);if(Math.abs(z0+v)<1e-12)z=-v;else{const R0=(z0-v)/(z0+v);if(R0>1)limit=Math.log(R0)/(2*b*v);t=Math.min(t,.8*limit);const R=R0*Math.exp(-2*b*v*t);z=v*(1+R)/(1-R);}}
 else{const v=Math.sqrt(-a/b),q=Math.atan(z0/v);limit=(q+Math.PI/2)/(b*v);t=Math.min(t,.8*limit);z=v*Math.tan(q-b*v*t);}
 return {y:z+K/2,t};
}
/** Integrate k0/(a+t)^2: the accumulated logarithmic growth is finite as t→∞. */
export function finiteGrowth(a,k0,y0,t,t0=0){
 if(a+t0<=0||a+t<=0)throw new RangeError('Stay on the interval t>−a');
 return y0*Math.exp(k0*(1/(a+t0)-1/(a+t)));
}
