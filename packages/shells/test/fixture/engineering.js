import '@flux/shells/engineering/styles/main.css';
import '@flux/shells/engineering/styles/practice.css';
import 'katex/dist/katex.min.css';
import { createPractice } from '@flux/shells/engineering/problems.js';
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
const practice = createPractice(api, fullBank());
window.__fixture = { practice, calls };
function frame() {
  practice.frame();
  requestAnimationFrame(frame);
}
frame();
