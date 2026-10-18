import ch12 from './bank/ch12.js';
import ch13 from './bank/ch13.js';
import ch14 from './bank/ch14.js';
import ch15 from './bank/ch15.js';
import ch16 from './bank/ch16.js';
import ch17 from './bank/ch17.js';
import ch18 from './bank/ch18.js';
import units from './bank/units.js';
import u1More from './bank/u1-more.js';
import u2More from './bank/u2-more.js';
import u3More from './bank/u3-more.js';
import u4More from './bank/u4-more.js';
import u5More from './bank/u5-more.js';
import u6More from './bank/u6-more.js';
import u7More from './bank/u7-more.js';
import { foldCoaching } from '@flux/shells/practice/coaching.js';
import { applyPrincipleTags } from '@flux/shells/practice/principles.js';
import coaching from './coaching/index.js';
import { PRINCIPLE_TAGS } from './principles.js';

/*
 * Traps, wrong-option explanations and extra hints live beside the bank (src/problems/coaching/),
 * one file per unit, and are folded in here so the app and the checker see the same thing. Each
 * template's principle tags come from src/problems/principles.js.
 */
export const PROBLEMS = foldCoaching(applyPrincipleTags([...units, ...ch12, ...u1More, ...ch13, ...u2More, ...ch14, ...u3More, ...ch15, ...u4More, ...ch16, ...u5More, ...ch17, ...u6More, ...ch18, ...u7More], PRINCIPLE_TAGS), coaching);

const byIdMap = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byIdMap.get(id) || null;
export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);
export const problemsForLab = (labId) => PROBLEMS.filter((p) => p.lab === labId);

export const CHAPTER_ORDER = ['1', '12', '13', '14', '15', '16', '17', '18'];

export const CHAPTER_TITLES = {
  1: 'Units and significant figures',
  12: 'Kinematics of a particle',
  13: 'Kinetics of a particle: force and acceleration',
  14: 'Kinetics of a particle: work and energy',
  15: 'Kinetics of a particle: impulse and momentum',
  16: 'Planar kinematics of a rigid body',
  17: 'Planar kinetics of a rigid body: force and acceleration',
  18: 'Planar kinetics of a rigid body: work and energy',
};
