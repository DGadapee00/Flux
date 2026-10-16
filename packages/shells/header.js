/**
 * Shared course header for the math and engineering shells.
 * The shell names no course. The course passes its code, its title, and the sibling list
 * from the hub's track data.
 */

/**
 * @param {unknown} value
 */
function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/**
 * The unit picker's label. The number alone was the old tab; the name is what the picker shows.
 * @param {{ id?: string, n?: number, title?: string }} exam
 */
export function unitLabel(exam) {
  if (!exam) return '';
  const name = exam.title || exam.id || '';
  return exam.n ? `Unit ${exam.n} · ${name}` : name;
}

/**
 * FLUX, then the course code and title. One wordmark for every course on these shells.
 * @param {string} [code]
 * @param {string} [title]
 */
function paintWordmark(code, title) {
  const heading = document.getElementById('brand')?.querySelector('h1');
  if (heading) {
    heading.textContent = 'FLUX';
    heading.classList.remove('wordmark-long');
  }
  const sub = document.getElementById('brand-sub');
  const line = [code, title].filter(Boolean).join(' · ');
  if (sub && line) sub.textContent = line;
  if (code) document.title = `FLUX — ${code}`;
}

/**
 * @param {string} [courseId]
 * @param {{ id?: string, code?: string, title?: string, href?: string|null }[]} [track]
 */
function paintTrack(courseId, track) {
  const row = document.getElementById('track-row');
  if (!row) return;
  const courses = Array.isArray(track) ? track : [];
  if (courses.length === 0) {
    row.hidden = true;
    row.innerHTML = '';
    return;
  }
  row.hidden = false;
  row.innerHTML = courses
    .map((course) => {
      const code = course.code || course.id || '';
      const tip = course.title ? ` title="${esc(course.title)}"` : '';
      if (!course.href) return `<span class="unbuilt"${tip}>${esc(code)}</span>`;
      const current = course.id && course.id === courseId ? ' aria-current="page"' : '';
      return `<a href="${esc(course.href)}"${current}${tip}>${esc(code)}</a>`;
    })
    .join('');
}

/**
 * @param {{ id: string, n?: number, title?: string }[]} exams
 * @param {string} [examId]
 */
function paintUnits(exams, examId) {
  const select = document.getElementById('exam-select');
  if (!select) return;
  const list = exams || [];
  select.innerHTML = list
    .map((exam) => `<option value="${esc(exam.id)}">${esc(unitLabel(exam))}</option>`)
    .join('');
  if (examId && list.some((exam) => exam.id === examId)) select.value = examId;
}

/**
 * @param {object} catalog
 * @param {object[]} catalog.exams
 * @param {string} [catalog.code]
 * @param {string} [catalog.title]
 * @param {string} [catalog.courseId]
 * @param {string} [catalog.homeId]
 * @param {{ id?: string, code?: string, title?: string, href?: string|null }[]} [catalog.track]
 * @param {{ setExam: (id: string) => unknown }} api
 */
export function bindCourseHeader(catalog, api) {
  const exams = catalog.exams || [];
  paintWordmark(catalog.code, catalog.title);
  paintTrack(catalog.courseId, catalog.track);
  paintUnits(exams, catalog.homeId);
  const select = document.getElementById('exam-select');
  select?.addEventListener('change', () => {
    const id = select.value;
    const label = unitLabel(exams.find((exam) => exam.id === id)) || id;
    Promise.resolve(api.setExam(id)).catch((err) => {
      console.error(`FLUX: could not open ${label}`, err);
      const hint = document.getElementById('setup-hint');
      if (hint) {
        hint.textContent = `Could not open ${label}: ${err?.message || err}. Reload the page; if it persists the browser console has the detail.`;
      }
    });
  });
  return {
    showUnit(examId) {
      paintUnits(exams, examId);
    },
  };
}
