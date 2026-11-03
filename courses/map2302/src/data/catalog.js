// OCW 18.03SC Fall 2011 order; planned ids are not built labs.
export const EXAMS = [
  {
    "id": "u1",
    "n": 1,
    "title": "First-order equations",
    "chapters": "1",
    "date": null,
    "labs": ["slope-field","euler","phase-line","first-order-response","coffee"],
    "coming": []
  },
  {
    "id": "u2",
    "n": 2,
    "title": "Second-order linear equations",
    "chapters": "2",
    "date": null,
    "labs": ["oscillator","resonance","suspension","rlc"],
    "coming": []
  },
  {
    "id": "u3",
    "n": 3,
    "title": "Fourier series and Laplace transforms",
    "chapters": "3",
    "date": null,
    "labs": ["fourier","laplace","convolution","radio-tuner"],
    "coming": []
  },
  {
    "id": "u4",
    "n": 4,
    "title": "First-order systems",
    "chapters": "4",
    "date": null,
    "labs": ["phase-portrait","normal-modes","linearize","limit-cycle","clock-pendulum"],
    "coming": []
  }
];
export const LAB_META = {
  'clock-pendulum': { id: 'clock-pendulum', exam: 'u4', title: 'Pendulum clock', app: true },
  'limit-cycle': { id: 'limit-cycle', exam: 'u4', title: 'Attracting cycles' },
  linearize: { id: 'linearize', exam: 'u4', title: 'Linearization limits' },
  'normal-modes': { id: 'normal-modes', exam: 'u4', title: 'Coupled normal modes' },
  'phase-portrait': { id: 'phase-portrait', exam: 'u4', title: 'Linear phase portrait' },
  'radio-tuner': { id: 'radio-tuner', exam: 'u3', title: 'Radio clock tuner', app: true },
  convolution: { id: 'convolution', exam: 'u3', title: 'Convolution memory' },
  laplace: { id: 'laplace', exam: 'u3', title: 'Steps, impulses and poles' },
  fourier: { id: 'fourier', exam: 'u3', title: 'Fourier synthesis' },
  rlc: { id: 'rlc', exam: 'u2', title: 'Series RLC' },
  suspension: { id: 'suspension', exam: 'u2', title: 'Car suspension', app: true },
  resonance: { id: 'resonance', exam: 'u2', title: 'Forced response' },
  oscillator: { id: 'oscillator', exam: 'u2', title: 'Free oscillator' },
  coffee: { id: 'coffee', exam: 'u1', title: 'Cooling coffee', app: true },
  'first-order-response': { id: 'first-order-response', exam: 'u1', title: 'First-order response' },
  'phase-line': { id: 'phase-line', exam: 'u1', title: 'Phase line' },
  euler: { id: 'euler', exam: 'u1', title: 'Euler steps' },
  'slope-field': { id: 'slope-field', exam: 'u1', title: 'Slope field' },};
export const CHAPTER_TITLES = Object.fromEntries(EXAMS.map(e=>[e.chapters,e.title]));
export function examById(id){return EXAMS.find(e=>e.id===id)||EXAMS[0];}
export function examForLab(){return EXAMS[0];}
export function examIndex(id){return Math.max(0,EXAMS.findIndex(e=>e.id===id));}
export function examLabel(exam){return exam?`Unit ${exam.n}`:'Unit';}
