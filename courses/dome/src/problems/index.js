import { domeNumbers } from '@flux/subjects/mechanics/tank-dome.js';
import { problem,num,range } from './kit.js';
import { CHAPTER_TITLES } from '../data/catalog.js';
export {CHAPTER_TITLES};
export const CHAPTER_ORDER=['1','2','3','4'];
const defs=[
 ['lands','u1','load','Barrel seam load','N/mm',n=>n.seams.long.load,'Calculate the pressure-only cylindrical barrel seam line load. Use N = p r, with p in N/mm² and r in mm.'],
 ['lands','u1','girth','Circumferential joint load','N/mm',n=>n.seams.girth.load,'Calculate the pressure-only cylindrical circumferential joint line load, p r / 2.'],
 ['lands','u1','ultimate','Ultimate land check','mm',n=>n.seams.long.ultimateMm,'Using the reference weld ultimate strength 58.7 ksi (1 ksi = 6.894757 MPa), calculate the land thickness for 1.4 times the barrel line load.'],
 ['lands','u1','land','Land governed by both checks','mm',n=>n.seams.long.landMm,'Calculate the larger thickness required by 1.4 times design load against weld ultimate strength 58.7 ksi, and 1.05 times design load against weld yield strength 36.6 ksi. Use 1 ksi = 6.894757 MPa.'],
 ['inspection','u2','eddy','Detectable depth as a share','',n=>n.flaws[0].share,'For this reference table comparison, divide the eddy-current detectable depth 0.51 mm by the pressure-only barrel land thickness. Enter a fraction, not a percentage. This ratio is not an acceptance criterion.'],
 ['inspection','u2','xray','Reference radiographic depth','mm',n=>n.flaws[3].depthMm,'The reference radiographic depth in this teaching comparison is 0.7 times the barrel land thickness. Calculate it. This is a capability comparison, not a flaw acceptance limit.'],
 ['inspection','u2','ultra','Ultrasonic reference share','',n=>n.flaws[2].share,'Divide the reference ultrasonic depth 0.76 mm by the barrel land thickness. Enter a fraction. Only use this table within its stated thickness range.'],
 ['repairs','u3','plug','Friction plug strength retained','',n=>n.repairs[0].roomShare,'Reference wide-panel tests give 57.0 ksi for a friction plug repair and 55.0 ksi for the original stir weld. Calculate the ratio of these warm results. A test average ratio does not approve a repair.'],
 ['repairs','u3','fusion','Fusion repair strength retained','',n=>n.repairs[3].roomShare,'Reference wide-panel tests give 36.8 ksi after a fusion repair and 55.0 ksi for the original stir weld. Calculate retained warm strength as a fraction.'],
 ['repairs','u3','cold','Cold plug repair comparison','',n=>n.repairs[0].coldShare,'Reference cold wide-panel results are 84.9 ksi for the plug repair and 87.6 ksi for the original stir weld. Calculate retained cold strength as a fraction.'],
 ['proof','u4','pressure','Reference proof pressure','kPa',n=>n.proofKPa,'Calculate the reference proof pressure using a factor of 1.05. This is a classroom calculation, not a test operating instruction.'],
 ['proof','u4','stress','Stress at proof','MPa',n=>n.seams.long.stressAtProofMPa,'Calculate the pressure-only barrel seam stress at proof: 1.05 times line load divided by the land thickness governed by both strength checks.'],
 ['proof','u4','design-stress','Stress at design pressure','MPa',n=>n.seams.long.stressAtDesignMPa,'Calculate the pressure-only barrel seam stress at design pressure: line load divided by the land thickness governed by both checks.']
];
export const PROBLEMS=defs.map(([lab,exam,id,title,unit,read,task])=>problem({id:`${exam}.${id}`,title,exam,ch:exam.slice(1),lab,src:'Flux, original problem based on the cited NASA reference model',topics:['dome'],principles:['pressure-model'],vars:{p:range(250,550,25,'kPa'),d:range(4,7,.5,'m')},valid:$=>id!=='ultra'||domeNumbers({pressureKPa:$.p,diameterM:$.d}).flaws[2].applies,text:T=>`Design pressure ${T.p} kPa; diameter ${T.d} m. ${task}`,parts:[num('value',$=>read(domeNumbers({pressureKPa:$.p,diameterM:$.d})),unit)],hints:['Convert pressure to N/mm² and diameter to radius in mm.','Use the weld property and the appropriate load factor. Keep capability separate from acceptance.'],steps:$=>[`${task} The model gives ${Number(read(domeNumbers({pressureKPa:$.p,diameterM:$.d})).toPrecision(4))} ${unit}. State the assumptions before applying it to hardware.`],sim:{scenario:'reference',setup(s,$){s.pressureKPa=$.p;s.diameterM=$.d;},read:c=>({value:read(c)})}}));
export const problemById=id=>PROBLEMS.find(p=>p.id===id)||null;
export const problemsForExam=id=>PROBLEMS.filter(p=>p.exam===id);
export const problemsForLab=id=>PROBLEMS.filter(p=>p.lab===id);
