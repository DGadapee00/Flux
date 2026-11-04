export default {
 oscillator:[
 {id:'os-over',scenario:'critical',ask:'Increase c from 4 to 8 for the same release from rest. At t=1 s, is the remaining displacement magnitude smaller?',apply(s){s.c=8;},watch:[{id:'x',label:'remaining displacement magnitude',get:c=>c.x}],mode:'dir',expect:{x:'bigger'},why:'Extra damping creates a slow real mode. For these identical release conditions it leaves more displacement at this time; more damping is not always a faster return.'},
 {id:'os-cross',scenario:'critical',ask:'Give the critically damped mass an initial velocity of −4 m/s, keeping x₀=1 m. Has it crossed equilibrium by t=1 s?',apply(s){s.v0=-4;},watch:[{id:'cross',label:'is x(1)<0?',get:c=>c.x<0}],mode:'bool',expect:{cross:true},why:'For m=1,c=4,k=4, x=(1−2t)e^(−2t). It crosses zero at t=0.5 s. Critical damping does not prohibit crossing for arbitrary initial velocity.'},
 ],
 resonance:[
 {id:'re-peak',scenario:'damped',ask:'Increase damping c from 0.5 to 2. Does the displacement-gain peak stay at the natural frequency 2 rad/s?',apply(s){s.c=2;},watch:[{id:'atNatural',label:'is the peak at ωn?',get:c=>Math.abs(c.peakFrequency-c.wn)<1e-8}],mode:'bool',expect:{atNatural:false},why:'For positive damping the peak shifts to √(k/m−c²/(2m²)); at c=2 this is √2 rad/s, below 2. With still more damping the interior peak disappears.'},
 {id:'re-pure',scenario:'pure',ask:'At exact undamped resonance, does waiting longer produce a finite constant steady amplitude?',apply(s){s.t=6;},watch:[{id:'finite',label:'is there a finite steady amplitude?',get:c=>c.amplitude!==null}],mode:'bool',expect:{finite:false},why:'The resonant particular solution contains t sin(ωn t). Its envelope grows. There is no finite steady sinusoid to report.'},
 ],
 suspension:[
 {id:'su-relative',scenario:'bump',ask:'Double the prescribed bump height from 0.05 to 0.10 m in the linear model. Does body displacement double at the same time?',apply(s){s.B*=2;},watch:[{id:'x',label:'body displacement',get:c=>c.x}],mode:'factor',expect:{x:2},why:'With zero initial data, both k r and c r′ double. Linearity doubles the full transient, not only a steady amplitude. The model still omits bump stops and nonlinear shock force.'},
 {id:'su-ground',scenario:'washboard',ask:'For the periodic road scenario, is body motion guaranteed to remain below the road amplitude?',apply(s){s.w=Math.sqrt(s.k/s.m);},watch:[{id:'small',label:'is the sampled body position below the road amplitude?',get:(c,s)=>Math.abs(c.x)<s.B}],mode:'bool',expect:{small:false},why:'Near the body mode, base excitation can amplify motion. Isolation is frequency dependent. A stiffer spring or weaker damper does not guarantee a smoother ride.'},
 ],
 rlc:[
 {id:'rl-charge',scenario:'ring',ask:'At the initial instant, the capacitor is charged and current is zero. Is its stored electric energy zero?',apply(s){s.t=0;},watch:[{id:'empty',label:'is the stored energy zero?',get:c=>c.energy<1e-14}],mode:'bool',expect:{empty:false},why:'Zero current says q′=0 at that instant. Capacitor energy q²/(2C) is positive when q is nonzero.'},
 {id:'rl-frequency',scenario:'ring',ask:'Increase R from 40 to 100 Ω while L and C stay fixed. What happens to the undamped natural frequency?',apply(s){s.R=100;},watch:[{id:'wn',label:'ωn=1/√(LC)',get:c=>c.wn}],mode:'dir',expect:{wn:'same'},why:'R changes damping and the damped oscillation frequency. The undamped natural frequency depends only on L and C.'},
 ],
 variation:[
  {id:'vp-edge',scenario:'secant',ask:'Move t from 1.2 to 1.5, closer to π/2 where sec t blows up. What happens to y?',apply(s){s.t=1.5;},watch:[{id:'y',label:'y(t)',get:c=>c.y}],mode:'dir',expect:{y:'bigger'},why:'y=cos t ln(cos t)+t sin t. The first term tends to zero and the second to π/2 as t→π/2, so y rises toward about 1.57, even though the forcing is unbounded.'},
  {id:'vp-wronskian',scenario:'repeated',ask:'Move t from 2 to 3. What happens to the Wronskian of eᵗ and teᵗ?',apply(s){s.t=3;},watch:[{id:'W',label:'Wronskian W',get:c=>c.W}],mode:'dir',expect:{W:'bigger'},why:'W=e^(2t) grows. It is never zero, which is why the two functions stay independent and the formulas for u₁′ and u₂′ never divide by zero.'},
 ],
 'cauchy-euler':[
  {id:'ce-case',scenario:'distinct',ask:'Keep a=−2 and raise b from 2 to 2.25. Are the indicial roots still distinct?',apply(s){s.b=2.25;},watch:[{id:'distinct',label:'are the roots distinct and real?',get:c=>c.kind==='distinct'}],mode:'bool',expect:{distinct:false},why:'The indicial equation is r²−3r+b=0 with discriminant 9−4b. At b=2.25 it is zero, so r=1.5 repeats and the second solution is x^1.5 ln x.'},
  {id:'ce-turns',scenario:'complex',ask:'Raise b from 4 to 6 with a=1. What happens to β in x^α cos(β ln x)?',apply(s){s.b=6;},watch:[{id:'beta',label:'β, the imaginary part of the root',get:c=>c.r2}],mode:'dir',expect:{beta:'bigger'},why:'With a=1 the indicial equation is r²+b=0, so r=±i√b. β grows from 2 to about 2.45, and the solution oscillates faster in ln x.'},
 ],
 'higher-order':[
  {id:'ho-wronskian',scenario:'mixed',ask:'Change the initial slope y′(0) from 0 to 1. What happens to the Wronskian of the basis at the end time?',apply(s){s.init[1]=1;},watch:[{id:'W',label:'Wronskian W(t)',get:c=>c.W}],mode:'dir',expect:{W:'same'},why:'The Wronskian belongs to the basis e^(−t), e^(−t)cos 2t, e^(−t)sin 2t, not to one solution. Initial data change the coefficients, not the basis.'},
  {id:'ho-order',scenario:'repeated',ask:'For (D²+1)²y=0, is y(0) and y′(0) enough to fix the solution?',apply(){},watch:[{id:'four',label:'does the order need more than two initial values?',get:c=>c.order>2}],mode:'bool',expect:{four:true},why:'The equation has order four, with basis cos t, sin t, t cos t and t sin t. Four constants need four initial values: y, y′, y″ and y‴.'},
 ],
};
