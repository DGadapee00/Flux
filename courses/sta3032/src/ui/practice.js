/**
 * Practice: the problem list for an exam, and the problem sheet.
 *
 * The loop, as in FLUX: open a problem (its first attempt uses the notes' or textbook's numbers,
 * later ones fresh numbers), answer, Check. A wrong part says why when it can (the complement,
 * one tail for two, s for σ). Hints come one at a time; the worked solution names every table
 * lookup. A clean solve (right on the first check, no hints, no solution) moves the problem up the
 * spaced-review ladder; anything less brings it back sooner (src/problems/progress.js).
 *
 * Sessions: working down the list, a mixed set, the review queue or a named set (the review sheet,
 * src/problems/sets.js), Next follows the session. A named set's session can pin each problem's
 * version: the sheet's own numbers, or fresh numbers chosen when the session starts.
 */
import { PROBLEMS, problemById, problemsForUnit } from '../problems/index.js';
import { instance, render, grade, accepted, caseIndex, seedForAttempt } from '../problems/engine.js';
import { createProgress, pickSet, MASTERED_BOX } from '../problems/progress.js';
import { setsForUnit, setById, sheetSeed } from '../problems/sets.js';
import { CHAPTER_TITLES, unitById, unitLabel } from '../data/catalog.js';
import { hashFor } from '../engine/router.js';
import { labsForChapter } from '../labs/index.js';
import { mathProse, escapeHTML as esc } from './shared.js';

export const progress = createProgress();

/** The list a Next button walks: set by whatever opened the problem. */
let session = null;

const STATUS_TEXT = { new: 'New', learning: 'Learning', due: 'Due for review', missed: 'Missed last time', mastered: 'Mastered' };

function daysUntil(dateStr, now = new Date()) {
  const d = new Date(`${dateStr}T12:00:00`);
  return Math.round((d - now) / 864e5);
}

/** Problems in list order: chapter by chapter, in the bank's order within each. */
function ordered(unitId) {
  return problemsForUnit(unitId);
}

export function dueCount(unitId) {
  return progress.dueIds(ordered(unitId).map((t) => t.id)).length;
}

// ---------------------------------------------------------------- list
/**
 * Today: at most three concrete next steps, so a first visit (or a stressed one) knows what to do.
 * Due reviews first; then the earliest chapter not started (read its notes, then its first
 * problem) or, when every chapter is started, the next unmastered problem in the weakest one;
 * then when to sit a practice exam.
 */
function todayHTML(unitId, unit, byCh, due, days) {
  const steps = [];
  if (due.length) steps.push(`<a href="#" data-act="review">Review the ${due.length} problem${due.length === 1 ? '' : 's'} due</a>: spaced review is what makes it stick.`);
  const chapters = [...byCh.entries()].map(([ch, tpls]) => ({ ch, tpls, c: progress.counts(tpls.map((t) => t.id)), m: progress.mastery(tpls.map((t) => t.id)) }));
  const fresh = chapters.find((x) => x.c.seen === 0);
  if (fresh) {
    steps.push(
      `Start Ch ${fresh.ch}, ${esc(CHAPTER_TITLES[fresh.ch])}: <a href="${hashFor({ unitId, mode: 'notes', chapter: fresh.ch })}">read its notes</a>, then try <a href="${hashFor({ unitId, problemId: fresh.tpls[0].id })}">${esc(fresh.tpls[0].title)}</a>.`,
    );
  } else {
    const weak = chapters.filter((x) => x.c.mastered < x.c.total).sort((a, b) => a.m - b.m)[0];
    if (weak) {
      const next = weak.tpls.find((t) => progress.status(t.id) !== 'mastered') || weak.tpls[0];
      steps.push(`Your weakest chapter is Ch ${weak.ch} (${weak.c.mastered}/${weak.c.total} mastered): try <a href="${hashFor({ unitId, problemId: next.id })}">${esc(next.title)}</a>.`);
    }
  }
  for (const set of setsForUnit(unitId)) {
    const untried = set.items.filter((it) => !progress.get(it.id)?.attempts).length;
    if (untried) steps.push(`Work the <a href="#" data-act="set" data-set="${set.id}" data-numbers="sheet">${esc(set.title.toLowerCase())}</a>: ${set.items.length} questions with the sheet's own numbers, then again with new ones.`);
  }
  const examAt = new Date(`${unit.date}T00:00:00`);
  const fmt = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
  if (days >= 1 && days <= 4) steps.push(`<a href="${hashFor({ unitId, mode: 'exam' })}">Take a practice exam</a> today, timed, then review what you missed.`);
  else if (days > 4) steps.push(`Plan a timed <a href="${hashFor({ unitId, mode: 'exam' })}">practice exam</a> around ${fmt(new Date(examAt - 4 * 864e5))} and another on ${fmt(new Date(examAt - 864e5))}.`);
  if (!steps.length) return '';
  return `<div class="card today"><h3>Today</h3><ol>${steps.slice(0, 3).map((x) => `<li>${x}</li>`).join('')}</ol></div>`;
}

export function renderList(root, { unitId }) {
  const unit = unitById(unitId);
  const list = ordered(unitId);
  const ids = list.map((t) => t.id);
  const due = progress.dueIds(ids);
  const days = daysUntil(unit.date);
  const when = days > 1 ? `in ${days} days` : days === 1 ? 'tomorrow' : days === 0 ? 'today' : `${-days} days ago`;
  const byCh = new Map();
  for (const t of list) {
    if (!byCh.has(t.ch)) byCh.set(t.ch, []);
    byCh.get(t.ch).push(t);
  }
  const missingChapters = unit.chapters.filter((ch) => !byCh.has(ch));

  root.innerHTML = `
    <div class="stack">
      <div class="unit-head">
        <h2>${esc(unitLabel(unit))}</h2>
        <span class="countdown">${esc(when)}</span>
      </div>
      ${todayHTML(unitId, unit, byCh, due, days)}
      <div class="actions">
        <button class="btn ${due.length ? 'primary' : ''}" data-act="review" ${due.length ? '' : 'disabled'}>Review due<small>${due.length ? `${due.length} problem${due.length === 1 ? '' : 's'}` : 'nothing due yet'}</small></button>
        <button class="btn ${due.length ? '' : 'primary'}" data-act="mixed">Mixed set<small>5, weakest first</small></button>
        <a class="btn" href="${hashFor({ unitId, mode: 'exam' })}">Practice exam<small>8 problems · 50 min</small></a>
      </div>
      ${setsForUnit(unitId).map((set) => setCard(unitId, set)).join('')}
      <div class="legend" aria-label="Status key">
        ${['new', 'learning', 'due', 'missed', 'mastered'].map((s) => `<span><i class="dot ${s}"></i>${STATUS_TEXT[s]}</span>`).join('')}
      </div>
      ${[...byCh.entries()]
        .map(([ch, tpls]) => {
          const m = progress.mastery(tpls.map((t) => t.id));
          const c = progress.counts(tpls.map((t) => t.id));
          return `
          <details class="chapter" ${c.seen > 0 && c.mastered < c.total ? 'open' : ''}>
            <summary>
              <span class="ch-title"><b>Ch ${ch}</b>${esc(CHAPTER_TITLES[ch])}</span>
              <span class="dim">${c.mastered}/${c.total} mastered</span>
              <span class="mastery" aria-hidden="true"><i style="width:${Math.round(m * 100)}%"></i></span>
            </summary>
            <ul class="plist">
              ${tpls
                .map((t) => {
                  const st = progress.status(t.id);
                  return `<li><a href="${hashFor({ unitId, problemId: t.id })}" data-open="${t.id}">
                    <i class="dot ${st}" title="${STATUS_TEXT[st]}"></i>
                    <span>${esc(t.title)}</span>
                    <span class="tag">${t.kind === 'conceptual' ? 'concept' : t.level > 1 ? 'multi-step' : 'compute'}</span>
                  </a></li>`;
                })
                .join('')}
            </ul>
          </details>`;
        })
        .join('')}
      ${missingChapters.length ? `<p class="note">Problems for Ch ${missingChapters.join(', ')} are not written yet.</p>` : ''}
    </div>`;

  root.onclick = (e) => {
    const open = e.target.closest('[data-open]');
    if (open) session = { name: 'list', ids, unitId };
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act) e.preventDefault();
    if (act === 'review' && due.length) startSession(unitId, 'review', due);
    if (act === 'mixed') startSession(unitId, 'mixed', pickSet(list, progress, { n: 5, seed: Date.now() }).map((t) => t.id));
    if (act === 'set') {
      const el = e.target.closest('[data-act]');
      startSetSession(unitId, setById(el.dataset.set), el.dataset.numbers);
    }
  };
}

function startSession(unitId, name, ids, extra = {}) {
  if (!ids.length) return;
  session = { name, ids, unitId, ...extra };
  location.hash = hashFor({ unitId, problemId: ids[0], seed: session.seeds?.[ids[0]] ?? null });
}

/** A named set in order: each problem at the sheet's numbers, or at fresh numbers for this session. */
function startSetSession(unitId, set, numbers) {
  if (!set) return;
  const ids = set.items.map((it) => it.id);
  const seeds = Object.fromEntries(set.items.map((it) => [it.id, numbers === 'sheet' ? sheetSeed(it) ?? null : 1 + Math.floor(Math.random() * 99999)]));
  startSession(unitId, 'set', ids, { seeds, label: set.short });
}

/** A named set on the list: what it is, one chip per question (its status), and three ways in. */
function setCard(unitId, set) {
  const chips = set.items
    .map((it, i) => {
      const st = progress.status(it.id);
      const cls = st === 'mastered' ? 'ok' : st === 'missed' ? 'bad' : st === 'new' ? '' : 'answered';
      const seed = sheetSeed(it);
      return `<a href="${hashFor({ unitId, problemId: it.id, seed })}" class="${cls}" title="Q${i + 1}: ${esc(problemById(it.id)?.title || '')} (${STATUS_TEXT[st]})">${i + 1}</a>`;
    })
    .join('');
  return `
    <div class="card stack set-card">
      <h3>${esc(set.title)}</h3>
      <p class="note">${esc(set.blurb)} Each question opens with the sheet's numbers; tap a number to go straight to it.</p>
      <nav class="qnav" aria-label="${esc(set.title)}: questions">${chips}</nav>
      <div class="actions">
        <button class="btn" data-act="set" data-set="${set.id}" data-numbers="sheet">The sheet<small>its own numbers</small></button>
        <button class="btn" data-act="set" data-set="${set.id}" data-numbers="new">New numbers<small>same questions</small></button>
        <a class="btn" href="${hashFor({ unitId, mode: 'exam', set: set.id })}">Timed<small>8 questions · 50 min</small></a>
      </div>
    </div>`;
}

// ---------------------------------------------------------------- problem sheet

/** The exam the student is practising for (it caps review dates). */
let unitNow = null;

/** One attempt at one version of one template. */
function newAttempt(tpl, seed) {
  const inst = instance(tpl, seed);
  const ci = caseIndex(tpl, seed);
  return {
    tpl,
    seed,
    inst,
    caseIndex: ci,
    case: ci >= 0 ? tpl.cases[ci] : null,
    view: render(inst),
    answers: {},
    results: {},
    checks: 0,
    firstRight: null,
    hints: 0,
    revealed: false,
    finished: false,
    correct: false,
  };
}

let current = null;

export function renderProblem(root, { unitId, problemId, seed }) {
  unitNow = unitId;
  const tpl = problemById(problemId);
  if (!tpl) {
    root.innerHTML = `<p class="note">No problem called “${esc(problemId)}”. <a href="${hashFor({ unitId })}">Back to the list</a>.</p>`;
    return;
  }
  if (seed == null) {
    // No version in the link: the notes' numbers first, fresh numbers after that. Write it into
    // the URL so a reload or a shared link opens the same version.
    const s = seedForAttempt(tpl, progress.get(tpl.id)?.attempts || 0);
    history.replaceState(null, '', hashFor({ unitId, problemId, seed: s }));
    seed = s;
  }
  if (!current || current.tpl.id !== tpl.id || current.seed !== seed) current = newAttempt(tpl, seed);
  draw(root, unitId);
}

function sessionInfo(unitId) {
  if (!session || session.unitId !== unitId || !current) return null;
  const i = session.ids.indexOf(current.tpl.id);
  if (i < 0) return null;
  const label = session.label || { list: 'Chapter list', review: 'Review', mixed: 'Mixed set' }[session.name] || '';
  return { i, n: session.ids.length, next: session.ids[i + 1] || null, label };
}

function partHTML(p, a) {
  const res = a.results[p.id];
  const cls = res ? (res.correct ? 'right' : 'wrong') : '';
  const locked = a.finished;
  const label = p.label ? `<div class="part-label">${mathProse(p.label)}</div>` : '';
  let body = '';
  if (p.kind === 'numeric') {
    const val = a.answers[p.id] ?? '';
    body = `<div class="answer-row">
      <input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-part="${p.id}" value="${esc(val)}" ${locked ? 'readonly' : ''} aria-label="${esc((p.label || 'Answer').replace(/\$/g, ''))}" placeholder="${p.prob ? 'e.g. 0.3085' : 'your answer'}" />
      ${p.unit ? `<span class="dim">${esc(p.unit)}</span>` : ''}
    </div>`;
  } else if (p.kind === 'choice') {
    const picked = a.answers[p.id];
    body = `<div class="opts" role="radiogroup">${p.options
      .map((o) => {
        const isPicked = picked === o.value;
        const mark = a.finished && res ? (o.value === a.expected?.[p.id] ? 'right' : isPicked ? 'wrong' : '') : res && isPicked ? (res.correct ? 'right' : 'wrong') : isPicked ? 'picked' : '';
        return `<label class="opt ${mark}">
          <input type="radio" name="${p.id}" value="${esc(JSON.stringify(o.value))}" ${isPicked ? 'checked' : ''} ${locked ? 'disabled' : ''} />
          <span>${mathProse(o.label)}</span>
        </label>`;
      })
      .join('')}</div>`;
  }
  let verdict = '';
  if (res) {
    verdict = res.correct
      ? `<div class="verdict ok">Right${res.note ? ` <span class="why">${mathProse(res.note)}</span>` : ''}</div>`
      : `<div class="verdict bad">${res.empty ? 'Not answered' : 'Not yet'}${res.feedback ? `<span class="why">${mathProse(res.feedback)}</span>` : ''}</div>`;
  }
  if (a.finished && p.kind === 'numeric' && !res?.correct) {
    const vals = accepted(current.tpl.parts.find((q) => q.id === p.id), a.inst.$);
    verdict += `<div class="verdict"><span class="why">Answer: ${vals.length > 1 ? `${fmt(vals[0])} (table route ${[...new Set(vals.slice(1).map(fmt))].join(' or ')})` : fmt(vals[0])}</span></div>`;
  }
  return `<div class="part ${cls}">${label}${body}${verdict}</div>`;
}

/** "See it in a lab" under a solution. */
function labLinks(unitId, ch) {
  const labs = labsForChapter(ch);
  if (!labs.length) return '';
  return `<p class="note" style="margin-top:10px">See it in a lab: ${labs.map((l) => `<a href="${hashFor({ unitId, mode: 'explore', labId: l.id })}">${esc(l.title)}</a>`).join(' · ')}</p>`;
}

const fmt = (v) => String(Number(Number(v).toPrecision(5)));

function draw(root, unitId) {
  const a = current;
  const tpl = a.tpl;
  const v = a.view;
  const s = sessionInfo(unitId);
  const hintsLeft = v.hints.length - a.hints;
  const status = progress.status(tpl.id);

  root.innerHTML = `
    <div class="stack">
      <div class="crumbs">
        <a href="${hashFor({ unitId })}">← ${s && s.label !== 'Chapter list' ? `${s.label} ${s.i + 1} of ${s.n}` : 'All problems'}</a>
        <span class="dim">Ch ${tpl.ch} · ${esc(tpl.src || '')}</span>
      </div>
      <h2>${esc(tpl.title)}</h2>
      ${a.case ? `<p class="dim">These are the numbers from ${esc(a.case.src)}.${a.caseIndex < tpl.cases.length - 1 ? ' Your next attempts go through the other worked examples, then new numbers.' : ' Try it again for new numbers.'}</p>` : ''}
      <div class="card statement">${mathProse(v.text)}</div>
      ${v.figure ? `<div class="figure card">${v.figure}</div>` : ''}
      <div class="parts stack">${tpl.parts.map((p) => partHTML(v.parts.find((q) => q.id === p.id), a)).join('')}</div>
      ${a.hints ? `<div class="card hints"><h3>Hints</h3><ol>${v.hints.slice(0, a.hints).map((h) => `<li>${mathProse(h)}</li>`).join('')}</ol></div>` : ''}
      ${a.finished ? finishedHTML(a, status) : ''}
      ${a.finished || a.revealed ? `<div class="card steps"><h3>Worked solution</h3><ol>${v.steps.map((st) => `<li>${mathProse(st)}</li>`).join('')}</ol>${a.case?.note ? `<p class="note" style="margin-top:10px"><b>About the source:</b> ${mathProse(a.case.note)}</p>` : ''}${labLinks(unitId, tpl.ch)}</div>` : ''}
      <div class="sheet-actions">
        ${
          a.finished
            ? `<button class="btn primary" data-act="next">${s?.next ? 'Next problem →' : 'Back to the list'}</button>
               <button class="btn" data-act="again">${a.caseIndex >= 0 && a.caseIndex + 1 < tpl.cases.length ? 'Next worked example' : 'Same problem, new numbers'}</button>`
            : `<button class="btn primary" data-act="check">Check</button>
               <button class="btn" data-act="hint" ${hintsLeft ? '' : 'disabled'}>Hint${hintsLeft ? ` (${hintsLeft})` : ''}</button>
               <button class="btn ghost" data-act="reveal">Show solution</button>`
        }
      </div>
    </div>`;

  root.oninput = (e) => {
    const id = e.target.dataset.part;
    if (id) a.answers[id] = e.target.value;
  };
  root.onchange = (e) => {
    if (e.target.type === 'radio') {
      a.answers[e.target.name] = JSON.parse(e.target.value);
      delete a.results[e.target.name];
      draw(root, unitId);
    }
  };
  root.onkeydown = (e) => {
    if (e.key === 'Enter' && e.target.dataset.part && !a.finished) {
      e.preventDefault();
      check(root, unitId);
    }
  };
  root.onclick = (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'check') check(root, unitId);
    if (act === 'hint' && a.hints < v.hints.length) {
      a.hints++;
      draw(root, unitId);
    }
    if (act === 'reveal') {
      a.revealed = true;
      finish(false);
      draw(root, unitId);
    }
    if (act === 'again') {
      // Next worked example if there is one this student has not met, else fresh numbers.
      const seed = a.caseIndex >= 0 && a.caseIndex + 1 < tpl.cases.length ? seedForAttempt(tpl, a.caseIndex + 1) : 1 + Math.floor(Math.random() * 99999);
      current = newAttempt(tpl, seed);
      location.hash = hashFor({ unitId, problemId: tpl.id, seed });
    }
    if (act === 'next') {
      current = null;
      location.hash = s?.next ? hashFor({ unitId, problemId: s.next, seed: session?.seeds?.[s.next] ?? null }) : hashFor({ unitId });
    }
  };
}

function finishedHTML(a) {
  if (a.correct && a.firstRight && !a.hints) return `<div class="card done-banner">Right first time. It comes back for review in a few days.</div>`;
  if (a.correct) return `<div class="card done-banner">Solved. Because it took ${a.hints ? 'hints' : 'more than one check'}, it comes back sooner for review.</div>`;
  return `<div class="card done-banner missed">Study the worked solution, then try “Same problem, new numbers”. This one comes back in 10 minutes.</div>`;
}

function check(root, unitId) {
  const a = current;
  const tpl = a.tpl;
  a.checks++;
  let all = true;
  for (const p of tpl.parts) {
    if (p.kind === 'self') continue;
    const input = a.answers[p.id];
    if (input == null || input === '') {
      a.results[p.id] = { correct: false, empty: true, feedback: '' };
      all = false;
      continue;
    }
    const g = grade(p, a.inst.$, input);
    // A right answer that matches only the table route is still right; say which one it matched.
    a.results[p.id] = g;
    if (!g.correct) all = false;
  }
  // Clean is judged part by part: each part must be right the first time it is checked with an
  // answer in it, so checking (a) before answering (b) does not spoil a clean solve.
  a.firstPart ||= {};
  for (const p of tpl.parts) {
    const r = a.results[p.id];
    if (r && !r.empty && !(p.id in a.firstPart)) a.firstPart[p.id] = r.correct;
  }
  a.firstRight = tpl.parts.every((p) => p.kind === 'self' || a.firstPart[p.id] !== false);
  if (all) finish(true);
  draw(root, unitId);
  announce(all ? 'All parts right.' : 'Some parts are not right yet.');
}

function finish(correct) {
  const a = current;
  if (a.finished) return;
  a.finished = true;
  a.correct = correct && !a.revealed;
  a.expected = Object.fromEntries(a.tpl.parts.filter((p) => p.kind === 'choice').map((p) => [p.id, typeof p.correct === 'function' ? p.correct(a.inst.$) : p.correct]));
  for (const p of a.tpl.parts) if (p.kind === 'choice' && !a.results[p.id]) a.results[p.id] = { correct: false, empty: true };
  progress.record(a.tpl.id, {
    correct: a.correct,
    clean: a.correct && a.firstRight && a.hints === 0,
    hints: a.hints,
    revealed: a.revealed,
    seed: a.seed,
    cap: reviewCap(unitNow),
  });
}

/** No review is scheduled past noon the day before the exam being studied for. */
export function reviewCap(unitId) {
  const u = unitById(unitId);
  return u ? new Date(`${u.date}T00:00:00`).getTime() - 12 * 3600e3 : null;
}

function announce(msg) {
  const el = document.getElementById('sr-announce');
  if (el) el.textContent = msg;
}

export { PROBLEMS, MASTERED_BOX };
