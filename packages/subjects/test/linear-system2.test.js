import test from 'node:test';import assert from 'node:assert/strict';import { expm2,flow2,portrait2,twoMassModes,radialCycle,nonlinearCentre } from '../src/math/linear-system2.js';import {integrate} from '../src/math/ode.js';
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<1e-11+tol*Math.max(Math.abs(a),Math.abs(b)),`${a} vs ${b}`);
test('matrix exponential covers distinct, complex, repeated, defective and zero eigenvalues',()=>{for(const A of [[-1,0,0,-3],[1,1,-4,1],[-1,1,0,-1],[-1,1e-10,0,-1],[0,1,0,0],[0,-1,1,0]]){const z=[1,2],t=.7,r=flow2(A,z,t),n=integrate((t,[x,y])=>[A[0]*x+A[1]*y,A[2]*x+A[3]*y],0,z,t,2048).end;r.forEach((v,i)=>near(v,n[i]));expm2(A,0).forEach((v,i)=>near(v,[1,0,0,1][i]));const h=1e-5,E=expm2(A,t),p=expm2(A,t+h),m=expm2(A,t-h);for(let j=0;j<2;j++){near((p[j]-m[j])/(2*h),A[0]*E[j]+A[1]*E[2+j]);near((p[2+j]-m[2+j])/(2*h),A[2]*E[j]+A[3]*E[2+j]);}}
 const A=[1,1,-4,1],t=.3;near(expm2(A,t)[1],.5*Math.exp(t)*Math.sin(2*t));
});
test('linearity scales state; trace/determinant do not identify defective eigenvectors',()=>{const A=[-1,1,0,-1],a=flow2(A,[1,2],1),b=flow2(A,[2,4],1);a.forEach((v,i)=>near(2*v,b[i]));assert.equal(portrait2(A).type,'defective sink');assert.equal(portrait2([-1,0,0,-1]).type,'scalar sink');});
test('unequal-mass modal response matches independent RK4 and the printed Lebl case',()=>{for(const [m1,m2,k1,kc,k3] of [[1,1,2,1,2],[2,1,4,2,0]]){const t=1,r=twoMassModes(m1,m2,k1,kc,k3,1,-1,0,6,t),n=integrate((t,[x,y,u,v])=>[u,v,(-(k1+kc)*x+kc*y)/m1,(kc*x-(k3+kc)*y)/m2],0,[1,-1,0,6],t,4096).end;[r.x1,r.x2,r.v1,r.v2].forEach((v,i)=>near(v,n[i]));near(r.energy,twoMassModes(m1,m2,k1,kc,k3,1,-1,0,6,0).energy);}
 const r=twoMassModes(2,1,4,2,0,1,-1,0,6,1);near(r.w1,1);near(r.w2,2);near(r.x1,2*Math.sin(1)+Math.cos(2)-Math.sin(2));near(r.x2,4*Math.sin(1)-Math.cos(2)+Math.sin(2));
});
test('radial normal forms agree with Cartesian integration on both sides of a cycle',()=>{for(const mu of [-1,0,1])for(const r0 of [.3,1.5]){const r=radialCycle(mu,r0,0,2),n=integrate((t,[x,y])=>{const a=mu-x*x-y*y;return [a*x-y,x+a*y];},0,[r0,0],2,4096).end;near(r.x,n[0]);near(r.y,n[1]);}
 for(const a of [-1,0,1]){const r=nonlinearCentre(a,.2,0,2),n=integrate((t,[x,y])=>[-y+a*x*(x*x+y*y),x+a*y*(x*x+y*y)],0,[.2,0],2,4096).end;near(r.x,n[0]);near(r.y,n[1]);}
});
