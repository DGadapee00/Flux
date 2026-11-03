import { downloadJSON, exportBundle, importBundle, parseProgressText } from '@flux/core';
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
import { courseStore as benchStore } from '@flux/bench/src/storage.js';
import { applicationStore } from './applications/progress.js';

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
    { courseId: 'applications', store: applicationStore() },
  ];
}

/** Older hub backups lack only the new applications section. Keep current application notes. */
export function restoreHubBackup(blob, parts) {
  const expected = parts.filter((p) => p.courseId !== 'applications').map((p) => p.courseId).sort();
  const courses = blob?.courses;
  if (blob?.v === 1 && courses && typeof courses === 'object' && !Array.isArray(courses)) {
    const got = Object.keys(courses).sort();
    if (JSON.stringify(got) === JSON.stringify(expected)) {
      const applications = parts.find((p) => p.courseId === 'applications');
      blob = { ...blob, courses: { ...courses, applications: applications.store.exportJSON() } };
    }
  }
  // The shared importer still validates every section before writing any record.
  importBundle(blob, parts);
}

export function mountBackup(parent = document.querySelector('#backup')) {
  if (!parent) return null;
  const parts = backupParts();
  const root = document.createElement('div');
  root.className = 'flux-files';
  root.innerHTML = '<button type="button" data-export>Back up progress</button><button type="button" data-import>Restore</button><input type="file" accept="application/json,.json" hidden aria-label="Choose a progress backup"><span class="flux-files-msg" role="status"></span>';
  parent.append(root);
  const message = root.querySelector('[role="status"]');
  const input = root.querySelector('input');
  try {
    if (sessionStorage.getItem('flux.hub.restore.notice')) {
      message.textContent = 'Progress restored.';
      sessionStorage.removeItem('flux.hub.restore.notice');
    }
  } catch { /* session storage may be blocked */ }
  root.querySelector('[data-export]').addEventListener('click', () => {
    downloadJSON('flux-progress.json', exportBundle(parts));
    message.textContent = 'Backup downloaded.';
  });
  root.querySelector('[data-import]').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      restoreHubBackup(parseProgressText(await file.text()), parts);
      try { sessionStorage.setItem('flux.hub.restore.notice', '1'); } catch { /* optional notice */ }
      location.reload();
    } catch (error) {
      message.textContent = error instanceof Error ? error.message : 'Could not restore progress.';
    }
  });
  return root;
}
