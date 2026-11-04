const free=(tag,values,read)=>({tag,lab:'oscillator',scenario:'under',setup:s=>Object.assign(s,values),read});
const forced=(tag,values,read)=>({tag,lab:'resonance',scenario:'damped',setup:s=>Object.assign(s,values),read});
export default {
 s1:[free('Two data select two weights',{m:1,c:0,k:4,x0:1,v0:2,t:1},c=>({x:[c.x,.4931505902785393],v:[c.v,-2.650888526745648]}))],
 s2:[
 free('Extra damping can leave more displacement',{m:1,c:8,k:4,x0:1,v0:0,t:1},c=>({x:[c.x,.6303600222780176]})),
 free('Energy need not fall at a constant rate',{m:1,c:1,k:4,x0:1,v0:0,t:1},c=>({energy:[c.energy,.6944318049655565]})),
 ],
 s3:[{tag:'Resonance need not be oscillatory',lab:'resonance',scenario:'exponential',setup(s){Object.assign(s,{m:1,c:2,k:1,F:1,w:-1,t:2,mode:'exponential'});},read:c=>({x:[c.x,.2706705664732254]})}],
 s4:[forced('A periodic response plus a transient',{m:1,c:1,k:4,F:2,w:1,t:2,mode:'sinusoid'},c=>({amplitude:[c.amplitude,.6324555320336759],lag:[c.phase,.3217505543966422],total:[c.x,.15988881980785646]}))],
 s5:[{tag:'The second derivative reaches the constant equation',lab:'resonance',scenario:'polynomial',setup(s){Object.assign(s,{m:1,c:0,k:4,F:2,F1:1,F0:3,t:1,mode:'polynomial'});},read:c=>({x:[c.x,1.25],constant:[c.C,.5]})}],
 s6:[forced('Scale the entire zero-state response',{m:1,c:1,k:4,F:2,w:1,t:2,mode:'sinusoid'},c=>({x:[c.x,.15988881980785646]}))],
 s7:[{tag:'A growing envelope can have a small sampled value',lab:'resonance',scenario:'pure',setup(s){Object.assign(s,{m:1,c:0,k:4,F:1,w:2,t:3,mode:'sinusoid'});},read:c=>({x:[c.x,-.2095616236491944]})}],
 s8:[
 {tag:'A real spring with a chosen body mass',lab:'suspension',scenario:'bump',setup(s){Object.assign(s,{m:300,c:2000,B:.05,duration:.4,t:.8,mode:'bump'});},read:c=>({x:[c.x,.012219022652676919],zeta:[c.zeta,.2518850521508361]})},
 {tag:'Road motion can be amplified',lab:'suspension',scenario:'washboard',setup(s){s.w=Math.sqrt(s.k/s.m);s.t=1;},read:(c,s)=>({gain:[c.amplitude/s.B,2.2226906651726686],x:[c.x,.0391913246661363]})},
 ],
 s9:[{tag:'Charged capacitor, zero initial current',lab:'rlc',scenario:'ring',setup(s){Object.assign(s,{L:.1,R:40,C:1e-5,V:0,q0:5e-5,I0:0,t:.004});},read:c=>({q:[c.q,-.00001922705648599494],I:[c.I,.016086685001990658],energy:[c.energy,.000031423056773445564]})}],
 s11:[
 {tag:'Forcing by sec t',lab:'variation',scenario:'secant',setup(s){Object.assign(s,{y0:0,v0:0,t:1.2});},read:c=>({y:[c.y,.750609]})},
 {tag:'A repeated root and e^t/t',lab:'variation',scenario:'repeated',setup(s){Object.assign(s,{t0:1,y0:0,v0:0,t:2});},read:c=>({y:[c.y,2.85435]})},
 {tag:'An answer left as an integral',lab:'variation',scenario:'general',setup(s){Object.assign(s,{y0:0,v0:0,t:4});},read:c=>({y:[c.y,.03305]})},
 ],
 s12:[
 {tag:'Distinct indicial roots',lab:'cauchy-euler',scenario:'distinct',setup(s){Object.assign(s,{a:-2,b:2,y0:1,v0:0,x:3});},read:c=>({y:[c.y,-3]})},
 {tag:'A repeated indicial root',lab:'cauchy-euler',scenario:'repeated',setup(s){Object.assign(s,{a:-1,b:1,y0:1,v0:0,x:3});},read:c=>({y:[c.y,-.295837]})},
 {tag:'Complex indicial roots',lab:'cauchy-euler',scenario:'complex',setup(s){Object.assign(s,{a:1,b:4,y0:1,v0:0,x:3});},read:c=>({y:[c.y,-.586255]})},
 {tag:'A second solution from e^x',lab:'cauchy-euler',scenario:'reduction',setup(s){Object.assign(s,{x0:1,y0:2,v0:1,x:2.5});},read:c=>({y:[c.y,3.5]})},
 ],
 s13:[
 {tag:'Three real roots',lab:'higher-order',scenario:'distinct',setup(s){s.init=[1,0,0];s.t=3;},read:c=>({y:[c.y,.142048],W0:[c.W0,-2]})},
 {tag:'A real root and a complex pair',lab:'higher-order',scenario:'mixed',setup(s){s.init=[1,0,0];s.t=3;},read:c=>({y:[c.y,.043327],W0:[c.W0,8]})},
 {tag:'A repeated complex pair',lab:'higher-order',scenario:'repeated',setup(s){s.init=[0,1,0,0];s.t=6;},read:c=>({y:[c.y,-3.29963]})},
 ],
 s14:[
 {tag:'A polynomial and an exponential',lab:'higher-order',scenario:'annihilator',setup(s){s.init=[0,0,0];s.t=3;},read:c=>({y:[c.y,9.21864]})},
 {tag:'Third order with sec t',lab:'variation',scenario:'third',setup(s){s.t=1.2;},read:c=>({y:[c.y,.292735]})},
 ],
};
