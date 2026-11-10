/** Original teaching models. SI internally unless a parameter explicitly names a display unit.
 * Constants: rounded CODATA 2022 values, https://physics.nist.gov/cuu/Constants/.
 * Each model carries an independent residual or numerical check in `gap`.
 */
export const C=299792458,H=6.62607015e-34,Q=1.602176634e-19,ME=9.1093837139e-31,HBAR=H/(2*Math.PI),U=1.66053906892e-27;
export const HC_EV_NM=H*C/Q*1e9;
const gap=(a,b)=>Math.abs(a-b)/Math.max(1e-30,Math.abs(a),Math.abs(b));
export function simpson(fn,a,b,n=2048){let s=fn(a)+fn(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*fn(a+(b-a)*i/n);return s*(b-a)/n/3;}
export function rkDecay(rate,time,n=2048){const h=time/n;let y=1;for(let i=0;i<n;i++){const a=-rate*y,b=-rate*(y+h*a/2),c=-rate*(y+h*b/2),d=-rate*(y+h*c);y+=h*(a+2*b+2*c+d)/6;}return y;}
export function relativity({beta=.6,tau=2,length=1}={}){
 if(!(beta>=0&&beta<1&&tau>0&&length>0))throw Error('Use 0 ≤ v/c < 1 and positive proper time and length.');
 const gamma=1/Math.sqrt(1-beta*beta),time=gamma*tau;
 // Solve the moving light-clock triangle for its elapsed time by bisection.
 let lo=tau,hi=100*tau;for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(mid*mid-(beta*mid)**2>tau*tau)hi=mid;else lo=mid;}
 return {gamma,time,contracted:length/gamma,beta,gap:gap(time,(lo+hi)/2)};
}
export function photoelectric({wavelength=300,work=2.4}={}){
 const energy=HC_EV_NM/wavelength,emits=energy>work,kinetic=Math.max(0,energy-work),cutoff=HC_EV_NM/work;
 const frequency=C/(wavelength*1e-9),bySI=(H*frequency-work*Q)/Q;
 return {energy,kinetic,stopping:kinetic,cutoff,emits,frequency,gap:Math.max(gap(energy,H*frequency/Q),gap(kinetic,Math.max(0,bySI)))};
}
export function matterWave({energy=100}={}){
 const momentum=Math.sqrt(2*ME*energy*Q),wavelength=H/momentum*1e9,k=2*Math.PI/(wavelength*1e-9),dx=wavelength*1e-9/4096;
 // Recover kinetic energy from the central-difference curvature of a plane wave.
 const second=(2*Math.cos(k*dx)-2)/(dx*dx),numericEnergy=-HBAR*HBAR/(2*ME)*second/Q;
 return {momentum,wavelength,k:k*1e-9,speed:momentum/ME,numericEnergy,gap:gap(energy,numericEnergy)};
}
export function hydrogen({upper=3,lower=2}={}){
 if(!(Number.isInteger(upper)&&Number.isInteger(lower)&&upper>lower&&lower>=1))throw Error('Choose integer upper > lower ≥ 1.');
 const rydbergEnergy=13.605693122994,photon=rydbergEnergy*(1/lower**2-1/upper**2),wavelength=HC_EV_NM/photon;
 const eps=8.8541878188e-12,a0=eps*H*H/(Math.PI*ME*Q*Q),ke=1/(4*Math.PI*eps);
 const coulomb=n=>-ke*Q/(2*a0*n*n),difference=coulomb(upper)-coulomb(lower);
 return {photon,wavelength,upperEnergy:-rydbergEnergy/upper**2,lowerEnergy:-rydbergEnergy/lower**2,gap:gap(photon,difference)};
}
export function packet({sigma=.5,k=5}={}){
 const density=x=>Math.exp(-x*x/(2*sigma*sigma))/(Math.sqrt(2*Math.PI)*sigma);
 const norm=simpson(density,-8*sigma,8*sigma),variance=simpson(x=>x*x*density(x),-8*sigma,8*sigma);
 // Momentum variance comes independently from the squared envelope derivative integral.
 const derivativeIntegral=simpson(x=>x*x/(4*sigma**4)*density(x),-8*sigma,8*sigma),dk=1/(2*sigma),dp=HBAR*dk*1e9;
 return {sigma,k,dk,dp,meanMomentum:HBAR*k*1e9,norm,variance,uncertainty:sigma*1e-9*dp/HBAR,gap:Math.max(Math.abs(norm-1),gap(variance,sigma*sigma),gap(dk,Math.sqrt(derivativeIntegral)))};
}
export function well({width=1,n=1}={}){
 const L=width*1e-9,energy=n*n*H*H/(8*ME*L*L)/Q,N=2048,dx=L/N;
 const psi=i=>Math.sqrt(2/L)*Math.sin(n*Math.PI*i/N);
 let norm=0,gradient=0;for(let i=0;i<=N;i++){const p=psi(i);norm+=p*p*dx;if(i<N)gradient+=(psi(i+1)-p)**2/dx;}
 const numericEnergy=HBAR*HBAR/(2*ME)*gradient/norm/Q;
 return {energy,nodes:n-1,norm,numericEnergy,gap:Math.max(Math.abs(norm-1),gap(energy,numericEnergy))};
}
const z=(a=0,b=0)=>[a,b],add=(a,b)=>z(a[0]+b[0],a[1]+b[1]),neg=a=>z(-a[0],-a[1]),mul=(a,b)=>z(a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]),div=(a,b)=>{const d=b[0]*b[0]+b[1]*b[1];return z((a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d);},abs2=a=>a[0]*a[0]+a[1]*a[1];
function solveComplex(A,b){const a=A.map((r,i)=>[...r,b[i]]);for(let j=0;j<4;j++){let p=j;for(let i=j+1;i<4;i++)if(abs2(a[i][j])>abs2(a[p][j]))p=i;[a[j],a[p]]=[a[p],a[j]];const pivot=a[j][j];for(let k=j;k<5;k++)a[j][k]=div(a[j][k],pivot);for(let i=0;i<4;i++)if(i!==j){const scale=a[i][j];for(let k=j;k<5;k++)a[i][k]=add(a[i][k],neg(mul(scale,a[j][k])));}}return a.map(r=>r[4]);}
export function tunnel({energy=2,barrier=5,width=.25}={}){
 if(!(energy>0&&barrier>energy&&width>0))throw Error('Use positive energy below the barrier and a positive width.');
 const k=Math.sqrt(2*ME*energy*Q)/HBAR*1e-9,kappa=Math.sqrt(2*ME*(barrier-energy)*Q)/HBAR*1e-9;
 const transmission=1/(1+barrier*barrier*Math.sinh(kappa*width)**2/(4*energy*(barrier-energy)));
 // Independently match ψ and ψ′ at both faces of the rectangular barrier.
 const ep=Math.exp(kappa*width),em=1/ep,phase=z(Math.cos(k*width),Math.sin(k*width)),ik=z(0,k);
 const solution=solveComplex([[z(1),z(-1),z(-1),z()],[neg(ik),z(-kappa),z(kappa),z()],[z(),z(ep),z(em),neg(phase)],[z(),z(kappa*ep),z(-kappa*em),neg(mul(ik,phase))]],[z(-1),neg(ik),z(),z()]);
 const [r,a,b,t]=solution,numericTransmission=abs2(t),reflection=abs2(r);
 return {transmission,reflection,k,kappa,r,a,b,t,numericTransmission,gap:Math.max(gap(transmission,numericTransmission),Math.abs(reflection+numericTransmission-1))};
}
export function tunnelWave(x,c,width){if(x<0)return add(z(Math.cos(c.k*x),Math.sin(c.k*x)),mul(c.r,z(Math.cos(c.k*x),-Math.sin(c.k*x))));if(x<=width)return add(mul(c.a,z(Math.exp(c.kappa*x))),mul(c.b,z(Math.exp(-c.kappa*x))));return mul(c.t,z(Math.cos(c.k*x),Math.sin(c.k*x)));}
export function spin({theta=60,analyzer=0}={}){
 const t=theta*Math.PI/180,a=analyzer*Math.PI/180,plus=Math.cos((t-a)/2)**2,projection=Math.sin(t)*Math.sin(a)+Math.cos(t)*Math.cos(a);
 return {plus,minus:1-plus,projection:2*plus-1,gap:Math.abs(plus-(1+projection)/2)};
}
export function binding({defect=.03,A=4}={}){
 const energy=defect*931.49410372,numericEnergy=defect*U*C*C/Q/1e6;
 return {energy,perNucleon:energy/A,massKg:defect*U,gap:gap(energy,numericEnergy)};
}
export function decay({halfLife=10,time=20,initial=1000}={}){
 const lambda=Math.log(2)/halfLife,fraction=Math.exp(-lambda*time),numericFraction=rkDecay(lambda,time);
 return {lambda,fraction,remaining:initial*fraction,activity:lambda*initial*fraction,numericFraction,gap:gap(fraction,numericFraction)};
}
export function attenuation({mu=.2,depth=5,intensity=1000}={}){
 const fraction=Math.exp(-mu*depth),numericFraction=rkDecay(mu,depth);
 return {fraction,transmitted:intensity*fraction,halfValue:Math.log(2)/mu,numericFraction,gap:gap(fraction,numericFraction)};
}
export function poissonVariance(mean){
 if(mean===0)return 0;const mode=Math.floor(mean);let sum=1,moment=(mode-mean)**2,p=1;
 for(let n=mode+1;n<mean+14*Math.sqrt(mean)+30;n++){p*=mean/n;sum+=p;moment+=(n-mean)**2*p;}
 p=1;for(let n=mode-1;n>=0;n--){p*=(n+1)/mean;sum+=p;moment+=(n-mean)**2*p;}
 return moment/sum;
}
export function counting({gross=120,background=20,time=10}={}){
 const rate=(gross-background)/time,sigma=Math.sqrt(gross+background)/time,numericSigma=Math.sqrt(poissonVariance(gross)+poissonVariance(background))/time;
 return {rate,sigma,numericSigma,relative:rate!==0?sigma/Math.abs(rate):null,gap:gap(sigma,numericSigma)};
}
