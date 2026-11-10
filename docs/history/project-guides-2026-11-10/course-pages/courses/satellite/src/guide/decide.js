/**
 * What the decisions compute. Pure: shared by the guide and the tests.
 */
import { DECISIONS, decisionById, optionById } from './decisions/index.js';

/**
 * A decision's derived columns for each option: `{ [option id]: { [column id]: number | null } }`.
 * A column is null where a figure it needs is blank.
 * @param {any} decision
 */
export function derive(decision) {
  const out = {};
  for (const o of decision.options) {
    out[o.id] = {};
    for (const col of decision.derived || []) {
      out[o.id][col.id] = col.needs.every((k) => Number.isFinite(o.values[k])) ? col.from(o.values) : null;
    }
  }
  return out;
}

/**
 * A cell as text. A number keeps the decimal places its column asks for, and a negative sign is a
 * true minus. A blank reads "none".
 * @param {{ kind: string, dp?: number }} column
 * @param {number | string | null} value
 */
export function formatValue(column, value) {
  if (value === null || value === undefined) return 'none';
  if (column.kind !== 'number') return String(value);
  const text = column.dp === undefined ? String(value) : Number(value).toFixed(column.dp);
  return text.replace(/^-/, '−');
}

/** Every link, once, as { a, b, kind, why }: `a` is the option it is written on. */
const LINKS = DECISIONS.flatMap((d) =>
  d.options.flatMap((o) => (o.links || []).flatMap((link) => link.to.map((to) => ({ a: o.id, b: to, kind: link.kind, why: link.why })))),
);

/**
 * An option's links to options of other decisions, read from either end.
 * @param {string} id
 * @returns {{ other: string, kind: 'goes-with' | 'rules-out', why: string }[]}
 */
export function linksOf(id) {
  return LINKS.filter((l) => l.a === id || l.b === id).map((l) => ({ other: l.a === id ? l.b : l.a, kind: l.kind, why: l.why }));
}

/**
 * Picks that rule each other out, each pair once. `picks` is `{ [decision id]: option id }`; a
 * pick that names no decision, or an option that decision does not have, is ignored.
 * @param {Record<string, string>} picks
 */
export function conflicts(picks) {
  const chosen = Object.entries(picks)
    .filter(([d, o]) => decisionById[d] && optionById[o]?.decision.id === d)
    .map(([, o]) => o);
  return LINKS.filter((l) => l.kind === 'rules-out' && chosen.includes(l.a) && chosen.includes(l.b)).map((l) => ({ a: l.a, b: l.b, why: l.why }));
}
