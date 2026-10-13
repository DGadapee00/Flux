/**
 * Practice exam: 8 problems across the exam's chapters, weakest first (pickSet), 50 minutes, no
 * hints and no feedback until you submit. Or a named set sat the same way (the review sheet's eight
 * questions, src/problems/sets.js), always with fresh numbers. Answers save as you type, so a
 * reload resumes. Results show a score by chapter, and each problem then opens with its worked
 * solution.
 */
import { problemById, problemsForUnit } from '../problems/index.js';
import { instance, render, grade, accepted } from '../problems/engine.js';
import { pickSet } from '../problems/progress.js';
import { setById, setsForUnit } from '../problems/sets.js';
import { progress, reviewCap } from './practice.js';
import { CHAPTER_TITLES, unitById, unitLabel } from '../data/catalog.js';
import { hashFor } from '../engine/router.js';
import { mathProse, escapeHTML as esc } from './shared.js';

const MINUTES = 50;
const SIZE = 8;
let tick = null;

function load(unitId) {
  const ex = progress.loadExam();
  return ex && ex.unitId === unitId ? ex : null;
}
const save = (ex) => progress.saveExam(ex);

function start(unitId, setId = null) {
  const set = setById(setId);
  const tpls = set ? set.items.map((it) => problemById(it.id)) : pickSet(problemsForUnit(unitId), progress, { n: SIZE, seed: Date.now() });
  const ex = {
    unitId,
    set: set ? set.id : null,
    ids: tpls.map((t) => t.id),
    seeds: tpls.map(() => 1 + Math.floor(Math.random() * 99999)),
    answers: {},
    start: Date.now(),
    submitted: null,
    at: 0,
  };
  save(ex);
  return ex;
}

export function renderExam(root, { unitId, set = null }) {
  clearInterval(tick);
  const ex = load(unitId);
  if (!ex) return intro(root, unitId, set);
  if (ex.submitted) return results(root, ex);
  return sheet(root, ex);
}

function intro(root, unitId, setId = null) {
  const unit = unitById(unitId);
  const n = problemsForUnit(unitId).length;
  const sets = setsForUnit(unitId);
  // The kind the link asked for comes first and is the primary button.
  const mixedFirst = !setById(setId);
  const mixed = `
      <div class="card stack">
        <h3>Mixed, weakest first</h3>
        <p>${SIZE} problems from ${esc(unitLabel(unit))}, chosen across the chapters with the ones you know least first. You have ${MINUTES} minutes.</p>
        ${n < SIZE ? `<p class="note">Only ${n} problems are written for this exam so far.</p>` : ''}
        <button class="btn ${mixedFirst ? 'primary' : ''}" data-act="start">Start the clock</button>
      </div>`;
  const setCards = sets.map(
    (set) => `
      <div class="card stack">
        <h3>Like the ${esc(set.title.toLowerCase())}</h3>
        <p>The sheet's ${set.items.length} questions in its order, every part of each, with new numbers each time. You have ${MINUTES} minutes.</p>
        <button class="btn ${set.id === setId ? 'primary' : ''}" data-act="start" data-set="${set.id}">Start the clock</button>
      </div>`,
  );
  root.innerHTML = `
    <div class="stack">
      <a href="${hashFor({ unitId })}">← All problems</a>
      <h2>Practice exam</h2>
      <p class="note">No hints and no feedback until you submit, like the real thing. Use your TI-84 and your printed tables (or the Tables tab). Answers save as you go.</p>
      ${mixedFirst ? mixed + setCards.join('') : setCards.join('') + mixed}
    </div>`;
  root.onclick = (e) => {
    const b = e.target.closest('[data-act="start"]');
    if (b) {
      start(unitId, b.dataset.set || null);
      renderExam(root, { unitId });
    }
  };
}

const remaining = (ex) => Math.max(0, ex.start + MINUTES * 60e3 - Date.now());
const clock = (ms) => `${Math.floor(ms / 60e3)}:${String(Math.floor((ms % 60e3) / 1000)).padStart(2, '0')}`;

function answered(ex, i) {
  const tpl = problemById(ex.ids[i]);
  const a = ex.answers[i] || {};
  return tpl.parts.every((p) => a[p.id] != null && a[p.id] !== '');
}

function sheet(root, ex) {
  const i = Math.min(ex.at, ex.ids.length - 1);
  const tpl = problemById(ex.ids[i]);
  const inst = instance(tpl, ex.seeds[i]);
  const v = render(inst);
  const a = (ex.answers[i] = ex.answers[i] || {});
  root.innerHTML = `
    <div class="stack">
      <div class="exam-bar">
        <span class="timer" id="timer">${clock(remaining(ex))}</span>
        <button class="btn small" data-act="submit">Submit exam</button>
      </div>
      <nav class="qnav" aria-label="Questions">${ex.ids.map((_, k) => `<a href="#" data-q="${k}" class="${k === i ? 'here' : ''} ${answered(ex, k) ? 'answered' : ''}">${k + 1}</a>`).join('')}</nav>
      <h2>${i + 1}. ${esc(tpl.title)}</h2>
      <div class="card statement">${mathProse(v.text)}</div>
      ${v.figure ? `<div class="figure card">${v.figure}</div>` : ''}
      <div class="stack">
        ${v.parts
          .map((p) => {
            const label = p.label ? `<div class="part-label">${mathProse(p.label)}</div>` : '';
            if (p.kind === 'numeric') return `<div class="part">${label}<div class="answer-row"><input type="text" inputmode="decimal" autocomplete="off" data-part="${p.id}" value="${esc(a[p.id] ?? '')}" />${p.unit ? `<span class="dim">${esc(p.unit)}</span>` : ''}</div></div>`;
            return `<div class="part">${label}<div class="opts">${p.options.map((o) => `<label class="opt ${a[p.id] === o.value ? 'picked' : ''}"><input type="radio" name="${p.id}" value="${esc(JSON.stringify(o.value))}" ${a[p.id] === o.value ? 'checked' : ''} /><span>${mathProse(o.label)}</span></label>`).join('')}</div></div>`;
          })
          .join('')}
      </div>
      <div class="sheet-actions">
        <button class="btn" data-act="prev" ${i === 0 ? 'disabled' : ''}>← Previous</button>
        ${i < ex.ids.length - 1 ? '<button class="btn primary" data-act="next">Next →</button>' : '<button class="btn primary" data-act="submit">Submit exam</button>'}
      </div>
    </div>`;

  const goTo = (k) => {
    ex.at = k;
    save(ex);
    sheet(root, ex);
    window.scrollTo(0, 0);
  };
  root.oninput = (e) => {
    const id = e.target.dataset.part;
    if (id) {
      a[id] = e.target.value;
      save(ex);
    }
  };
  root.onchange = (e) => {
    if (e.target.type === 'radio') {
      a[e.target.name] = JSON.parse(e.target.value);
      save(ex);
      sheet(root, ex);
    }
  };
  root.onclick = (e) => {
    const q = e.target.closest('[data-q]');
    if (q) {
      e.preventDefault();
      goTo(Number(q.dataset.q));
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'prev') goTo(i - 1);
    if (act === 'next') goTo(i + 1);
    if (act === 'submit') {
      const blank = ex.ids.filter((_, k) => !answered(ex, k)).length;
      if (blank && !confirm(`${blank} question${blank > 1 ? 's are' : ' is'} not fully answered. Submit anyway?`)) return;
      submit(ex);
      results(root, ex);
    }
  };
  tick = setInterval(() => {
    const el = document.getElementById('timer');
    if (!el) return clearInterval(tick);
    const ms = remaining(ex);
    el.textContent = clock(ms);
    if (ms <= 0) {
      clearInterval(tick);
      submit(ex);
      results(root, ex);
    }
  }, 1000);
}

function submit(ex) {
  clearInterval(tick);
  ex.submitted = Date.now();
  ex.graded = ex.ids.map((id, k) => {
    const tpl = problemById(id);
    const inst = instance(tpl, ex.seeds[k]);
    const a = ex.answers[k] || {};
    const parts = tpl.parts.map((p) => ({ id: p.id, correct: a[p.id] != null && a[p.id] !== '' && grade(p, inst.$, a[p.id]).correct }));
    const right = parts.filter((p) => p.correct).length;
    progress.record(id, { correct: right === parts.length, clean: right === parts.length, seed: ex.seeds[k], cap: reviewCap(ex.unitId) });
    return { right, of: parts.length, parts };
  });
  save(ex);
}

function results(root, ex) {
  clearInterval(tick);
  const g = ex.graded;
  const right = g.reduce((s, x) => s + x.right, 0);
  const of = g.reduce((s, x) => s + x.of, 0);
  const byCh = new Map();
  ex.ids.forEach((id, k) => {
    const ch = problemById(id).ch;
    const r = byCh.get(ch) || { right: 0, of: 0 };
    r.right += g[k].right;
    r.of += g[k].of;
    byCh.set(ch, r);
  });
  const open = ex.review ?? null;
  root.innerHTML = `
    <div class="stack">
      <a href="${hashFor({ unitId: ex.unitId })}">← All problems</a>
      <h2>Practice exam results${ex.set ? ` · ${esc(setById(ex.set)?.short || '')}` : ''}</h2>
      <div class="card">
        <div class="score">${right} / ${of} parts · ${Math.round((100 * right) / Math.max(1, of))}%</div>
        <p class="dim">Time used: ${clock(Math.min(MINUTES * 60e3, ex.submitted - ex.start))}</p>
      </div>
      <table class="results"><thead><tr><th>Chapter</th><th>Parts right</th></tr></thead><tbody>
        ${[...byCh.entries()].map(([ch, r]) => `<tr><td>Ch ${ch} · ${esc(CHAPTER_TITLES[ch])}</td><td>${r.right} / ${r.of}</td></tr>`).join('')}
      </tbody></table>
      <nav class="qnav" aria-label="Review a question">${ex.ids.map((_, k) => `<a href="#" data-q="${k}" class="${g[k].right === g[k].of ? 'ok' : 'bad'} ${k === open ? 'here' : ''}">${k + 1}</a>`).join('')}</nav>
      <div id="review"></div>
      <button class="btn" data-act="new">New practice exam</button>
    </div>`;
  if (open != null) review(root.querySelector('#review'), ex, open);
  root.onclick = (e) => {
    const q = e.target.closest('[data-q]');
    if (q) {
      e.preventDefault();
      ex.review = Number(q.dataset.q);
      save(ex);
      results(root, ex);
    }
    if (e.target.closest('[data-act="new"]')) {
      progress.saveExam(null);
      renderExam(root, { unitId: ex.unitId, set: ex.set });
    }
  };
}

function review(el, ex, k) {
  const tpl = problemById(ex.ids[k]);
  const inst = instance(tpl, ex.seeds[k]);
  const v = render(inst);
  const a = ex.answers[k] || {};
  el.innerHTML = `
    <div class="stack">
      <h3>${k + 1}. ${esc(tpl.title)}</h3>
      <div class="card statement">${mathProse(v.text)}</div>
      ${v.figure ? `<div class="figure card">${v.figure}</div>` : ''}
      ${tpl.parts
        .map((p, j) => {
          const rp = v.parts[j];
          const ok = ex.graded[k].parts[j].correct;
          const yours = p.kind === 'choice' ? rp.options.find((o) => o.value === a[p.id])?.label ?? '—' : a[p.id] || '—';
          const want = p.kind === 'choice' ? rp.options.find((o) => o.value === (typeof p.correct === 'function' ? p.correct(inst.$) : p.correct))?.label : accepted(p, inst.$).map((x) => String(Number(x.toPrecision(5)))).filter((x, i, l) => l.indexOf(x) === i).join(' or ');
          return `<div class="part ${ok ? 'right' : 'wrong'}">${rp.label ? `<div class="part-label">${mathProse(rp.label)}</div>` : ''}
            <div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? 'Right' : 'Wrong'}: you wrote ${mathProse(String(yours))}${ok ? '' : `<span class="why">Answer: ${mathProse(String(want))}</span>`}</div></div>`;
        })
        .join('')}
      <div class="card steps"><h3>Worked solution</h3><ol>${v.steps.map((s) => `<li>${mathProse(s)}</li>`).join('')}</ol></div>
      <a class="btn" href="${hashFor({ unitId: ex.unitId, problemId: tpl.id })}">Practice this one again</a>
    </div>`;
}
