import {LESSONS} from './lessons.js';
export const EXAMS=LESSONS.map((s,i)=>({id:s.exam,n:i+1,title:s.title,chapters:s.chapter,date:`Unit ${i+1}`,labs:[s.id],coming:[]}));
export const LAB_META=Object.fromEntries(LESSONS.map(s=>[s.id,{id:s.id,exam:s.exam,title:s.labTitle}]));
export const CHAPTER_TITLES=Object.fromEntries(LESSONS.map(s=>[s.chapter,s.title]));
export const examById=id=>EXAMS.find(e=>e.id===id)||EXAMS[0];
export const examForLab=id=>examById(LAB_META[id]?.exam);
export const examIndex=id=>Math.max(0,EXAMS.findIndex(e=>e.id===id));
export const examLabel=e=>e?`Unit ${e.n}`:'Unit';
