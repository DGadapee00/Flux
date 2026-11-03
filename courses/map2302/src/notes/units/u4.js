export default {exam:'u4',title:'First-order systems',chapters:'4',file:'u4-systems.html',load:()=>import('../content/u4-systems.html?raw').then(m=>m.default),sections:[
{id:'s1',n:1,title:'From an equation to a state',lab:'phase-portrait',ch:['4'],topics:['systems'],home:true,problems:['u4.companion']},
{id:'s2',n:2,title:'Eigenvalues and eigenvectors',lab:'phase-portrait',ch:['4'],topics:['eigenvalues'],problems:['u4.roots','u4.eigenline']},
{id:'s3',n:3,title:'Coupled normal modes',lab:'normal-modes',ch:['4'],topics:['normal-modes'],problems:['u4.mode-weights','u4.mode-frequencies','u4.coupled-state','u4.mode-mixture']},
{id:'s4',n:4,title:'Phase portraits',lab:'phase-portrait',ch:['4'],topics:['portraits'],problems:['u4.trace-det','u4.zero-roots','u4.repeated-basis']},
{id:'s5',n:5,title:'Matrix exponentials',lab:'phase-portrait',ch:['4'],topics:['matrix-exponential','repeated'],problems:['u4.matrix-ivp','u4.jordan','u4.exponential-entry','u4.fundamental']},
{id:'s6',n:6,title:'Equilibria and nonlinear models',lab:'linearize',ch:['4'],topics:['nonlinear'],problems:['u4.prey-equilibrium']},
{id:'s7',n:7,title:'Linearization',lab:'linearize',ch:['4'],topics:['linearization'],problems:['u4.jacobian','u4.saddle-rate','u4.hyperbolic']},
{id:'s8',n:8,title:'What a linear centre cannot decide',lab:'linearize',ch:['4'],topics:['linearization'],problems:['u4.cubic-radius']},
{id:'s9',n:9,title:'Limit cycles',lab:'limit-cycle',ch:['4'],topics:['limit-cycles'],problems:['u4.cycle-radius','u4.cycle-vs-centre']},
{id:'s10',n:10,title:'Chaos and the scope of a portrait',lab:'clock-pendulum',ch:['4'],topics:['chaos'],problems:['u4.chaos-scope']},
{id:'s11',n:11,title:'A pendulum clock',lab:'clock-pendulum',ch:['4'],topics:['pendulum'],problems:['u4.clock-length','u4.pendulum-period','u4.clock-model']},
{id:'s12',n:12,title:'Formula sheet',lab:null,ch:[]},]};
