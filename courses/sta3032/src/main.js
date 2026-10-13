import 'katex/dist/katex.min.css';
import { mountCourseFiles, mountPage, mountTrackBar } from '@flux/core';
import { UNITS } from './data/catalog.js';
import { hashFor, parseHash } from './engine/router.js';
import { TRACK, course } from './manifest.js';
import { courseStore } from './storage.js';
import { renderExam } from './ui/exam.js';
import { renderExplore } from './ui/lab.js';
import { dueCount, renderList, renderProblem } from './ui/practice.js';
import { fitMath } from './ui/shared.js';
import { renderTables } from './ui/tables.js';

// Which build this is, so "is the live site current?" has an answer (see DEPLOY.md, /version.json).
console.info(`FLUX·stats build ${__BUILD__.commit}${__BUILD__.subject ? ` — ${__BUILD__.subject}` : ''} (built ${__BUILD__.built})`);
window.__build = __BUILD__;

const header = document.querySelector('.top-inner');
mountTrackBar(header, { currentId: course.id, courses: TRACK });
mountCourseFiles(header, { courseId: course.id, store: courseStore() });

mountPage({
  view: document.getElementById('view'),
  unitSelect: document.getElementById('unit-select'),
  modes: document.getElementById('modes'),
  units: UNITS,
  parseHash,
  hashFor,
  dueCount,
  renderProblem,
  renderList,
  renderExam,
  renderTables,
  renderExplore,
  fitMath,
  title: (r) => `FLUX·stats — ${r.problemId ? 'Practice' : r.labId ? 'Lab' : r.mode[0].toUpperCase() + r.mode.slice(1)}`,
});
