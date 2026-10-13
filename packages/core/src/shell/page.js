/**
 * Plot page host: the hash loop for a course whose screens are practice, exam,
 * tables, and explore. The course passes those screens.
 *
 * @param {{
 *   view: HTMLElement,
 *   unitSelect: HTMLSelectElement,
 *   modes: HTMLElement,
 *   units: { id: string, title: string, label: string }[],
 *   parseHash: (hash?: string) => any,
 *   hashFor: (route: object) => string,
 *   dueCount: (unitId: string) => number,
 *   renderProblem: (view: HTMLElement, route: object) => void,
 *   renderList: (view: HTMLElement, route: object) => void,
 *   renderExam: (view: HTMLElement, route: object) => void,
 *   renderTables: (view: HTMLElement, route: object) => void,
 *   renderExplore: (view: HTMLElement, route: object) => void,
 *   fitMath: (view: HTMLElement) => void,
 *   title: (route: object) => string,
 * }} spec
 */
export function mountPage(spec) {
  const { view, unitSelect, modes, units, parseHash, hashFor, dueCount } = spec;
  unitSelect.innerHTML = units
    .map((u) => `<option value="${u.id}">${u.title} · ${u.label.split(',')[0]}</option>`)
    .join('');
  unitSelect.addEventListener('change', () => {
    const r = parseHash();
    location.hash = hashFor({ unitId: unitSelect.value, mode: r.mode === 'exam' ? 'practice' : r.mode });
  });

  let last = '';
  function route() {
    const r = parseHash();
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

    const key = `${r.unitId}|${r.mode}|${r.problemId}|${r.seed}|${r.labId}|${r.scenario}|${r.set}`;
    view.onclick = null;
    view.oninput = null;
    view.onchange = null;
    view.onkeydown = null;
    if (r.mode === 'practice' && r.problemId) spec.renderProblem(view, r);
    else if (r.mode === 'practice') spec.renderList(view, r);
    else if (r.mode === 'exam') spec.renderExam(view, r);
    else if (r.mode === 'tables') spec.renderTables(view, r);
    else if (r.mode === 'explore') spec.renderExplore(view, r);
    if (key !== last) window.scrollTo(0, 0);
    last = key;
    document.title = spec.title(r);
  }

  let fitting = 0;
  const refit = () => {
    if (!fitting) {
      fitting = requestAnimationFrame(() => {
        fitting = 0;
        spec.fitMath(view);
      });
    }
  };
  new MutationObserver(refit).observe(view, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['open'],
  });
  window.addEventListener('resize', refit);
  window.addEventListener('hashchange', route);
  route();
}
