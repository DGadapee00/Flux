export const EXAMS = [
 {id:'u1',n:1,title:'Design and materials',chapters:'1',date:'Unit 1',labs:['lands'],coming:[]},
 {id:'u2',n:2,title:'Joining and inspection',chapters:'2',date:'Unit 2',labs:['inspection'],coming:[]},
 {id:'u3',n:3,title:'Repair and disposition',chapters:'3',date:'Unit 3',labs:['repairs'],coming:[]},
 {id:'u4',n:4,title:'Proof and acceptance',chapters:'4',date:'Unit 4',labs:['proof'],coming:[]}
];
export const LAB_META={lands:{id:'lands',exam:'u1',title:'Weld land sizing'},inspection:{id:'inspection',exam:'u2',title:'Inspection capability'},repairs:{id:'repairs',exam:'u3',title:'Repair strength'},proof:{id:'proof',exam:'u4',title:'Proof test'}};
export const CHAPTER_TITLES=Object.fromEntries(EXAMS.map(e=>[e.chapters,e.title]));
export const examById=id=>EXAMS.find(e=>e.id===id)||EXAMS[0];
export const examForLab=id=>examById(LAB_META[id]?.exam);
export const examIndex=id=>Math.max(0,EXAMS.findIndex(e=>e.id===id));
export const examLabel=e=>e?`Unit ${e.n}`:'Unit';
