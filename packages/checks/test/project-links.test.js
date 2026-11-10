import assert from 'node:assert/strict';
import test from 'node:test';
import { LABS as STA_LABS } from '../../../courses/sta3032/src/labs/index.js';
import { RECIPES } from '../../../courses/satellite/src/guide/recipes.js';
import { DECISIONS } from '../../../courses/satellite/src/guide/decisions/index.js';
import { FOUNDATIONS as SATELLITE_FOUNDATIONS } from '../../../courses/satellite/src/guide/foundations.js';
import { TRAVELERS } from '../../../courses/satellite/src/guide/links.js';
import dome from '../../../courses/dome/src/traveler.js';
import { FOUNDATIONS as DOME_FOUNDATIONS } from '../../../courses/dome/src/foundations.js';
import { LAB_CATALOGS, STA3032_TITLES, notesIndexes } from '../catalogs.mjs';
import { notesOf, notesTarget } from '../../tracks/routes.js';

/**
 * A project page links into other courses' labs and notes. It keeps the course, unit, lab and
 * title as plain data, so it loads no other course. These tests read every course's own catalog
 * and fail when a link has gone stale: a lab renamed, moved to another unit or retitled, or a
 * notes section removed.
 */
const NOTES = await notesIndexes();

/**
 * @param {string} where Who names the lab, for the message.
 * @param {{ course: string, unit: string, lab: string, title?: string, notes?: string | string[] }} ref
 */
function checkLab(where, ref) {
  const meta = LAB_CATALOGS[ref.course]?.[ref.lab];
  assert.ok(meta, `${where}: ${ref.course} has no lab ${ref.lab}`);
  assert.equal(ref.unit, meta.unit, `${where}: ${ref.course}/${ref.lab} sits in unit ${meta.unit}`);
  if (ref.title !== undefined) assert.equal(ref.title, meta.title, `${where}: ${ref.course}/${ref.lab} is titled "${meta.title}"`);
  for (const id of notesOf(ref)) {
    const { unit, section } = notesTarget(id, meta.unit);
    const sections = NOTES[ref.course]?.[unit];
    assert.ok(sections, `${where}: ${ref.course} has no notes for unit ${unit}`);
    assert.ok(sections.includes(section), `${where}: ${ref.course} unit ${unit} notes have no section ${section}`);
  }
}

/** @param {string} project @param {Record<string, { title: string, course?: string, unit?: string, lab?: string }>} table */
function checkFoundations(project, table) {
  for (const [id, f] of Object.entries(table)) {
    // A foundation's title names the idea, not the lab, so only the place is checked.
    if (f.course) checkLab(`${project} foundation ${id}`, { course: f.course, unit: f.unit, lab: f.lab, notes: f.notes });
  }
}

test("STA 3032's lab titles here match the course's own lab definitions", () => {
  assert.deepEqual(STA3032_TITLES, Object.fromEntries(STA_LABS.map((l) => [l.id, l.title])));
  for (const [id, meta] of Object.entries(LAB_CATALOGS.sta3032)) assert.equal(meta.title, STA3032_TITLES[id], id);
});

test('the satellite guide links to labs and notes sections their courses still have', () => {
  let labs = 0;
  for (const r of RECIPES) {
    for (const ref of r.labs || []) {
      checkLab(`satellite ${r.id}`, ref);
      labs += 1;
    }
  }
  assert.ok(labs >= 20, 'the recipes name their labs');
  checkFoundations('satellite', SATELLITE_FOUNDATIONS);
  // Every foundation a recipe or a decision names is in the table the guide reads.
  for (const owner of [...RECIPES, ...DECISIONS]) {
    for (const id of owner.foundations || []) assert.ok(SATELLITE_FOUNDATIONS[id], `${owner.id}: ${id}`);
  }
});

test('the dome traveler links to labs and notes sections their courses still have', () => {
  checkFoundations('dome', DOME_FOUNDATIONS);
  for (const s of dome.stations) {
    for (const id of s.foundations) assert.ok(DOME_FOUNDATIONS[id], `dome ${s.id}: ${id}`);
  }
});

test('a traveler the satellite guide points to is the one its course holds', () => {
  assert.deepEqual(Object.keys(TRAVELERS), [dome.id]);
  assert.equal(TRAVELERS[dome.id].course, 'dome');
  assert.equal(TRAVELERS[dome.id].title, dome.title);
});
