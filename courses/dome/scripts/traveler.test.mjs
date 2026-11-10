import assert from 'node:assert/strict';
import test from 'node:test';
import dome from '../src/traveler.js';
import { DEFAULTS, FACTORS, FLAWS, MPA_PER_KSI, REPAIRS, WELD, domeNumbers } from '../src/dome-numbers.js';
import { FOUNDATIONS } from '../src/foundations.js';
import { caseBrief, projectInstructions } from '../src/brief.js';
import { foundation } from '../src/links.js';
import { blockRows, fig, stationFromAddress } from '../src/text.js';

/**
 * The traveler's data, the dome's numbers and the briefs. Every number is checked a second way.
 * That each linked lab still exists is checked across courses, in
 * packages/checks/test/project-links.test.js.
 */
const EM_DASH = '—';
const TRAVELERS = [dome];

/** Every string in a value, however deep. */
function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

test('a traveler follows one part through the shop: stations in order, each with the same five things', () => {
  for (const t of TRAVELERS) {
    assert.equal(t.id, 'fsw-dome');
    for (const key of ['title', 'process', 'part', 'lede', 'why']) assert.ok(t[key], `${t.id}: ${key}`);
    const ids = t.stations.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `${t.id}: station ids are unique`);
    assert.ok(ids.length >= 8, `${t.id}: a traveler has at least eight stations`);
    for (const s of t.stations) {
      const where = `${t.id}/${s.id}`;
      assert.ok(s.title && s.what, `${where}: title and what happens`);
      assert.ok(s.decides.length >= 2, `${where}: what the engineer decides`);
      assert.ok(s.wrong.length >= 1, `${where}: what goes wrong`);
      for (const w of s.wrong) assert.ok(w.what && w.why && w.found, `${where}: a failure says what, why and how it is found`);
      assert.ok(s.paper.length >= 1, `${where}: the paper it produces`);
      for (const p of s.paper) assert.ok(p.name && p.what, `${where}: a document has a name and a use`);
      assert.ok(s.ask.length >= 2, `${where}: what to ask on the floor`);
      for (const q of s.ask) assert.match(q, /\?$/, `${where}: "${q}" is a question`);
      assert.ok(s.foundations.length >= 1, `${where}: the foundations behind it`);
      for (const id of s.foundations) assert.ok(FOUNDATIONS[id], `${where}: ${id}`);
    }
  }
});

test('the dome is the part NASA built: eleven stations from requirement to design', () => {
  assert.deepEqual(dome.stations.map((s) => s.id), [
    'requirement', 'material', 'panels', 'fitup', 'schedule', 'weld', 'inspection', 'nonconformance', 'proof', 'acceptance', 'design',
  ]);
});

test('every figure on a traveler names a source read for it', () => {
  for (const t of TRAVELERS) {
    const refs = new Set(t.references.map((r) => r.id));
    assert.equal(refs.size, t.references.length, `${t.id}: reference ids are unique`);
    const used = new Set(t.cites || []);
    for (const id of used) assert.ok(refs.has(id), `${t.id}: cites ${id}`);
    for (const s of t.stations) {
      for (const id of s.sources) {
        assert.ok(refs.has(id), `${t.id}/${s.id}: source ${id}`);
        used.add(id);
      }
      const text = strings([s.what, s.decides, s.wrong, s.paper, s.ask]).join(' ');
      if (/\d/.test(text)) assert.ok(s.sources.length >= 1, `${t.id}/${s.id} states a figure and names no source`);
    }
    for (const c of t.cases) for (const id of c.sources || []) {
      assert.ok(refs.has(id), `${t.id}/${c.id}: source ${id}`);
      used.add(id);
    }
    for (const r of t.references) {
      assert.ok(used.has(r.id), `${t.id}: reference ${r.id} is cited by something`);
      assert.equal(new URL(r.url).protocol, 'https:', r.url);
      assert.match(r.checked, /^\d{4}-\d{2}-\d{2}$/, `${t.id}/${r.id} checked`);
      assert.ok(r.title && r.why, `${t.id}/${r.id} title and why`);
    }
  }
});

test('a case belongs to a station and can be judged: a situation, evidence, a task and a checklist', () => {
  for (const t of TRAVELERS) {
    const stations = new Set(t.stations.map((s) => s.id));
    assert.ok(t.cases.length >= 3, `${t.id} has cases to practise on`);
    assert.equal(new Set(t.cases.map((c) => c.id)).size, t.cases.length);
    for (const c of t.cases) {
      assert.ok(stations.has(c.station), `${t.id}/${c.id}: station ${c.station}`);
      assert.ok(c.title && c.situation && c.task, `${t.id}/${c.id}: title, situation and task`);
      assert.ok(c.evidence.length >= 2, `${t.id}/${c.id}: evidence`);
      assert.ok(c.checklist.length >= 3, `${t.id}/${c.id}: checklist`);
    }
  }
});

test('travelers keep to the voice: no em dashes', () => {
  for (const t of TRAVELERS) for (const s of strings(t)) assert.ok(!s.includes(EM_DASH), `${t.id}: "${s.slice(0, 60)}" has an em dash`);
});

test('a station that shows the dome\'s numbers names a block the numbers have', () => {
  const n = domeNumbers();
  for (const s of dome.stations) if (s.numbers) assert.ok(n.blocks[s.numbers], `${s.id}: block ${s.numbers}`);
  assert.deepEqual(Object.keys(n.blocks).sort(), [...new Set(dome.stations.map((s) => s.numbers).filter(Boolean))].sort(), 'every block is shown at a station');
});

test('a foundation has a title and a place in a course, and every one listed is used', () => {
  for (const [id, f] of Object.entries(FOUNDATIONS)) {
    assert.ok(f.title, `${id} has a title`);
    if (f.course) assert.ok(f.unit && f.lab, `${id}: a taught foundation names its unit and lab`);
    else assert.deepEqual(Object.keys(f), ['title'], `${id}: an idea with no lab names no place`);
  }
  const used = new Set(dome.stations.flatMap((s) => s.foundations));
  assert.deepEqual(Object.keys(FOUNDATIONS).filter((id) => !used.has(id)), []);
  const vessel = foundation('pressure-vessels');
  assert.match(vessel.href, /^\.\.\/egn3331\/#\/egn3331\//);
  assert.equal(vessel.code, 'EGN 3331');
  assert.throws(() => foundation('nowhere'), /No foundation/);
});

// ---------- The dome's numbers ----------

test('the load in a seam: a force balance by integration agrees with p r and p r / 2', () => {
  const n = domeNumbers();
  const p = (DEFAULTS.pressureKPa * 1000) / 1e6; // N/mm²
  const r = (DEFAULTS.diameterM * 1000) / 2; // mm
  // Cut the barrel along its axis. Pressure on the half shell pushes it off the cut with
  // ∫ p sinθ r dθ per unit length, and two walls hold it: the hoop load per wall.
  const steps = 20000;
  let push = 0;
  for (let i = 0; i < steps; i++) {
    const theta = (Math.PI * (i + 0.5)) / steps;
    push += p * Math.sin(theta) * r * (Math.PI / steps);
  }
  assert.ok(Math.abs(push / 2 - n.seams.long.load) / n.seams.long.load < 1e-6, 'longitudinal seam carries p r');
  // Cut it across. Pressure on the end, p π r², is held by the wall around the circumference, 2 π r.
  assert.ok(Math.abs((p * Math.PI * r * r) / (2 * Math.PI * r) - n.seams.girth.load) < 1e-9, 'girth seam carries p r / 2');
  assert.ok(Math.abs(n.seams.long.load / n.seams.girth.load - 2) < 1e-12, 'the long seam carries twice the girth seam');
});

test('the weld land is as thick as the harder of two checks asks, and the land then passes both', () => {
  const n = domeNumbers();
  const ftu = WELD.fsw.ftuKsi * MPA_PER_KSI;
  const fty = WELD.fsw.ftyKsi * MPA_PER_KSI;
  for (const seam of Object.values(n.seams)) {
    const t = seam.landMm;
    assert.equal(t, Math.max(seam.ultimateMm, seam.yieldMm));
    assert.equal(seam.governs, seam.yieldMm >= seam.ultimateMm ? 'yield' : 'ultimate');
    // Check the result the other way round: stress in a land this thick.
    assert.ok((FACTORS.ultimate * seam.load) / t <= ftu * (1 + 1e-12), 'does not break at 1.4 times the design pressure');
    assert.ok((FACTORS.proof * seam.load) / t <= fty * (1 + 1e-12), 'does not yield at proof pressure');
    const tight = Math.max((FACTORS.ultimate * seam.load) / t / ftu, (FACTORS.proof * seam.load) / t / fty);
    assert.ok(Math.abs(tight - 1) < 1e-12, 'and no thicker than the governing check needs');
  }
  // For this weld, yield at proof governs, because its yield is low against its ultimate strength.
  assert.equal(n.seams.long.governs, 'yield');
  assert.ok(WELD.fsw.ftyKsi / FACTORS.proof < WELD.fsw.ftuKsi / FACTORS.ultimate);
});

test('the default dome: the figures the stations quote', () => {
  const n = domeNumbers();
  assert.equal(DEFAULTS.diameterM, 5.5);
  assert.equal(DEFAULTS.pressureKPa, 235);
  assert.deepEqual(FACTORS, { ultimate: 1.4, proof: 1.05 });
  assert.ok(Math.abs(MPA_PER_KSI - 6.894757) < 1e-6);
  assert.ok(Math.abs(n.proofKPa - 246.75) < 1e-9);
  assert.ok(Math.abs(n.seams.long.load - 646.25) < 1e-9, 'N/mm');
  assert.ok(Math.abs(n.seams.long.landMm - 2.69) < 0.005, `long seam land, got ${n.seams.long.landMm}`);
  assert.ok(Math.abs(n.seams.girth.landMm - 1.34) < 0.005, `girth seam land, got ${n.seams.girth.landMm}`);
  // A fusion weld's land, on ultimate strength, is a third thicker: 58.7 against 44 ksi.
  assert.ok(Math.abs(n.fusionRatio - 58.7 / 44) < 1e-12);
  assert.ok(Math.abs(n.fusionRatio - 4 / 3) < 0.01);
  // Cold, the weld is 1.6 times stronger.
  assert.ok(Math.abs(n.cryoFactor - 1.6) < 0.05);
});

test('changing the dome changes its numbers in proportion', () => {
  const a = domeNumbers();
  const b = domeNumbers({ pressureKPa: 470, diameterM: 5.5 });
  const c = domeNumbers({ pressureKPa: 235, diameterM: 2.75 });
  assert.ok(Math.abs(b.seams.long.landMm / a.seams.long.landMm - 2) < 1e-12, 'twice the pressure, twice the land');
  assert.ok(Math.abs(c.seams.long.landMm / a.seams.long.landMm - 0.5) < 1e-12, 'half the diameter, half the land');
  // Nonsense in, the defaults out: the page never shows NaN.
  for (const bad of [{ pressureKPa: 0 }, { pressureKPa: -5 }, { diameterM: Number.NaN }, { pressureKPa: 'abc' }]) {
    assert.deepEqual(domeNumbers(bad).inputs, DEFAULTS, JSON.stringify(bad));
  }
});

test('what a standard inspection is counted on to find, against the land it looks at', () => {
  const n = domeNumbers();
  assert.deepEqual(FLAWS.map((f) => f.id), ['eddy', 'penetrant', 'ultrasonic', 'xray']);
  for (const f of n.flaws) {
    const def = FLAWS.find((x) => x.id === f.id);
    if (!f.applies) continue;
    const depth = def.depthOfThickness ? def.depthOfThickness * n.seams.long.landMm : def.depthMm;
    assert.ok(Math.abs(f.depthMm - depth) < 1e-12, f.id);
    assert.ok(Math.abs(f.share - depth / n.seams.long.landMm) < 1e-12, f.id);
  }
  // On the default land, penetrant is counted on for a crack a quarter of the way through.
  const pen = n.flaws.find((f) => f.id === 'penetrant');
  assert.ok(pen.applies && Math.abs(pen.share - 0.24) < 0.01, `penetrant share ${pen.share}`);
  // A land thinner than a method's range is not covered by its figure.
  const thin = domeNumbers({ pressureKPa: 100, diameterM: 2 });
  assert.ok(thin.seams.long.landMm < 2.54);
  assert.equal(thin.flaws.find((f) => f.id === 'ultrasonic').applies, false);
});

test('what each repair keeps of the weld\'s strength, as measured', () => {
  const n = domeNumbers();
  const by = Object.fromEntries(n.repairs.map((r) => [r.id, r]));
  assert.deepEqual(REPAIRS.map((r) => r.id), ['plug', 'stir', 'overlap', 'fusion']);
  for (const r of REPAIRS) {
    assert.ok(Math.abs(by[r.id].roomShare - r.roomKsi / WELD.wide.roomKsi) < 1e-12, r.id);
    assert.ok(Math.abs(by[r.id].coldShare - r.coldKsi / WELD.wide.coldKsi) < 1e-12, r.id);
  }
  // The claims the station makes: a plug repair keeps nearly all of it, a fusion repair about two thirds.
  assert.ok(by.plug.roomShare > 0.97 && by.plug.coldShare > 0.95);
  assert.ok(Math.abs(by.fusion.roomShare - 0.67) < 0.01);
  assert.ok(Math.abs(by.fusion.coldShare - 0.61) < 0.01);
});

// ---------- Briefs and text ----------

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
      assert.ok(!text.includes(EM_DASH), `${c.id} brief has no em dash`);
    }
  }
  // The dome the learner set is in the brief, so the reviewer judges the same numbers.
  const text = caseBrief(dome, dome.cases[0], { numbers: domeNumbers({ pressureKPa: 300, diameterM: 4 }) });
  assert.match(text, /300 kPa/);
  assert.match(text, /4 m across/);
  // The Project is told what a traveler is and how to judge a case.
  const rules = projectInstructions();
  assert.match(rules, /traveler/);
  assert.match(rules, /second method/);
  assert.match(rules, /root cause and corrective action/);
  assert.match(rules, /Do not treat it as a qualified procedure/);
  assert.ok(!rules.includes(EM_DASH));
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

test('the address picks the station: the one it names, or the first', () => {
  assert.equal(stationFromAddress(dome, ''), 'requirement');
  assert.equal(stationFromAddress(dome, '?station=proof'), 'proof');
  assert.equal(stationFromAddress(dome, '?station=nowhere'), 'requirement');
});
