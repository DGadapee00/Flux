/**
 * What every project page shares: the header strip, escaping, and copying text out.
 * The shell names no course. The course passes its code, its title and its neighbours from the
 * hub's track list.
 */

/** @param {unknown} s */
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** A number as two digits: `03`. */
export const two = (n) => String(n).padStart(2, '0');

/** A list as plain text lines, bulleted or numbered. */
export const lines = (list, mark = '-') => list.map((x, i) => `${mark === '1.' ? `${i + 1}.` : mark} ${x}`).join('\n');

/**
 * Copy text. Where the clipboard is refused, select the text in its box so it can be copied by hand.
 * @param {string} text
 * @param {Element | null} [box] The element that shows the same text.
 * @returns {Promise<boolean>} Whether the clipboard took it.
 */
export async function copyText(text, box) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (box) {
      box.hidden = false;
      const range = document.createRange();
      range.selectNodeContents(box);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    return false;
  }
}

/** What a copy button says once it has run. */
export const copiedNote = (ok) => (ok ? 'Copied. Paste it into Claude.' : 'Copying is blocked here. The text is selected below: copy it by hand.');

/**
 * Paint the header strip: the course's code and title, then the courses in its group, with this
 * one marked. `actions` are links that belong to this course alone, such as its labs.
 *
 * @param {{
 *   id: string, code: string, title: string,
 *   siblings?: { id: string, code?: string, title?: string, href: string | null }[],
 *   actions?: { label: string, href: string }[],
 *   root?: Document,
 * }} spec
 */
export function mountProjectHeader({ id, code, title, siblings = [], actions = [], root = document }) {
  const sub = root.getElementById('brand-sub');
  if (sub) sub.textContent = [code, title].filter(Boolean).join(' · ');
  const nav = root.getElementById('track-row');
  if (!nav) return;
  const items = siblings.map((course) => {
    const label = esc(course.code || course.id);
    const name = esc(course.title || '');
    if (course.id === id) return `<span aria-current="page" title="${name}">${label}</span>`;
    if (!course.href) return `<span class="is-unbuilt" title="${name}, not built yet">${label}</span>`;
    return `<a href="${esc(course.href)}" title="${name}">${label}</a>`;
  });
  const extra = actions.map((a) => `<a class="nav-action" href="${esc(a.href)}">${esc(a.label)} <span aria-hidden="true">→</span></a>`);
  nav.innerHTML = items.join('') + (extra.length ? `<span class="nav-gap" aria-hidden="true"></span>${extra.join('')}` : '');
  nav.hidden = items.length + extra.length === 0;
}
