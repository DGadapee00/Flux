/** Notes panel for this course. The renderer lives in core; this file is the catalog and the store. */
import { createNotes as mountNotes } from '@flux/core';
import { escapeHTML as esc } from '@flux/shells/physics/shared.js';
import { LAB_META, examById, examLabel } from '../catalog.js';
import { allNotes, notesForExam } from '../notes/index.js';
import { matchExamples, setupsFor } from '../notes/setups.js';
import { CHAPTER_TITLES, PROBLEMS } from '../problems/index.js';
import { courseStore } from '../storage.js';

const countFor = (ch) => PROBLEMS.filter((p) => p.ch === ch).length;
const store = courseStore();

export function createNotes(api) {
  return mountNotes(api, {
    notesForExam,
    allNotes,
    setupsFor,
    matchExamples,
    // This course has no step-through derivations yet; the panel only iterates the list.
    DERIVATIONS: [],
    LAB_META,
    examById,
    examLabel,
    CHAPTER_TITLES,
    countFor,
    esc,
    store,
  });
}
