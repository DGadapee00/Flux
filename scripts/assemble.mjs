/**
 * Put each course build next to the hub so one upload serves all of them.
 * `site/dist/<id>/` is the platform copy. Assets are relative (`base: './'`).
 * The course list is site/courses.js. A listed course with no build fails here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSE_IDS } from '../site/courses.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const id of COURSE_IDS) {
  const from = path.join(root, 'courses', id, 'dist');
  const to = path.join(root, 'site/dist', id);
  if (!fs.existsSync(path.join(from, 'index.html'))) {
    console.error(`${id} build is missing at courses/${id}/dist`);
    process.exit(1);
  }
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`copied ${id} into site/dist/${id}`);
}
