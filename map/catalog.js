/**
 * Every Flux course's lab catalog, keyed by course id: lab id → the unit it sits in and its title.
 * Read from each course's own catalog, so a lab the map names is a lab that course really has.
 * These catalogs are plain data, which keeps this module safe to bundle into the hub.
 *
 * STA 3032 has no LAB_META. Its labs are the Explore list of its units, so they are read from there.
 */
import * as bench from '../courses/bench/src/data/catalog.js';
import * as egn3321 from '../courses/egn3321/src/data/catalog.js';
import * as egn3331 from '../courses/egn3331/src/data/catalog.js';
import * as eml3100 from '../courses/eml3100/src/data/catalog.js';
import * as eml3015 from '../courses/eml3015/src/data/catalog.js';
import * as design from '../courses/design/src/data/catalog.js';
import * as egn3203 from '../courses/egn3203/src/data/catalog.js';
import * as ema3010 from '../courses/ema3010/src/data/catalog.js';
import * as eml4140 from '../courses/eml4140/src/data/catalog.js';
import * as eel3111 from '../courses/eel3111/src/data/catalog.js';
import * as satellite from '../courses/satellite/src/data/catalog.js';
import * as mac2311 from '../courses/mac2311/src/data/catalog.js';
import * as mac2313 from '../courses/mac2313/src/data/catalog.js';
import * as map2302 from '../courses/map2302/src/data/catalog.js';
import * as phy2048 from '../courses/phy2048/src/catalog.js';
import * as phy2049 from '../courses/phy2049/src/data/catalog.js';
import * as sta3032 from '../courses/sta3032/src/data/catalog.js';
import * as statics from '../courses/statics/src/data/catalog.js';

/** @param {Record<string, { exam: string, title?: string }>} meta */
function fromMeta(meta) {
  return Object.fromEntries(Object.entries(meta).map(([id, m]) => [id, { unit: m.exam, title: m.title || id }]));
}

/**
 * STA 3032's lab titles. Its lab definitions carry drawing code, so the hub does not import them;
 * map/test/catalog.test.js keeps this table equal to their titles.
 */
export const STA3032_TITLES = {
  describe: 'Describing data',
  cond: 'Conditional probability',
  dist: 'Distributions',
  npp: 'Normal probability plot',
  clt: 'Sampling distributions (CLT)',
  ci: 'Confidence interval coverage',
  power: 'Errors and power',
  tests: 'Which test?',
  paired: 'Paired vs independent',
  reg: 'Regression',
};

/**
 * @param {{ id: string, labs: string[] }[]} units
 * @param {Record<string, string>} [titles]
 */
function fromUnits(units, titles = {}) {
  const out = {};
  for (const unit of units) {
    for (const id of unit.labs || []) if (!out[id]) out[id] = { unit: unit.id, title: titles[id] || id };
  }
  return out;
}

/** @type {Record<string, Record<string, { unit: string, title: string }>>} */
export const LAB_CATALOGS = {
  bench: fromMeta(bench.LAB_META),
  egn3321: fromMeta(egn3321.LAB_META),
  egn3331: fromMeta(egn3331.LAB_META),
  eml3100: fromMeta(eml3100.LAB_META),
  eml3015: fromMeta(eml3015.LAB_META),
  design: fromMeta(design.LAB_META),
  egn3203: fromMeta(egn3203.LAB_META),
  ema3010: fromMeta(ema3010.LAB_META),
  eml4140: fromMeta(eml4140.LAB_META),
  eel3111: fromMeta(eel3111.LAB_META),
  satellite: fromMeta(satellite.LAB_META),
  mac2311: fromMeta(mac2311.LAB_META),
  mac2313: fromMeta(mac2313.LAB_META),
  map2302: fromMeta(map2302.LAB_META),
  phy2048: fromMeta(phy2048.LAB_META),
  phy2049: fromMeta(phy2049.LAB_META),
  sta3032: fromUnits(sta3032.UNITS, STA3032_TITLES),
  statics: fromMeta(statics.LAB_META),
};
