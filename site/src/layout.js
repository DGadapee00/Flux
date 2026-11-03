/**
 * Where each concept sits on the map, as the prototype draws it: one lane per subject, top to
 * bottom in subjects.js order, and one column per depth, so every prerequisite arrow points right.
 * Only lanes that hold a concept are drawn.
 *
 * Inside one lane and column, boxes are ordered by the average height of their prerequisites, so
 * arrows cross as little as they can. Ties fall back to the title. File order never matters.
 */
export const BOX = { COLW: 146, NODEW: 124, NODEH: 46, LEFT: 24, TOP: 8, ROWH: 62, LANEPAD: 26 };

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

/** How much of the map the hub draws around the chosen concept. */
export const SCOPES = { near: 1, two: 2, all: Infinity };

/**
 * The chosen concept, what it builds on and what it leads to, up to `steps` each way. Upward
 * steps follow `requires` only and downward steps follow `leads` only, so a sibling that shares a
 * prerequisite is not pulled in.
 * @param {string} id
 * @param {number} steps
 * @param {(id: string) => string[]} requiresOf
 * @param {(id: string) => string[]} leadsOf
 */
export function neighbourhood(id, steps, requiresOf, leadsOf) {
  const out = new Set([id]);
  for (const next of [requiresOf, leadsOf]) {
    let ring = [id];
    for (let s = 0; s < steps && ring.length; s += 1) {
      const nextRing = [];
      for (const x of ring) {
        for (const y of next(x)) {
          if (!out.has(y)) {
            out.add(y);
            nextRing.push(y);
          }
        }
      }
      ring = nextRing;
    }
  }
  return out;
}

/**
 * The concepts in `ids`, with `requires` cut to that set, so a part of the map can be laid out on
 * its own: its depths start at zero and it has no empty columns.
 * @template {{ id: string, requires: string[] }} C
 * @param {C[]} concepts
 * @param {Set<string>} ids
 * @returns {C[]}
 */
export function subMap(concepts, ids) {
  return concepts.filter((c) => ids.has(c.id)).map((c) => ({ ...c, requires: c.requires.filter((r) => ids.has(r)) }));
}

/**
 * The box an arrow key moves to: the nearest one on that side of `from`, where being out of line
 * costs three times as much as being far along. Right and left cross columns; up and down stay
 * close to the column. Null when nothing lies that way.
 * @param {Record<string, { x: number, y: number }>} pos
 * @param {string} from
 * @param {'left'|'right'|'up'|'down'} dir
 */
export function nearestInDirection(pos, from, dir) {
  const a = pos[from];
  if (!a) return null;
  let best = null;
  let bestScore = Infinity;
  for (const [id, p] of Object.entries(pos)) {
    if (id === from) continue;
    const dx = p.x - a.x;
    const dy = p.y - a.y;
    const [along, across] = dir === 'right' ? [dx, dy] : dir === 'left' ? [-dx, dy] : dir === 'down' ? [dy, dx] : [-dy, dx];
    if (along <= 0) continue;
    const score = along + 3 * Math.abs(across);
    if (score < bestScore || (score === bestScore && id < best)) {
      best = id;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Keep only the concepts in the chosen subjects. The chosen concept always stays, so the reading
 * panel and the map never disagree. No subjects chosen keeps everything.
 * @param {Iterable<string>} ids
 * @param {(id: string) => string} subjectOf
 * @param {Set<string>} subjects
 * @param {string} keep
 */
export function inSubjects(ids, subjectOf, subjects, keep) {
  const out = new Set();
  for (const id of ids) if (!subjects.size || subjects.has(subjectOf(id)) || id === keep) out.add(id);
  return out;
}
