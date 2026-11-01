import '@flux/shells/math/styles/main.css';
import '@flux/shells/math/styles/practice.css';
import '@flux/shells/math/styles/mobile.css';
import 'katex/dist/katex.min.css';
import { createPractice } from '@flux/shells/math/problems.js';
import { fullBank } from './bank.js';

/** A stand-in for a course's main.js: one lab ("demo"), and a log of what the panel asked for. */
const calls = { openNotes: [] };
const api = {
  examId: () => 'u1',
  labId: () => 'demo',
  slice: () => ({}),
  computed: {},
  openInLab: async () => '',
  clearQuery() {},
  setSceneBlind() {},
  setExam() {},
  openNotes: (where) => calls.openNotes.push(where),
  labelLayer: document.getElementById('label-layer'),
};
const bank=fullBank();const progress=bank.createProgress();bank.createProgress=()=>progress;
if(new URLSearchParams(location.search).has('cumulative')){
 bank.practiceLabel=exam=>`Unit ${exam.n}`;
 bank.assessmentFor=()=>({label:'Cumulative practice',templates:bank.PROBLEMS});
}
const practice = createPractice(api, bank);
window.__fixture = { practice, calls, progress };
function frame() {
  practice.frame();
  requestAnimationFrame(frame);
}
frame();
