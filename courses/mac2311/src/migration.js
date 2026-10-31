import { calculusProblemId, calculusProblemUnit, CALCULUS_DEFAULTS } from '@flux/tracks/calculus';
const readJSON = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const progress = (data) =>
  data?.v === 1 && data.items && typeof data.items === 'object' && !Array.isArray(data.items);
const keys = {
  target: 'flux.mac2311.problems.v1',
  source: 'flux.mac2312.problems.v1',
  exam: 'flux.mac2311.exam.v1',
  oldExam: 'flux.mac2312.exam.v1',
  marker: 'flux.mac2311.merge.v1',
};
/** Keep seed, typed answers and timing while mapping a saved practice exam to the merged bank. */
export function migrateExam(exam, source) {
  if (!exam || typeof exam !== 'object') return exam;
  const items = Array.isArray(exam.items)
    ? exam.items.map((item) => ({ ...item, id: calculusProblemId(source, item.id) }))
    : exam.items;
  const first = exam.items?.[0]?.id;
  const examId =
    calculusProblemUnit(source, first || '') || CALCULUS_DEFAULTS[source]?.[exam.examId]?.[0] || exam.examId;
  return { ...exam, examId, ...(items ? { items } : {}) };
}
/** Idempotent import. Never delete legacy keys or add old attempt counts a second time.
 * Recheck when a hub restore changes the old payload; mark only after the target write succeeds. */
export function migrateCalculus(storage) {
  if (!storage) return;
  try {
    const rawTarget = storage.getItem(keys.target),
      rawSource = storage.getItem(keys.source);
    const target = readJSON(rawTarget),
      source = readJSON(rawSource);
    // Do not replace unreadable or unsupported data with an empty history.
    if (rawTarget && !progress(target)) return;
    if (rawSource && !progress(source)) return;
    const examRaw = storage.getItem(keys.exam),
      oldExamRaw = storage.getItem(keys.oldExam);
    const oldPrefs = ['notes.width', 'notes.full'].map((slot) => storage.getItem(`flux.mac2312.${slot}.v1`));
    const fingerprint = JSON.stringify({ source: rawSource, exam: oldExamRaw, prefs: oldPrefs });
    const previous = readJSON(storage.getItem(keys.marker));
    const currentExam = readJSON(examRaw);
    if (
      !rawSource &&
      !oldExamRaw &&
      !oldPrefs.some((v) => v != null) &&
      !/^u[1-4]$/.test(currentExam?.examId || '')
    )
      return;
    const included =
      !source ||
      Object.entries(source.items).every(([id, value]) => {
        const existing = target?.items?.[calculusProblemId('mac2312', id)];
        return (
          existing &&
          Number(existing.last || 0) >= Number(value.last || 0) &&
          Number(existing.attempts || 0) >= Number(value.attempts || 0)
        );
      });
    if (
      previous?.source === fingerprint &&
      included &&
      (!currentExam?.examId || !/^u[1-4]$/.test(currentExam.examId))
    )
      return;
    if (source) {
      const merged = { ...(target || { v: 1 }), items: { ...(target?.items || {}) } };
      for (const [id, value] of Object.entries(source.items)) {
        const nextId = calculusProblemId('mac2312', id),
          existing = merged.items[nextId];
        if (
          !existing ||
          Number(value.last || 0) > Number(existing.last || 0) ||
          (Number(value.last || 0) === Number(existing.last || 0) &&
            Number(value.attempts || 0) > Number(existing.attempts || 0))
        )
          merged.items[nextId] = { ...value };
      }
      const serialized = JSON.stringify(merged);
      storage.setItem(keys.target, serialized);
      if (storage.getItem(keys.target) !== serialized) return;
    }
    // Preserve the current course's active exam. The other exam remains in its original backup slot.
    const active = currentExam || readJSON(oldExamRaw);
    if (active) {
      const migrated = migrateExam(active, currentExam ? 'mac2311' : 'mac2312');
      const text = JSON.stringify(migrated);
      storage.setItem(keys.exam, text);
      if (storage.getItem(keys.exam) !== text) return;
    }
    for (const slot of ['notes.width', 'notes.full']) {
      const to = `flux.mac2311.${slot}.v1`,
        from = `flux.mac2312.${slot}.v1`;
      if (storage.getItem(to) == null && storage.getItem(from) != null)
        storage.setItem(to, storage.getItem(from));
    }
    storage.setItem(keys.marker, JSON.stringify({ v: 1, source: fingerprint }));
  } catch {
    /* A blocked or full storage backend must not prevent the course from opening. */
  }
}
