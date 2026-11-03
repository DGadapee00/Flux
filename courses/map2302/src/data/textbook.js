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
 'systems':{section:'3.1',url:'sec_introtosys.html'},
 'eigenvalues':{section:'3.4',url:'eigenmethod_section.html'},
 'portraits':{section:'3.5',url:'sec_twodimaut.html'},
 'normal-modes':{section:'3.6',url:'sol_section.html'},
 'repeated':{section:'3.7',url:'sec_multeigen.html'},
 'matrix-exponential':{section:'3.8',url:'sec_matexp.html'},
 'nonlinear':{section:'8.3',url:'nlinapps_section.html'},
 'linearization':{section:'8.1',url:'linearization_section.html'},
 'limit-cycles':{section:'8.4',url:'limitcycles_section.html'},
 'chaos':{section:'8.5',url:'sec_chaos.html'},
 'pendulum':{section:'8.3',url:'nlinapps_section.html'},
 'fourier':{section:'4.2',url:'ts_section.html'},
 'fourier-operations':{section:'4.3',url:'moreonfourier_section.html'},
 'laplace-basics':{section:'6.1',url:'laplace_section.html'},
 'laplace-inverse':{section:'6.2',url:'transformsofders_section.html'},
 'laplace-ivp':{section:'6.2',url:'transformsofders_section.html'},
 'causal-inputs':{section:'6.4',url:'diracdelta_section.html'},
 'convolution':{section:'6.3',url:'convolution_section.html'},
 'transfer':{section:'6.2',url:'transformsofders_section.html'},
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
