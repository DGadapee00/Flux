/**
 * Notes panel for this course. The renderer lives in core.
 * This file is the catalog, the setups, and the store.
 */
import { createNotes as mountNotes } from '@flux/core';
import { LAB_META, examById, examLabel } from '../data/catalog.js';
import { DERIVATIONS } from '../derive/index.js';
import { allNotes, notesForExam } from '../notes/index.js';
import { matchExamples, setupsFor } from '../notes/setups.js';
import { CHAPTER_TITLES, PROBLEMS } from '../problems/index.js';
import { courseStore } from '../storage.js';
import { escapeHTML as esc } from './shared.js';

const countFor = (ch) => PROBLEMS.filter((p) => p.ch === ch).length;
const store = courseStore();

export function createNotes(api) {
  return mountNotes(api, {
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
    store,
  });
}
