export default {exam:'u3',title:'Fourier series and Laplace transforms',chapters:'3',file:'u3-fourier-laplace.html',load:()=>import('../content/u3-fourier-laplace.html?raw').then(m=>m.default),sections:[
{id:'s1',n:1,title:'Fourier coefficients',lab:'fourier',ch:['3'],topics:['fourier'],home:true,problems:['u3.coefficient','u3.mean','u3.period','u3.parity']},
{id:'s2',n:2,title:'Convergence and operations',lab:'fourier',ch:['3'],topics:['fourier-operations'],problems:['u3.jump-value','u3.gibbs','u3.series-operation']},
{id:'s3',n:3,title:'Periodic forcing and resonance',lab:'fourier',ch:['3'],topics:['fourier-operations'],problems:['u3.periodic-resonance']},
{id:'s4',n:4,title:'Steps, impulses and derivatives',lab:'laplace',ch:['3'],topics:['causal-inputs'],problems:['u3.delta-weight','u3.step-vs-impulse']},
{id:'s5',n:5,title:'Step and impulse responses',lab:'laplace',ch:['3'],topics:['causal-inputs'],problems:['u3.impulse-response','u3.step-response']},
{id:'s6',n:6,title:'Convolution',lab:'convolution',ch:['3'],topics:['convolution'],problems:['u3.rc-history','u3.sin-convolution','u3.integration-convolution','u3.convolution-unit']},
{id:'s7',n:7,title:'The Laplace transform',lab:'convolution',ch:['3'],topics:['laplace-basics'],problems:['u3.transform','u3.delay-transform']},
{id:'s8',n:8,title:'Partial fractions and inverse transforms',lab:'laplace',ch:['3'],topics:['laplace-inverse'],problems:['u3.inverse-poles','u3.residue']},
{id:'s9',n:9,title:'Initial-value problems',lab:'laplace',ch:['3'],topics:['laplace-ivp'],problems:['u3.first-ivp','u3.initial-pulse']},
{id:'s10',n:10,title:'Transfer functions and poles',lab:'laplace',ch:['3'],topics:['transfer'],problems:['u3.transfer','u3.transfer-state','u3.poles']},
{id:'s11',n:11,title:'A radio-clock tuner',lab:'radio-tuner',ch:['3'],topics:['transfer'],problems:['u3.radio-tuning']},
{id:'s12',n:12,title:'Formula sheet',lab:null,ch:[]},]};
