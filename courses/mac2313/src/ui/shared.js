import { createTex } from '@flux/core';

const TEX_MACROS = {
  '\\qV': '\\textcolor{#58C4DD}{V}',
  '\\qI': '\\textcolor{#F4D345}{I}',
  '\\qR': '\\textcolor{#83C167}{R}',
  '\\qP': '\\textcolor{#FC6255}{P}',
  // House style, so every panel spells the same quantity the same way.
  '\\Qin': 'Q_{\\text{in}}',
  '\\eps': '\\varepsilon_0',
  '\\net': '_{\\text{net}}',
};

const { tex, mathText, mathProse, escapeHTML } = createTex(TEX_MACROS);

export { tex, mathText, mathProse, escapeHTML };

/** A displayed (centered) equation inside an explainer body. */
export const eq = (src) => ({ eq: src });

/**
 * An explainer body: a string, or a list of paragraphs and `eq(...)` display equations — the way a
 * textbook sets a short argument, with the equation it turns on given a line of its own.
 */
export function prose(body) {
  const blocks = Array.isArray(body) ? body : [body];
  return blocks
    .filter(Boolean)
    .map((b) => (b.eq ? `<div class="prose-eq">${tex(b.eq, true)}</div>` : `<p>${mathText(b)}</p>`))
    .join('');
}

export function kv(k, v) {
  return `<div class="row"><span class="k">${mathText(k)}</span><span class="v">${mathText(v)}</span></div>`;
}

export function qv(cls, v) {
  return `<span class="${cls}">${v}</span>`;
}

export function cells(items) {
  return items
    .map(
      ([label, value, cls]) =>
        `<div class="cell"><div class="label">${mathText(label)}</div><div class="value ${cls || ''}">${mathText(value)}</div></div>`,
    )
    .join('');
}

export function matchClass(pct) {
  if (pct >= 97) return 'ok';
  if (pct >= 90) return 'warn';
  return 'bad';
}

export function setLawEl(el, lines) {
  el.innerHTML = (lines || []).map((l) => `<div class="law-row">${tex(l)}</div>`).join('');
}
