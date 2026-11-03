export default {
 'phase-portrait':[
 {id:'ph-repeat',scenario:'scalar',ask:'Add an upper-right entry b=1 while retaining both eigenvalues −1. Does the matrix still have two independent eigenvectors?',apply(s){s.A[1]=1;},watch:[{id:'complete',label:'two independent eigenvectors?',get:c=>c.type==='scalar sink'}],mode:'bool',expect:{complete:false},why:'Trace and determinant stay fixed, but the scalar matrix becomes defective. Its flow includes t exp(−t) and has only one eigenline.'},
 {id:'ph-zero',scenario:'shear',ask:'Both eigenvalues are zero. Does that guarantee every trajectory stays bounded?',apply(s){s.t=3;},watch:[{id:'bounded',label:'does this trajectory remain at x=0?',get:c=>Math.abs(c.x)<1e-8}],mode:'bool',expect:{bounded:false},why:'The nilpotent matrix gives x=t and y=1 for this initial state. Zero eigenvalues alone do not decide boundedness.'},
 ],
 'normal-modes':[
 {id:'nm-mixture',scenario:'mixed',ask:'Release only mass 1 from displacement. Is exactly one modal weight nonzero?',apply(s){s.t=0;},watch:[{id:'single',label:'only one mode excited?',get:c=>Math.abs(c.weight1*c.weight2)<1e-8}],mode:'bool',expect:{single:false},why:'A one-mass displacement is a combination of symmetric and antisymmetric vectors. Both modal weights are nonzero.'},
 {id:'nm-frequency',scenario:'symmetric',ask:'Halve both initial displacements. Does the natural frequency halve too?',apply(s){s.x10/=2;s.x20/=2;},watch:[{id:'w1',label:'first natural frequency',get:c=>c.w1}],mode:'dir',expect:{w1:'same'},why:'Linear mode frequencies depend on mass and stiffness. Initial displacement changes the weights, not the eigenvalues.'},
 ],
 linearize:[
 {id:'li-centre',scenario:'source',ask:'The Jacobian has purely imaginary eigenvalues. Must the nonlinear radius remain constant?',apply(s){s.t=4;},watch:[{id:'constant',label:'is radius unchanged from release?',get:(c,s)=>Math.abs(c.radius-s.r0)<1e-8}],mode:'bool',expect:{constant:false},why:'For this cubic example r′=a r³ with a>0. Radius grows although the linearization is a centre. Nonhyperbolic linearization cannot decide stability.'},
 {id:'li-small',scenario:'potential',ask:'Reduce the initial offset from 0.3 to 0.05. At the same time, does the absolute tangent-model error increase?',apply(s){s.r0=.05;},watch:[{id:'error',label:'absolute model difference',get:c=>c.error}],mode:'dir',expect:{error:'smaller'},why:'The omitted nonlinear term is quadratic. A smaller initial offset improves the local approximation here; it does not prove global accuracy.'},
 ],
 'limit-cycle':[
 {id:'lc-origin',scenario:'inside',ask:'For μ=1, a stable periodic orbit exists. Must the equilibrium inside it also attract?',apply(s){s.t=6;},watch:[{id:'originStable',label:'does the origin attract nearby radii?',get:(c,s)=>s.mu<0}],mode:'bool',expect:{originStable:false},why:'Near zero, r′≈r>0. The origin repels while the finite-radius orbit attracts from both sides.'},
 {id:'lc-centre',scenario:'inside',ask:'Raise initial radius from 0.3 to 1.7. Does the long-term cycle radius change with that initial condition?',apply(s){s.r0=1.7;},watch:[{id:'cycle',label:'attracting cycle radius',get:c=>c.cycle}],mode:'dir',expect:{cycle:'same'},why:'Both trajectories approach √μ. A conservative centre would retain a different orbit for every initial radius.'},
 ],
 'clock-pendulum':[
 {id:'cl-amplitude',scenario:'small',ask:'Increase release angle from 0.1 to 1.2 radians. Does the conservative full period stay exactly 4 seconds?',apply(s){s.A=1.2;},watch:[{id:'same',label:'is the period unchanged?',get:c=>Math.abs(c.period-4)<1e-6}],mode:'bool',expect:{same:false},why:'The nonlinear sin θ force produces an amplitude-dependent period. The exact conservative period exceeds the small-angle reference.'},
 {id:'cl-damping',scenario:'damped',ask:'With damping but no sustaining drive, does the clock retain its initial mechanical energy?',apply(s){s.t=8;},watch:[{id:'constant',label:'is energy unchanged?',get:c=>Math.abs(c.energy-c.initial)<1e-8}],mode:'bool',expect:{constant:false},why:'Energy derivative is −2βω² in this normalization. The pendulum loses energy; a linear centre without damping cannot justify a perpetual clock.'},
 ],
};
