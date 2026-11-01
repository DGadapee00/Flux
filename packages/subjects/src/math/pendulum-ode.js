import { integrate } from './ode.js';import { G_STANDARD } from '../convert.js';
// Divide the torque balance by mL². The extra state integrates external work
// per unit mL²; E=.5 omega²+(g/L)(1-cos theta) then has exactly that derivative.
export function pendulumMotion(L,A,beta,drive,w,t,n=2048,g=G_STANDARD){const alpha=g/L,out=integrate((t,[theta,v])=>{const ext=drive*Math.cos(w*t)-2*beta*v;return [v,-alpha*Math.sin(theta)+ext,v*ext];},0,[A,0,0],t,n),[theta,v,work]=out.end,energy=.5*v*v+alpha*(1-Math.cos(theta)),initial=alpha*(1-Math.cos(A));return {theta,v,energy,work,initial,trace:out};}
