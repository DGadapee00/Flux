import * as M from '@flux/subjects/physics/foundations.js';
import { LESSONS } from '../data/lessons.js';
import { problem,num,range } from './kit.js';
import { CHAPTER_TITLES } from '../data/catalog.js';
export { CHAPTER_TITLES };
export const CHAPTER_ORDER=LESSONS.map(s=>s.chapter);
const varsFor=s=>Object.fromEntries(s.inputs.map(i=>[i.key,range(i.min,i.max,i.step)]));
const setupText=(s,$)=>s.inputs.map(i=>`${i.label}: ${$[i.key]}`).join('; ');
const concepts={
 relativity:['Which clock measures proper time for two ticks of the moving clock?',['The clock present at both tick events.','Whichever clock assigns the larger time interval.','Every clock measures the same interval.'],0,'Proper time belongs to the worldline connecting the two events at one spatial location in its own rest frame.'],
 photoelectric:['At a fixed wavelength in the ideal single-photon model, what does greater intensity change?',['The work function of the surface.','The photon arrival rate, not the energy per photon.','The electron rest mass.'],1,'Intensity and photon energy are separate controls. Energy per photon is hf.'],
 'matter-wave':['If nonrelativistic electron kinetic energy is multiplied by four, what happens to wavelength?',['It doubles.','It is divided by four.','It is halved.'],2,'Momentum grows as the square root of kinetic energy, and wavelength is h/p.'],
 hydrogen:['What does the energy of an emitted spectral photon equal?',['The difference between initial and final atomic energies.','The signed energy of the final bound state.','The radius of the historical electron orbit.'],0,'Conservation of energy ties the photon to a positive energy difference.'],
 packet:['What happens to this packet’s position density when only its central wave number changes?',['Its normalization becomes zero.','It stays unchanged while its phase and mean momentum change.','Its width must double.'],1,'The phase factor has unit magnitude, so it does not change the squared envelope.'],
 well:['What does an energy-state label n = 1 imply in an infinite well?',['Zero kinetic energy.','One interior node.','A nonzero ground-state energy and no interior nodes.'],2,'The zero function cannot be normalized. The ground state fits one half-wave between the boundaries.'],
 tunnel:['What is required at each finite rectangular-barrier boundary for the same constant mass?',['Continuity of ψ and its first derivative.','Zero ψ everywhere inside the barrier.','A temporary increase in the incident energy.'],0,'The stationary Schrödinger boundary problem fixes the amplitudes without energy borrowing.'],
 spin:['A spin-half state has zero mean component along the analyzer axis. What can an individual ideal measurement return?',['Only zero.','Plus or minus ħ/2.','Any continuous value between the two limits.'],1,'An expectation value is a probability-weighted average, not necessarily one observed outcome.'],
 binding:['Which distinguishes total binding energy from energy per nucleon?',['They are always the same value.','Total energy is divided by the proton number.','Energy per nucleon is total binding energy divided by mass number A.'],2,'A counts all nucleons, not only protons.'],
 decay:['What fraction is expected to remain after three half-lives?',['One eighth.','One third.','Zero.'],0,'Each half-life halves the remaining expected population.'],
 attenuation:['What does the ideal narrow-beam transmission fraction describe?',['A complete dose assessment.','The fraction remaining in the uncollided monoenergetic beam.','The universal behavior of every radiation energy in that material.'],1,'Scattering, secondary radiation, energy dependence and geometry must be considered separately.'],
 counting:['For independent gross and equal-time background counts, which variance estimate belongs to the net count?',['Gross minus background.','Zero after background subtraction.','Gross plus background.'],2,'Independent variances add even when the measured values are subtracted.']
};
export const PROBLEMS=LESSONS.flatMap(s=>{
 const numeric=s.outputs.slice(0,3).map((o,i)=>problem({id:`${s.exam}.${i+1}.${o.key.toLowerCase()}`,exam:s.exam,ch:s.chapter,lab:s.id,title:o.label,src:'Flux, original exercise for this lab',topics:[s.concept],principles:['model-and-units'],vars:varsFor(s),valid:$=>s.id!=='photoelectric'||M.photoelectric($).emits,
 text:(_, $)=>`${setupText(s,$)}. Calculate ${o.label.toLowerCase()}${o.unit?' in '+o.unit:''}. Use the model and assumptions from this unit. Enter a number in the indicated unit; scientific notation is accepted.`,
 parts:[num('value',$=>M[s.model]($)[o.key],o.unit,{tol:.02,abs:['dp','momentum','meanMomentum','massKg','transmission'].includes(o.key)?1e-40:1e-12})],
 hints:[s.method[0],s.method[1]],steps:$=>[s.method.join(' '),`${o.label} = ${Number(M[s.model]($)[o.key].toPrecision(5))} ${o.unit}. ${s.limits}`],
 sim:{scenario:'base',setup(state,$){Object.assign(state,$);},read:c=>({value:c[o.key]})}}));
 const [question,options,correct,why]=concepts[s.id];
 const conceptual=problem({id:`${s.exam}.concept`,exam:s.exam,ch:s.chapter,lab:s.id,title:'Interpret the model',kind:'conceptual',src:'Flux, original conceptual exercise',topics:[s.concept],principles:['model-and-units'],vars:{},text:()=>question,
 parts:[{id:'choice',kind:'choice',label:'Choose the supported statement',options:options.map((label,i)=>({value:String(i),label,why:i===correct?why:'Revisit the model assumptions and distinguish the quantity asked for.'})),correct:()=>String(correct),multi:false}],hints:[s.idea],steps:()=>[why]});
 return [...numeric,conceptual];
});
export const problemById=id=>PROBLEMS.find(p=>p.id===id)||null;
export const problemsForExam=id=>PROBLEMS.filter(p=>p.exam===id);
export const problemsForLab=id=>PROBLEMS.filter(p=>p.lab===id);
