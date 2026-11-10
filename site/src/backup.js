import { browserStorage, createStore, importBundle, mountHubBackup } from '@flux/core';
import { courseStore as calc1Store } from '@flux/mac2311/src/storage.js';
import { courseStore as calc2Store } from '@flux/mac2312/src/storage.js';
import { courseStore as macStore } from '@flux/mac2313/src/storage.js';
import { courseStore as phyStore } from '@flux/phy2049/src/storage.js';
import { courseStore as phy1Store } from '@flux/phy2048/src/storage.js';
import { courseStore as staStore } from '@flux/sta3032/src/storage.js';
import { courseStore as dynamicsStore } from '@flux/egn3321/src/storage.js';
import { courseStore as materialsStore } from '@flux/egn3331/src/storage.js';
import { courseStore as thermoStore } from '@flux/eml3100/src/storage.js';
import { courseStore as staticsStore } from '@flux/statics/src/storage.js';
import { courseStore as odeStore } from '@flux/map2302/src/storage.js';
import { courseStore as fluidsStore } from '@flux/eml3015/src/storage.js';
import { courseStore as designStore } from '@flux/design/src/storage.js';
import { courseStore as computationStore } from '@flux/egn3203/src/storage.js';
import { courseStore as matsciStore } from '@flux/ema3010/src/storage.js';
import { courseStore as heatStore } from '@flux/eml4140/src/storage.js';
import { courseStore as circuitsStore } from '@flux/eel3111/src/storage.js';
import { courseStore as satelliteStore } from '@flux/satellite/src/storage.js';
import { courseStore as thermo2Store } from '@flux/eml3101/src/storage.js';
import { courseStore as benchStore } from '@flux/bench/src/storage.js';

/**
 * The hub's Build tab once kept satellite records under this key. The tab is gone (archived in
 * docs/history/map-2026-11-10/), but backup files made then carry an `applications` section, and a
 * section the hub does not know fails a restore. So the store stays, and the records ride along.
 */
export function applicationStore(storage = browserStorage()) {
  return createStore({ courseId: 'applications', storage, slots: [
    { name: 'satellite', version: 1, key: 'flux.applications.satellite.v1' },
  ] });
}

/** Course stores, in the order a backup file writes them. */
export function backupParts() {
  return [
    { courseId: 'phy2049', store: phyStore() },
    { courseId: 'mac2311', store: calc1Store() },
    { courseId: 'mac2312', store: calc2Store() },
    { courseId: 'mac2313', store: macStore() },
    { courseId: 'statics', store: staticsStore() },
    { courseId: 'sta3032', store: staStore() },
    { courseId: 'egn3321', store: dynamicsStore() },
    { courseId: 'eml3100', store: thermoStore() },
    { courseId: 'egn3331', store: materialsStore() },
    { courseId: 'phy2048', store: phy1Store() },
    { courseId: 'bench', store: benchStore() },
    { courseId: 'map2302', store: odeStore() },
    { courseId: 'eml3015', store: fluidsStore() },
    { courseId: 'design', store: designStore() },
    { courseId: 'egn3203', store: computationStore() },
    { courseId: 'ema3010', store: matsciStore() },
    { courseId: 'eml4140', store: heatStore() },
    { courseId: 'eel3111', store: circuitsStore() },
    { courseId: 'satellite', store: satelliteStore() },
    { courseId: 'eml3101', store: thermo2Store() },
    { courseId: 'applications', store: applicationStore() },
  ];
}

/**
 * Courses added after a backup was made (EML 3015, 6 November 2026) and the applications section
 * are missing from older files. Keep this browser's current data for those, and restore the rest.
 * A section for a course the hub does not know still fails.
 */
const ADDED_LATER = ['applications', 'eml3015', 'design', 'egn3203', 'ema3010', 'eml4140', 'eel3111', 'satellite', 'eml3101'];
export function restoreHubBackup(blob, parts) {
  const courses = blob?.courses;
  if (blob?.v === 1 && courses && typeof courses === 'object' && !Array.isArray(courses)) {
    const missing = parts.filter((p) => !(p.courseId in courses));
    if (missing.length && missing.every((p) => ADDED_LATER.includes(p.courseId))) {
      blob = { ...blob, courses: { ...courses, ...Object.fromEntries(missing.map((p) => [p.courseId, p.store.exportJSON()])) } };
    }
  }
  // The shared importer still validates every section before writing any record.
  importBundle(blob, parts);
}

export function mountBackup(parent = document.querySelector('#backup')) {
  if (!parent) return null;
  return mountHubBackup(parent, backupParts(), { restore: restoreHubBackup });
}
