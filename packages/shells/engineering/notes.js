import { createNotes } from '@flux/core';

/**
 * Notes tab for an engineering course. Shown only when the course passes `notes`
 * (the manifest has notes). Statics passes none, so this returns null and does
 * not touch the header.
 *
 * A course that passes notes also imports `styles/notes.css`.
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
