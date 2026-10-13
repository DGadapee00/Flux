/**
 * The course's own sheets: practice sheets, class activities, worksheets. A worked case is from a
 * sheet when its `src` names one ("Class Activity 4 #9"), or is a bare question number ("#14")
 * on a template whose `src` cites a sheet ("Practice 44 #14A–D").
 *
 * A case is opened by its own seed: seed −(k+1) is case k, so every question on every sheet can
 * be worked with the sheet's numbers. (Seed 0 stays "the first case", for a first try.)
 */
const SHEET = /^(Practice|Class Activity|Worksheet|Interactive Lesson)\b/;

export const caseSeed = (k) => -(k + 1);

/** Which worked case a seed opens: 0 and −1 the first, −(k+1) case k; null for random numbers. */
export const caseIndex = (seed) => (seed === 0 ? 0 : seed < 0 ? -seed - 1 : null);

/** "Practice 44 #8" for a sheet case; null for one the bank added itself. */
export function sheetCaseLabel(tpl, kase) {
  const src = kase?.src;
  if (!src) return null;
  if (SHEET.test(src)) return src;
  if (src.startsWith('#') && tpl.src && SHEET.test(tpl.src)) return `${tpl.src.replace(/\s*#.*$/, '')} ${src}`;
  return null;
}

const sheetOrder = (label) => {
  const name = label.replace(/\s*#.*$/, '');
  const q = Number(label.match(/#(\d+)/)?.[1] ?? 0);
  // Practice sheets in chapter order first, then class activities, then worksheets.
  const kind = /^Practice/.test(name) ? 0 : /^Class Activity/.test(name) ? 1 : 2;
  return [kind, name, q];
};

/** Every sheet question among these templates, one item per case, in the sheets' own order. */
export function sheetItems(tpls) {
  const items = [];
  for (const tpl of tpls) {
    const before = items.length;
    tpl.cases.forEach((c, k) => {
      const label = sheetCaseLabel(tpl, c);
      if (label) items.push({ id: tpl.id, seed: caseSeed(k), label });
    });
    // A template written from a sheet question whose own numbers weren't kept: still on the list.
    if (items.length === before && tpl.src && SHEET.test(tpl.src)) items.push({ id: tpl.id, seed: 0, label: tpl.src });
  }
  return items.sort((a, b) => {
    const [ka, na, qa] = sheetOrder(a.label);
    const [kb, nb, qb] = sheetOrder(b.label);
    return ka - kb || na.localeCompare(nb, undefined, { numeric: true }) || qa - qb || a.label.localeCompare(b.label, undefined, { numeric: true });
  });
}
