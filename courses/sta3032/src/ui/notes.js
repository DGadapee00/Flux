/**
 * Notes, laid out the way FLUX lays out its class notes: each chapter is one continuous document
 * with an eyebrow, a title, a lede, a colour key and a contents list; its sections are grouped into
 * parts, read as prose with the formula after the idea, and end with where to go next (the lab that
 * shows the section, the practice problems it prepares). Worked examples are open, with a button to
 * work the same numbers in Practice and, where a lab can show the example, one to open that lab
 * set up on it. Material the class notes don't cover, taken from the textbook, is marked as such
 * wherever it appears. A formula sheet closes the chapter.
 *
 * The chapters are data (src/notes/chN.js, format in src/notes/index.js), so notes-check can
 * recompute every number they state.
 */
import { CHAPTERS, unitById } from '../data/catalog.js';
import { hashFor } from '../engine/router.js';
import { NOTES, notesFor, examplesIn } from '../notes/index.js';
import { problemById } from '../problems/index.js';
import { CASE_SEED } from '../problems/engine.js';
import { labById } from '../labs/index.js';
import { mathProse, escapeHTML as esc } from './shared.js';

/**
 * Typesetting for the serif prose, outside the math: straight double quotes become curly ones (the
 * body font draws a straight " as a closing quote, so "or" would read ”or”), and a period, comma,
 * semicolon or colon right after inline math moves inside it, so a phone never wraps it onto a line
 * of its own.
 */
const OPEN_FIRST = /(^|[\s(\[\u2014\u2013-])\x22/g;
const OPEN_MID = /([\s(\[\u2014\u2013-])\x22/g;
function typeset(t) {
  const parts = String(t).split(/(\$\$[\s\S]*?\$\$|\$[^$]*\$)/);
  for (let i = 1; i < parts.length; i += 2) {
    const punct = /^[.,;:]/.exec(parts[i + 1] || '');
    // Not when only the mark separates two formulas: "$a$.$b$" would turn into "$$".
    if (punct && !parts[i].startsWith('$$') && (parts[i + 1].length > 1 || i + 2 >= parts.length)) {
      parts[i] = `${parts[i].slice(0, -1)}\\text{${punct[0]}}$`;
      parts[i + 1] = parts[i + 1].slice(1);
    }
  }
  return parts.map((part, i) => (i % 2 ? part : part.replace(i ? OPEN_MID : OPEN_FIRST, '$1\u201c').replace(/\x22/g, '\u201d'))).join('');
}

/** Notes prose: the panel markup, plus **bold** (applied after escaping, outside the math). */
const P = (t) => mathProse(typeset(t)).replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>');
const paras = (x) => [].concat(x).map((t) => `<p>${P(t)}</p>`).join('');

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** The route that opens a lab set up on one of its scenarios ("dist:heights"). */
function showHref(unitId, show) {
  const [labId, scenario] = show.split(':');
  return hashFor({ unitId, mode: 'explore', labId, scenario });
}

function tableHTML(x) {
  const head = x.head ? `<thead><tr>${x.head.map((h) => `<th>${P(h)}</th>`).join('')}</tr></thead>` : '';
  const rows = x.rows.map((r) => `<tr>${r.map((c) => `<td>${P(String(c))}</td>`).join('')}</tr>`).join('');
  return `<div class="tbl scroll-x"><table>${head}<tbody>${rows}</tbody></table></div>${x.note ? `<p class="note">${P(x.note)}</p>` : ''}`;
}

function block(b, unitId) {
  const [kind, x, y] = b;
  switch (kind) {
    case 'p':
      return `<p>${P(x)}</p>`;
    case 'h':
      return `<h3>${P(x)}</h3>`;
    case 'def':
      return `<p class="def"><b>${P(x)}</b> ${P(y)}</p>`;
    case 'key':
      return `<div class="box key"><span class="tag">Key idea</span>${paras(x)}</div>`;
    case 'why':
      return `<div class="box why"><span class="tag">${esc(y || 'Why it works')}</span>${paras(x)}</div>`;
    case 'warn':
      return `<div class="box warn"><span class="tag">Watch out</span>${paras(x)}</div>`;
    case 'fix':
      return `<div class="box fix"><span class="tag">Correction to the class notes</span>${paras(x)}</div>`;
    case 'bridge':
      return `<p class="bridge">${P(x)}</p>`;
    case 'list':
      return `<ul>${x.map((t) => `<li>${P(t)}</li>`).join('')}</ul>`;
    case 'steps':
      return `<ol>${x.map((t) => `<li>${P(t)}</li>`).join('')}</ol>`;
    case 'ti':
      return `<div class="box ti"><span class="tag">On the TI-84</span><ol>${x.map((t) => `<li>${P(t)}</li>`).join('')}</ol></div>`;
    case 'table':
      return tableHTML(x);
    case 'ex':
      return exampleHTML(x, unitId);
    case 'book':
      return `<div class="book"><span class="book-tag">From the textbook · ${esc(x)} · beyond the class notes</span>${y.map((c) => block(c, unitId)).join('')}</div>`;
    default:
      return '';
  }
}

function exampleHTML(e, unitId) {
  const tpl = e.problem ? problemById(e.problem) : null;
  const seed = e.case ? CASE_SEED + e.case : 0;
  const buttons = [];
  if (tpl) buttons.push(`<a class="btn small" href="${hashFor({ unitId, problemId: tpl.id, seed })}">Work it in Practice</a>`);
  if (e.show) buttons.push(`<a class="btn small nt-show" href="${showHref(unitId, e.show)}">Show this in the lab</a>`);
  return `<div class="box ex" id="ex-${esc(e.n)}">
      <span class="tag">Worked example ${esc(e.n)}${e.title ? ` · ${esc(e.title)}` : ''}</span>
      <p>${P(e.q)}</p>
      ${e.data ? tableHTML(e.data) : ''}
      <ol class="ex-steps">${e.a.map((t) => `<li>${P(t)}</li>`).join('')}</ol>
      ${e.answer ? `<p class="ex-answer">${P(e.answer)}</p>` : ''}
      ${buttons.length ? `<div class="nt-setup">${buttons.join('')}</div>` : ''}
    </div>`;
}

function linksHTML(sec, unitId) {
  const bits = [];
  const lab = sec.lab ? labById(sec.lab) : null;
  if (lab) bits.push(`<a class="btn small nt-lab" href="${hashFor({ unitId, mode: 'explore', labId: lab.id })}">See it in the ${esc(lab.title)} lab</a>`);
  for (const t of (sec.problems || []).map(problemById).filter(Boolean)) {
    bits.push(`<a class="btn small" href="${hashFor({ unitId, problemId: t.id })}">Practice · ${esc(t.title)}</a>`);
  }
  return bits.length ? `<div class="nt-links">${bits.join('')}</div>` : '';
}

function sectionHTML(sec, unitId) {
  const source = sec.source
    ? `<p class="book-note">From the textbook (${esc(sec.source)}). The class notes don't cover this section: check the syllabus for whether it is examined.</p>`
    : '';
  return `<section class="topic${sec.source ? ' book-sec' : ''}" id="s${esc(sec.id)}">
      <h2><span class="n">${esc(sec.id)}</span>${P(sec.title)}</h2>
      ${source}
      ${sec.blocks.map((b) => block(b, unitId)).join('')}
      ${linksHTML(sec, unitId)}
    </section>`;
}

function formulasHTML(N) {
  if (!N.formulas?.length) return '';
  const rows = N.formulas
    .map(([idea, result, source]) => `<tr><td>${P(idea)}${source ? ` <span class="bk" title="From the textbook, ${esc(source)}">textbook</span>` : ''}</td><td>${P(result)}</td></tr>`)
    .join('');
  return `<section class="topic" id="sformulas">
      <h2><span class="n">∑</span>Formula sheet</h2>
      <div class="tbl"><table><thead><tr><th>Idea</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table></div>
    </section>`;
}

/** The contents list, grouped by part, with the textbook sections marked. */
function tocHTML(N) {
  let part = 0;
  const out = [];
  for (const s of N.sections) {
    if (s.part) out.push(`<h3>Part ${ROMAN[part++]} · ${esc(s.part)}</h3>`);
    out.push(`<a href="#s${esc(s.id)}" data-sec="s${esc(s.id)}"><span>${esc(s.id)}</span>${P(s.title)}${s.source ? ' <i class="bk">textbook</i>' : ''}</a>`);
  }
  if (N.formulas?.length) out.push(`<a href="#sformulas" data-sec="sformulas"><span>∑</span>Formula sheet</a>`);
  return `<nav class="toc" aria-label="Contents">${out.join('')}</nav>`;
}

const LEGEND = `<div class="nt-legend" aria-label="Colour key">
    <span><i class="sw-ex"></i>Worked example</span>
    <span><i class="sw-why"></i>Why it works</span>
    <span><i class="sw-key"></i>Key idea</span>
    <span><i class="sw-fix"></i>Correction to the class notes</span>
    <span><i class="sw-book"></i>From the textbook</span>
  </div>`;

function chapterHTML(N, unit, unitId) {
  const i = unit.chapters.indexOf(N.ch);
  const prev = i > 0 ? notesFor(unit.chapters[i - 1]) : null;
  const next = i >= 0 && i < unit.chapters.length - 1 ? notesFor(unit.chapters[i + 1]) : null;
  let part = 0;
  const body = N.sections
    .map((s) => {
      const head = s.part ? `<div class="part"><div class="eyebrow">Part ${ROMAN[part++]}</div><h2>${esc(s.part)}</h2></div>` : '';
      return head + sectionHTML(s, unitId);
    })
    .join('');
  return `
    <div class="crumbs"><a href="${hashFor({ unitId, mode: 'notes' })}">← Notes</a><span class="dim">Chapter ${esc(N.ch)}</span></div>
    <article class="nt-doc">
      <header class="nt-top">
        <div class="eyebrow">STA 3032 · Chapter ${esc(N.ch)} · Class notes, rewritten</div>
        <h1>${esc(N.title)}</h1>
        ${N.lede ? `<p class="lede">${P(N.lede)}</p>` : ''}
        ${LEGEND}
        ${tocHTML(N)}
      </header>
      ${body}
      ${formulasHTML(N)}
      <footer>Rewritten from the Fall 2026 STA 3032 class notes, Chapter ${esc(N.ch)}, with the textbook (Walpole, Myers, Myers & Ye) where it is marked. Every number stated in a worked example is recomputed by the app's checks.</footer>
      <div class="row nb-pager">
        ${prev ? `<a class="btn" href="${hashFor({ unitId, mode: 'notes', chapter: prev.ch })}">← Ch ${esc(prev.ch)} · ${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a class="btn" href="${hashFor({ unitId, mode: 'notes', chapter: next.ch })}">Ch ${esc(next.ch)} · ${esc(next.title)} →</a>` : ''}
      </div>
    </article>`;
}

/** One chapter card on the Notes front page: title, the lede's first sentence, what is inside. */
function chapterCard(N, unitId) {
  const exs = examplesIn(N).length;
  const book = N.sections.filter((s) => s.source).length + N.sections.reduce((a, s) => a + s.blocks.filter((b) => b[0] === 'book').length, 0);
  const first = (N.lede || '').split(/(?<=\.)\s/)[0];
  return `<a class="card nt-card" href="${hashFor({ unitId, mode: 'notes', chapter: N.ch })}">
      <div class="eyebrow">Chapter ${esc(N.ch)}</div>
      <h3>${esc(N.title)}</h3>
      ${first ? `<p class="note">${P(first)}</p>` : ''}
      <span class="dim">${N.sections.length} sections · ${exs} worked examples${book ? ` · ${book} from the textbook` : ''}</span>
    </a>`;
}

export function renderNotes(root, { unitId, chapter }) {
  const unit = unitById(unitId);
  const N = chapter ? notesFor(chapter) : null;
  if (N) {
    root.innerHTML = `<div class="notes stack">${chapterHTML(N, unit, unitId)}</div>`;
    // Contents links scroll in place; the hash stays the chapter's route.
    root.onclick = (e) => {
      const a = e.target.closest('[data-sec]');
      if (!a) return;
      e.preventDefault();
      document.getElementById(a.dataset.sec)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    return;
  }
  const chapters = CHAPTERS.filter((c) => unit.chapters.includes(c.ch)).map((c) => notesFor(c.ch)).filter(Boolean);
  root.innerHTML = `
    <div class="stack">
      <h2>Notes</h2>
      <p class="note">The class notes for the ${esc(unit.title.toLowerCase())}, rewritten as one continuous document per chapter: the idea first, then the formula, then worked examples you can redo in Practice or watch in a lab. Where the class notes are thin, the textbook fills in, marked as such. Corrections to the class notes are marked too.</p>
      ${chapters.map((N2) => chapterCard(N2, unitId)).join('')}
    </div>`;
  root.onclick = null;
}

export { NOTES };
