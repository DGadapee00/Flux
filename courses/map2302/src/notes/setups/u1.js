export default {
 s1:[{tag:'An integral is an exact solution',lab:'slope-field',scenario:'gaussian',setup(s){s.probe={x:0,y:1,z:0};s.t=1;},read:c=>({y:[c.y,1.746824132812427]})}],
 s2:[
 {tag:'Finite cumulative growth',lab:'slope-field',scenario:'finite-growth',setup(s){Object.assign(s,{a:2,b:4,t:2,probe:{x:0,y:2,z:0}});},read:c=>({y:[c.y,5.43656365691809]})},
 {tag:'A negative branch',lab:'slope-field',scenario:'separate',setup(s){s.probe={x:0,y:-2,z:0};s.a=1;s.t=1;},read:c=>({y:[c.y,-3.2974425414002564]})},
 {tag:'The interval is part of the answer',lab:'slope-field',scenario:'blowup',setup(s){s.probe={x:0,y:2,z:0};s.t=.25;},read:c=>({y:[c.y,4]})},
 ],
 s3:[{tag:'Waiting at zero',lab:'slope-field',scenario:'nonunique',setup(s){s.wait=0;s.t=1;},read:c=>({zero:[c.y,0],departed:[c.departed,1]})}],
 s4:[{tag:'Resolving decay',lab:'euler',scenario:'decay',setup(s){Object.assign(s,{a:-1,y0:1,t:2,n:20});},read:c=>({euler:[c.euler,.12157665459056928],exact:[c.exact,.1353352832366127]})}],
 s5:[
 {tag:'A ramp has a lag',lab:'slope-field',scenario:'affine',setup(s){Object.assign(s,{a:2,b:1,t:1,probe:{x:0,y:1,z:0}});},read:c=>({y:[c.y,.4191691040457659]})},
 {tag:'A variable coefficient',lab:'slope-field',scenario:'variable',setup(s){s.probe={x:0,y:-1,z:0};s.t=1;},read:c=>({y:[c.y,.26424111765711533]})},
 {tag:'Concentration follows current volume',lab:'slope-field',scenario:'mixing',setup(s){s.probe={x:0,y:15,z:0};s.t=10;s.mix={V0:60,qin:4,qout:2,ci:.2};},read:c=>({mass:[c.y,18.25]})},
 ],
 s6:[{tag:'A reciprocal phasor',lab:'first-order-response',scenario:'slow',setup(s){Object.assign(s,{a:1,A:1,w:1,y0:0,t:8});},read:c=>({gain:[c.gain,.7071067811865475],lag:[c.phase,.7853981633974483]})}],
 s7:[{tag:'Gain and transient are different',lab:'first-order-response',scenario:'slow',setup(s){Object.assign(s,{a:1,A:2,w:1,y0:0,t:2});},read:c=>({amplitude:[c.amp,1.414213562373095],total:[c.y,.3578153070419266]})}],
 s8:[{tag:'Two equilibria can disappear',lab:'phase-line',scenario:'harvest',setup(s){Object.assign(s,{r:1,K:10,H:1,y0:8,t:3});},read:c=>({lower:[c.roots[0],1.127016653792583],upper:[c.roots[1],8.872983346207416],y:[c.y,8.777844058722009]})}],
 s9:[
 {tag:'Half the excess, not half the Celsius value',lab:'coffee',scenario:'room',setup(s){Object.assign(s,{T0:90,Ta:20,Ta2:20,k:.001,t:600,switchAt:300});},read:c=>({T:[c.T,58.41681452658185],half:[c.half,693.1471805599452]})},
 {tag:'A new ambient changes the equilibrium',lab:'coffee',scenario:'switch',setup(s){Object.assign(s,{T0:90,Ta:20,Ta2:10,k:.001,t:900,switchAt:300});},read:c=>({T:[c.T,43.9479925427822]})},
 ],
 s10:[{tag:'Doubling initial data need not double the trajectory',lab:'slope-field',scenario:'blowup',setup(s){s.probe={x:0,y:2,z:0};s.t=.25;},read:c=>({y:[c.y,4]})}],
 s12:[
 {tag:'A potential through the origin',lab:'exact-substitution',scenario:'exact',setup(s){Object.assign(s,{x0:0,y0:1,x:1.5});},read:c=>({y:[c.y,-.21764],level:[c.C,1]})},
 {tag:'A factor of x',lab:'exact-substitution',scenario:'factor',setup(s){Object.assign(s,{x0:1,y0:1,x:2});},read:c=>({y:[c.y,.179449],level:[c.C,1.5]})},
 ],
 s13:[
 {tag:'The ratio y/x',lab:'exact-substitution',scenario:'homogeneous',setup(s){Object.assign(s,{x0:1,y0:1,x:2});},read:c=>({y:[c.y,3.08953]})},
 {tag:'A Bernoulli pole',lab:'exact-substitution',scenario:'bernoulli',setup(s){Object.assign(s,{x0:1,y0:1,x:1.5});},read:c=>({y:[c.y,4/3],pole:[c.pole,2]})},
 ],
 s14:[
 {tag:'Salt passes downstream',lab:'first-order-models',scenario:'tanks',setup(s){Object.assign(s,{q:5,V1:100,V2:50,a0:20,b0:0,t:12});},read:c=>({tank2:[c.y,4.95235],peak:[c.peak,13.8629]})},
 {tag:'A building lags the weather',lab:'first-order-models',scenario:'building',setup(s){Object.assign(s,{K:.2,M0:10,B:8,H:2,T0:15,t:30});},read:c=>({T:[c.y,16.136],swing:[c.swing,4.857],lag:[c.lag,3.51],mean:[c.mean,20]})},
 {tag:'Linear drag from rest',lab:'first-order-models',scenario:'linear',setup(s){Object.assign(s,{m:2,b:.5,v0:0,t:4});},read:c=>({v:[c.y,24.80],x:[c.y2,57.74],vt:[c.vt,39.24]})},
 {tag:'A skydiver near terminal speed',lab:'first-order-models',scenario:'quadratic',setup(s){Object.assign(s,{m:80,c:.25,v0:0,t:6});},read:c=>({v:[c.y,43.8],vt:[c.vt,56.03],x:[c.y2,151]})},
 ],
};
