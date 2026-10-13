/**
 * The class notes, rewritten from the teacher's notes (the only notes this course has), one file
 * per chapter, and laid out the way FLUX lays out its notes (src/ui/notes.js). A chapter is data:
 *
 *   {
 *     ch, title,
 *     lede: 'what the chapter is about, in a sentence or three',
 *     sections: [{ id: '1.5', title, part?, source?, lab?, problems?: [ids], blocks: [...] }],
 *     formulas: [[idea, result, source?], …],        the formula sheet that closes the chapter
 *   }
 *
 *   part     starts a new part of the chapter here, with this title (Part I, II, … in order)
 *   source   the whole section comes from the textbook, not the class notes ('Walpole §2.7')
 *
 * Blocks, all in the panel markup (prose with $…$ and $$…$$, **bold**):
 *   ['p', text]                      a paragraph
 *   ['h', text]                      a subheading inside a section
 *   ['def', term, text]              a definition: the term in bold, then its meaning
 *   ['key', text | [texts]]          a key idea, boxed
 *   ['why', text | [texts], tag?]    the reason behind a rule (tag defaults to "Why it works";
 *                                    "Derivation" for a worked derivation)
 *   ['warn', text]                   a common mistake
 *   ['fix', text]                    where the class notes slip, and the correct version
 *   ['bridge', text]                 the link from one part of the chapter to the next
 *   ['list', [items]], ['steps', [items]]
 *   ['table', { head: [...], rows: [[...]], note? }]
 *   ['ti', [steps]]                  TI-84 keystrokes
 *   ['book', 'Walpole §x.y', [blocks]]  material from the textbook inside a class-notes section
 *   ['ex', { n, title?, q, data?, a: [steps], answer?, problem?, case?, show?, checks? }]
 *        a worked example, shown open. `n` is the notes' number (1.13); a textbook example gets
 *        the chapter and a letter (2.A), never an invented textbook number. `problem` and `case`
 *        open the practice version with the same numbers (only when the case cites this example).
 *        `show: 'lab:scenario'` opens that lab set up on it. `checks` returns
 *        [[label, recomputed, stated, tolerance], …]: notes-check recomputes every stated number.
 */
import ch1 from './ch1.js';
import ch2 from './ch2.js';
import ch3 from './ch3.js';
import ch4 from './ch4.js';
import ch5 from './ch5.js';
import ch6 from './ch6.js';
import ch7 from './ch7.js';
import ch8 from './ch8.js';
import ch9 from './ch9.js';
import ch10 from './ch10.js';

export const NOTES = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10];

export const notesFor = (ch) => NOTES.find((n) => n.ch === String(ch)) || null;

/** Every block of a section, textbook blocks included, with the section it sits in. */
export function* blocksIn(N) {
  for (const sec of N.sections) {
    const walk = function* (blocks, book) {
      for (const b of blocks) {
        yield { sec, block: b, book };
        if (b[0] === 'book') yield* walk(b[2], b[1]);
      }
    };
    yield* walk(sec.blocks, sec.source || null);
  }
}

/** Every worked example in a chapter, in order. */
export const examplesIn = (N) => [...blocksIn(N)].filter((x) => x.block[0] === 'ex').map((x) => x.block[1]);
