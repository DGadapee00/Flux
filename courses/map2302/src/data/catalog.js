// OCW 18.03SC Fall 2011 order; planned ids are not built labs.
export const EXAMS = [
  {
    "id": "u1",
    "n": 1,
    "title": "First-order equations",
    "chapters": "1",
    "date": null,
    "labs": [],
    "coming": [
      "slope-field",
      "euler",
      "phase-line",
      "first-order-response",
      "coffee"
    ]
  },
  {
    "id": "u2",
    "n": 2,
    "title": "Second-order linear equations",
    "chapters": "2",
    "date": null,
    "labs": [],
    "coming": [
      "oscillator",
      "resonance",
      "suspension",
      "rlc"
    ]
  },
  {
    "id": "u3",
    "n": 3,
    "title": "Fourier series and Laplace transforms",
    "chapters": "3",
    "date": null,
    "labs": [],
    "coming": [
      "fourier",
      "laplace",
      "convolution",
      "radio-tuner"
    ]
  },
  {
    "id": "u4",
    "n": 4,
    "title": "First-order systems",
    "chapters": "4",
    "date": null,
    "labs": [],
    "coming": [
      "phase-portrait",
      "normal-modes",
      "linearize",
      "limit-cycle",
      "clock-pendulum"
    ]
  }
];
export const LAB_META = {};
export const CHAPTER_TITLES = Object.fromEntries(EXAMS.map(e=>[e.chapters,e.title]));
export function examById(id){return EXAMS.find(e=>e.id===id)||EXAMS[0];}
export function examForLab(){return EXAMS[0];}
export function examIndex(id){return Math.max(0,EXAMS.findIndex(e=>e.id===id));}
export function examLabel(exam){return exam?`Unit ${exam.n}`:'Unit';}
