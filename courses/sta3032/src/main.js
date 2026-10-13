import 'katex/dist/katex.min.css';
import { UNITS } from './data/catalog.js';
import { parseHash, hashFor } from './engine/router.js';
import { renderList, renderProblem, dueCount } from './ui/practice.js';
import { renderExam } from './ui/exam.js';
import { renderTables } from './ui/tables.js';
import { renderNotes } from './ui/notes.js';
import { renderExplore } from './ui/lab.js';
import { fitMath } from './ui/shared.js';

// Which build this is, so "is the live site current?" has an answer (see DEPLOY.md, /version.json).
console.info(`FLUX·stats build ${__BUILD__.commit}${__BUILD__.subject ? ` — ${__BUILD__.subject}` : ''} (built ${__BUILD__.built})`);
window.__build = __BUILD__;

const view = document.getElementById('view');
const unitSelect = document.getElementById('unit-select');
const modes = document.getElementById('modes');

unitSelect.innerHTML = UNITS.map((u) => `<option value="${u.id}">${u.title} · ${u.label.split(',')[0]}</option>`).join('');
unitSelect.addEventListener('change', () => {
  const r = parseHash();
  location.hash = hashFor({ unitId: unitSelect.value, mode: r.mode === 'exam' ? 'practice' : r.mode });
});

let last = '';
function route() {
  const r = parseHash();
  // No link: normalize to the exam coming up, without adding a history entry.
  if (r.bare) history.replaceState(null, '', hashFor({ unitId: r.unitId }));
  unitSelect.value = r.unitId;
  for (const a of modes.querySelectorAll('a')) {
    const m = a.dataset.mode;
    a.href = hashFor({ unitId: r.unitId, mode: m });
    const on = m === r.mode || (m === 'practice' && r.mode === 'exam');
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  const due = dueCount(r.unitId);
  const badge = document.getElementById('due-badge');
  badge.hidden = !due;
  badge.textContent = due;

  const key = `${r.unitId}|${r.mode}|${r.problemId}|${r.seed}|${r.labId}|${r.scenario}|${r.chapter}|${r.set}`;
  // Each screen sets the handlers it needs on the shared view; none carries over to the next one.
  view.onclick = view.oninput = view.onchange = view.onkeydown = null;
  if (r.mode === 'practice' && r.problemId) renderProblem(view, r);
  else if (r.mode === 'practice') renderList(view, r);
  else if (r.mode === 'exam') renderExam(view, r);
  else if (r.mode === 'tables') renderTables(view, r);
  else if (r.mode === 'notes') renderNotes(view, r);
  else if (r.mode === 'explore') renderExplore(view, r);
  if (key !== last) window.scrollTo(0, 0);
  last = key;
  document.title = `FLUX·stats — ${r.problemId ? 'Practice' : r.labId ? 'Lab' : r.mode[0].toUpperCase() + r.mode.slice(1)}`;
}

// Displayed equations that are too wide for the column switch to their wrapping form, whenever
// the view's content changes (a revealed solution, an opened example) or the width does.
let fitting = 0;
const refit = () => {
  if (!fitting) fitting = requestAnimationFrame(() => {
    fitting = 0;
    fitMath(view);
  });
};
new MutationObserver(refit).observe(view, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
window.addEventListener('resize', refit);

window.addEventListener('hashchange', route);
route();
