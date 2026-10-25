/**
 * The practice loop (practice/*.js) against the fixture course: each feature on when the course
 * supplies its data, and off when it does not.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { memoryStorage } from '@flux/core';
import { coachingProblems, foldCoaching } from '../practice/coaching.js';
import { createFading } from '../practice/fading.js';
import { MIX_EVERY, createLoop } from '../practice/loop.js';
import { isTool, primaryOf } from '../practice/principles.js';
import { COACHING, PRINCIPLES, PROBLEMS, engine, fullBank, makeProgress } from './fixture/bank.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const classes = () => {
  const set = new Set();
  return { classList: { toggle: (c, on) => (on ? set.add(c) : set.delete(c)), contains: (c) => set.has(c) }, set };
};
const byId = (id) => PROBLEMS.find((p) => p.id === id);

function loopFor(bank, progress = makeProgress()) {
  const body = classes();
  return { loop: createLoop(bank, { esc, prose: esc, tex: (t) => `<tex>${t}</tex>`, progress, body }), progress, body };
}

test('principle tags: the primary is first, and a Tools principle is a tool', () => {
  assert.equal(primaryOf(byId('f.1.force')), 'newton');
  assert.deepEqual(byId('f.1.force').principles.slice(0, 2), ['newton', 'kinematics']);
  assert.ok(isTool(PRINCIPLES, 'units'));
  assert.ok(!isTool(PRINCIPLES, 'newton'));
});

test('fading: an example first, then fewer worked steps, then none', () => {
  const fading = createFading(engine);
  const progress = makeProgress();
  const t = byId('f.1.formula');
  const steps = engine.render(engine.instance(t, 5)).steps.length;
  const first = fading.guidanceFor(t, progress, { templates: PROBLEMS, seed: 5, steps });
  assert.equal(first.level, 'example');
  assert.notDeepEqual(engine.instance(t, first.exampleSeed).$, engine.instance(t, 5).$, 'the example has other numbers');
  assert.equal(fading.workedExample(t, first.exampleSeed).steps.length, steps);
  progress.record('f.1.force', { correct: true, clean: true });
  const faded = fading.guidanceFor(t, progress, { templates: PROBLEMS, seed: 5, steps });
  assert.deepEqual([faded.level, faded.shown, faded.of], ['faded', steps - 1, steps]);
  progress.record('f.1.formula', { correct: true, clean: true });
  assert.equal(fading.guidanceFor(t, progress, { templates: PROBLEMS, seed: 5, steps }), null, 'solved: working alone');
  assert.equal(fading.guidanceFor(byId('f.1.which'), makeProgress(), { templates: PROBLEMS, seed: 5, steps: 2 }), null, 'never for a choice problem');
});

test('coaching: hints continue the ladder, and each wrong option gets its why', () => {
  const t = byId('f.1.which');
  assert.equal(t.hints.length, 3);
  assert.equal(t.hints[2], 'Energy skips the time entirely.');
  for (const o of t.parts[0].options) assert.ok(o.why, `option ${o.value} has a why`);
  const r = engine.grade(t.parts[0], {}, 'momentum');
  assert.equal(r.correct, false);
  assert.equal(r.feedback, 'No time or force-over-time is given.');
  assert.deepEqual(coachingProblems(PROBLEMS, COACHING), []);
  assert.match(coachingProblems(PROBLEMS, { 'no.such': {} })[0], /not in the bank/);
  // Traps from a coaching file add to a template's own.
  const copy = foldCoaching([structuredClone({ id: 'x', parts: [{ id: 'p', kind: 'numeric', traps: [] }] })], { x: { traps: { p: [[() => 1, 'one']] } } });
  assert.equal(copy[0].parts[0].traps.length, 1);
});

test('traps: a known wrong value names its mistake', () => {
  const t = byId('f.1.formula');
  const inst = engine.instance(t, 3);
  const $ = inst.$;
  const r = engine.grade(t.parts[1], $, String(0.5 * $.a * $.t * $.t));
  assert.equal(r.correct, false);
  assert.equal(r.feedback, 'That is the distance, ½at².');
  assert.ok(engine.grade(t.parts[1], $, String($.a * $.t)).correct);
});

test('the loop: every feature on with the full bank', () => {
  const { loop, progress, body } = loopFor(fullBank());
  assert.deepEqual(loop.on, { principles: true, fading: true, interleave: true, notes: true, drawer: true, palette: true });
  const t = byId('f.1.force');
  const view = engine.render(engine.instance(t, 2));
  const extra = loop.attempt(t, 2, 'practice', view);
  assert.equal(extra.principle, undefined, 'there is no principle step');
  assert.equal(extra.guide.level, 'example');
  const cur = { ...extra, id: t.id, tpl: t, view, mode: 'practice', finished: false, correct: false, firstTry: null, hints: 0, peeked: false, revealed: false };
  assert.equal(loop.principleHTML, undefined, 'the loop has no principle step to render');
  assert.equal(loop.pickPrinciple, undefined);
  assert.equal(loop.gated, undefined, 'nothing holds the parts back');
  assert.match(loop.guideHTML(cur), /Worked example/);
  assert.match(loop.notesLink(cur), /Notes §1 · Particles/);
  assert.match(loop.principleLine(t), /Deciding principle: <b>Newton’s second law<\/b> · also uses Kinematics/);

  // A miss: what went wrong, recorded against the principle, then listed as weak.
  Object.assign(cur, { finished: true, correct: false, firstTry: false, revealed: true });
  const rec = loop.record(cur);
  assert.equal(rec.clean, false);
  assert.equal(rec.principle, undefined);
  progress.record(t.id, { correct: false });
  assert.match(loop.gapHTML(cur), /What went wrong\?/);
  assert.ok(loop.noteGap(cur, 'newton'));
  assert.match(loop.gapHTML(cur), /Re-read it/);
  assert.match(loop.weakHTML(5), /Principles you most often miss[\s\S]*Newton’s second law/);
  assert.ok(loop.mixedWeight()(t) > 0, 'mixed sets lean toward the weak principle');

  // The drawer opens once the problem is done, on its own lab.
  assert.equal(loop.drawerReady(cur, 'demo'), true);
  assert.equal(loop.drawerReady(cur, 'other'), false);
  assert.match(loop.labButton(cur, 'demo'), /Explore in the lab/);
  loop.setDrawer(true);
  assert.ok(body.classList.contains('lab-open'));

  // Palette for a formula, the number pad for a number.
  const sym = byId('f.1.formula').parts[0];
  assert.match(loop.paletteHTML(sym, 0), /data-ins="\/\(\)"/);
  assert.match(loop.previewHTML(sym, 'a*t'), /<tex>/);
  assert.match(loop.numPadHTML(1, false), /×10\^/);
});

test('interleaving: after MIX_EVERY problems, one from an earlier chapter', () => {
  const { loop, progress } = loopFor(fullBank());
  for (const t of PROBLEMS.filter((p) => p.ch === '1')) progress.record(t.id, { correct: true, clean: true, now: Date.now() - 30 * 864e5 });
  const s = { ids: ['f.2.impulse', 'f.2.rest'], mix: true };
  const cur = { tpl: byId('f.2.impulse') };
  for (let k = 0; k < MIX_EVERY; k++) loop.interleave(s, cur, 0);
  assert.equal(s.ids.length, 3);
  assert.equal(byId(s.ids[1]).ch, '1', 'the problem dropped in comes from chapter 1');
  assert.deepEqual(s.mixedAt, [1]);
});

test('the loop: every feature off when the course supplies nothing', () => {
  const plain = { ...fullBank() };
  for (const k of ['PRINCIPLES', 'fading', 'pickInterleave', 'sectionForProblem', 'labDrawer', 'GLYPH']) delete plain[k];
  const { loop } = loopFor(plain);
  assert.deepEqual(Object.values(loop.on).filter(Boolean), []);
  const t = byId('f.1.force');
  const view = engine.render(engine.instance(t, 2));
  const extra = loop.attempt(t, 2, 'practice', view);
  assert.equal(extra.guide, null);
  const cur = { ...extra, tpl: t, view, mode: 'practice', finished: true, peeked: false, clean: false, firstTry: false, revealed: true };
  for (const html of [loop.guideHTML(cur), loop.gapHTML(cur), loop.weakHTML(5), loop.notesLink(cur), loop.principleLine(t), loop.labButton(cur, 'demo'), loop.paletteHTML(byId('f.1.formula').parts[0], 0)]) {
    assert.equal(html, '');
  }
  assert.equal(loop.mixedWeight(), null);
  // The number pad needs only a numeric part.
  assert.match(loop.numPadHTML(0, false), /pb-numpal/);
});

test('an exam attempt gets no guide', () => {
  const { loop } = loopFor(fullBank({ storage: memoryStorage() }));
  const t = byId('f.1.force');
  const extra = loop.attempt(t, 2, 'exam', engine.render(engine.instance(t, 2)));
  assert.equal(extra.guide, null);
  assert.equal(loop.notesLink({ tpl: t, mode: 'exam' }), '');
});
