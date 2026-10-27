/**
 * Course map, one entry per unit in the plan's goal-first order (docs/course-plans/bench.md, D35).
 * `labs` are built; `coming` is the rest of that unit, still to be written.
 */

export const EXAMS = [
  { id: 'u1', n: 1, title: 'The bench', chapters: '1', date: 'Unit 1', labs: ['breadboard', 'meter', 'usb-rail'], coming: [] },
  { id: 'u2', n: 2, title: 'Light an LED', chapters: '2', date: 'Unit 2', labs: [], coming: ['LED and resistor'] },
  { id: 'u3', n: 3, title: 'Reading the world', chapters: '3', date: 'Unit 3', labs: [], coming: ['Voltage divider', 'Button and pull-up'] },
  { id: 'u4', n: 4, title: 'Switching bigger things', chapters: '4', date: 'Unit 4', labs: [], coming: ['Transistor switch', 'Flyback diode', 'Night light'] },
  { id: 'u5', n: 5, title: 'Timing', chapters: '5', date: 'Unit 5', labs: [], coming: ['RC timer', '555 timer'] },
  { id: 'u6', n: 6, title: 'Deciding', chapters: '6', date: 'Unit 6', labs: [], coming: ['Comparator', 'Temperature alarm'] },
  { id: 'u7', n: 7, title: 'Power', chapters: '7', date: 'Unit 7', labs: [], coming: ['Regulator', 'Battery life'] },
  { id: 'u8', n: 8, title: 'A microcontroller as the brain', chapters: '8', date: 'Unit 8', labs: [], coming: ['PWM', 'Analog input', 'Temperature fan'] },
  { id: 'u9', n: 9, title: 'Debugging a build', chapters: '9', date: 'Unit 9', labs: [], coming: ['Troubleshoot'] },
];

export const LAB_META = {
  breadboard: { id: 'breadboard', exam: 'u1', title: 'Breadboard' },
  meter: { id: 'meter', exam: 'u1', title: 'Multimeter' },
  'usb-rail': { id: 'usb-rail', exam: 'u1', title: 'USB power', app: true },
};

/** A unit is a "chapter" here: the problems and notes of one build. */
export const CHAPTER_TITLES = {
  1: 'The bench',
  2: 'Light an LED',
  3: 'Reading the world',
  4: 'Switching bigger things',
  5: 'Timing',
  6: 'Deciding',
  7: 'Power',
  8: 'A microcontroller as the brain',
  9: 'Debugging a build',
};

export function examById(id) {
  return EXAMS.find((e) => e.id === id) || EXAMS[0];
}

export function examForLab(labId) {
  const meta = LAB_META[labId];
  return meta ? examById(meta.exam) : EXAMS[0];
}

export function examIndex(id) {
  const i = EXAMS.findIndex((e) => e.id === id);
  return i < 0 ? 0 : i;
}

export function examLabel(exam) {
  return exam ? `Unit ${exam.n}` : 'Unit';
}
