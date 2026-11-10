import assert from 'node:assert/strict';
import test from 'node:test';
import { RECIPES, recipeById } from '../applications/satellite.js';
import { DECISIONS, decisionById, decisionsOf, optionById } from '../applications/decisions/index.js';
import { conflicts, derive, formatValue, linksOf } from '../applications/decide.js';
import { loadConcepts } from '../load.mjs';

const concepts = Object.fromEntries((await loadConcepts()).map(({ concept }) => [concept.id, concept]));
const EM_DASH = '—';

/** Every string in a value, however deep. */
function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

test('a recipe lists its decisions, and every decision belongs to the recipe that lists it', () => {
  const ids = DECISIONS.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length, 'decision ids are unique');
  for (const d of DECISIONS) {
    assert.ok(recipeById[d.subsystem], `${d.id}: subsystem ${d.subsystem}`);
    assert.ok((recipeById[d.subsystem].decisions || []).includes(d.id), `${d.subsystem} lists ${d.id}`);
    assert.equal(decisionById[d.id], d);
  }
  for (const r of RECIPES) {
    for (const id of r.decisions || []) assert.equal(decisionById[id]?.subsystem, r.id, `${r.id}: ${id}`);
    assert.deepEqual(decisionsOf(r.id).map((d) => d.id), r.decisions || [], `${r.id} in its own order`);
  }
  assert.deepEqual(recipeById.structure.decisions, ['structure-material', 'structure-process', 'structure-joints', 'structure-finish']);
});

test('a decision can be read in a minute: a question, what drives it, the options, a usual pick and what would change it', () => {
  for (const d of DECISIONS) {
    assert.match(d.question, /\?$/, `${d.id} asks a question`);
    assert.ok(d.title && d.lede && d.read, `${d.id} title, lede and how to read the table`);
    assert.ok(d.drivers.length >= 2 && d.drivers.length <= 3, `${d.id}: two or three drivers`);
    assert.ok(d.options.length >= 3 && d.options.length <= 6, `${d.id}: three to six options`);
    assert.ok(d.options.some((o) => o.id === d.pick.option), `${d.id}: the usual pick is one of its options`);
    assert.ok(d.pick.why.length > 40, `${d.id}: the pick says why`);
    assert.ok(d.changes.length >= 2, `${d.id}: what would change it`);
    assert.ok(d.watch.length >= 2, `${d.id}: what bites later`);
    for (const o of d.options) {
      for (const key of ['name', 'for', 'against', 'own']) assert.ok(o[key], `${d.id}/${o.id}: ${key}`);
    }
  }
});

test('option ids are unique across decisions, so a link can name one', () => {
  const ids = DECISIONS.flatMap((d) => d.options.map((o) => o.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const d of DECISIONS) for (const o of d.options) assert.deepEqual(optionById[o.id], { option: o, decision: d });
});

test('every option fills every column: a number, text, or a stated reason for a blank', () => {
  for (const d of DECISIONS) {
    assert.ok(d.columns.length >= 2, `${d.id} compares on at least two columns`);
    for (const col of d.columns) assert.ok(col.id && col.label && ['number', 'text'].includes(col.kind), `${d.id}: column ${col.id}`);
    for (const o of d.options) {
      for (const col of d.columns) {
        const v = o.values[col.id];
        const where = `${d.id}/${o.id}.${col.id}`;
        if (v === null) assert.ok(o.blank?.[col.id], `${where}: a blank says why`);
        else if (col.kind === 'number') assert.ok(Number.isFinite(v), `${where} is a number`);
        else assert.ok(typeof v === 'string' && v.length > 0, `${where} is text`);
      }
      assert.deepEqual(Object.keys(o.values).sort(), d.columns.map((c) => c.id).sort(), `${d.id}/${o.id} has no stray values`);
    }
  }
});

test('every number carries its source: an option with a figure names a reference its decision lists', () => {
  for (const d of DECISIONS) {
    const refs = new Set(d.references.map((r) => r.id));
    assert.equal(refs.size, d.references.length, `${d.id}: reference ids are unique`);
    for (const o of d.options) {
      for (const id of o.sources) assert.ok(refs.has(id), `${d.id}/${o.id}: source ${id}`);
      const hasFigure = /\d/.test(strings([o.values, o.for, o.against, o.own, o.note || '']).join(' '));
      if (hasFigure) assert.ok(o.sources.length >= 1, `${d.id}/${o.id} states a figure and names no source`);
    }
    const used = new Set(d.options.flatMap((o) => o.sources));
    // `cites`: references the card's own text leans on, beyond its options.
    for (const s of d.cites || []) {
      assert.ok(refs.has(s), `${d.id}: cites ${s}`);
      used.add(s);
    }
    for (const r of d.references) assert.ok(used.has(r.id), `${d.id}: reference ${r.id} is cited by something`);
  }
});

test('every reference is an https link we read, with a date and our own reason', () => {
  for (const d of DECISIONS) {
    assert.ok(d.references.length >= 2, `${d.id} has references`);
    for (const r of d.references) {
      assert.equal(new URL(r.url).protocol, 'https:', r.url);
      assert.match(r.checked, /^\d{4}-\d{2}-\d{2}$/, `${d.id}/${r.id} checked`);
      assert.ok(r.title && r.why, `${d.id}/${r.id} title and why`);
    }
  }
});

test('derived columns agree with a second calculation from the stated numbers', () => {
  const d = decisionById['structure-material'];
  assert.deepEqual(d.derived.map((c) => c.id), ['specific', 'plate', 'strength']);
  const rows = derive(d);
  for (const o of d.options) {
    const { E, rho, yield: sy } = o.values;
    const got = rows[o.id];
    // Written out again here, not through the decision's own formulas.
    assert.ok(Math.abs(got.specific - E / rho) < 1e-9, `${o.id} E/ρ`);
    assert.ok(Math.abs(got.plate - Math.exp(Math.log(E) / 3) / rho) < 1e-9, `${o.id} ∛E/ρ`);
    if (sy === null) assert.equal(got.strength, null, `${o.id} has no yield, so no yield per density`);
    else assert.ok(Math.abs(got.strength - sy / rho) < 1e-9, `${o.id} yield/ρ`);
  }
});

test('the plate index ranks materials as the mass of a sized plate does', () => {
  // A strip of plate, simply supported, sized so a centre load F deflects it by delta:
  // delta = F L^3 / (48 E I), I = b t^3 / 12, so t = (F L^3 / (4 E b delta))^(1/3) and m = rho b L t.
  const d = decisionById['structure-material'];
  const rows = derive(d);
  const F = 200, L = 0.3, b = 0.1, delta = 0.5e-3;
  const mass = (o) => {
    const E = o.values.E * 1e9;
    const rho = o.values.rho * 1000;
    const t = Math.cbrt((F * L ** 3) / (4 * E * b * delta));
    return rho * b * L * t;
  };
  const byMass = [...d.options].sort((p, q) => mass(p) - mass(q)).map((o) => o.id);
  const byIndex = [...d.options].sort((p, q) => rows[q.id].plate - rows[p.id].plate).map((o) => o.id);
  assert.deepEqual(byIndex, byMass, 'the highest index is the lightest plate');
  // And the mass ratio is the inverse ratio of the index, to rounding.
  const [a, z] = [d.options[0], d.options.at(-1)];
  assert.ok(Math.abs(mass(a) / mass(z) - rows[z.id].plate / rows[a.id].plate) < 1e-9);
});

test('the claims the cards make about the numbers hold for the numbers in the table', () => {
  const d = decisionById['structure-material'];
  const r = derive(d);
  const metals = ['al-6061-t6', 'al-7075-t73', 'al-5052-h32', 'ti-6al-4v'];
  // Every metal here has nearly the same stiffness for its mass: within 10% of 25.
  for (const id of metals) assert.ok(Math.abs(r[id].specific - 25) / 25 < 0.1, `${id}: E/ρ near 25, got ${r[id].specific}`);
  // In bending aluminium beats titanium by about 40%.
  assert.ok(Math.abs(r['al-6061-t6'].plate / r['ti-6al-4v'].plate - 1.4) < 0.05);
  // 7075-T73 has about 60% more yield strength than 6061-T6.
  const y = (id) => optionById[id].option.values.yield;
  assert.ok(Math.abs(y('al-7075-t73') / y('al-6061-t6') - 1.6) < 0.05);
  // Titanium: twice 6061's strength for the mass, about a third of its expansion.
  assert.ok(Math.abs(r['ti-6al-4v'].strength / r['al-6061-t6'].strength - 2) < 0.1);
  const cte = (id) => optionById[id].option.values.cte;
  assert.ok(Math.abs(cte('ti-6al-4v') / cte('al-6061-t6') - 1 / 3) < 0.05);
  // Along the fibres a laminate is over four times stiffer for its mass than any metal here.
  for (const id of metals) assert.ok(r['cfrp-laminate'].specific / r[id].specific > 4, id);
});

test('a number prints the way its column asks', () => {
  assert.equal(formatValue({ kind: 'number', dp: 2 }, 2.7), '2.70');
  assert.equal(formatValue({ kind: 'number' }, 71.7), '71.7');
  assert.equal(formatValue({ kind: 'number', dp: 1 }, 25.1851), '25.2');
  assert.equal(formatValue({ kind: 'number' }, -0.8), '−0.8');
  assert.equal(formatValue({ kind: 'text' }, 'Yes'), 'Yes');
  assert.equal(formatValue({ kind: 'number' }, null), 'none');
});

test('a link joins options of two different decisions, is written once, and reads from both ends', () => {
  const seen = new Set();
  for (const d of DECISIONS) {
    for (const o of d.options) {
      for (const link of o.links || []) {
        assert.ok(['goes-with', 'rules-out'].includes(link.kind), `${o.id}: ${link.kind}`);
        assert.ok(link.why, `${o.id}: a link says why`);
        for (const to of link.to) {
          assert.ok(optionById[to], `${o.id} links to ${to}`);
          assert.notEqual(optionById[to].decision.id, d.id, `${o.id} and ${to} are in one decision`);
          const pair = [o.id, to].sort().join(' + ');
          assert.ok(!seen.has(pair), `${pair} is written twice`);
          seen.add(pair);
        }
      }
    }
  }
  assert.ok(seen.size >= 10, 'the four choices are tied together');
  // Written on Print in metal, read from 6061.
  const fromPlate = linksOf('al-6061-t6').find((l) => l.other === 'printed-metal');
  assert.equal(fromPlate?.kind, 'rules-out');
  assert.equal(fromPlate.why, linksOf('printed-metal').find((l) => l.other === 'al-6061-t6').why);
});

test('picks that rule each other out are reported once, and the usual picks agree', () => {
  assert.deepEqual(conflicts({}), []);
  const usual = Object.fromEntries(DECISIONS.map((d) => [d.id, d.pick.option]));
  assert.deepEqual(conflicts(usual), [], 'the four usual picks can be made together');
  const clash = conflicts({ 'structure-material': 'al-6061-t6', 'structure-process': 'printed-metal' });
  assert.equal(clash.length, 1);
  assert.deepEqual([clash[0].a, clash[0].b].sort(), ['al-6061-t6', 'printed-metal']);
  assert.ok(clash[0].why);
  // A pick for a decision that does not exist, or an option that is not in it, is ignored.
  assert.deepEqual(conflicts({ nowhere: 'printed-metal', 'structure-material': 'printed-metal' }), []);
});

test('decisions name concepts on the map and keep to the voice: no em dashes', () => {
  for (const d of DECISIONS) {
    assert.ok(d.concepts.length >= 3, `${d.id} names its foundations`);
    for (const id of d.concepts) assert.ok(concepts[id], `${d.id}: ${id}`);
    for (const s of strings(d)) assert.ok(!s.includes(EM_DASH), `${d.id}: "${s.slice(0, 60)}" has an em dash`);
  }
});
