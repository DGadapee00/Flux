import { domeNumbers, FACTORS, MPA_PER_KSI, WELD } from '@flux/subjects/mechanics/tank-dome.js';
/** Second method: resolve pressure traction around a cylindrical half-shell numerically.
 * Integrate p r cos(theta) from -pi/2 to pi/2, then divide by the two cut edges.
 * Dome meridional and bending stresses need a separate shape-specific analysis. */
export function checkedDome(s){
 const n=domeNumbers(s),r=n.radiusMm,p=n.inputs.pressureKPa/1000,N=1024;
 let sum=0;for(let i=0;i<=N;i++){const th=-Math.PI/2+i*Math.PI/N;sum+=(i===0||i===N?1:i%2?4:2)*p*r*Math.cos(th);}
 const load=sum*Math.PI/N/3/2;
 const t=n.seams.long.landMm;
 const ultimate=load/t*FACTORS.ultimate/(WELD.fsw.ftuKsi*MPA_PER_KSI),yieldRatio=load/t*FACTORS.proof/(WELD.fsw.ftyKsi*MPA_PER_KSI);
 return {...n,gap:Math.max(Math.abs(load-n.seams.long.load)/Math.max(1,load),Math.abs(Math.max(ultimate,yieldRatio)-1)),numericLoad:load,ultimateUtilization:ultimate,proofUtilization:yieldRatio};
}
