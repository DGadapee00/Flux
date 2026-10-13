/**
 * Notes: the class notes for an exam, read beside the lab they describe (src/notes/index.js).
 *
 * The notes file is kept as it was written and read in here: its scripts, styles and fonts are
 * dropped, its math is typeset with the app's KaTeX instead of MathJax, and its colours map onto the
 * app's palette. Its own "#s4" links are rewritten to scroll this panel, because a bare "#s4" in the
 * address bar would be read by the router as an exam called s4.
 *
 * Each section ends with where to go next: the lab that shows it, and the practice problems it
 * prepares. Opened from a problem, the panel sits over the problem sheet and "Back to the problem"
 * returns to it with the attempt untouched.
 *
 * On a wide screen the reader sizes the panel: its right edge drags (the lab re-frames into whatever
 * space is left), and "Full height" folds the brand header away so the notes run top to bottom. Both
 * are remembered per browser.
 */
import renderMathInElement from 'katex/contrib/auto-render';
import { notesForExam, allNotes } from '../notes/index.js';
import { setupsFor, matchExamples } from '../notes/setups.js';
import { DERIVATIONS } from '../derive/index.js';
import { LAB_META, examById, examLabel } from '../data/catalog.js';
import { CHAPTER_TITLES, PROBLEMS } from '../problems/index.js';
import { escapeHTML as esc } from './shared.js';

const MATH = {
  delimiters: [
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
  ],
  throwOnError: false,
};

const countFor = (ch) => PROBLEMS.filter((p) => p.ch === ch).length;

const WIDTH_KEY = 'flux.notes.width';
const FULL_KEY = 'flux.notes.full';
const MIN_W = 420;
const LAB_MIN = 480; // the lab keeps at least this much of the window: a flat lab's labels still fit
const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      /* private window: the size just isn't remembered */
    }
  },
};
const EXPAND_SVG = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 1.5v13M8 1.5 5.5 4M8 1.5 10.5 4M8 14.5 5.5 12M8 14.5l2.5-2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function createNotes(api) {
  const panel = document.getElementById('notes');
  const body = document.body;
  const cache = new Map(); // examId → built document fragment HTML
  const st = { open: false, examId: null, section: null, fromProblem: false, token: 0 };
  const root = document.documentElement;

  // The right edge: drag it, nudge it with the arrow keys, double-click it for the default width.
  const grip = document.createElement('div');
  grip.className = 'notes-grip';
  grip.hidden = true;
  grip.tabIndex = 0;
  grip.setAttribute('role', 'separator');
  grip.setAttribute('aria-orientation', 'vertical');
  grip.setAttribute('aria-label', 'Notes width');
  grip.title = 'Drag to resize the notes · double-click to reset';
  panel.after(grip);

  let savedW = Number(store.get(WIDTH_KEY)) || null;
  const maxW = () => Math.max(MIN_W, window.innerWidth - LAB_MIN);
  function applyWidth() {
    if (savedW) root.style.setProperty('--notes-w', `${Math.round(Math.min(maxW(), Math.max(MIN_W, savedW)))}px`);
    else root.style.removeProperty('--notes-w');
  }
  function setWidth(px) {
    savedW = px == null ? null : Math.round(Math.min(maxW(), Math.max(MIN_W, px)));
    store.set(WIDTH_KEY, savedW == null ? null : String(savedW));
    applyWidth();
  }
  applyWidth();
  window.addEventListener('resize', applyWidth);

  grip.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    grip.setPointerCapture(e.pointerId);
    body.classList.add('notes-resizing');
    const left = panel.getBoundingClientRect().left;
    const move = (ev) => setWidth(ev.clientX - left);
    const up = () => {
      body.classList.remove('notes-resizing');
      api.reframe?.();
      grip.removeEventListener('pointermove', move);
      grip.removeEventListener('pointerup', up);
      grip.removeEventListener('pointercancel', up);
    };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', up);
    grip.addEventListener('pointercancel', up);
  });
  grip.addEventListener('dblclick', () => {
    setWidth(null);
    api.reframe?.();
  });
  grip.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setWidth(panel.getBoundingClientRect().width + (e.key === 'ArrowRight' ? 40 : -40));
    api.reframe?.();
  });

  let full = store.get(FULL_KEY) === '1';
  body.classList.toggle('notes-full', full);
  function setFull(on) {
    full = on;
    body.classList.toggle('notes-full', on);
    store.set(FULL_KEY, on ? '1' : null);
    requestAnimationFrame(() => api.reframe?.());
    const b = panel.querySelector('[data-nt="full"]');
    if (b) {
      b.setAttribute('aria-pressed', String(on));
      b.title = on ? 'Show the header again' : 'Full height: fold the header away';
    }
  }

  function setOpen(on) {
    st.open = on;
    panel.hidden = !on;
    grip.hidden = !on;
    body.classList.toggle('notes-open', on);
    api.onChange?.();
  }

  /** Strip what the reader must not run or restyle, and point in-page links at this panel. */
  function clean(root, set) {
    root.querySelectorAll('script, style, link, meta, title').forEach((el) => el.remove());
    for (const el of root.querySelectorAll('*')) {
      for (const a of [...el.attributes]) if (/^on/i.test(a.name)) el.removeAttribute(a.name);
    }
    // The app styles .legend as a lab's colour key; the notes' legend is a different thing.
    root.querySelectorAll('.legend').forEach((el) => el.classList.replace('legend', 'nt-legend'));
    for (const sec of root.querySelectorAll('section.topic[id]')) {
      sec.dataset.section = sec.id;
      sec.id = `nt-${set.exam}-${sec.id}`;
    }
    for (const a of root.querySelectorAll('a[href^="#"]')) {
      a.dataset.go = a.getAttribute('href').slice(1);
      a.setAttribute('href', '');
    }
  }

  function linksHTML(set, sec) {
    const bits = [];
    if (sec.lab && LAB_META[sec.lab]) bits.push(`<button type="button" class="btn nt-lab" data-lab="${esc(sec.lab)}">See it in the ${esc(LAB_META[sec.lab].title)} lab</button>`);
    for (const ch of sec.ch) {
      const n = countFor(ch);
      if (n) bits.push(`<button type="button" class="btn nt-practice" data-ch="${esc(ch)}">Practice Ch ${esc(ch)} · ${esc(CHAPTER_TITLES[ch] || '')} · ${n}</button>`);
    }
    return bits.length ? `<div class="nt-links">${bits.join('')}</div>` : '';
  }

  /** "Show this in the lab" under each worked example the lab can show (src/notes/setups.js). */
  function addSetups(el, set, sec) {
    const boxes = [...el.querySelectorAll('.box.ex')];
    const hits = matchExamples(set.exam, sec.id, boxes.map((b) => b.querySelector('.tag')?.textContent || ''));
    const list = setupsFor(set.exam, sec.id);
    hits.forEach((i, k) => {
      if (i < 0) return;
      const ex = list[i];
      const where = ex.lab === sec.lab ? 'the lab' : `the ${LAB_META[ex.lab]?.title || ex.lab} lab`;
      const note = ex.note ? `<span class="nt-setup-note">${esc(ex.note)}</span>` : '';
      boxes[k].insertAdjacentHTML(
        'beforeend',
        `<div class="nt-setup"><button type="button" class="btn nt-show" data-ex="${sec.id}:${i}">Show this in ${where}</button>${note}</div>`
      );
    });
  }

  /** "Step through it" where the notes derive something the lab has a step-through for (src/derive/). */
  function addDerivations(el, set, sec) {
    for (const d of DERIVATIONS) {
      const at = d.notes;
      if (!at || at.exam !== set.exam || at.section !== sec.id) continue;
      const anchor = at.h3
        ? [...el.querySelectorAll('h3')].find((h) => h.textContent.trim() === at.h3)
        : [...el.querySelectorAll('.box')].find((b) => b.querySelector('.tag')?.textContent.trim() === at.box);
      if (!anchor) continue;
      const html = `<div class="nt-setup nt-derive"><button type="button" class="btn nt-step" data-derive="${esc(d.id)}">Step through it in the lab</button><span class="nt-setup-note">${esc(d.title)}, one decision at a time.</span></div>`;
      if (at.h3) anchor.insertAdjacentHTML('afterend', html);
      else anchor.insertAdjacentHTML('beforeend', html);
    }
  }

  async function build(set) {
    if (cache.has(set.exam)) return cache.get(set.exam);
    const raw = await set.load();
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const wrap = document.createElement('div');
    const header = doc.querySelector('header.top');
    const main = doc.querySelector('main');
    const footer = doc.querySelector('footer');
    if (header) wrap.appendChild(header);
    if (main) wrap.appendChild(main);
    if (footer) wrap.appendChild(footer);
    clean(wrap, set);
    for (const sec of set.sections) {
      const el = wrap.querySelector(`[data-section="${sec.id}"]`);
      if (!el) continue;
      addSetups(el, set, sec);
      addDerivations(el, set, sec);
      el.insertAdjacentHTML('beforeend', linksHTML(set, sec));
    }
    renderMathInElement(wrap, MATH);
    const html = wrap.innerHTML;
    cache.set(set.exam, html);
    return html;
  }

  function headHTML(set) {
    const back = st.fromProblem ? '<button type="button" class="pb-back" data-nt="back">← Back to the problem</button>' : '';
    const jump = set
      ? `<select class="nt-jump" aria-label="Go to section">${set.sections.map((s) => `<option value="${s.id}">${s.n}. ${esc(s.title)}</option>`).join('')}</select>`
      : '';
    const size = `<button type="button" class="nt-full" data-nt="full" aria-pressed="${full}" aria-label="Full height" title="${full ? 'Show the header again' : 'Full height: fold the header away'}">${EXPAND_SVG}</button>`;
    return `<div class="nt-head">${back}${jump}${size}<button type="button" class="pb-x" data-nt="close" title="Close the notes (N)" aria-label="Close notes">×</button></div>`;
  }

  function emptyHTML(examId) {
    const exam = examById(examId);
    const sets = allNotes();
    return `${headHTML(null)}
      <div class="nt-doc nt-empty">
        <p class="pb-kicker">Notes · ${esc(examLabel(exam))} · Ch ${esc(exam.chapters)}</p>
        <h2 class="pb-h">No notes for ${esc(examLabel(exam))} yet</h2>
        <p>The notes in FLUX so far:</p>
        <div class="nt-sets">${sets
          .map((s) => {
            const e = examById(s.exam);
            return `<button type="button" class="btn" data-set="${esc(s.exam)}">${esc(examLabel(e))} · ${esc(s.title)} · Ch ${esc(s.chapters)}</button>`;
          })
          .join('')}</div>
      </div>`;
  }

  async function render() {
    const my = ++st.token;
    const set = notesForExam(st.examId);
    if (!set) {
      panel.innerHTML = emptyHTML(st.examId);
      return;
    }
    if (!cache.has(set.exam)) panel.innerHTML = `${headHTML(set)}<div class="nt-doc"><p class="pb-dim">Loading the notes…</p></div>`;
    const html = await build(set);
    if (my !== st.token || !st.open) return;
    panel.innerHTML = `${headHTML(set)}<article class="nt-doc">${html}</article>`;
    if (st.section) scrollTo(st.section, { instant: true });
    else panel.scrollTop = 0;
    syncJump();
  }

  function sectionEl(id) {
    return panel.querySelector(`[data-section="${CSS.escape(id)}"]`);
  }

  function scrollTo(id, { instant = false } = {}) {
    const el = sectionEl(id);
    if (!el) return;
    const head = panel.querySelector('.nt-head');
    const top = el.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop - (head?.offsetHeight || 0) - 8;
    panel.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' });
    st.section = id;
    const sel = panel.querySelector('.nt-jump');
    if (sel) sel.value = id;
    showLabFor(id);
  }

  /** The lab behind the notes follows the section being read, unless a problem owns the lab. */
  function showLabFor(id) {
    const sec = notesForExam(st.examId)?.sections.find((s) => s.id === id);
    if (sec?.lab && !st.fromProblem) api.showLab?.(sec.lab, st.examId);
  }

  /** Keep the jump menu on the section in view as the reader scrolls. */
  let spyQueued = false;
  function syncJump() {
    spyQueued = false;
    const sel = panel.querySelector('.nt-jump');
    if (!sel) return;
    const head = panel.querySelector('.nt-head');
    const line = panel.getBoundingClientRect().top + (head?.offsetHeight || 0) + 40;
    let cur = null;
    for (const el of panel.querySelectorAll('[data-section]')) {
      if (el.getBoundingClientRect().top <= line) cur = el.dataset.section;
    }
    if (cur && sel.value !== cur) sel.value = cur;
    if (cur) st.section = cur;
  }
  panel.addEventListener('scroll', () => {
    if (!spyQueued) {
      spyQueued = true;
      requestAnimationFrame(syncJump);
    }
  });

  panel.addEventListener('change', (e) => {
    if (e.target.matches('.nt-jump')) scrollTo(e.target.value);
  });

  panel.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-go]');
    if (a) {
      e.preventDefault();
      scrollTo(a.dataset.go);
      return;
    }
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.derive) {
      close();
      api.stepThrough?.(b.dataset.derive);
      return;
    }
    if (b.dataset.ex) {
      const [sid, i] = b.dataset.ex.split(':');
      const ex = setupsFor(st.examId, sid)[Number(i)];
      if (!ex) return;
      api.setupExample?.(st.examId, ex);
      panel.querySelectorAll('.nt-show.is-on').forEach((x) => {
        x.classList.remove('is-on');
        x.textContent = x.dataset.label;
      });
      b.dataset.label ||= b.textContent;
      b.classList.add('is-on');
      b.textContent = 'Showing in the lab ✓';
      // On a phone the notes cover the lab: step aside so the example can be seen. Notes reopen here.
      if (window.innerWidth <= 720) close();
      return;
    }
    if (b.dataset.nt === 'full') setFull(!full);
    else if (b.dataset.nt === 'close') close();
    else if (b.dataset.nt === 'back') close();
    else if (b.dataset.set) open({ examId: b.dataset.set });
    else if (b.dataset.lab) {
      const examId = st.examId;
      close();
      api.explore?.(b.dataset.lab, examId);
    } else if (b.dataset.ch) {
      const examId = st.examId;
      close();
      api.practiceChapter?.(examId, b.dataset.ch);
    }
  });

  function open({ examId, section = null, fromProblem = false } = {}) {
    st.examId = examId || api.examId();
    st.section = section;
    st.fromProblem = fromProblem;
    // Opened from a problem, the lab holds the problem's setup: no example may replace it.
    panel.classList.toggle('nt-problem', fromProblem);
    setOpen(true);
    render();
  }

  /** Reopen at the section the reader left, when it is the same exam's notes. */
  function resume(examId = api.examId()) {
    open({ examId, section: examId === st.examId ? st.section : null });
  }

  function close() {
    if (!st.open) return;
    st.fromProblem = false;
    setOpen(false);
  }

  return {
    open,
    close,
    resume,
    toggle: () => (st.open ? close() : resume()),
    isOpen: () => st.open,
    /** Follow the exam picker while open: the notes are per exam. */
    onExam(examId) {
      if (st.open && !st.fromProblem && examId !== st.examId) {
        st.examId = examId;
        st.section = null;
        render();
      }
    },
  };
}
