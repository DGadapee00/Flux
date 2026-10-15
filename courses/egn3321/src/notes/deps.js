import { LAB_META, examById, examLabel } from '../data/catalog.js';
import { CHAPTER_TITLES, PROBLEMS } from '../problems/index.js';
import { courseStore } from '../storage.js';
import { escapeHTML as esc } from '../ui/shared.js';
import { allNotes, notesForExam } from './index.js';
import { matchExamples, setupsFor } from './setups.js';

const countFor = (ch) => PROBLEMS.filter((p) => p.ch === ch).length;

/** No step-through derivations in Unit 1. The field stays so the notes panel can iterate it. */
export const DERIVATIONS = [];

export const notesDeps = {
  notesForExam,
  allNotes,
  setupsFor,
  matchExamples,
  DERIVATIONS,
  LAB_META,
  examById,
  examLabel,
  CHAPTER_TITLES,
  countFor,
  esc,
  store: courseStore(),
};
