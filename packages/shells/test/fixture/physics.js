import '@flux/shells/physics/styles/main.css';
import '@flux/shells/physics/styles/practice.css';
import '@flux/shells/physics/styles/mobile.css';
import 'katex/dist/katex.min.css';
import { CHROME_IDS, renderChrome } from '@flux/shells/physics/chrome.js';
import { createHUD } from '@flux/shells/physics/hud.js';
import { createPractice } from '@flux/shells/physics/problems.js';
import { createUnits } from '@flux/shells/physics/units.js';
import { createFading } from '../../practice/fading.js';
import { UNSURE, createPrincipleStep, primaryOf } from '../../practice/principles.js';
import { EXAMS, LAB_META, PRINCIPLES, engine, examById, fullBank } from './bank.js';

/** A stand-in for a course's main.js: one lab ("demo") with no electromagnetic data at all. */
renderChrome(document.getElementById('app'), { code: 'FIX 1000', setupHint: 'Lab controls', unitName: 'Unit' });

const calls = { openNotes: [] };
const api = {
  examId: () => 'u1',
  labId: () => 'demo',
  slice: () => ({}),
  computed: {},
  labelLayer: document.getElementById('label-layer'),
  openInLab: async () => '',
  clearQuery() {},
  setSceneBlind() {},
  setExam() {},
  openNotes: (where) => calls.openNotes.push(where),
  setLab() {},
  setScenario() {},
  resetCamera() {},
  toggleShow() {},
  togglePractice: () => practice.toggle(),
  toggleUnits: () => units.toggle(),
  toggleNotes() {},
  escape() {},
  shiftExam() {},
  setLabIndex() {},
  handleKey() {},
  bump() {},
};

const base = fullBank();
const step = createPrincipleStep({ PRINCIPLES, confused: base.principleConfused, twins: base.principleTwins });
const fading = createFading(engine);
const bank = {
  ...base,
  examLabel: (exam) => `Unit ${exam.n}`,
  PRINCIPLES,
  primaryOf,
  UNSURE,
  ASK_PRINCIPLE: true,
  asksPrinciple: step.asksPrinciple,
  principleOptions: step.principleOptions,
  gradePrinciple: step.gradePrinciple,
  guidanceFor: fading.guidanceFor,
  workedExample: fading.workedExample,
};

const hud = createHUD(api, {
  exams: EXAMS,
  examById,
  examLabel: bank.examLabel,
  examLongLabel: (exam) => `Unit ${exam.n} · ${exam.title}`,
  labMeta: LAB_META,
  code: 'FIX 1000',
  homeId: 'u1',
});
const units = createUnits({ unitsForLab: () => [{ sym: 'F', name: 'force', unit: 'N' }], labMeta: LAB_META });
const practice = createPractice(api, bank);
document.getElementById('btn-practice').addEventListener('click', () => practice.toggle());
hud.mount(null, EXAMS[0], { examId: 'u1' });

window.__fixture = { practice, hud, units, calls, chromeIds: [...CHROME_IDS] };
function frame() {
  practice.frame();
  requestAnimationFrame(frame);
}
frame();
