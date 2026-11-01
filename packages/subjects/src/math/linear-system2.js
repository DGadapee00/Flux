// Cayley-Hamilton: B=A-tr(A)I/2 satisfies B²=disc I. Even/odd series also
// handle the repeated-root limit without dividing by an eigenvalue gap.
export function expm2(A,t){const [a,b,c,d]=A,tau=(a+d)/2,u=(a-d)/2,disc=u*u+b*c,z=disc*t*t;let C,S;if(Math.abs(z)<1e-8){C=1+z/2+z*z/24+z*z*z/720;S=t*(1+z/6+z*z/120+z*z*z/5040);}else if(disc>0){const r=Math.sqrt(disc),ep=Math.exp((tau+r)*t),em=Math.exp((tau-r)*t),cs=(ep+em)/2,ss=(ep-em)/(2*r);return [cs+ss*u,ss*b,ss*c,cs-ss*u];}else{const r=Math.sqrt(-disc);C=Math.cos(r*t);S=Math.sin(r*t)/r;}const e=Math.exp(tau*t);return [e*(C+S*u),e*S*b,e*S*c,e*(C-S*u)];}
export function flow2(A,z,t){const E=expm2(A,t);return [E[0]*z[0]+E[1]*z[1],E[2]*z[0]+E[3]*z[1]];}
export function portrait2(A){const [a,b,c,d]=A,tr=a+d,det=a*d-b*c,disc=tr*tr-4*det,tol=1e-10*Math.max(1,...A.map(Math.abs))**2;let type;if(det< -tol)type='saddle';else if(Math.abs(det)<=tol)type='zero eigenvalue';else if(Math.abs(tr)<=Math.sqrt(tol)&&disc< -tol)type='centre';else if(disc< -tol)type=tr<0?'spiral sink':'spiral source';else if(Math.abs(disc)<=tol)type=Math.abs(b)+Math.abs(c)+Math.abs(a-d)<Math.sqrt(tol)?(tr<0?'scalar sink':'scalar source'):(tr<0?'defective sink':'defective source');else type=tr<0?'node sink':'node source';return {tr,det,disc,type,re:tr/2,im:disc<0?Math.sqrt(-disc)/2:0,lambda1:disc>=0?(tr+Math.sqrt(disc))/2:null,lambda2:disc>=0?(tr-Math.sqrt(disc))/2:null};}
// The radial equation r'=mu*r-r³ becomes a logistic equation for r²; theta'=1.
export function radialCycle(mu,r0,theta0,t){const r=Math.abs(mu)<1e-12?r0/Math.sqrt(1+2*r0*r0*t):r0*Math.exp(mu*t)/Math.sqrt(1+r0*r0*Math.expm1(2*mu*t)/mu),angle=theta0+t;return {r,x:r*Math.cos(angle),y:r*Math.sin(angle)};}
// All these systems have the same linear centre, while r'=a r³ changes stability.
export function nonlinearCentre(a,r0,theta0,t){const den=1-2*a*r0*r0*t;if(den<=0)throw new RangeError('past radial blow-up');const r=r0/Math.sqrt(den),angle=theta0+t;return {r,x:r*Math.cos(angle),y:r*Math.sin(angle)};}
// Mass-weighted coordinates make M^-1 K symmetric. Orthogonal mode projections
// then solve both initial positions and velocities, also for unequal masses.
export function twoMassModes(m1,m2,k1,kc,k3,x10,x20,v10,v20,t){
 const a=(k1+kc)/m1,d=(k3+kc)/m2,b=-kc/Math.sqrt(m1*m2),gap=Math.hypot(a-d,2*b),l1=(a+d-gap)/2,l2=(a+d+gap)/2;
 if(!(l1>0&&m1>0&&m2>0))throw new RangeError('positive masses and restoring stiffness required');
 const angle=.5*Math.atan2(2*b,a-d),v2=[Math.cos(angle),Math.sin(angle)],v1=[-v2[1],v2[0]],q0=[Math.sqrt(m1)*x10,Math.sqrt(m2)*x20],p0=[Math.sqrt(m1)*v10,Math.sqrt(m2)*v20],dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
 const q=[0,0],p=[0,0];for(const [v,l] of [[v1,l1],[v2,l2]]){const w=Math.sqrt(l),A=dot(v,q0),B=dot(v,p0),pos=A*Math.cos(w*t)+B*Math.sin(w*t)/w,vel=-A*w*Math.sin(w*t)+B*Math.cos(w*t);for(let j=0;j<2;j++){q[j]+=v[j]*pos;p[j]+=v[j]*vel;}}
 const x1=q[0]/Math.sqrt(m1),x2=q[1]/Math.sqrt(m2),v1out=p[0]/Math.sqrt(m1),v2out=p[1]/Math.sqrt(m2);
 return {x1,x2,v1:v1out,v2:v2out,w1:Math.sqrt(l1),w2:Math.sqrt(l2),weight1:dot(v1,q0),weight2:dot(v2,q0),energy:.5*m1*v1out*v1out+.5*m2*v2out*v2out+.5*k1*x1*x1+.5*k3*x2*x2+.5*kc*(x1-x2)**2};
}
