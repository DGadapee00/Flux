#!/usr/bin/env node
/**
 * Guard for the panel markup (src/ui/shared.js): TeX written inside an ordinary template literal.
 *
 * `` `$V_{\text{rms}}$` `` is not the string it looks like — JavaScript turns `\t` into a tab, so
 * KaTeX receives `V_{<TAB>ext{rms}}` and silently renders "extrms". The same trap is waiting in
 * \vec (\v), \frac (\f), \rho (\r), \neq (\n) and \begin (\b).
 *
 * Fix one of two ways: tag the literal with String.raw, or double the backslash.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');
// Any backslash before a letter: \t, \v, \f … become control characters, and one that is no JS
// escape at all (\Delta, \Sigma, \Phi) quietly loses its backslash — "Delta V" in italics.
const EATEN = /\\+[A-Za-z]/g;

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

/** Template literals, with `${…}` skipped so a nested literal does not end this one early. */
function literals(src) {
  const out = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== '`') continue;
    let j = i + 1;
    let depth = 0;
    while (j < src.length) {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === '`' && depth === 0) break;
      if (src[j] === '$' && src[j + 1] === '{') { depth++; j += 2; continue; }
      if (src[j] === '}' && depth > 0) depth--;
      j++;
    }
    out.push({ start: i, text: src.slice(i + 1, j), raw: src.slice(Math.max(0, i - 10), i).endsWith('String.raw') });
    i = j;
  }
  return out;
}

/** Template text with each `${…}` (code, not TeX) replaced by a space. */
function withoutInterpolations(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '$' && text[i + 1] === '{') {
      let d = 1;
      i += 2;
      while (i < text.length && d) {
        if (text[i] === '{') d++;
        else if (text[i] === '}') d--;
        i++;
      }
      i--;
      out += ' ';
    } else out += text[i];
  }
  return out;
}

const problems = [];
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  for (const lit of literals(src)) {
    // A `$` that does not open an interpolation is an inline-math delimiter; math needs a pair.
    const delims = (lit.text.match(/\$(?!\{)/g) || []).length;
    if (delims < 2) continue;
    if (lit.raw) {
      // The opposite slip: inside String.raw a doubled backslash stays doubled, and KaTeX reads \\
      // as a line break followed by the letters ("R_{\\text{eq}}" prints "text eq").
      for (const m of withoutInterpolations(lit.text).matchAll(/(?<!\\)\\\\[A-Za-z]/g)) {
        const line = src.slice(0, lit.start).split('\n').length;
        problems.push(`${file}:${line}: doubled backslash inside String.raw — …${lit.text.slice(Math.max(0, m.index - 30), m.index + 30)}…`);
      }
      continue;
    }
    for (const m of lit.text.matchAll(EATEN)) {
      // An even run of backslashes is a literal backslash: `\\text` is fine, `\text` is not.
      if ((m[0].length - 1) % 2 === 0) continue;
      const line = src.slice(0, lit.start).split('\n').length;
      const near = lit.text.slice(Math.max(0, m.index - 40), m.index + 30);
      problems.push(`${file}:${line}: \\${m[0].slice(-1)} is read as a JS escape here, so the TeX is broken — …${near}…`);
    }
  }
}

/**
 * Quoted strings ('…' and "…") in code, including those nested in a template's `${…}`:
 * `String.raw\`$P(X ${'\le'} 3)$\`` looks right but JavaScript turns '\le' into "le". A backslash
 * before a letter that is not a JS escape (\n \r \t \b \f \v \u \x) is always a lost one.
 * Template text and comments are blanked first so their apostrophes do not look like quotes.
 */
function codeOnly(src) {
  const out = src.split('');
  const blank = (a, b) => {
    for (let k = a; k < b; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  let i = 0;
  const stack = []; // template nesting: brace depth at which each open template's ${ } closes
  let depth = 0;
  while (i < src.length) {
    const c = src[i];
    const inTemplateText = stack.length && stack[stack.length - 1].text;
    if (inTemplateText) {
      const start = i;
      while (i < src.length && src[i] !== '`' && !(src[i] === '$' && src[i + 1] === '{')) i += src[i] === '\\' ? 2 : 1;
      blank(start, i);
      if (src[i] === '`') {
        stack.pop();
        i++;
      } else {
        stack[stack.length - 1].text = false;
        stack[stack.length - 1].depth = depth;
        depth++;
        i += 2;
      }
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      const e = src.indexOf('\n', i);
      blank(i, e < 0 ? src.length : e);
      i = e < 0 ? src.length : e;
    } else if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      blank(i, e < 0 ? src.length : e + 2);
      i = e < 0 ? src.length : e + 2;
    } else if (c === "'" || c === '"') {
      i++;
      while (i < src.length && src[i] !== c && src[i] !== '\n') i += src[i] === '\\' ? 2 : 1;
      i++;
    } else if (c === '`') {
      stack.push({ text: true, depth: 0 });
      i++;
    } else if (c === '{') {
      depth++;
      i++;
    } else if (c === '}') {
      depth--;
      if (stack.length && !stack[stack.length - 1].text && depth === stack[stack.length - 1].depth) stack[stack.length - 1].text = true;
      i++;
    } else i++;
  }
  return out.join('');
}

for (const file of walk(ROOT)) {
  const code = codeOnly(fs.readFileSync(file, 'utf8'));
  for (const m of code.matchAll(/(['"])((?:(?!\1)[^\\\n]|\\.)*)\1/g)) {
    for (const e of m[2].matchAll(/\\(.)/g)) {
      if (/[A-Za-z]/.test(e[1]) && !'nrtbfvux'.includes(e[1])) {
        const line = code.slice(0, m.index).split('\n').length;
        problems.push(`${file}:${line}: ${m[0]} — JavaScript drops the backslash before "${e[1]}"`);
      }
    }
  }
}

if (problems.length) {
  console.error(`tex-check: ${problems.length} literal(s) where JavaScript eats the TeX\n`);
  for (const p of problems) console.error('  ' + p);
  console.error('\nUse String.raw`…` or double the backslash.');
  process.exit(1);
}
console.log('tex-check: panel markup is clean');
