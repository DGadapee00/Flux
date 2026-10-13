import katex from 'katex';

/** House style, so every panel spells the same quantity the same way. */
const TEX_MACROS = {
  '\\xbar': '\\bar{x}',
  '\\phat': '\\hat{p}',
  '\\Xbar': '\\bar{X}',
  '\\given': '\\mid',
};

const texCache = new Map();

export function tex(src, display = false) {
  const key = display ? `D:${src}` : src;
  let html = texCache.get(key);
  if (!html) {
    html = katex.renderToString(src, { throwOnError: false, displayMode: display, macros: TEX_MACROS });
    texCache.set(key, html);
  }
  return html;
}

/** For the checks: does this TeX parse? Returns the error message, or '' when it does. */
export function texError(src, display = false) {
  try {
    katex.renderToString(src, { throwOnError: true, displayMode: display, macros: TEX_MACROS });
    return '';
  } catch (e) {
    return e.message;
  }
}

/**
 * Panel text is written in a light markup: prose with math between `$…$`, typeset by KaTeX, and
 * `$$…$$` for a displayed equation on its own line (the way a worked solution sets its key step).
 *
 * Text outside the delimiters passes through as HTML, or escaped with `escape`.
 */
export function mathText(s, escape = false) {
  const keep = escape ? escapeHTML : (x) => x;
  const str = s == null ? '' : String(s);
  if (str.indexOf('$') < 0) return keep(str);
  let out = '';
  let i = 0;
  for (;;) {
    const a = str.indexOf('$', i);
    if (a < 0) return out + keep(str.slice(i));
    const display = str[a + 1] === '$';
    const open = display ? 2 : 1;
    const b = str.indexOf(display ? '$$' : '$', a + open);
    if (b < 0) return out + keep(str.slice(i));
    const body = str.slice(a + open, b);
    // A long inline list (data, a set, an interval) may break after its commas.
    out += keep(str.slice(i, a)) + (display ? displayBlock(body) : tex(body.length > 30 && body.includes(',') ? commaBreaks(body) : body));
    i = b + open;
  }
}

/**
 * A displayed equation, set twice: as display math, and as a version that can wrap (display
 * style, but inline, so KaTeX may break after = + − and, with \allowbreak, after top-level commas).
 * `fitMath` shows the wrapping version only where the display one is wider than its column, so on
 * a phone a long chain breaks onto several lines instead of hiding its result off to the right.
 */
function displayBlock(body) {
  return `<div class="disp"><span class="d-full">${tex(body, true)}</span><span class="d-wrap" hidden>${tex(breakable(body))}</span></div>`;
}

/** `\displaystyle` plus a break opportunity after every comma outside braces. */
export const breakable = (body) => String.raw`\displaystyle ` + commaBreaks(body);

/** A break opportunity after every comma outside braces. */
function commaBreaks(body) {
  let out = '';
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '\\') {
      out += c + (body[i + 1] ?? '');
      i++;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    out += c;
    if (c === ',' && depth === 0) out += String.raw`\allowbreak `;
  }
  return out;
}

/** Swap each displayed equation to its wrapping form where it does not fit (and back when it does). */
export function fitMath(root = document) {
  for (const d of root.querySelectorAll('.disp')) {
    const full = d.querySelector('.d-full');
    const wrap = d.querySelector('.d-wrap');
    if (!full || !wrap) continue;
    full.hidden = false;
    wrap.hidden = true;
    const tooWide = d.scrollWidth > d.clientWidth + 1;
    full.hidden = tooWide;
    wrap.hidden = !tooWide;
    d.classList.toggle('wrapped', tooWide);
  }
}

/** Every `$…$` and `$$…$$` body in a string, for the checks. */
export function mathPieces(s) {
  const out = [];
  const str = String(s ?? '');
  let i = 0;
  for (;;) {
    const a = str.indexOf('$', i);
    if (a < 0) return out;
    const display = str[a + 1] === '$';
    const open = display ? 2 : 1;
    const b = str.indexOf(display ? '$$' : '$', a + open);
    if (b < 0) {
      out.push({ src: str.slice(a), display, unclosed: true });
      return out;
    }
    out.push({ src: str.slice(a + open, b), display });
    i = b + open;
  }
}

const HTML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => HTML_ESC[c]);

/**
 * Prose that may carry math but never markup: everything outside `$…$` is escaped. Problem
 * statements, worked steps and hints go through this; they contain `<` and `>` often enough
 * ("$p < 0.05$", "x > 3") that passing them through as HTML would be a mistake.
 */
export const mathProse = (s) => mathText(s, true);
