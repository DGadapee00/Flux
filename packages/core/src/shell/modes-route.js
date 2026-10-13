/**
 * Hash grammar `#/<course>/<unit>/<mode>/<lab>`.
 * Practice is the bare unit. A retired mode segment is legacy and opens practice.
 * The course supplies the unit list and which modes exist.
 *
 * @param {{
 *   courseId: string,
 *   modes: string[],
 *   unitById: (id: string) => { id: string }|null,
 *   nextUnit: () => { id: string },
 *   retired?: string[],
 * }} spec
 */
export function createModesRouter({ courseId, modes, unitById, nextUnit, retired = [] }) {
  /**
   * @param {string} [hash] Pass a hash to parse it without touching history. Omit it to read
   * `location.hash`; a legacy hash is then rewritten with `history.replaceState`.
   */
  function parseHash(hash) {
    const fromLocation = hash === undefined;
    const raw = fromLocation ? (typeof location === 'undefined' ? '' : location.hash) : hash;
    const full = String(raw || '').replace(/^#\/?/, '');
    const qAt = full.indexOf('?');
    const path = qAt === -1 ? full : full.slice(0, qAt);
    const query = qAt === -1 ? '' : full.slice(qAt + 1);
    const params = new URLSearchParams(query);
    const parts = path.split('/').filter(Boolean);
    let legacy = parts.length > 0 && parts[0] !== courseId;
    if (parts[0] === courseId) parts.shift();
    const [a, b, c] = parts;
    if (retired.includes(b)) legacy = true;
    const unit = unitById(a) || nextUnit();
    const mode = modes.includes(b) ? b : 'practice';
    const s = params.get('s');
    const route = {
      unitId: unit.id,
      mode,
      problemId: params.get('p') || null,
      seed: s != null && Number.isFinite(Number(s)) ? Math.max(0, Math.floor(Number(s))) : null,
      set: params.get('set') || null,
      labId: mode === 'explore' && c ? c : null,
      scenario: mode === 'explore' && c ? params.get('sc') || null : null,
      bare: parts.length === 0 && query === '',
      legacy,
    };
    if (fromLocation && legacy && typeof location !== 'undefined' && typeof history !== 'undefined') {
      const next = hashFor(route);
      if (location.hash !== next) history.replaceState(null, '', next);
    }
    return route;
  }

  function hashFor({ unitId, mode = 'practice', problemId = null, seed = null, set = null, labId = null, scenario = null }) {
    const q = new URLSearchParams();
    if (problemId) q.set('p', problemId);
    if (problemId && seed != null) q.set('s', String(seed));
    if (set) q.set('set', set);
    if (mode === 'explore' && labId && scenario) q.set('sc', scenario);
    const qs = q.toString();
    const lab = mode === 'explore' && labId ? `/${labId}` : '';
    return `#/${courseId}/${unitId}${mode === 'practice' ? '' : `/${mode}`}${lab}${qs ? `?${qs}` : ''}`;
  }

  function go(route, { replace = false } = {}) {
    const next = hashFor(route);
    if (location.hash === next) return false;
    const legacy = parseHash(location.hash).legacy;
    if (replace || legacy) {
      history.replaceState(null, '', next);
      return false;
    }
    location.hash = next;
    return true;
  }

  return { courseId, modes, parseHash, hashFor, go };
}
