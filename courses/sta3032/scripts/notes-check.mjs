/**
 * The notes, headless. For every chapter:
 *   - it has a title and a lede; section ids are unique and belong to the chapter; every block is
 *     a known kind, textbook blocks included;
 *   - all the TeX parses, and no text says NaN or undefined;
 *   - every linked problem exists, and a linked worked case exists and cites the same example;
 *   - every linked lab exists, and every "Show this in the lab" names a lab and one of its scenarios;
 *   - textbook material names its Walpole section, and its examples are lettered (2.A), so no
 *     textbook example number is ever invented;
 *   - every worked example's `checks` hold: each number the notes state is recomputed from the
 *     data (an example with stated numbers and no checks fails, unless it is only symbolic).
 *
 *   node scripts/notes-check.mjs
 */
import { NOTES, blocksIn } from '../src/notes/index.js';
import { problemById } from '../src/problems/index.js';
import { labById } from '../src/labs/index.js';
import { mathPieces, texError } from '../src/ui/shared.js';

let checks = 0;
let fails = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) {
    fails++;
    console.log(`FAIL ${msg}`);
  }
  return cond;
};

function text(where, s) {
  const str = String(s);
  ok(!/\bNaN\b|undefined/.test(str), `${where}: says ${str}`);
  for (const p of mathPieces(str)) {
    ok(!p.unclosed, `${where}: unclosed $ in ${JSON.stringify(str.slice(0, 80))}`);
    if (!p.unclosed) {
      const e = texError(p.src, p.display);
      ok(!e, `${where}: TeX ${JSON.stringify(p.src)}: ${e}`);
    }
  }
  ok((str.match(/\*\*/g) || []).length % 2 === 0, `${where}: unbalanced ** in ${JSON.stringify(str.slice(0, 80))}`);
}
const texts = (where, x) => [].concat(x).forEach((t) => text(where, t));

const KINDS = new Set(['p', 'h', 'def', 'key', 'list', 'steps', 'table', 'ex', 'ti', 'why', 'fix', 'warn', 'bridge', 'book']);
const WALPOLE = /^Walpole §\d+\.\d+/;
// Symbolic examples (a derivation with no numbers to recompute) may skip `checks`.
const SYMBOLIC = new Set(['7.2', '7.3', '8.1', '8.3']);

let examples = 0;
let recomputed = 0;
let book = 0;
for (const N of NOTES) {
  const W = `notes ch${N.ch}`;
  ok(N.title && N.sections.length, `${W}: needs a title and sections`);
  ok(typeof N.lede === 'string' && N.lede.length > 40, `${W}: needs a lede`);
  if (N.lede) text(`${W} lede`, N.lede);
  const ids = N.sections.map((s) => s.id);
  ok(new Set(ids).size === ids.length, `${W}: duplicate section ids`);
  for (const id of ids) ok(id.startsWith(`${N.ch}.`), `${W}: section ${id} is not in chapter ${N.ch}`);
  for (const [idea, result, source] of N.formulas || []) {
    text(`${W} formula sheet`, idea);
    text(`${W} formula sheet`, result);
    if (source) ok(WALPOLE.test(source), `${W} formula sheet: source "${source}" is not a Walpole section`);
  }
  for (const sec of N.sections) {
    const S = `${W} §${sec.id}`;
    text(`${S} title`, sec.title);
    if (sec.part) text(`${S} part`, sec.part);
    if (sec.source) ok(WALPOLE.test(sec.source), `${S}: source "${sec.source}" is not a Walpole section`);
    if (sec.lab) ok(labById(sec.lab), `${S}: no lab ${sec.lab}`);
    for (const id of sec.problems || []) ok(problemById(id), `${S}: no problem ${id}`);
  }
  const exNumbers = new Set();
  for (const { sec, block, book: fromBook } of blocksIn(N)) {
    const S = `${W} §${sec.id}`;
    const [kind, x, y] = block;
    ok(KINDS.has(kind), `${S}: unknown block ${kind}`);
    if (['p', 'h', 'bridge'].includes(kind)) text(`${S} ${kind}`, x);
    if (['key', 'why', 'fix', 'warn'].includes(kind)) texts(`${S} ${kind}`, x);
    if (kind === 'def') {
      text(`${S} def`, x);
      text(`${S} def`, y);
    }
    if (['list', 'steps', 'ti'].includes(kind)) for (const t of x) text(`${S} ${kind}`, t);
    if (kind === 'table') for (const r of [x.head || [], ...x.rows]) for (const c of r) text(`${S} table`, c);
    if (kind === 'book') {
      book++;
      ok(WALPOLE.test(x), `${S}: textbook block "${x}" does not name a Walpole section`);
      ok(Array.isArray(y) && y.length, `${S}: empty textbook block`);
    }
    if (kind === 'ex') {
      examples++;
      const E = `${S} Ex ${x.n}`;
      ok(!exNumbers.has(x.n), `${E}: duplicate example number`);
      exNumbers.add(x.n);
      // Textbook examples are lettered; the class notes' are numbered.
      if (fromBook) ok(new RegExp(`^${N.ch}\\.[A-Z]$`).test(x.n), `${E}: a textbook example is numbered ${N.ch}.A, ${N.ch}.B, …`);
      else ok(/^\d+\.\d+$/.test(x.n), `${E}: a class-notes example keeps the notes' number`);
      text(`${E} q`, x.q);
      if (x.title) text(`${E} title`, x.title);
      for (const t of x.a) text(`${E} step`, t);
      if (x.answer) text(`${E} answer`, x.answer);
      if (x.data) for (const r of [x.data.head || [], ...x.data.rows]) for (const c of r) text(`${E} data`, c);
      if (x.show) {
        const [labId, sc] = String(x.show).split(':');
        const lab = labById(labId);
        if (ok(lab, `${E}: show names no lab ${labId}`)) ok(lab.scenarios.some((s) => s.id === sc), `${E}: the ${labId} lab has no scenario ${sc}`);
      }
      if (x.problem) {
        const tpl = problemById(x.problem);
        ok(tpl, `${E}: no problem ${x.problem}`);
        ok(!fromBook, `${E}: a textbook example links a practice case, which would cite the class notes`);
        if (tpl && x.case != null) {
          const c = tpl.cases?.[x.case];
          ok(c, `${E}: ${x.problem} has no case ${x.case}`);
          // The case must cite this example: "Notes Ex 4.1, 4.6" covers 4.6, "Ex 3.3–3.4" covers 3.4.
          if (c) ok(/Notes Ex/.test(c.src) && new RegExp(`(^|[^\\d.])${x.n.replace('.', '\\.')}($|[^\\d])`).test(c.src), `${E}: case ${x.case} of ${x.problem} is "${c.src}", not this example`);
        }
      }
      if (x.checks) {
        for (const [label, got, want, tol] of x.checks()) {
          recomputed++;
          ok(Number.isFinite(got) && Math.abs(got - want) <= tol + 1e-12, `${E} ${label}: the notes say ${want}, recomputed ${got}`);
        }
      } else {
        const states = /\d\.\d|=\s*\d/.test(x.a.join(' ') + (x.answer || ''));
        ok(!states || SYMBOLIC.has(x.n), `${E}: states numbers but has no checks`);
      }
    }
  }
}
console.log(`notes-check: ${NOTES.length} chapters, ${examples} worked examples (${book} textbook blocks), ${recomputed} numbers recomputed, ${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
