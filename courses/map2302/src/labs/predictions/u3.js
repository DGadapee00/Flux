export default {
 fourier:[
 {id:'fo-gibbs',scenario:'square',ask:'Increase the highest harmonic from 9 to 19. Does the positive overshoot near the jump fall below 10% of the wave height?',apply(s){s.N=19;},watch:[{id:'small',label:'is the peak below 1.1 A?',get:(c,s)=>c.peak<1.1*s.A}],mode:'bool',expect:{small:false},why:'The peak approaches about 1.179 A for a −A to A jump. More harmonics narrow the ringing region; they do not remove its limiting height.'},
 {id:'fo-midpoint',scenario:'square',ask:'At the jump t=0, does the partial sum approach the left-hand value −A?',apply(s){s.t=0;s.N=19;},watch:[{id:'left',label:'is the sum equal to −A?',get:(c,s)=>Math.abs(c.sum+s.A)<1e-8}],mode:'bool',expect:{left:false},why:'Every retained sine is zero there. The sum is the midpoint 0, not the left or right value. Changing a function at one point does not change its Fourier coefficients.'},
 ],
 laplace:[
 {id:'la-existing',scenario:'moving',ask:'The input is delayed until t=1 s. Before it arrives, must this already displaced mass stay still?',apply(s){s.t=.5;},watch:[{id:'still',label:'is velocity zero?',get:c=>Math.abs(c.v)<1e-8}],mode:'bool',expect:{still:false},why:'Only the new zero-state input response waits for the delay. The initial displacement has already excited free motion.'},
 {id:'la-jump',scenario:'impulse',ask:'Look immediately after the unit impulse at t=1 s. Does position jump by 1 m?',apply(s){s.t=1;},watch:[{id:'positionJump',label:'is position 1 m?',get:c=>Math.abs(c.x-1)<1e-8},{id:'velocityJump',label:'does velocity jump to 1 m/s?',get:c=>Math.abs(c.v-1)<1e-8}],mode:'bool',expect:{positionJump:false,velocityJump:true},why:'Integrate the equation across the ideal impact. mΔv=J, while position remains continuous. Here m=J=1, so velocity jumps by one.'},
 ],
 convolution:[
 {id:'co-memory',scenario:'pulse',ask:'After the source pulse stops, must capacitor voltage immediately become zero?',apply(s){s.t=2;},watch:[{id:'empty',label:'is the capacitor voltage zero?',get:c=>Math.abs(c.y)<1e-8}],mode:'bool',expect:{empty:false},why:'The input is now zero, but earlier input remains in the weighted-history integral. Stored charge decays with time constant RC.'},
 {id:'co-product',scenario:'pulse',ask:'At t=2 s the source is off. Is output equal to input-now multiplied by impulse-response-now?',apply(s){s.t=2;},watch:[{id:'product',label:'does Vc equal Vin(t)h(t)?',get:c=>Math.abs(c.y-c.input)<1e-8}],mode:'bool',expect:{product:false},why:'Pointwise multiplication would give zero because the input is off. Convolution integrates delayed contributions from the entire earlier pulse.'},
 ],
 'radio-tuner':[
 {id:'ra-tune',scenario:'tuned',ask:'Increase L by 20% while keeping C fixed. Does the tuned natural frequency stay at 60 kHz?',apply(s){s.L*=1.2;},watch:[{id:'same',label:'is f0 still 60 kHz?',get:c=>Math.abs(c.f0-60000)<1e-5}],mode:'bool',expect:{same:false},why:'The tuning frequency varies as 1/√L at fixed C. Increasing L lowers it; keeping the same station requires reducing C accordingly.'},
 {id:'ra-memory',scenario:'tuned',ask:'Halve the chosen resistance. The frequency preference sharpens. Does the transient envelope decay twice as fast?',apply(s){s.R/=2;},watch:[{id:'tau',label:'envelope decay time',get:c=>c.tau}],mode:'factor',expect:{tau:2},why:'The decay rate is R/(2L), so halving R doubles the decay time. A sharper resonance and a faster transient are competing goals.'},
 ],
};
