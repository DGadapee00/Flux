import assert from 'node:assert/strict';
import test from 'node:test';
import { LAB_CATALOGS, findCycle } from '@flux/map';
import { loadConcepts } from '@flux/map/load.mjs';
import { exportBundle, importBundle, memoryStorage } from '@flux/core';
import { RECIPES, SATELLITE, recipeById } from '@flux/map/applications/satellite.js';
import { projectInstructions, reviewBrief } from '../src/applications/brief.js';
import { applicationStore, cleanProgress, demonstrated, missingInputs, record, revise, wouldClear } from '../src/applications/progress.js';
import { backupParts, restoreHubBackup } from '../src/backup.js';
import { courseStore as fluidsStore } from '@flux/eml3015/src/storage.js';

const concepts = Object.fromEntries((await loadConcepts()).map(({ concept }) => [concept.id, concept]));

test('every recipe uses existing concepts and labs that teach its foundations', () => {
  const ids = new Set(RECIPES.map((r) => r.id));
  assert.equal(ids.size, RECIPES.length);
  assert.equal(findCycle(RECIPES.map((r) => ({ id: r.id, requires: r.requires }))), null);
  for (const r of RECIPES) {
    for (const dep of r.requires) assert.ok(ids.has(dep), `${r.id}: ${dep}`);
    for (const id of r.concepts || []) assert.ok(concepts[id], id);
    for (const ref of r.labs || []) {
      assert.ok(r.concepts.includes(ref.concept));
      assert.ok(concepts[ref.concept].labs.some((l) => l.course === ref.course && l.lab === ref.lab));
      assert.ok(LAB_CATALOGS[ref.course]?.[ref.lab]);
    }
  }
  assert.deepEqual(SATELLITE.integration.requires, SATELLITE.components.map((c) => c.id));
  // Numbered in build order: working 01 to 07 never meets a subsystem that is still locked.
  SATELLITE.components.forEach((c, i) => {
    for (const dep of c.requires) assert.ok(SATELLITE.components.findIndex((d) => d.id === dep) < i, `${c.id} before ${dep}`);
  });
  // Work is reviewed in a Claude Project, not submitted to another site.
  assert.deepEqual(SATELLITE.components.filter((c) => c.submission), []);
  for (const r of RECIPES) {
    assert.ok(r.method?.length >= 3, `${r.id} method`);
    assert.ok(r.checklist?.length >= 3, `${r.id} checklist`);
    assert.ok(r.references?.length >= 1, `${r.id} references`);
    for (const ref of r.references) assert.equal(new URL(ref.url).protocol, 'https:', ref.url);
  }
});

test('a review brief stands on its own: task, method, every checklist item and reference', () => {
  for (const r of RECIPES) {
    const text = reviewBrief(r, { byId: concepts, recipeById, standing: (id) => (id === r.concepts?.[0] ? 'solid' : null) });
    assert.match(text, new RegExp(`^# Review: ${r.title}`));
    assert.ok(text.includes(r.demonstrate), r.id);
    for (const item of r.checklist) assert.ok(text.includes(item), `${r.id}: ${item}`);
    for (const ref of r.references) assert.ok(text.includes(ref.url), `${r.id}: ${ref.url}`);
    for (const dep of r.requires) assert.ok(text.includes(recipeById[dep].title), `${r.id} names ${dep}`);
    if (r.concepts?.length) assert.ok(text.includes('(my standing in Flux: solid)'), r.id);
    assert.match(text, /## My work\n\[Paste/);
    assert.ok(!/<[a-z]/i.test(text), `${r.id} brief is plain text`);
  }
  const rules = projectInstructions();
  assert.match(rules, /second method/);
  assert.match(rules, /not .*flight qualification|Do not treat it as flight qualification/);
});

function complete(state, id) {
  return record(revise(state, id, { studied: true, evidence: `Report for ${id}: result, assumptions and independent check.` }), id);
}

test('evidence and study alone cannot skip a prerequisite or unlock integration', () => {
  let state = cleanProgress(null);
  state = complete(state, 'power');
  assert.equal(demonstrated('power', state), false);
  assert.deepEqual(missingInputs('power', state), ['orbit']);
  state = record(revise(state, 'satellite', { evidence: 'A report without subsystem records.' }), 'satellite');
  assert.equal(demonstrated('satellite', state), false);
  state = complete(state, 'orbit');
  state = record(state, 'power');
  assert.equal(demonstrated('power', state), true);
  assert.equal(demonstrated('satellite', state), false);
});

test('a shared mission needs all seven demonstrations; revising an input invalidates its dependents and keeps their notes', () => {
  let state = cleanProgress(null);
  for (const r of SATELLITE.components) state = complete(state, r.id);
  assert.deepEqual(missingInputs('satellite', state), []);
  state = record(revise(state, 'satellite', { evidence: 'Shared mission and transmitter tradeoff report.' }), 'satellite');
  assert.equal(demonstrated('satellite', state), true);
  const notes = state.communications.evidence;
  state = revise(state, 'orbit', { evidence: 'Revised orbit, new eclipse duration.' });
  for (const id of ['orbit', 'power', 'thermal', 'attitude', 'communications', 'payload', 'satellite']) {
    assert.equal(demonstrated(id, state), false, id);
  }
  assert.equal(demonstrated('structure', state), true);
  assert.equal(state.communications.evidence, notes);
});

test('a recipe depends on every subsystem whose numbers it uses, so a payload edit reaches Thermal and Communications', () => {
  let state = cleanProgress(null);
  for (const r of SATELLITE.components) state = complete(state, r.id);
  assert.deepEqual(wouldClear(state, 'payload'), ['payload', 'thermal', 'communications']);
  state = revise(state, 'payload', { evidence: 'A larger data budget.' });
  for (const id of ['thermal', 'communications', 'payload']) assert.equal(demonstrated(id, state), false, id);
  for (const id of ['orbit', 'power', 'structure', 'attitude']) assert.equal(demonstrated(id, state), true, id);
  assert.deepEqual(wouldClear(state, 'payload'), [], 'nothing left to clear');
});

test('blank evidence and an unread foundation cannot become a demonstration', () => {
  let state = cleanProgress(null);
  state = record(revise(state, 'orbit', { studied: true, evidence: '  ' }), 'orbit');
  assert.equal(demonstrated('orbit', state), false);
  state = record(revise(state, 'orbit', { studied: false, evidence: 'My report.' }), 'orbit');
  assert.equal(demonstrated('orbit', state), false);
});

test('application evidence survives a hub backup and a fresh browser; malformed records grant no capabilities', () => {
  const store = applicationStore(memoryStorage());
  const progress = complete(cleanProgress(null), 'orbit');
  store.writeJSON('satellite', progress);
  const blob = exportBundle([{ courseId: 'applications', store }]);
  const fresh = applicationStore(memoryStorage());
  importBundle(blob, [{ courseId: 'applications', store: fresh }]);
  assert.deepEqual(cleanProgress(fresh.readJSON('satellite')), progress);
  assert.equal(demonstrated('orbit', cleanProgress(fresh.readJSON('satellite'))), true);
  const invalid = cleanProgress({ orbit: { studied: 'true', recorded: true, evidence: 12 }, surprise: {} });
  assert.equal(demonstrated('orbit', invalid), false);
  assert.equal('surprise' in invalid, false);
});

test('old hub backups restore courses without erasing application evidence; incomplete or malformed backups write nothing', () => {
  const parts = backupParts();
  const applications = parts.find((p) => p.courseId === 'applications');
  applications.store = applicationStore(memoryStorage());
  const progress = complete(cleanProgress(null), 'orbit');
  applications.store.writeJSON('satellite', progress);
  const oldBackup = exportBundle(parts.filter((p) => p.courseId !== 'applications'));
  restoreHubBackup(oldBackup, parts);
  assert.deepEqual(applications.store.readJSON('satellite'), progress);
  const broken = structuredClone(oldBackup);
  delete broken.courses.phy2049;
  assert.throws(() => restoreHubBackup(broken, parts), /does not match this backup/);
  const invalid = structuredClone(oldBackup);
  invalid.courses.phy2049.courseId = 'bench';
  assert.throws(() => restoreHubBackup(invalid, parts), /does not match this course/);
  assert.deepEqual(applications.store.readJSON('satellite'), progress);
  assert.equal('applications' in oldBackup.courses, false, 'restoring does not modify the source backup');
});

test('a hub backup from before Fluids was added restores and keeps the Fluids record', () => {
  const parts = backupParts();
  const fluids = parts.find((p) => p.courseId === 'eml3015');
  fluids.store = fluidsStore(memoryStorage(), () => 0);
  fluids.store.writeJSON('problems', { v: 1, kept: true });
  const before = exportBundle(parts.filter((p) => !['eml3015', 'design', 'egn3203', 'ema3010', 'eml4140', 'eel3111', 'satellite', 'eml3101', 'applications'].includes(p.courseId)));
  assert.equal('eml3015' in before.courses, false);
  restoreHubBackup(before, parts);
  assert.deepEqual(fluids.store.readJSON('problems'), { v: 1, kept: true });
});

// ---------- The Make side: decisions ----------

const { DECISIONS, decisionById } = await import('@flux/map/applications/decisions/index.js');
const { decisionRecord } = await import('../src/applications/brief.js');

test('a decision record carries the question, the drivers, every option and five prompts, as plain text', () => {
  for (const d of DECISIONS) {
    const text = decisionRecord(d, { recipe: recipeById[d.subsystem] });
    assert.match(text, new RegExp(`^# Decision: ${d.question.replace(/[?]/g, '\\?')}`), d.id);
    assert.ok(text.includes(recipeById[d.subsystem].title), `${d.id} names its subsystem`);
    for (const driver of d.drivers) assert.ok(text.includes(driver), `${d.id}: ${driver}`);
    for (const o of d.options) assert.ok(text.includes(o.name), `${d.id}: ${o.name}`);
    for (const n of [1, 2, 3, 4, 5]) assert.match(text, new RegExp(`^${n}\\. `, 'm'), `${d.id} prompt ${n}`);
    assert.match(text, /^1\. I chose: *$/m, `${d.id}: with no pick the first line is left to fill in`);
    assert.ok(!/<[a-z]/i.test(text), `${d.id} record is plain text`);
    assert.ok(!text.includes('—'), `${d.id} record has no em dash`);
  }
});

test('a decision record states the pick with its figures, and any other pick it conflicts with', () => {
  const d = decisionById['structure-material'];
  const picks = { 'structure-material': 'al-6061-t6', 'structure-process': 'printed-metal' };
  const text = decisionRecord(d, { recipe: recipeById.structure, picks });
  assert.match(text, /^1\. I chose: Aluminium 6061-T6$/m);
  // The pick's own numbers are on its line, with units, so the record stands alone.
  assert.match(text, /Aluminium 6061-T6 \(my pick\): .*68 GPa.*2\.70 g\/cm³/);
  assert.match(text, /E\/ρ 25\.2/);
  // The clash with the process pick is stated, with its reason.
  assert.match(text, /Conflicts with my pick for "How is the frame made\?": Print in metal\./);
  assert.ok(text.includes('powder bed machines run their own aluminium alloy'));
  // The other decisions' picks are listed, since the four are one choice.
  assert.match(text, /How is the frame made\?: Print in metal/);
  // A pick that is not one of this decision's options is not recorded.
  assert.match(decisionRecord(d, { recipe: recipeById.structure, picks: { 'structure-material': 'bolted' } }), /^1\. I chose: *$/m);
});

test('the structure brief asks for its four decision records, and the reviewer is told how to judge one', () => {
  const text = reviewBrief(recipeById.structure, { byId: concepts, recipeById });
  assert.match(text, /## Decisions to record/);
  for (const d of DECISIONS.filter((x) => x.subsystem === 'structure')) assert.ok(text.includes(d.question), d.id);
  // A subsystem with no decisions yet has no such section.
  assert.ok(!reviewBrief(recipeById.orbit, { byId: concepts, recipeById }).includes('## Decisions to record'));
  assert.match(projectInstructions(), /decision record/i);
});

// ---------- Travelers ----------

const { TRAVELERS, travelerById } = await import('@flux/map/applications/travelers/index.js');
const { domeNumbers } = await import('@flux/map/applications/travelers/dome-numbers.js');
const { caseBrief } = await import('../src/applications/brief.js');
const { blockRows, fig, pickBuildView } = await import('../src/applications/traveler-text.js');

test('a case brief stands on its own: the part, the station, the situation, the evidence, the task and the rubric', () => {
  for (const t of TRAVELERS) {
    for (const c of t.cases) {
      const station = t.stations.find((s) => s.id === c.station);
      const text = caseBrief(t, c, { numbers: domeNumbers() });
      assert.match(text, new RegExp(`^# Case: ${c.title}`), c.id);
      assert.ok(text.includes(t.title) && text.includes(station.title), `${c.id} names the part and the station`);
      assert.ok(text.includes(c.situation) && text.includes(c.task), `${c.id} situation and task`);
      for (const e of c.evidence) assert.ok(text.includes(e), `${c.id}: ${e}`);
      for (const item of c.checklist) assert.ok(text.includes(item), `${c.id}: ${item}`);
      for (const id of c.sources) assert.ok(text.includes(t.references.find((r) => r.id === id).url), `${c.id}: ${id}`);
      assert.match(text, /## My answer\n\[Write/);
      assert.ok(!/<[a-z]/i.test(text), `${c.id} brief is plain text`);
      assert.ok(!text.includes('—'), `${c.id} brief has no em dash`);
    }
  }
  // The dome the learner set is in the brief, so the reviewer judges the same numbers.
  const dome = travelerById['fsw-dome'];
  const text = caseBrief(dome, dome.cases[0], { numbers: domeNumbers({ pressureKPa: 300, diameterM: 4 }) });
  assert.match(text, /300 kPa/);
  assert.match(text, /4 m across/);
  assert.match(projectInstructions(), /traveler case/i);
});

test('the dome\'s numbers print to three figures, with the units a shop uses', () => {
  assert.equal(fig(646.25), '646');
  assert.equal(fig(2.6889), '2.69');
  assert.equal(fig(0.2379), '0.238');
  assert.equal(fig(1234.5), '1230');
  assert.equal(fig(5.5), '5.5');
  const n = domeNumbers();
  for (const name of Object.keys(n.blocks)) {
    const b = blockRows(name, n);
    assert.ok(b.title && b.note, `${name}: title and note`);
    assert.ok(b.rows.length >= 3, `${name}: rows`);
    for (const r of b.rows) {
      assert.ok(r.label && r.value, `${name}: ${JSON.stringify(r)}`);
      assert.ok(!/NaN|undefined|Infinity/.test(r.label + r.value), `${name}: ${r.value}`);
    }
  }
  const text = (name) => blockRows(name, n).rows.map((r) => `${r.label}: ${r.value}`).join('\n');
  assert.match(text('requirement'), /Proof pressure[^\n]*: 247 kPa/);
  assert.match(text('requirement'), /646 N per mm/);
  assert.match(text('requirement'), /323 N per mm/);
  assert.match(text('lands'), /2\.69 mm/);
  assert.match(text('lands'), /yield at proof governs/);
  assert.match(text('lands'), /33% thicker/);
  assert.match(text('flaws'), /Dye penetrant: a crack 0\.64 mm deep and 6\.36 mm long, 24% of the land/);
  assert.match(text('repairs'), /Fusion weld repair: 67% warm, 61% cold/);
  assert.match(text('proof'), /1\.6 times/);
  // A thin land is outside a method's range, and the row says so.
  assert.match(blockRows('flaws', domeNumbers({ pressureKPa: 100, diameterM: 2 })).rows.map((r) => r.value).join('\n'), /thinner than this method/);
});

test('the address picks which Build view shows: the satellite, or a traveler', () => {
  assert.deepEqual(pickBuildView(''), { view: 'satellite' });
  assert.deepEqual(pickBuildView('?application=satellite&component=structure'), { view: 'satellite' });
  assert.deepEqual(pickBuildView('?traveler=fsw-dome'), { view: 'traveler', traveler: 'fsw-dome', station: 'requirement' });
  assert.deepEqual(pickBuildView('?traveler=fsw-dome&station=proof'), { view: 'traveler', traveler: 'fsw-dome', station: 'proof' });
  // A station the traveler does not have opens its first. A traveler that does not exist shows the satellite.
  assert.deepEqual(pickBuildView('?traveler=fsw-dome&station=nowhere'), { view: 'traveler', traveler: 'fsw-dome', station: 'requirement' });
  assert.deepEqual(pickBuildView('?traveler=nothing'), { view: 'satellite' });
});
