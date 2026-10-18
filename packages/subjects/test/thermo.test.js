import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { createEngine } from '@flux/core';
import {
  ThermoRangeError, covered, cpMolar, fromC, gas, hMolar, molarMass, mixT, region, s0Molar, satP, satT,
  superheatTable, compressedTable, satTableT, satTableP, tableInterp, tableInterp2, printed, waterP, waterTP, waterTv,
  SAT_T_GRID, SUPERHEAT_P_GRID, SUPERHEAT_T_GRID, R_UNIVERSAL, inUnits,
} from '../src/thermo/index.js';
import { NASA7 } from '../src/thermo/nasa7-data.js';

const fixture = (name) => new URL(`./fixtures/engine/${name}`, import.meta.url);
const CAL = 4.184; // the thermochemical calorie, CEA's

/** Throws a ThermoRangeError for `region`, with a message that matches `text`. */
function throwsRange(fn, regionWanted, text) {
  assert.throws(fn, (e) => {
    assert.ok(e instanceof ThermoRangeError, `${e?.name}: ${e?.message}`);
    assert.equal(e.region, regionWanted);
    if (text) assert.match(e.message, text);
    return true;
  });
}

test('a state in region 3 throws and says so', () => {
  throwsRange(() => waterTP(650, 25e6), 3, /region 3, near the critical point/);
  throwsRange(() => waterTP(fromC(400), 30e6), 3, /region 3/);
  throwsRange(() => region(700, 40), 3, /region 3/);
  throwsRange(() => satT(640), 3, /region 3/);
  throwsRange(() => satP(20e6), 3, /region 3/);
  throwsRange(() => waterP(20e6, 'h', 2000e3), 3, /region 3/);
  throwsRange(() => waterTv(650, 0.003), 3, /region 3/);
});

test('a state outside the formulation, or in region 5, throws', () => {
  throwsRange(() => waterTP(260, 1e5), 'outside', /below 273\.15 K/);
  throwsRange(() => waterTP(400, 120e6), 'outside', /above 100 MPa/);
  throwsRange(() => waterTP(400, 0), 'outside', /above zero/);
  throwsRange(() => waterTP(1200, 1e6), 5, /region 5/);
  throwsRange(() => satT(660), 'outside', /critical temperature/);
  throwsRange(() => satP(100), 'outside', /triple-point/);
  throwsRange(() => waterP(1e5, 'h', 5000e3), 'outside', /1073\.15 K/);
  throwsRange(() => waterP(1e6, 'v', 0.001), 'outside', /not fixed by p and v/);
});

test('an ideal gas outside its fitted range throws', () => {
  throwsRange(() => cpMolar('CO2', 4000), 'outside', /CO2 is fitted from 200 K to 3500 K/);
  throwsRange(() => cpMolar('N2', 250), 'outside', /N2 is fitted from 298\.15 K/);
  throwsRange(() => gas('air').cp(250), 'outside', /N2/);
  assert.ok(Number.isFinite(cpMolar('AR', 200)));
  assert.throws(() => cpMolar('XE', 300), TypeError);
});

test('covered() is true exactly where a state can be computed, and the tables keep out of region 3', () => {
  assert.equal(covered(fromC(400), 30e6), false);
  assert.equal(covered(fromC(400), 10e6), true);
  assert.equal(covered(fromC(900), 1e6), false);
  for (const block of superheatTable()) {
    for (const cell of block.rows) {
      assert.equal(!cell.skip, covered(cell.T, cell.p), `${cell.p} Pa, ${cell.T} K`);
      if (cell.skip) assert.ok(cell.skip === 'region 3' || cell.skip === 'outside');
    }
  }
  const skipped = superheatTable().flatMap((b) => b.rows).filter((c) => c.skip === 'region 3');
  assert.ok(skipped.length > 0, 'the grid does reach region 3, and those cells are left out');
  for (const block of compressedTable()) for (const cell of block.rows) assert.ok(!cell.skip, `${cell.p} Pa, ${cell.T} K`);
  assert.equal(satTableT().length, SAT_T_GRID.length);
  assert.ok(satTableP().every((r) => r.vg > r.vf && r.hg > r.hf && r.sg > r.sf));
});

test('English units come from the exact definitions', () => {
  const s = inUnits(waterTP(fromC(200), 1e6), 'English');
  const si = waterTP(fromC(200), 1e6);
  assert.ok(Math.abs(s.h * 2.326e3 - si.h) < 1e-9 * si.h);
  assert.ok(Math.abs(s.s * 4186.8 - si.s) < 1e-9 * si.s);
  assert.ok(Math.abs(s.T - si.T * 1.8) < 1e-9);
  assert.equal(s.phase, si.phase);
});

// ---------- The engine repo, at its pinned commit ----------

test('the engine fixtures are the files at the pinned commit', () => {
  const sha = (name) => crypto.createHash('sha256').update(fs.readFileSync(fixture(name))).digest('hex');
  assert.equal(sha('thermo_nasa7.json'), 'e705f80cb7a6a6c9d821595c10da509c74714f750e202774b7cfcd150a4bbd90');
  assert.equal(sha('design_point.txt'), '9069c7edc2c4715214c0eee316e36cf1cb3fe51c0f1cf3c7d21d4da977e28549');
});

test('NASA-7 data and values match the engine repo for every species it carries', () => {
  const engine = JSON.parse(fs.readFileSync(fixture('thermo_nasa7.json'), 'utf8'));
  assert.equal(engine.source_sha256, '0bfc72f546309d1388f21a30fcb7c31372d7de6e92d60d028d8f3e8499ddf774');
  for (const [sp, r] of Object.entries(engine.species)) {
    const ours = NASA7[sp];
    assert.ok(ours, `${sp} is missing`);
    assert.deepEqual(ours.high, r.high, `${sp} high-range coefficients`);
    assert.deepEqual(ours.low, r.low, `${sp} low-range coefficients`);
    assert.equal(ours.W, r.W, `${sp} molar mass`);
    assert.deepEqual([ours.T_low, ours.T_mid, ours.T_high], [r.T_low, r.T_mid, r.T_high]);
    // Evaluate the engine's coefficients with the formulas in its own file's "form" note.
    for (const T of [300, 800, 1000, 2500]) {
      const a = T < r.T_mid ? r.low : r.high;
      const cp = a[0] + a[1] * T + a[2] * T ** 2 + a[3] * T ** 3 + a[4] * T ** 4;
      const h = a[0] + (a[1] * T) / 2 + (a[2] * T ** 2) / 3 + (a[3] * T ** 3) / 4 + (a[4] * T ** 4) / 5 + a[5] / T;
      const s = a[0] * Math.log(T) + a[1] * T + (a[2] * T ** 2) / 2 + (a[3] * T ** 3) / 3 + (a[4] * T ** 4) / 4 + a[6];
      const close = (x, y, what) => assert.ok(Math.abs(x - y) <= 1e-12 * Math.abs(y), `${sp} ${what} at ${T} K: ${x} vs ${y}`);
      close(cpMolar(sp, T), R_UNIVERSAL * cp, 'cp');
      close(hMolar(sp, T), R_UNIVERSAL * T * h, 'h');
      close(s0Molar(sp, T), R_UNIVERSAL * s, 's°');
    }
  }
});

/** The numbers the checks use, read from CEA's own output, not retyped. */
function readDesignPoint() {
  const text = fs.readFileSync(fixture('design_point.txt'), 'utf8');
  const perf = text.slice(text.indexOf('THEORETICAL ROCKET PERFORMANCE'));
  const row = (label) => {
    const line = perf.split('\n').find((l) => l.trimStart().startsWith(label));
    assert.ok(line, `no "${label}" row`);
    return line.slice(line.indexOf(label) + label.length).trim().split(/\s+/).map(Number);
  };
  const frozen = perf.slice(perf.indexOf('WITH FROZEN REACTIONS'));
  const cpFrozen = frozen.split('\n').find((l) => l.trimStart().startsWith('Cp, CAL/(G)(K)'));
  const fractions = {};
  const block = perf.slice(perf.indexOf('MOLE FRACTIONS'), perf.indexOf('* THERMODYNAMIC PROPERTIES'));
  for (const line of block.split('\n').slice(1)) {
    const m = line.trim().match(/^\*?(\S+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/);
    if (m) fractions[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  }
  const fuel = perf.split('\n').find((l) => l.trimStart().startsWith('FUEL'));
  return {
    P: row('P, ATM'),
    T: row('T, K'),
    H: row('H, CAL/G'),
    S: row('S, CAL/(G)(K)'),
    M: row('M, (1/n)'),
    a: row('SON VEL,M/SEC'),
    Mach: row('MACH NUMBER'),
    cpFrozen: cpFrozen.trim().split(/\s+/).slice(2).map(Number),
    of: Number(perf.match(/O\/F=\s*([\d.]+)/)[1]),
    fuelEnthalpy: Number(fuel.trim().split(/\s+/)[3]), // cal/mol
    fractions,
  };
}

test('the CEA design point: molar mass, frozen cp and entropy at the chamber, throat and exit', () => {
  const cea = readDesignPoint();
  assert.deepEqual(cea.T, [3327.83, 3155.62, 2506.52]);
  // HCO and HO2 are at most 2e-5 and have no polynomial here; the rest are renormalised.
  const known = Object.keys(cea.fractions).filter((k) => NASA7[k]);
  assert.deepEqual(known.sort(), ['CO', 'CO2', 'H', 'H2', 'H2O', 'O', 'O2', 'OH']);
  for (let i = 0; i < 3; i++) {
    const total = known.reduce((a, k) => a + cea.fractions[k][i], 0);
    assert.ok(total > 0.9999, `fractions at station ${i} sum to ${total}`);
    const x = Object.fromEntries(known.map((k) => [k, cea.fractions[k][i] / total]));
    const T = cea.T[i];
    const W = molarMass(x); // kg/mol
    const cp = known.reduce((a, k) => a + x[k] * cpMolar(k, T), 0) / W; // J/(kg·K), composition frozen
    const p = cea.P[i] * 101325;
    const s = known.reduce((a, k) => a + x[k] * (s0Molar(k, T) - R_UNIVERSAL * Math.log((x[k] * p) / 1e5)), 0) / W;
    const rel = (got, want) => Math.abs(got / want - 1);
    assert.ok(rel(W * 1e3, cea.M[i]) < 1e-4, `M at ${T} K: ${W * 1e3} vs ${cea.M[i]}`);
    assert.ok(rel(cp / 1e3 / CAL, cea.cpFrozen[i]) < 1e-3, `frozen cp at ${T} K: ${cp / 1e3 / CAL} vs ${cea.cpFrozen[i]}`);
    assert.ok(rel(s / 1e3 / CAL, cea.S[i]) < 1e-4, `s at ${T} K: ${s / 1e3 / CAL} vs ${cea.S[i]}`);
  }
});

test('the CEA design point: the energy balance closes, and the enthalpy gap is CH4\'s heat of formation', () => {
  const cea = readDesignPoint();
  const yFuel = 1 / (1 + cea.of);
  const known = Object.keys(cea.fractions).filter((k) => NASA7[k]);
  const hMix = (i) => {
    const total = known.reduce((a, k) => a + cea.fractions[k][i], 0);
    const x = Object.fromEntries(known.map((k) => [k, cea.fractions[k][i] / total]));
    return known.reduce((a, k) => a + x[k] * hMolar(k, cea.T[i]), 0) / molarMass(x) / 1e3 / CAL; // cal/g
  };
  const reactants = (yFuel * hMolar('CH4', 298.15)) / molarMass('CH4') / 1e3 / CAL + ((1 - yFuel) * hMolar('O2', 298.15)) / molarMass('O2') / 1e3 / CAL;
  // CEA's input states ΔfH(CH4) = −17895 cal/mol; GRI-Mech 3.0 has −74.600 kJ/mol. That difference,
  // spread over a gram of propellant, is the whole gap between the two reactant enthalpies.
  const gap = (yFuel * (hMolar('CH4', 298.15) / CAL - cea.fuelEnthalpy)) / (molarMass('CH4') * 1e3);
  assert.ok(Math.abs(reactants - gap - cea.H[0]) < 0.02, `reactants ${reactants} cal/g, CEA ${cea.H[0]}, gap ${gap}`);
  // With one dataset on both sides, the adiabatic chamber balances: products = reactants.
  assert.ok(Math.abs(hMix(0) - reactants) < 0.15, `chamber products ${hMix(0)} vs reactants ${reactants} cal/g`);
  // The expansion: exit speed from the enthalpy drop, against CEA's Mach number times its sound speed.
  const drop = (hMix(0) - hMix(2)) * CAL * 1e3; // J/kg
  const ue = Math.sqrt(2 * drop);
  const ueCea = cea.Mach[2] * cea.a[2];
  assert.ok(Math.abs(ue / ueCea - 1) < 1e-3, `exit speed ${ue} vs ${ueCea} m/s`);
});

// ---------- Grading: a textbook-style interpolated answer passes through alt ----------

test('an answer interpolated from the generated table passes, and so does the exact one', () => {
  const { grade } = createEngine();
  // Saturation pressure at 42.5 °C, between the 40 °C and 45 °C rows. p_sat curves upward, so the
  // straight line between the rows lands 0.74% above the exact value.
  const T = fromC(42.5);
  const exact = satT(T).p / 1e3; // kPa
  const table = tableInterp((t) => satT(t).p / 1e3, SAT_T_GRID, T);
  // The student reads the two printed rows (four significant figures) and interpolates.
  const student = tableInterp((t) => satT(t).p / 1e3, SAT_T_GRID, T, (y) => printed(y, 4));
  assert.ok(Math.abs(table / exact - 1) > 0.007, `the interpolation error is real: ${table} vs ${exact}`);

  const part = { kind: 'numeric', get: () => exact, alt: () => table, tol: 0.003 };
  const typed = (v) => printed(v, 4).toString();
  assert.equal(grade(part, {}, typed(exact)).correct, true, 'the exact value');
  assert.equal(grade(part, {}, typed(student)).correct, true, `the interpolated value ${typed(student)}`);
  assert.equal(grade({ ...part, alt: undefined }, {}, typed(student)).correct, false, 'without alt it would fail');
  assert.equal(grade(part, {}, typed(satT(fromC(40)).p / 1e3)).correct, false, 'the 40 °C row alone is wrong');
});

test('a double interpolation on the superheated table passes through alt', () => {
  const { grade } = createEngine();
  // Steam at 0.9 MPa and 275 °C: between 0.8 and 1 MPa, and between 250 and 300 °C.
  const p = 0.9e6;
  const T = fromC(275);
  const v = (pp, tt) => waterTP(tt, pp).v;
  const exact = v(p, T);
  const student = tableInterp2(v, SUPERHEAT_P_GRID, SUPERHEAT_T_GRID, p, T, (y) => printed(y, 4));
  const table = tableInterp2(v, SUPERHEAT_P_GRID, SUPERHEAT_T_GRID, p, T);
  const part = { kind: 'numeric', get: () => exact, alt: () => table, tol: 0.003 };
  assert.ok(Math.abs(table / exact - 1) > 0.003, `v is curved in p: ${table} vs ${exact}`);
  assert.equal(grade(part, {}, printed(student, 4).toString()).correct, true);
  assert.equal(grade(part, {}, printed(exact, 4).toString()).correct, true);
  assert.equal(grade({ ...part, alt: undefined }, {}, printed(student, 4).toString()).correct, false);
});

test('a quality from interpolated saturation values is graded the same way', () => {
  const { grade } = createEngine();
  const T = fromC(137);
  const m = mixT(T, 0.6);
  const sat = (key) => tableInterp((t) => satT(t)[key], SAT_T_GRID, T, (y) => printed(y, 5));
  const xStudent = (m.h - sat('hf')) / (sat('hg') - sat('hf'));
  const part = { kind: 'numeric', get: () => 0.6, alt: () => (m.h - sat('hf')) / (sat('hg') - sat('hf')), tol: 0.005 };
  assert.equal(grade(part, {}, printed(xStudent, 3).toString()).correct, true);
});
