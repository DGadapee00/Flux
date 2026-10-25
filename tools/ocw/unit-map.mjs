import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const UNIT_MAPS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'unit-maps.json'), 'utf8'));

/**
 * The Flux unit for a session. `byUnit` keys on OCW's own unit or week slug, `bySession` on the
 * session's place in the list (1-based), and `byLesson` on the "n.m" that starts a lesson title:
 * the exact lesson first, then its group ("20" for "20.5").
 */
export function fluxUnit(slug, session, index = 0, map = UNIT_MAPS[slug]) {
  if (!map) return 'unmapped';
  if (map.byUnit && session.unit && map.byUnit[session.unit]) return map.byUnit[session.unit];
  if (map.bySession && map.bySession[index + 1]) return map.bySession[index + 1];
  const lesson = /^(\d+)\.(\d+)\b/.exec(session.title || '');
  if (map.byLesson && lesson) return map.byLesson[`${lesson[1]}.${lesson[2]}`] || map.byLesson[lesson[1]] || 'unmapped';
  return 'unmapped';
}
