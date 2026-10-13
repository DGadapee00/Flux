/**
 * Namespaced browser storage. A course passes its own key strings. Core names no course.
 *
 * Dual-write each value back to its legacy key through 15 Dec 2026, so a rollback to the
 * pre-phase-2 tag keeps progress made after the switch. Remove the legacy write (the
 * `now() < DUAL_WRITE_UNTIL` branch) after that date.
 */

/** Exclusive end of 15 Dec 2026 UTC. Dual-write runs while `Date.now()` is below this. */
export const DUAL_WRITE_UNTIL = Date.UTC(2026, 11, 16);

const COURSE_ID = /^[a-z][a-z0-9]*$/;
const SLOT_NAME = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/;

/**
 * `flux.<courseId>.<name>.v<version>`.
 * @param {string} courseId
 * @param {string} name
 * @param {number} version
 */
export function storageKey(courseId, name, version) {
  if (!COURSE_ID.test(courseId)) throw new Error(`bad course id: ${courseId}`);
  if (!SLOT_NAME.test(name)) throw new Error(`bad storage name: ${name}`);
  if (!Number.isInteger(version) || version < 1) throw new Error(`bad storage version: ${version}`);
  return `flux.${courseId}.${name}.v${version}`;
}

export function browserStorage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

/**
 * @param {object} spec
 * @param {string} spec.courseId
 * @param {{ getItem: Function, setItem: Function, removeItem: Function } | null} [spec.storage]
 * @param {{ name: string, version: number, key: string, legacy?: string }[]} spec.slots
 * @param {() => number} [spec.now]
 */
export function createStore({ courseId, storage = null, slots, now = () => Date.now() }) {
  if (!Array.isArray(slots) || slots.length === 0) throw new Error('storage needs at least one slot');
  const byName = new Map();
  for (const slot of slots) {
    const expected = storageKey(courseId, slot.name, slot.version);
    if (slot.key !== expected) throw new Error(`storage key ${slot.key} does not match ${expected}`);
    if (byName.has(slot.name)) throw new Error(`duplicate storage slot: ${slot.name}`);
    byName.set(slot.name, slot);
  }

  const rawGet = (key) => {
    try {
      return storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  };

  const rawSet = (key, value) => {
    try {
      if (value == null) storage?.removeItem(key);
      else storage?.setItem(key, String(value));
    } catch {
      /* storage full or blocked */
    }
  };

  function slotOf(name) {
    const slot = byName.get(name);
    if (!slot) throw new Error(`unknown storage slot: ${name}`);
    return slot;
  }

  /** Raw string, or null. A missing new key is filled once from its legacy key. */
  function getItem(name) {
    const slot = slotOf(name);
    let raw = rawGet(slot.key);
    if (raw == null && slot.legacy) {
      const old = rawGet(slot.legacy);
      if (old != null) {
        rawSet(slot.key, old);
        raw = old;
      }
    }
    return raw;
  }

  /**
   * Write the new key. Through 15 Dec 2026 (see DUAL_WRITE_UNTIL) also write the legacy key,
   * including a removal, so a rollback to the pre-phase-2 tag still sees this value.
   * @param {string} name
   * @param {string | null} value
   */
  function setItem(name, value) {
    const slot = slotOf(name);
    const text = value == null ? null : String(value);
    rawSet(slot.key, text);
    if (slot.legacy && now() < DUAL_WRITE_UNTIL) rawSet(slot.legacy, text);
  }

  function readJSON(name) {
    try {
      const raw = getItem(name);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeJSON(name, value) {
    if (value == null) setItem(name, null);
    else setItem(name, JSON.stringify(value));
  }

  function exportJSON() {
    const keys = {};
    for (const slot of slots) keys[slot.name] = getItem(slot.name);
    return { v: 1, courseId, keys };
  }

  function importJSON(blob) {
    if (!blob || blob.v !== 1 || blob.courseId !== courseId || !blob.keys || typeof blob.keys !== 'object') {
      throw new Error('progress file does not match this course');
    }
    for (const slot of slots) {
      if (!Object.prototype.hasOwnProperty.call(blob.keys, slot.name)) continue;
      const raw = blob.keys[slot.name];
      setItem(slot.name, raw == null ? null : String(raw));
    }
  }

  return { getItem, setItem, readJSON, writeJSON, exportJSON, importJSON };
}
