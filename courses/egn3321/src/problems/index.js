import ch12 from './bank/ch12.js';
import ch13 from './bank/ch13.js';
import ch14 from './bank/ch14.js';
import units from './bank/units.js';

export const PROBLEMS = [...units, ...ch12, ...ch13, ...ch14];

const byIdMap = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byIdMap.get(id) || null;
export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);
export const problemsForLab = (labId) => PROBLEMS.filter((p) => p.lab === labId);

export const CHAPTER_ORDER = ['1', '12', '13', '14'];

export const CHAPTER_TITLES = {
  1: 'Units and significant figures',
  12: 'Kinematics of a particle',
  13: 'Kinetics of a particle: force and acceleration',
  14: 'Kinetics of a particle: work and energy',
};
