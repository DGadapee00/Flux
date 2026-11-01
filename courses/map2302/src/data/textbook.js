// D38: Lebl, the OCW spine and application choices confirmed by Dalton, 1 Nov 2026.
export const selectedBook = 'lebl';
export const OCW = Object.freeze({course:'18.03SC',term:'Fall 2011',url:'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/',license:'CC BY-NC-SA 4.0'});
export const BOOKS = Object.freeze({
  lebl:{author:'Jiří Lebl',title:'Notes on Diffy Qs',url:'https://www.jirka.org/diffyqs/',license:'CC BY-SA 4.0 or CC BY-NC-SA 4.0'},
  trench:{author:'William F. Trench',title:'Elementary Differential Equations',url:'https://digitalcommons.trinity.edu/mono/8/',license:'CC BY-NC-SA 3.0 Unported'},
});
export const UNIT_SECTIONS = Object.freeze({
  u1:{book:'lebl',sections:['0.2','0.3','1.1','1.2','1.3','1.4','1.6','1.7','2.2']},
  u2:{book:'lebl',sections:['2.1','2.2','2.3','2.4','2.5','2.6']},
  u3:{book:'lebl',sections:['4.2','4.3','4.4','4.5','6.1','6.2','6.3','6.4']},
  u4:{book:'lebl',sections:['3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8','8.1','8.2','8.3','8.4','8.5']},
});
// Topic → section entries begin with the first confirmed unit, not with invented citations.
export const SECTIONS = Object.freeze({
 'characteristic':{section:'2.2',url:'sec_ccsol.html'},
 'vibrations':{section:'2.4',url:'sec_mv.html'},
 'exponential-response':{section:'2.5',url:'sec_nonhom.html'},
 'undetermined':{section:'2.5',url:'sec_nonhom.html'},
 'frequency-response':{section:'2.6',url:'forcedo_section.html'},
 'rlc':{section:'2.4',url:'sec_mv.html'},
 'integral-solutions':{section:'1.1',url:'integralsols_section.html'},
 'slope-field':{section:'1.2',url:'slopefields_section.html'},
 'separation':{section:'1.3',url:'separable_section.html'},
 'integrating-factor':{section:'1.4',url:'intfactor_section.html'},
 'phase-line':{section:'1.6',url:'auteq_section.html'},
 'euler':{section:'1.7',url:'numer_section.html'},
 'complex-response':{section:'2.2',url:'sec_ccsol.html'},
});
export function citation(topic){const s=SECTIONS[topic];return s?`Lebl, Notes on Diffy Qs §${s.section}`:null;}
export function sectionURL(topic){return SECTIONS[topic]?`https://www.jirka.org/diffyqs/html/${SECTIONS[topic].url}`:null;}
