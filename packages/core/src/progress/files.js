/**
 * Progress files. A course file is one store's export.
 * A hub file is `{ v: 1, courses: { [courseId]: store export } }`.
 * Each section is checked against that course's id before anything is written.
 */

const NOTICE_KEY = 'flux.files.notice';

/**
 * @param {{ courseId: string, store: { exportJSON: () => object } }[]} parts
 */
export function exportBundle(parts) {
  const courses = {};
  for (const part of parts) {
    const blob = part.store.exportJSON();
    if (!blob || blob.v !== 1 || blob.courseId !== part.courseId) {
      throw new Error('progress file does not match this course');
    }
    courses[part.courseId] = blob;
  }
  return { v: 1, courses };
}

/**
 * Validate every section, then write. A wrong id writes nothing.
 * @param {object} bundle
 * @param {{ courseId: string, store: { importJSON: (blob: object) => void } }[]} parts
 */
export function importBundle(bundle, parts) {
  if (!bundle || bundle.v !== 1 || !bundle.courses || typeof bundle.courses !== 'object' || Array.isArray(bundle.courses)) {
    throw new Error('progress file does not match this backup');
  }
  const expect = parts.map((part) => part.courseId).sort();
  const got = Object.keys(bundle.courses).sort();
  if (got.length !== expect.length || got.some((id, i) => id !== expect[i])) {
    throw new Error('progress file does not match this backup');
  }
  for (const part of parts) {
    const section = bundle.courses[part.courseId];
    if (!section || section.v !== 1 || section.courseId !== part.courseId || !section.keys || typeof section.keys !== 'object') {
      throw new Error('progress file does not match this course');
    }
  }
  for (const part of parts) part.store.importJSON(bundle.courses[part.courseId]);
}

/**
 * @param {string} filename
 * @param {object} data
 */
export function downloadJSON(filename, data) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * @param {string} text
 */
export function parseProgressText(text) {
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('bad');
    return data;
  } catch {
    throw new Error('That file is not progress JSON.');
  }
}

function rememberNotice(text) {
  try {
    sessionStorage.setItem(NOTICE_KEY, text);
  } catch {
    /* private mode */
  }
}

function takeNotice() {
  try {
    const text = sessionStorage.getItem(NOTICE_KEY);
    if (text) sessionStorage.removeItem(NOTICE_KEY);
    return text || '';
  } catch {
    return '';
  }
}

function styleOnce() {
  if (document.getElementById('flux-files-style')) return;
  const style = document.createElement('style');
  style.id = 'flux-files-style';
  style.textContent = `
.flux-hub { display: inline-flex; align-items: center; color: inherit; }
.flux-files {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  margin-top: 8px;
}
.flux-files button {
  font: 500 16px/1.2 Inter, system-ui, sans-serif;
  color: inherit;
}
.flux-files button {
  min-height: 32px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(236, 230, 226, 0.18);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.flux-files-msg {
  flex: 1 1 12rem;
  margin: 0;
  min-width: 0;
  font: 400 13px/1.3 Inter, system-ui, sans-serif;
  color: #aaa39e;
}
.flux-files-msg.is-bad { color: #fc6255; }
`;
  document.head.append(style);
}

function messageNode() {
  const msg = document.createElement('p');
  msg.className = 'flux-files-msg';
  msg.setAttribute('role', 'status');
  return msg;
}

function show(msg, text, bad = false) {
  msg.textContent = text;
  msg.classList.toggle('is-bad', bad);
}

/**
 * Export / Import for one course. A file for another course is refused.
 * @param {HTMLElement} parent
 * @param {{ courseId: string, store: { exportJSON: () => object, importJSON: (blob: object) => void } }} spec
 */
export function mountCourseFiles(parent, { courseId, store }) {
  styleOnce();
  const root = document.createElement('div');
  root.className = 'flux-files';
  const exp = document.createElement('button');
  exp.type = 'button';
  exp.textContent = 'Export progress';
  const imp = document.createElement('button');
  imp.type = 'button';
  imp.textContent = 'Import progress';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.hidden = true;
  const msg = messageNode();
  root.append(exp, imp, input, msg);
  parent.append(root);

  const saved = takeNotice();
  if (saved) show(msg, saved);

  exp.addEventListener('click', () => {
    downloadJSON(`flux-${courseId}-progress.json`, store.exportJSON());
    show(msg, 'Progress downloaded.');
  });
  imp.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    try {
      const data = parseProgressText(await file.text());
      store.importJSON(data);
      rememberNotice('Progress restored.');
      location.reload();
    } catch (err) {
      show(msg, err instanceof Error ? err.message : 'Could not restore progress.', true);
    }
  });
  return root;
}

/**
 * One file for every course on the hub. Each section is checked by its course id.
 * @param {HTMLElement} parent
 * @param {{ courseId: string, store: { exportJSON: () => object, importJSON: (blob: object) => void } }[]} parts
 */
export function mountHubBackup(parent, parts) {
  styleOnce();
  const root = document.createElement('div');
  root.className = 'flux-files';
  const exp = document.createElement('button');
  exp.type = 'button';
  exp.textContent = 'Back up progress';
  const imp = document.createElement('button');
  imp.type = 'button';
  imp.textContent = 'Restore';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.hidden = true;
  const msg = messageNode();
  root.append(exp, imp, input, msg);
  parent.append(root);

  const saved = takeNotice();
  if (saved) show(msg, saved);

  exp.addEventListener('click', () => {
    downloadJSON('flux-progress.json', exportBundle(parts));
    show(msg, 'Backup downloaded.');
  });
  imp.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    try {
      const data = parseProgressText(await file.text());
      importBundle(data, parts);
      rememberNotice('Progress restored.');
      location.reload();
    } catch (err) {
      show(msg, err instanceof Error ? err.message : 'Could not restore progress.', true);
    }
  });
  return root;
}

/**
 * The way back to the hub. The logo links there.
 * The sibling-track row is drawn by the course shell from the hub's track list, not here:
 * `courses` is accepted and ignored so an older caller cannot put the all-courses row back.
 * If the header already has an `a.brand`, its href is pointed at the hub; otherwise the `.brand-mark`
 * icon is wrapped in a link.
 * @param {HTMLElement} parent
 * @param {{ currentId?: string, courses?: unknown[], hubHref?: string }} [spec]
 */
export function mountTrackBar(parent, { hubHref = '../' } = {}) {
  styleOnce();
  const scope = parent.closest('header') || parent;
  const existing = scope.querySelector('a.brand') || (parent.matches('a.brand') ? parent : null);
  if (existing) {
    existing.href = hubHref;
    existing.setAttribute('aria-label', 'FLUX hub');
    return existing;
  }
  const mark = scope.querySelector('.brand-mark');
  if (!mark) return null;
  if (mark.parentElement && mark.parentElement.matches('a.flux-hub')) return mark.parentElement;
  const link = document.createElement('a');
  link.className = 'flux-hub';
  link.href = hubHref;
  link.setAttribute('aria-label', 'FLUX hub');
  link.title = 'All courses';
  mark.replaceWith(link);
  link.append(mark);
  return link;
}
