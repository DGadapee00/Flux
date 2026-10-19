import { createNotes } from '@flux/core';

/**
 * Notes tab, shared by the math and engineering HUDs. Shown only when the course passes `notes`
 * (the manifest has notes). A course that passes none gets null, and the header is untouched.
 *
 * A course that passes notes also imports `@flux/shells/styles/notes.css`.
 *
 * @param {object} api Same host api as the HUD, plus `examId()`.
 * @param {object|null|undefined} notesDeps Arguments for core `createNotes`.
 * @returns {ReturnType<typeof createNotes>|null}
 */
export function mountNotesTab(api, notesDeps) {
  if (!notesDeps || typeof notesDeps.notesForExam !== 'function') return null;

  const practice = document.getElementById('btn-practice');
  const row = practice?.parentElement || document.querySelector('.practice-row');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'btn-notes';
  btn.className = 'practice-btn';
  btn.title = 'Notes (N)';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'notes');
  btn.innerHTML = '<span>Notes</span><kbd>N</kbd>';

  if (practice && row) {
    const group = document.createElement('span');
    group.className = 'mode-tabs';
    practice.replaceWith(group);
    group.append(practice, btn);
  } else if (row) {
    row.append(btn);
  }

  let panel = document.getElementById('notes');
  if (!panel) {
    panel = document.createElement('aside');
    panel.id = 'notes';
    panel.className = 'hud panel notes';
    panel.setAttribute('aria-label', 'Notes');
    panel.hidden = true;
    const problems = document.getElementById('problems');
    if (problems) problems.after(panel);
    else (document.getElementById('app') || document.body).append(panel);
  }

  const notes = createNotes(
    {
      ...api,
      onChange() {
        const open = notes.isOpen();
        btn.classList.toggle('active', open);
        btn.setAttribute('aria-expanded', String(open));
        api.onNotes?.(open);
      },
    },
    notesDeps,
  );
  btn.addEventListener('click', () => notes.toggle());
  return notes;
}

/**
 * Open the notes at the section a `?n=<section>` link names. The course calls this with the route
 * it just parsed, at boot and when the hash changes. A link that names a problem wins: that
 * problem's own notes link opens its section beside it. Returns whether the notes were opened.
 *
 * @param {ReturnType<typeof createNotes>|null|undefined} notes The HUD's `notes`.
 * @param {{ examId: string, problemId?: string|null, notes?: string|null }} route
 */
export function openNotesFromRoute(notes, route) {
  if (!notes || !route.notes || route.problemId) return false;
  notes.open({ examId: route.examId, section: route.notes });
  return true;
}
