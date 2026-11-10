import u1 from './units/u1.js';
import u2 from './units/u2.js';
import u3 from './units/u3.js';
import u4 from './units/u4.js';
export const NOTES={u1,u2,u3,u4};export const notesForExam=id=>NOTES[id]||null;export const allNotes=()=>Object.values(NOTES);export function sectionForProblem(tpl){const set=NOTES[tpl.exam];return set?{set,section:set.sections.find(s=>s.id==='s1')}:null;}
