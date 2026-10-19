/**
 * The reference course's practice loop, for the math and engineering shells. Copied from the reference course's practice
 * panel (src/ui/problems.js), split out so both shells' panels share one copy. The reference course keeps its
 * own until Phase 2b moves it onto a shell.
 *
 * Every feature turns on only when the course supplies what it needs, through the bank it hands
 * the panel:
 *
 *   PRINCIPLES (+ principleConfused, principleTwins) and templates' `principles` tags
 *       → the deciding principle in the solution, "what went wrong" after a miss, the weak-principle list, mixed sets
 *         that lean toward weak principles, and grouping the list by principle.
 *   fading: true          → worked examples that fade backward as a chapter is learned.
 *   pickInterleave        → every MIX_EVERY problems along a chapter list, one from earlier.
 *   sectionForProblem     → the problem → notes link (api.openNotes opens it).
 *   labDrawer: true       → the lab's controls wait in a drawer while a problem is unsolved.
 *   GLYPH + exprToTex     → the symbolic palette and the typeset preview under a formula box.
 *   a numeric part        → the phone number pad (×10^ and −), shown on touch screens only.
 *
 * Per-option `why` and numeric `traps` are graded by @flux/core; the panel shows that feedback
 * typeset. A course's coaching file is folded in by practice/coaching.js.
 */
import { isTool, primaryOf } from './principles.js';
import { createFading } from './fading.js';

/** Working a chapter's list, every fourth problem is a review from an earlier chapter. */
export const MIX_EVERY = 3;

/**
 * @param {object} bank What the course passes the panel.
 * @param {object} ctx  { esc, prose, tex, progress, body }
 */
export function createLoop(bank, { esc, prose, tex, progress, body }) {
  const P = bank.PRINCIPLES && Object.keys(bank.PRINCIPLES).length ? bank.PRINCIPLES : null;
  const fading = bank.fading ? createFading({ instance: bank.instance, render: bank.render }) : null;
  const on = {
    principles: !!P,
    fading: !!fading,
    interleave: typeof bank.pickInterleave === 'function',
    notes: typeof bank.sectionForProblem === 'function',
    drawer: !!bank.labDrawer,
    palette: !!(bank.GLYPH && bank.exprToTex),
  };
  const pname = (id) => P?.[id]?.name || id;
  const tagged = (tpl) => on.principles && !!P[primaryOf(tpl)];

  // ---------------------------------------------------------------- attempts
  /** The loop's part of a new attempt. */
  function attempt(tpl, seed, mode, view, { again = false } = {}) {
    const guide = on.fading && mode === 'practice' ? fading.guidanceFor(tpl, progress, { templates: bank.PROBLEMS, seed, steps: view.steps.length, again }) : null;
    return {
      guide,
      example: guide?.level === 'example' ? fading.workedExample(tpl, guide.exampleSeed) : null,
      guideHidden: false,
      gap: null,
    };
  }

  /** What a finished practice attempt records, beyond what the panel already knows. */
  function record(cur) {
    const rightFirst = cur.correct && cur.firstTry !== false && cur.hints === 0 && !cur.peeked;
    // Worked steps on screen make it a guided solve: it counts toward fading them out, not as clean.
    const guided = !!cur.guide;
    return {
      clean: rightFirst && !guided,
      rightFirst,
      guided,
    };
  }

  /** "Deciding principle: …" above the worked solution. */
  function principleLine(tpl) {
    if (!tagged(tpl)) return '';
    const [lead, ...also] = tpl.principles;
    return `<p class="pb-pline">Deciding principle: <b>${esc(pname(lead))}</b>${also.length ? ` · also uses ${also.map((t) => esc(pname(t))).join(', ')}` : ''}${P[lead]?.conserved ? ` · conserved: ${esc(P[lead].conserved)}` : ''}</p>`;
  }

  /**
   * After a missed attempt, ask what went wrong, in the problem's own principles. Naming the gap is
   * the moment the problem gets re-filed under the right idea; the answer is kept with its history.
   */
  function gapHTML(cur) {
    if (!on.principles || cur.mode !== 'practice' || cur.clean || !(cur.firstTry === false || cur.revealed)) return '';
    const tags = (cur.tpl.principles || []).filter((t) => P[t]);
    const want = primaryOf(cur.tpl);
    if (!tags.length) return '';
    if (cur.gap) {
      let reply;
      if (P[cur.gap]) reply = `Re-read it: ${P[cur.gap].statement} Then find the step above where it comes in.`;
      else if (cur.gap === 'which') reply = `The cue for ${pname(want)}: ${P[want].cue}`;
      else if (cur.gap === 'slip') reply = 'Slips show up in a units check and a rough size estimate before you press Check. It will be back soon with new numbers.';
      else reply = 'Next time, mark what is asked and what is given before choosing a method.';
      return `<div class="pb-gap done"><div class="pb-dim">What went wrong</div><p>${prose(reply)}</p></div>`;
    }
    const opt = (v, label) => `<button type="button" class="pb-chip" data-gap="${esc(v)}">${esc(label)}</button>`;
    return `<div class="pb-gap">
      <div class="pb-label">What went wrong?</div>
      <div class="pb-filters">
        ${tags.filter((t) => !isTool(P, t) || tags.length === 1).map((t) => opt(t, `Applying ${pname(t).replace(/^./, (c) => c.toLowerCase())}`)).join('')}
        ${!isTool(P, want) ? opt('which', 'Seeing which idea to use') : ''}
        ${opt('slip', 'A slip: sign, units, powers of ten, algebra')}
        ${opt('read', 'Misreading the question')}
      </div>
    </div>`;
  }

  function noteGap(cur, gap) {
    if (!cur || cur.gap) return false;
    cur.gap = gap;
    progress.noteGap(cur.id, gap);
    return true;
  }

  /** The principles this student misses most (at most three), for the list and for weighting sets. */
  function weakPrinciples() {
    return on.principles ? progress.principleMisses(bank.PROBLEMS).list.filter((r) => P[r.id]).slice(0, 3) : [];
  }

  /** A weight for pickSet that leans a mixed set toward the weakest principles, or null. */
  function mixedWeight() {
    const weak = new Map(weakPrinciples().map((r, i) => [r.id, 1 - i * 0.25]));
    return weak.size ? (t) => weak.get(primaryOf(t)) || 0 : null;
  }

  /** "Principles you most often miss": nothing shows until there is something to show. */
  function weakHTML(mixedSize) {
    if (!on.principles) return '';
    const { list, other } = progress.principleMisses(bank.PROBLEMS);
    const known = list.filter((r) => P[r.id]);
    if (!known.length && !other.slip && !other.read) return '';
    const rows = known.slice(0, 3).map((r) => {
      const bits = [
        r.misnamed ? `named wrong ${r.misnamed} of ${r.asked}` : '',
        r.misapplied ? `misapplied ${r.misapplied}×` : '',
        r.unseen ? `didn’t see it ${r.unseen}×` : '',
      ].filter(Boolean);
      const n = bank.PROBLEMS.filter((t) => primaryOf(t) === r.id).length;
      return `<div class="pb-weak-row">
          <div><div class="pb-weak-name">${esc(pname(r.id))}</div><div class="pb-dim">${esc(bits.join(' · '))}</div></div>
          ${n ? `<button type="button" class="btn" data-weak="${esc(r.id)}" title="${Math.min(mixedSize, n)} problems decided by this principle, weakest first">Practice</button>` : ''}
        </div>`;
    });
    const slips = [other.slip ? `slips ${other.slip}×` : '', other.read ? `misread the question ${other.read}×` : ''].filter(Boolean).join(' · ');
    return `<section class="pb-weak" aria-label="Principles you most often miss">
        <div class="pb-weak-h">Principles you most often miss</div>
        ${rows.join('') || '<p class="pb-dim">No principle stands out yet.</p>'}
        ${slips ? `<p class="pb-dim">Not about a principle: ${esc(slips)}.</p>` : ''}
        ${known.length ? '<p class="pb-dim">Mixed sets lean toward these.</p>' : ''}
      </section>`;
  }

  /** Templates decided by one principle, for "Practice" on a weak row. */
  const byPrinciple = (pid) => bank.PROBLEMS.filter((t) => primaryOf(t) === pid);

  /** Grouped by governing principle (in the order the course lists them), the given order inside. */
  function orderByPrinciple(tpls) {
    const rank = Object.fromEntries(Object.keys(P || {}).map((id, i) => [id, i]));
    const at = new Map(tpls.map((t, i) => [t.id, i]));
    return [...tpls].sort((a, b) => (rank[primaryOf(a)] ?? 99) - (rank[primaryOf(b)] ?? 99) || at.get(a.id) - at.get(b.id));
  }

  /** The list grouped by principle, each with its statement and how often it was named right. */
  function principleGroups(tpls, all, itemHTML) {
    const ordered = orderByPrinciple(tpls);
    const out = [];
    for (const pid of Object.keys(P)) {
      const inP = ordered.filter((t) => primaryOf(t) === pid);
      if (!inP.length) continue;
      const mIds = all.filter((t) => primaryOf(t) === pid).map((t) => t.id);
      const cm = Math.round(progress.mastery(mIds) * 100);
      const cc = progress.counts(mIds);
      out.push(`<section class="pb-ch pb-pgroup" data-principle-group="${esc(pid)}">
          <div class="pb-ch-head">
            <span class="pb-ch-name">${esc(P[pid].name)}</span>
            <span class="pb-ch-meter" title="${cm}% mastery"><i style="width:${cm}%"></i></span>
            <span class="pb-ch-count">${cc.mastered}/${cc.total}</span>
          </div>
          <p class="pb-pstate">${prose(P[pid].statement)}</p>
          ${inP.map((t) => itemHTML(t, { chTag: true })).join('')}
        </section>`);
    }
    return out;
  }

  // ---------------------------------------------------------------- faded worked examples
  /**
   * The worked example, or the worked first steps, for a student new to the chapter. It sits
   * above the parts, and goes away once the attempt is finished.
   */
  function guideHTML(cur) {
    const g = cur.guide;
    if (!g || cur.finished || cur.mode !== 'practice') return '';
    if (cur.guideHidden) {
      return `<div class="pb-guide hidden"><span class="pb-dim">${g.level === 'example' ? 'Worked example' : 'Worked steps'} hidden.</span> <button type="button" class="linkish" data-act="guide-show">Show ${g.level === 'example' ? 'it' : 'them'}</button></div>`;
    }
    const hide = `<button type="button" class="linkish" data-act="guide-hide">${g.level === 'example' ? 'Hide it — I’ll work it cold' : 'Hide them'}</button>`;
    if (g.level === 'example') {
      const ex = cur.example;
      return `<section class="pb-guide" aria-label="Worked example">
        <div class="pb-guide-h">Worked example <span class="pb-dim">· the same kind of problem, other numbers</span></div>
        <p class="pb-guide-text">${prose(ex.text)}</p>
        <ol class="pb-steps">${ex.steps.map((x) => `<li>${prose(x)}</li>`).join('')}</ol>
        <p class="pb-dim">Before each step, ask why it is allowed. Then solve yours below. These examples fade out as you get this chapter’s problems right.</p>
        ${hide}
      </section>`;
    }
    const n = g.shown;
    const steps = cur.view.steps.slice(0, n).map((x) => `<li>${prose(x)}</li>`).join('');
    const rest = g.of - n === 1 ? `Step ${g.of} is yours.` : `Steps ${n + 1}–${g.of} are yours.`;
    return `<section class="pb-guide faded" aria-label="Worked steps">
        <div class="pb-guide-h">Worked for you: ${n === 1 ? 'step 1' : `steps 1–${n}`} of ${g.of}</div>
        <ol class="pb-steps">${steps}</ol>
        <p class="pb-guide-yours">${rest} Finish the problem from here.</p>
        ${hide}
      </section>`;
  }

  /** The verdict over a solution, when the loop has something more specific to say. */
  function verdict(cur) {
    if (cur.mode !== 'practice' || !cur.correct || cur.clean) return null;
    if (cur.guide) {
      return cur.guide.level === 'example'
        ? 'Solved, with a worked example beside you. It will come back soon to do on your own.'
        : `Solved, with the first ${cur.guide.shown === 1 ? 'step' : `${cur.guide.shown} steps`} worked for you. Next time, one fewer.`;
    }
    return null;
  }

  /** Badges over the problem: dropped in from an earlier chapter, or guided. */
  function badges(cur, interleaved) {
    if (cur.mode === 'exam') return '';
    const mixed = interleaved ? `<span class="pb-mixed" title="Every few problems, one comes back from an earlier chapter">Review from earlier</span> ` : '';
    const guided = cur.guide ? `<span class="pb-mixed" title="New to this chapter: worked steps help, and fade as you get problems right">Guided</span> ` : '';
    return mixed + guided;
  }

  // ---------------------------------------------------------------- interleaving
  /**
   * Move on in a chapter-list session. Every MIX_EVERY problems along the path is followed by one
   * from an earlier chapter (the course's pickInterleave): retrieval spread out and mixed rather than
   * massed one chapter at a time. Returns the session position to open next.
   */
  function interleave(s, cur, i) {
    if (!on.interleave || !s?.mix || s.mixedAt?.includes(i)) return;
    s.since = (s.since || 0) + 1;
    if (s.since < MIX_EVERY) return;
    const ahead = s.ids.slice(i);
    const pick = bank.pickInterleave(bank.PROBLEMS, progress, { ch: cur.tpl.ch, exclude: [...ahead, ...(s.mixed || [])] });
    if (!pick) return;
    s.ids.splice(i + 1, 0, pick.id);
    s.mixed = [...(s.mixed || []), pick.id];
    s.mixedAt = [...(s.mixedAt || []), i + 1];
    s.since = 0;
  }

  // ---------------------------------------------------------------- notes and the lab drawer
  /** Where the notes cover this problem's idea. Not in an exam: no notes on the desk. */
  function notesLink(cur) {
    if (!on.notes || cur.mode === 'exam') return '';
    const hit = bank.sectionForProblem(cur.tpl);
    if (!hit) return '';
    return `<button type="button" class="linkish pb-notes" data-notes="${esc(hit.set.exam)}:${esc(hit.section.id)}">Notes §${hit.section.n} · ${esc(hit.section.title)}</button>`;
  }

  /**
   * The lab controls, while practising. The problem is the main thing on screen and the lab is its
   * picture; the controls wait in a closed drawer until the lab has something to teach: once the
   * problem is solved or peeked, or when it only opens the topic's lab without its numbers.
   */
  function drawerReady(cur, labId) {
    if (!on.drawer || !cur || cur.mode !== 'practice' || !cur.tpl.lab || labId !== cur.tpl.lab) return false;
    return !cur.tpl.sim || cur.finished || cur.peeked;
  }

  function setDrawer(open) {
    body.classList.toggle('lab-open', !!open);
  }

  function syncDrawer(cur, { blind, exam }) {
    if (!on.drawer) return;
    body.classList.toggle('lab-drawer', true);
    body.classList.toggle('exam-mode', !!exam);
    if (blind || exam || !cur) setDrawer(false);
  }

  function labButton(cur, labId) {
    if (!drawerReady(cur, labId)) return '';
    const open = body.classList.contains('lab-open');
    return `<button type="button" class="linkish pb-labbtn" data-act="lab" aria-pressed="${open}">${open ? 'Hide lab controls' : 'Explore in the lab'}</button>`;
  }

  // ---------------------------------------------------------------- palette and number pad
  /**
   * The formula as the parser read it, typeset. It renders the AST, so a missing bracket shows up as
   * the wrong thing under the numerator while you type. Blank until the expression parses.
   */
  function previewHTML(part, value) {
    if (!on.palette || !String(value ?? '').trim()) return '';
    const t = bank.exprToTex(value, part.vars, part.alias);
    return t ? tex(t, true) : '';
  }

  /**
   * Chips that insert a symbol at the caret: the problem's own symbols, then the constants, then the
   * operators that are awkward on a touch keyboard. `/` opens a bracketed denominator with the caret
   * inside it, because a bare slash makes `q/Aε` mean (q/A)·ε.
   */
  function paletteHTML(part, i) {
    if (!on.palette) return '';
    const G = bank.GLYPH;
    const chip = (ins, show = ins, cls = '', back = 0) =>
      `<button type="button" class="pb-key${cls}" data-key-for="${i}" data-ins="${esc(ins)}" data-back="${back}">${esc(show)}</button>`;
    const vars = part.vars.map((v) => chip(G[v] || v));
    const consts = (bank.paletteConsts || ['pi']).filter((c) => !part.vars.includes(c)).map((c) => chip(G[c] || c));
    const ops = [chip('/()', '/', ' op', 1), chip('^', '^', ' op'), chip('²', '²', ' op'), chip('√()', '√', ' op', 1), chip('()', '(', ' op', 1), chip(')', ')', ' op')];
    return `<div class="pb-pal">${vars.join('')}${consts.join('')}<span class="pb-pal-gap"></span>${ops.join('')}</div>`;
  }

  /**
   * Chips for what a phone's number pad leaves out: without them 1.6×10⁻¹⁹ or −40 cannot be entered
   * on a phone at all. Shown on touch screens only (.pb-numpal); a keyboard has e and - already.
   */
  function numPadHTML(i, held) {
    const chip = (ins) => `<button type="button" class="pb-key op" data-key-for="${i}" data-ins="${esc(ins)}" data-back="0"${held ? ' disabled' : ''}>${esc(ins)}</button>`;
    return `<div class="pb-pal pb-numpal">${chip('×10^')}${chip('−')}</div>`;
  }

  /**
   * Put `ins` in at the caret and leave the caret `back` characters from its end. insertText keeps
   * the browser's undo stack; the direct write is the fallback.
   */
  function insertAt(box, ins, back = 0) {
    if (!box || box.disabled || box.readOnly) return;
    const a = box.selectionStart ?? box.value.length;
    const b = box.selectionEnd ?? a;
    box.focus();
    if (ins === ')' && a === b && box.value[a] === ')') {
      box.setSelectionRange(a + 1, a + 1);
      return;
    }
    let ok = false;
    try {
      box.setSelectionRange(a, b);
      ok = document.execCommand('insertText', false, ins);
    } catch {
      ok = false;
    }
    if (!ok) {
      box.value = box.value.slice(0, a) + ins + box.value.slice(b);
      box.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const caret = a + ins.length - back;
    box.setSelectionRange(caret, caret);
  }

  /** The palette's keys, and `/` and `(` typed from a keyboard, which open groups the same way. */
  function installKeys(panel) {
    const PAIRS = { '/': ['/()', 1], '(': ['()', 1], ')': [')', 0] };
    if (on.palette) {
      panel.addEventListener('beforeinput', (e) => {
        if (e.inputType !== 'insertText' || !PAIRS[e.data]) return;
        const box = e.target;
        if (!box.matches?.('.pb-input.sym') || box.disabled || box.readOnly) return;
        e.preventDefault();
        const [ins, back] = PAIRS[e.data];
        insertAt(box, ins, back);
      });
      // Backspace inside an empty pair takes both brackets.
      panel.addEventListener('keydown', (e) => {
        if (e.key !== 'Backspace') return;
        const box = e.target;
        if (!box.matches?.('.pb-input.sym') || box.disabled || box.readOnly) return;
        const a = box.selectionStart;
        if (a == null || a !== box.selectionEnd || box.value[a - 1] !== '(' || box.value[a] !== ')') return;
        e.preventDefault();
        box.value = box.value.slice(0, a - 1) + box.value.slice(a + 1);
        box.dispatchEvent(new Event('input', { bubbles: true }));
        box.setSelectionRange(a - 1, a - 1);
      });
    }
    // A chip must not take the focus from its input: on a phone that drops the keyboard on every tap.
    panel.addEventListener('mousedown', (e) => {
      if (e.target.closest('button.pb-key')) e.preventDefault();
    });
    panel.addEventListener('click', (e) => {
      const key = e.target.closest('button.pb-key');
      if (!key) return;
      e.preventDefault();
      e.stopPropagation();
      insertAt(panel.querySelector(`[data-input="${key.dataset.keyFor}"]`), key.dataset.ins, Number(key.dataset.back) || 0);
    }, true);
  }

  return {
    on,
    pname,
    primaryOf,
    attempt,
    record,
    principleLine,
    gapHTML,
    noteGap,
    weakHTML,
    mixedWeight,
    byPrinciple,
    orderByPrinciple,
    principleGroups,
    guideHTML,
    verdict,
    badges,
    interleave,
    notesLink,
    drawerReady,
    setDrawer,
    syncDrawer,
    labButton,
    previewHTML,
    paletteHTML,
    numPadHTML,
    insertAt,
    installKeys,
  };
}
