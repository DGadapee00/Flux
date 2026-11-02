/**
 * Where each concept sits on the map, as the prototype draws it: one lane per subject, top to
 * bottom in subjects.js order, and one column per depth, so every prerequisite arrow points right.
 * Only lanes that hold a concept are drawn.
 *
 * Inside one lane and column, boxes are ordered by the average height of their prerequisites, so
 * arrows cross as little as they can. Ties fall back to the title. File order never matters.
 */
export const BOX = { COLW: 146, NODEW: 124, NODEH: 46, LEFT: 24, TOP: 34, ROWH: 62, LANEPAD: 16 };

/**
 * @param {{ id: string, title: string, subject: string, requires: string[] }[]} concepts
 * @param {{ id: string }[]} subjects
 * @param {Record<string, number>} depth From buildGraph.
 */
export function layout(concepts, subjects, depth) {
  const { COLW, NODEH, LEFT, TOP, ROWH, LANEPAD } = BOX;
  const lanes = subjects.filter((s) => concepts.some((c) => c.subject === s.id));
  const cols = concepts.length ? Math.max(...concepts.map((c) => depth[c.id])) + 1 : 1;

  /** @type {Record<string, typeof concepts>} */
  const slots = {};
  for (const c of concepts) (slots[`${c.subject}:${depth[c.id]}`] ||= []).push(c);
  const laneRows = lanes.map((l) =>
    Math.max(1, ...Object.entries(slots).filter(([k]) => k.startsWith(`${l.id}:`)).map(([, v]) => v.length)),
  );
  const laneY = [];
  let y = TOP;
  laneRows.forEach((rows, i) => {
    laneY[i] = y;
    y += rows * ROWH + LANEPAD * 2;
  });
  const W = LEFT + cols * COLW + 8;
  const H = y + 6;

  /** @type {Record<string, { x: number, y: number }>} */
  const pos = {};
  const centre = (id) => pos[id].y + NODEH / 2;
  for (let d = 0; d < cols; d += 1) {
    lanes.forEach((lane, li) => {
      const slot = slots[`${lane.id}:${d}`];
      if (!slot) return;
      const key = (c) => (c.requires.length ? c.requires.reduce((s, r) => s + centre(r), 0) / c.requires.length : -1);
      const ordered = [...slot].sort((a, b) => key(a) - key(b) || a.title.localeCompare(b.title));
      const laneH = laneRows[li] * ROWH;
      ordered.forEach((c, idx) => {
        const cy = laneY[li] + LANEPAD + (laneH - ordered.length * ROWH) / 2 + idx * ROWH + ROWH / 2;
        pos[c.id] = { x: LEFT + d * COLW, y: cy - NODEH / 2 };
      });
    });
  }
  const laneBands = lanes.map((lane, i) => ({ subject: lane, y: laneY[i], h: laneRows[i] * ROWH + LANEPAD * 2 }));
  return { lanes: laneBands, pos, W, H, cols };
}

/**
 * Split a title into at most two lines for a box, when the concept gives no `label`.
 * @param {string} title
 * @param {number} [max] Characters per line.
 */
export function wrapLabel(title, max = 15) {
  if (title.length <= max) return [title];
  const words = title.split(' ');
  let best = [title];
  let bestLen = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const len = Math.max(a.length, b.length);
    if (len < bestLen) {
      best = [a, b];
      bestLen = len;
    }
  }
  return best;
}
