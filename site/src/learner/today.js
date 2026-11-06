/**
 * Today: the top of the hub. It reads the learner's record from every course app and says what to
 * do now: review the problems that are due, grouped by thread on the map, then learn the next
 * concept whose prerequisites are solid. Beside it, the next PHY 2049 exam and the courses in hand.
 *
 * `#review-<concept id>` opens a thread review in place of the rest of the hub: one concept at a
 * time, recalled before its problems, each problem opened in its own course app. The thread is fixed when the review starts
 * and kept for the tab's session, so a problem solved in another tab ticks off here when the hub
 * tab comes back into view. Nothing here writes to a course's record.
 */
import katex from 'katex';
import { COURSES, LAB_CATALOGS, labHref, SUBJECTS } from '@flux/map';
import { esc, prose, tex } from '../map.js';
import { createLearner } from './model.js';
import { phyExams, readItems } from './records.js';
import './today.css';

const SESSION_KEY = 'flux.hub.review.v1';
const STATUS_LABEL = { solid: 'Solid', assumed: 'From a course you took', learning: 'Learning', ready: 'Ready', locked: 'Not yet' };
const RECALL = { got: 'I had it', partly: 'Partly', not: 'Not really' };
const subjectOf = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
const courseOf = Object.fromEntries(COURSES.map((c) => [c.id, c]));
const code = (id) => courseOf[id]?.code || id.toUpperCase();
const lane = (subject) => `var(${subjectOf[subject].token})`;

/** A problem title: plain text with `$…$` TeX. */
function titleHtml(s) {
  return String(s)
    .split(/(\$[^$]+\$)/g)
    .map((part) => (/^\$[^$]+\$$/.test(part) ? katex.renderToString(part.slice(1, -1), { throwOnError: false }) : esc(part)))
    .join('');
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

const session = {
  read() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  },
  write(value) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
    } catch {
      /* private mode: the review still works until the tab closes */
    }
  },
};

/**
 * @param {{
 *   concepts: any[],
 *   paths: Record<string, any>,
 *   problems: { byLab: Record<string, string[]>, titles: Record<string, string> },
 *   root?: Document,
 *   readRecord?: () => Record<string, any>,
 *   clock?: () => number,
 *   onPath?: (course: string) => void,
 *   onRefresh?: () => void,
 *   onLeaveReview?: () => void,
 * }} opts
 */
export function mountToday({ concepts, paths, problems, root = document, readRecord = readItems, clock = Date.now, onPath = () => {}, onRefresh = () => {}, onLeaveReview = () => {} }) {
  const section = root.getElementById('today');
  const byId = Object.fromEntries(concepts.map((c) => [c.id, c]));
  /** The lab a problem belongs to, for its link. */
  const labOf = {};
  for (const [labKey, keys] of Object.entries(problems.byLab)) for (const k of keys) labOf[k] = labKey.split('/')[1];

  let learner;
  function refresh() {
    const now = clock();
    learner = createLearner({
      concepts,
      courses: COURSES,
      paths,
      exams: phyExams(paths, new Date(now).getFullYear()),
      byLab: problems.byLab,
      items: readRecord(),
      now,
    });
    return learner;
  }
  refresh();

  /** A link that opens one problem in its course app, ready to answer. */
  function problemHref(key) {
    const [course, id] = key.split(':');
    const lab = labOf[key];
    const meta = LAB_CATALOGS[course]?.[lab];
    if (!meta) return null;
    return `${labHref({ course, unit: meta.unit, lab })}?p=${encodeURIComponent(id)}`;
  }

  function conceptLink(id, text = byId[id].title) {
    return `<a href="#${esc(id)}" data-concept="${esc(id)}">${esc(text)}</a>`;
  }

  /** A thread as text: → where one builds on the last, a comma for siblings, a semicolon for a branch. */
  function chain(groups) {
    return groups.map((g, i) => {
      const prev = groups[i - 1];
      const sep = i === 0 ? ''
        : g.parent?.id === prev.concept ? ' <span aria-label="leads to">→</span> '
        : g.parent && g.parent.id === prev.parent?.id ? ', '
        : '; ';
      return `${sep}${esc(byId[g.concept].title)}`;
    }).join('');
  }

  function lanesLine(subjects) {
    return subjects.map((s) => `<span style="color:${lane(s)}">${esc(subjectOf[s].label)}</span>`).join(' <span aria-label="into">→</span> ');
  }

  function examWhen(exam) {
    const day = new Date(exam.day);
    day.setHours(0, 0, 0, 0);
    const today = new Date(learner.now);
    today.setHours(0, 0, 0, 0);
    const d = Math.round((day.getTime() - today.getTime()) / 864e5);
    return d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`;
  }

  // ---------- The overview ----------

  function renderOverview() {
    const all = learner.threads();
    const today = all.filter((t) => t.today);
    const later = all.filter((t) => !t.today);
    const todayN = today.reduce((s, t) => s + t.n, 0);
    const dueN = all.reduce((s, t) => s + t.n, 0);
    const next = learner.nextUp(3);
    const exam = learner.upcoming[0];
    const words = ['', 'One short review', 'Two short reviews', 'Three short reviews', 'Four short reviews'];

    let headline;
    if (today.length) headline = `${words[today.length]}.${next.length ? ` Then learn <em>${esc(byId[next[0]].title)}</em>.` : ''}`;
    else if (next.length) headline = `${learner.started.size ? 'Nothing to review. ' : ''}Learn <em>${esc(byId[next[0]].title)}</em> next.`;
    else headline = 'Nothing due today.';
    const sub = exam ? `${esc(code(exam.course))} Exam ${exam.n}, ${esc(exam.title)}, is ${examWhen(exam)}.` : '';

    const review = today.length
      ? `<p class="tdy-note">Each review follows one thread on the map: a concept, then the ideas built on it, in order. A thread can cross subjects, the way flux runs from calculus into electricity. Do one at a sitting, about ${Math.max(2, Math.round(todayN * 1.5))} minutes in all.</p>
         <ul class="tdy-threads">${today.map((t) => `<li><a class="tdy-thread" href="#review-${esc(t.key)}" style="--lane:${lane(t.subjects[0])}">
           <span class="tdy-eyebrow">${lanesLine(t.subjects)}${t.exam ? ` · for Exam ${t.exam.n}` : ''}</span>
           <span class="tdy-chain">${chain(t.groups)}</span>
           <span class="tdy-meta">${plural(t.groups.length, 'concept')} · ${plural(t.n, 'problem')} · about ${Math.max(2, Math.round(t.n * 1.5))} min${t.missed ? ` · ${t.missed} missed last time` : ''}</span>
           <span class="tdy-go">Start this thread →</span></a></li>`).join('')}</ul>
         ${later.length ? `<p class="tdy-meta tdy-later">${plural(later.reduce((s, t) => s + t.n, 0), 'more problem')} can wait for tomorrow: ${later.map((t) => `${esc(byId[t.key].title)}${t.groups.length > 1 ? ` and ${t.groups.length - 1} more` : ''} (${t.n})`).join(', ')}. A day’s delay costs little; the gaps between reviews are widening anyway.</p>` : ''}`
      : learner.started.size
        ? '<p class="tdy-note">Nothing is due. A problem comes back here when its next review date arrives.</p>'
        : '<p class="tdy-note">Nothing to review yet. Practise in any course app below, and each problem you solve comes back here on a widening schedule: a day, three days, a week, then longer.</p>';

    const learn = next.length
      ? `<ul class="tdy-next">${next.map((id) => nextCard(id)).join('')}</ul>`
      : '<p class="tdy-note">Every concept you can reach is learning or solid.</p>';

    section.innerHTML = `
      <div class="tdy-head">
        <p class="tdy-eyebrow">${esc(new Date(learner.now).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
        <h2 id="today-title" class="tdy-headline">${headline}</h2>
        ${sub ? `<p class="tdy-sub">${sub}</p>` : ''}
      </div>
      <div class="tdy-grid">
        <div class="tdy-main">
          <section class="tdy-step" aria-labelledby="tdy-review-title"><span class="tdy-n" aria-hidden="true">1</span><div class="tdy-body">
            <div class="tdy-row"><h3 id="tdy-review-title">Review</h3>${dueN ? `<span class="tdy-meta">${dueN} due</span>` : ''}</div>${review}</div></section>
          <section class="tdy-step" aria-labelledby="tdy-next-title"><span class="tdy-n" aria-hidden="true">2</span><div class="tdy-body">
            <div class="tdy-row"><h3 id="tdy-next-title">Learn next</h3></div>
            <p class="tdy-note">Concepts whose prerequisites are all solid, starting with the courses you are taking.</p>${learn}</div></section>
        </div>
        <aside class="tdy-side">${exam ? examCard(exam) : ''}${coursesCard()}</aside>
      </div>`;
  }

  function nextCard(id) {
    const c = byId[id];
    const where = (learner.pathIndex[id] || []).find((p) => courseOf[p.course]?.status === 'taking now') || (learner.pathIndex[id] || [])[0];
    const bits = [];
    if (where) bits.push(`${esc(code(where.course))}${where.unit ? `, ${esc(where.unit.replace(/^(Exam \d+):.*/, '$1'))}` : ''}`);
    bits.push(c.requires.length ? `All ${plural(c.requires.length, 'prerequisite')} solid` : 'Needs nothing first');
    const opens = learner.opens(id);
    if (opens) bits.push(`Opens the way to ${plural(opens, 'concept')}`);
    const st = learner.stats(id);
    bits.push(c.labs.length ? `${c.labs.length > 1 ? `${c.labs.length} labs` : 'A lab'}${st.all ? ` and ${plural(st.all, 'problem')}` : ''}` : 'No Flux lab yet. Start from the sources');
    return `<li><a class="tdy-card" href="#${esc(id)}" data-concept="${esc(id)}" style="--lane:${lane(c.subject)}">
      <span class="tdy-eyebrow" style="color:var(--lane)">${esc(subjectOf[c.subject].label)}</span>
      <span class="tdy-card-title">${esc(c.title)}</span>
      <span class="tdy-why">${bits.map((b) => `<span>${b}</span>`).join('')}</span></a></li>`;
  }

  function pill(status) {
    return `<span class="tdy-pill is-${status}">${STATUS_LABEL[status]}</span>`;
  }

  function examCard(exam) {
    const solid = exam.concepts.filter(learner.met).length;
    return `<section class="tdy-panel" aria-labelledby="tdy-exam-title">
      <p class="tdy-eyebrow">${esc(code(exam.course))} · ${examWhen(exam) === 'today' ? 'Today' : esc(new Date(exam.day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }))}</p>
      <h3 id="tdy-exam-title">Exam ${exam.n}: ${esc(exam.title)}</h3>
      <p class="tdy-note">${solid} of ${plural(exam.concepts.length, 'concept')} solid.</p>
      <div class="tdy-bar"><span style="width:${(100 * solid) / exam.concepts.length}%"></span></div>
      <ul class="tdy-list">${exam.concepts.map((id) => `<li>${conceptLink(id)}${pill(learner.status(id))}</li>`).join('')}</ul>
    </section>`;
  }

  function coursesCard() {
    const list = COURSES.filter((c) => paths[c.id] && (c.status === 'taking now' || c.status === 'next term' || c.kind === 'project'));
    if (!list.length) return '';
    return `<section class="tdy-panel" aria-labelledby="tdy-courses-title">
      <h3 id="tdy-courses-title">Your courses</h3>
      <ul class="tdy-courses">${list.map((c) => {
        const p = learner.courseProgress(c.id);
        return `<li><div class="tdy-row"><a href="#explore" data-path="${esc(c.id)}"><strong>${esc(c.code)}</strong> ${esc(c.title)}</a><span class="tdy-meta">${p.solid}/${p.total}</span></div>
          <div class="tdy-bar"><span style="width:${p.total ? (100 * p.solid) / p.total : 0}%"></span></div>
          <span class="tdy-meta">${c.kind === 'project' ? 'Project' : c.status === 'taking now' ? 'Taking now' : 'Next term'}</span></li>`;
      }).join('')}</ul></section>`;
  }

  // ---------- A thread review ----------

  /** The thread named by `key`, fixed when the review starts and kept for the tab's session. */
  function openReview(key) {
    const saved = session.read();
    if (saved && saved.key === key) return saved;
    const t = learner.threads().find((x) => x.key === key);
    if (!t) return null;
    const fresh = {
      key,
      started: learner.now,
      subjects: t.subjects,
      exam: t.exam ? t.exam.n : null,
      groups: t.groups.map((g) => ({ concept: g.concept, parent: g.parent, rows: g.rows.map((r) => ({ key: r.key, missed: r.missed })) })),
      i: 0,
      shown: false,
      rated: {},
    };
    session.write(fresh);
    return fresh;
  }

  function connection(s, i) {
    const g = s.groups[i];
    if (!g.parent) return 'Where this thread starts.';
    const p = byId[g.parent.id].title;
    const ago = s.groups[i - 1]?.concept === g.parent.id ? 'which you just reviewed' : 'which you reviewed earlier in this thread';
    if (!g.parent.via.length) return `It builds on ${esc(p)}, ${ago}.`;
    const names = g.parent.via.map((id) => conceptLink(id));
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
    return `${esc(p)}, ${ago}, leads here through ${list}.`;
  }

  /** The record as last read, for ticking off problems solved since a review started. */
  let record = {};
  function solved(s, key) {
    const it = record[key];
    return Boolean(it && it.last >= s.started);
  }

  function renderReview(key) {
    const s = openReview(key);
    if (!s) {
      section.innerHTML = `<div class="tdy-head"><p class="tdy-eyebrow"><a href="#today">Today</a> / Review</p>
        <h2 id="today-title" class="tdy-headline">Nothing is due on this thread.</h2>
        <p class="tdy-sub">It may be done already. <a href="#today">Back to today</a>.</p></div>`;
      return;
    }
    record = readRecord();
    const groups = s.groups;
    const n = groups.reduce((sum, g) => sum + g.rows.length, 0);
    const finished = s.i >= groups.length;
    const rail = `<ol class="tdy-rail" style="--count:${groups.length}">${groups.map((g, i) => `<li class="${i < s.i ? 'is-done' : i === s.i ? 'is-now' : ''}"><button type="button" data-goto="${i}"${i === s.i ? ' aria-current="step"' : ''}><span class="tdy-seg"></span><span class="tdy-lbl">${esc(byId[g.concept].title)}</span></button></li>`).join('')}</ol>`;
    let body;
    if (finished) {
      const rated = Object.entries(s.rated);
      const weak = groups.filter((g) => s.rated[g.concept] && s.rated[g.concept] !== 'got').map((g) => g.concept);
      const done = groups.flatMap((g) => g.rows).filter((r) => solved(s, r.key)).length;
      const next = learner.threads().find((t) => t.today && t.key !== s.key);
      body = `<section class="tdy-panel tdy-recall"><p class="tdy-eyebrow">Thread done</p>
        <h3 class="tdy-big">${plural(groups.length, 'concept')}, ${done} of ${plural(n, 'problem')} solved</h3>
        <p>${rated.length ? `You recalled ${rated.filter(([, v]) => v === 'got').length} of ${plural(rated.length, 'concept')} without help. ` : ''}${weak.length ? `Worth a second look on the map: ${weak.map((id) => conceptLink(id)).join(', ')}.` : ''}</p>
        <p class="tdy-meta">Each problem you solved moves to its next review date in its course. One you skipped stays due.</p>
        <div class="tdy-actions">${next ? `<a class="tdy-btn" href="#review-${esc(next.key)}">Next thread: ${esc(byId[next.key].title)} →</a>` : ''}<a class="tdy-btn quiet" href="#today">Back to today</a></div></section>`;
    } else {
      const g = groups[s.i];
      const c = byId[g.concept];
      const rating = s.rated[c.id];
      body = `<section class="tdy-panel tdy-recall" style="--lane:${lane(c.subject)}">
          <p class="tdy-eyebrow" style="color:var(--lane)">Concept ${s.i + 1} of ${groups.length} · ${esc(subjectOf[c.subject].label)}</p>
          <h3 class="tdy-big">${esc(c.title)}</h3>
          <p class="tdy-link">${connection(s, s.i)}</p>
          <p>Before the problems, recall it. Say the idea in a sentence and write its key equation. Then check.</p>
          ${s.shown
            ? `<div class="tdy-eq">${tex(c.eq, true)}</div><p class="tdy-idea">${prose(c.idea)}</p>
               <div class="tdy-rate" role="group" aria-label="How did you do?"><span class="tdy-meta">How did you do?</span>${Object.entries(RECALL).map(([k, v]) => `<button type="button" class="tdy-btn ${rating === k ? '' : 'quiet'}" data-rate="${k}" aria-pressed="${rating === k}">${v}</button>`).join('')}</div>`
            : '<div class="tdy-actions"><button type="button" class="tdy-btn" data-show>Show the idea</button></div>'}
        </section>
        ${s.shown ? `<section class="tdy-panel" aria-labelledby="tdy-probs-title">
          <div class="tdy-row"><h3 id="tdy-probs-title">Its problems</h3><span class="tdy-meta">${g.rows.length} due</span></div>
          <ul class="tdy-problems">${g.rows.map((r) => {
            const href = problemHref(r.key);
            const done = solved(s, r.key);
            return `<li class="${done ? 'is-done' : ''}"><span class="tdy-tick" aria-label="${done ? 'Solved' : 'Not yet solved'}">${done ? '✓' : ''}</span>
              <div class="tdy-body"><strong>${titleHtml(problems.titles[r.key] || r.key.split(':')[1])}</strong><span class="tdy-meta">${esc(code(r.key.split(':')[0]))}${r.missed ? ' · missed last time' : ''}${done ? ' · solved' : ''}</span></div>
              ${href ? `<a class="tdy-solve" href="${href}" target="_blank" rel="noopener">${done ? 'Again' : 'Solve'} ↗</a>` : ''}</li>`;
          }).join('')}</ul>
          <p class="tdy-meta">Solve opens the problem in its course app in a new tab. Come back here and it ticks off.</p>
          <div class="tdy-actions"><button type="button" class="tdy-btn" data-next>${s.i + 1 < groups.length ? `Next: ${esc(byId[groups[s.i + 1].concept].title)} →` : 'Finish this thread'}</button></div>
        </section>` : ''}`;
    }
    section.innerHTML = `
      <div class="tdy-head">
        <p class="tdy-eyebrow"><a href="#today">Today</a> / Thread review · ${lanesLine(s.subjects)}${s.exam ? ` · for Exam ${s.exam}` : ''}</p>
        <h2 id="today-title" class="tdy-headline">From ${esc(byId[s.key].title)}</h2>
        <p class="tdy-sub">${chain(groups)} · ${plural(n, 'problem')}</p>
      </div>
      ${rail}
      <div class="tdy-session">${body}</div>`;
  }

  // ---------- Wiring ----------

  const reviewKey = () => {
    const h = decodeURIComponent(root.defaultView.location.hash.slice(1));
    return h.startsWith('review-') ? h.slice('review-'.length) : null;
  };
  function render() {
    const key = reviewKey();
    const leaving = section.dataset.mode === 'review' && !key;
    section.dataset.mode = key ? 'review' : 'today';
    // A review is one sitting: the rest of the hub steps aside until you leave it.
    root.body.classList.toggle('tdy-reviewing', Boolean(key));
    // The map may have been laid out while hidden; let it draw again now it shows.
    if (leaving) onLeaveReview();
    if (key) renderReview(key);
    else renderOverview();
  }

  section.addEventListener('click', (e) => {
    const t = /** @type {HTMLElement} */ (e.target).closest('[data-show],[data-rate],[data-next],[data-goto],[data-concept],[data-path]');
    if (!t) return;
    if (t.dataset.path) {
      e.preventDefault();
      onPath(t.dataset.path);
      root.getElementById('explore')?.scrollIntoView({ block: 'start' });
      return;
    }
    if (t.hasAttribute('data-concept')) {
      // The concept opens on the map below; the hash change brings the map into view.
      toMap = true;
      return;
    }
    const s = session.read();
    if (!s) return;
    if (t.dataset.goto != null) {
      s.i = Number(t.dataset.goto);
      s.shown = false;
    } else if (t.hasAttribute('data-show')) s.shown = true;
    else if (t.dataset.rate) s.rated[s.groups[s.i].concept] = t.dataset.rate;
    else if (t.hasAttribute('data-next')) {
      s.i += 1;
      s.shown = false;
    }
    session.write(s);
    renderReview(s.key);
    if (t.hasAttribute('data-next') || t.dataset.goto != null) section.scrollIntoView({ block: 'start' });
  });

  /** Set by a concept link in Today, so the map comes into view once the concept has opened. */
  let toMap = false;
  root.defaultView.addEventListener('hashchange', () => {
    const key = reviewKey();
    const h = decodeURIComponent(root.defaultView.location.hash.slice(1));
    if (key || h === 'today') {
      render();
      section.scrollIntoView({ block: 'start' });
      return;
    }
    if (section.dataset.mode === 'review') render();
    if (toMap && byId[h]) root.getElementById('explore')?.scrollIntoView({ block: 'start' });
    toMap = false;
  });
  // A problem solved in a course tab: read the record again when this tab is back in view.
  root.addEventListener('visibilitychange', () => {
    if (root.visibilityState !== 'visible') return;
    refresh();
    render();
    onRefresh();
  });

  render();
  if (reviewKey()) section.scrollIntoView({ block: 'start' });

  return {
    get learner() {
      return learner;
    },
    refresh() {
      refresh();
      render();
    },
    /** The learner's record for one concept, for the map's reading panel. */
    recordHtml(id) {
      const c = byId[id];
      const st = learner.stats(id);
      const status = learner.status(id);
      let line;
      if (st.tried) {
        line = `${st.solid} of ${plural(st.n, 'problem')} solid${st.due ? `, ${st.due} due now` : st.next < Infinity ? `, next review in ${plural(Math.max(1, learner.daysTo(st.next)), 'day')}` : ''}.`;
      } else if (status === 'assumed') line = st.all ? `${plural(st.all, 'problem')} check it. Your first solve starts the record.` : 'No Flux practice measures it yet.';
      else if (status === 'locked') {
        const missing = c.requires.filter((r) => !learner.met(r));
        line = `Builds on ${missing.map((r) => conceptLink(r)).join(', ')}, not solid yet.`;
      } else line = st.all ? `${plural(st.all, 'problem')} to practise. Your first solve starts the record.` : 'Learn it from the lab and the sources below.';
      const first = learner.problemsOf[id].find((k) => st.dueKeys.includes(k)) || learner.problemsOf[id][0];
      const href = first ? problemHref(first) : null;
      return `<div class="tdy-record">${pill(status)}<span>${line}</span>${href ? `<a href="${href}">${st.due ? 'Review now' : 'Practise'} ↗</a>` : ''}</div>`;
    },
  };
}
