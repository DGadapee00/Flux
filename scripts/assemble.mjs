/**
 * Put the PHY build next to the hub so one upload serves both.
 * `site/dist/phy2049/` is the platform copy. Assets are relative (`base: './'`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const from = path.join(root, 'courses/phy2049/dist');
const to = path.join(root, 'site/dist/phy2049');

if (!fs.existsSync(path.join(from, 'index.html'))) {
  console.error('PHY build is missing at courses/phy2049/dist');
  process.exit(1);
}
fs.rmSync(to, { recursive: true, force: true });
fs.mkdirSync(path.dirname(to), { recursive: true });
fs.cpSync(from, to, { recursive: true });
console.log('copied PHY into site/dist/phy2049');
