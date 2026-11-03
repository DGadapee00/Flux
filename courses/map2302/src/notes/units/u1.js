export default {
 exam:'u1',title:'First-order equations',chapters:'1',file:'u1-first-order.html',
 load:()=>import('../content/u1-first-order.html?raw').then(m=>m.default),
 sections:[
 {id:'s1',n:1,title:'What a solution means',lab:'slope-field',ch:['1'],topics:['integral-solutions'],home:true},
 {id:'s2',n:2,title:'Separation without losing branches',lab:'slope-field',ch:['1'],topics:['separation'],problems:['u1.finite-growth','u1.blowup','u1.separate','u1.equilibrium-lost']},
 {id:'s3',n:3,title:'Fields, existence and uniqueness',lab:'slope-field',ch:['1'],topics:['slope-field']},
 {id:'s4',n:4,title:'Euler steps and their limits',lab:'euler',ch:['1'],topics:['euler']},
 {id:'s5',n:5,title:'The integrating factor',lab:'slope-field',ch:['1'],topics:['integrating-factor']},
 {id:'s6',n:6,title:'Complex arithmetic and exponentials',lab:'first-order-response',ch:['1'],topics:['complex-response'],problems:['u1.complex-power']},
 {id:'s7',n:7,title:'Sinusoids, gain and phase',lab:'first-order-response',ch:['1'],topics:['complex-response'],problems:['u1.sinusoid','u1.gain','u1.phase-transient']},
 {id:'s8',n:8,title:'Autonomous equations and stability',lab:'phase-line',ch:['1'],topics:['phase-line']},
 {id:'s9',n:9,title:'A cooling coffee server',lab:'coffee',ch:['1'],topics:['separation'],problems:['u1.cooling-temperature','u1.cooling-time','u1.cooling-fit','u1.cooling-model']},
 {id:'s10',n:10,title:'Linear versus nonlinear',lab:'slope-field',ch:['1'],topics:['integrating-factor'],problems:['u1.linear-superposition','u1.classify']},
 {id:'s11',n:11,title:'Formula sheet',lab:null,ch:[]},
 ],
};
