import { mountHubBackup } from '@flux/core';
import { courseStore as calc1Store } from '@flux/mac2311/src/storage.js';
import { courseStore as macStore } from '@flux/mac2313/src/storage.js';
import { courseStore as phyStore } from '@flux/phy2049/src/storage.js';
import { courseStore as staStore } from '@flux/sta3032/src/storage.js';
import { courseStore as staticsStore } from '@flux/statics/src/storage.js';

/** Course stores, in the order a backup file writes them. */
export function backupParts() {
  return [
    { courseId: 'phy2049', store: phyStore() },
    { courseId: 'mac2311', store: calc1Store() },
    { courseId: 'mac2313', store: macStore() },
    { courseId: 'statics', store: staticsStore() },
    { courseId: 'sta3032', store: staStore() },
  ];
}

export function mountBackup(parent = document.querySelector('#backup')) {
  if (!parent) return null;
  return mountHubBackup(parent, backupParts());
}
