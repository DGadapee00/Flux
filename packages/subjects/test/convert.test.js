import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FT_LBF_PER_S_PER_HP,
  G_STANDARD,
  J_PER_BTU,
  J_PER_FT_LBF,
  K_PER_R,
  KG_PER_LBM,
  KG_PER_SLUG,
  M_PER_FT,
  M_PER_KM,
  M_PER_MI,
  N_PER_LBF,
  PA_PER_PSI,
  SI_FACTORS,
  W_PER_HP,
  convert,
  fromSI,
  toSI,
} from '../src/convert.js';

const REQUIRED = ['m', 'ft', 'in', 'kg', 'lbm', 'slug', 'N', 'lbf', 'Pa', 'psi', 'J', 'ft·lbf', 'Btu', 'W', 'hp', 'K', 'R'];

function close(actual, expected, name) {
  const scale = Math.max(1e-30, Math.abs(expected));
  assert.ok(
    Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-12 * scale,
    `${name}: got ${actual}, expected ${expected}`,
  );
}

test('the five definitions are the exact constants', () => {
  assert.equal(M_PER_FT, 0.3048);
  assert.equal(KG_PER_LBM, 0.45359237);
  assert.equal(G_STANDARD, 9.80665);
  assert.equal(J_PER_BTU, 1055.05585262);
  assert.equal(K_PER_R, 5 / 9);
  assert.equal(FT_LBF_PER_S_PER_HP, 550);
  for (const unit of REQUIRED) assert.equal(typeof SI_FACTORS[unit], 'number', unit);
});

const PARTNER = {
  m: 'ft',
  ft: 'in',
  in: 'ft',
  mi: 'km',
  km: 'mi',
  kg: 'lbm',
  lbm: 'slug',
  slug: 'lbm',
  N: 'lbf',
  lbf: 'N',
  Pa: 'psi',
  psi: 'Pa',
  J: 'Btu',
  'ft·lbf': 'Btu',
  Btu: 'ft·lbf',
  W: 'hp',
  hp: 'W',
  K: 'R',
  R: 'K',
};

test('every unit round-trips through SI and through another unit of its kind', () => {
  for (const unit of Object.keys(SI_FACTORS)) {
    const via = PARTNER[unit];
    for (const value of [0, 1, -2.5, 1e-6, 1000, 12.345]) {
      close(fromSI(toSI(value, unit), unit), value, `${value} ${unit}`);
      close(convert(convert(value, unit, via), via, unit), value, `${value} ${unit} via ${via}`);
    }
  }
});

test('a pound-force is one pound-mass under standard gravity', () => {
  const newton = 0.45359237 * 9.80665;
  close(N_PER_LBF, newton, 'lbf in newtons');
  close(toSI(1, 'lbf') / toSI(1, 'lbm'), 9.80665, 'lbf / lbm is standard g');
  close(toSI(1, 'lbf'), newton, 'toSI lbf');
});

test('a slug accelerates at one foot per second squared under one pound-force', () => {
  const newton = 0.45359237 * 9.80665;
  const slug = newton / 0.3048;
  close(KG_PER_SLUG, slug, 'slug in kilograms');
  close(toSI(1, 'slug') * toSI(1, 'ft'), toSI(1, 'lbf'), 'm a = F');
  close(toSI(1, 'slug') / toSI(1, 'lbm'), 9.80665 / 0.3048, 'a slug is g pound-mass, g in ft/s²');
});

test('psi is a pound-force on a square inch, and twelve inches make a foot', () => {
  const inch = 0.3048 / 12;
  const newton = 0.45359237 * 9.80665;
  close(toSI(12, 'in'), toSI(1, 'ft'), '12 in = 1 ft');
  close(toSI(1, 'psi') * inch * inch, newton, 'psi × in² = lbf');
  close(PA_PER_PSI, 144 * newton / 0.3048 ** 2, 'psi = 144 lbf/ft²');
  close(convert(1, 'ft', 'in'), 12, '1 ft in inches');
});

test('foot-pounds and horsepower follow from the force and the foot', () => {
  const joule = 0.45359237 * 9.80665 * 0.3048;
  close(J_PER_FT_LBF, joule, 'ft·lbf in joules');
  close(toSI(1, 'ft·lbf'), joule, 'toSI ft·lbf');
  close(W_PER_HP, 550 * joule, 'hp in watts');
  close(toSI(1, 'hp'), (33000 / 60) * toSI(1, 'ft·lbf'), '1 hp = 33000 ft·lbf/min');
  close(toSI(1, 'Btu') / toSI(1, 'ft·lbf'), 1055.05585262 / joule, 'Btu counted in ft·lbf');
});

test('rankine and kelvin share a zero', () => {
  close(toSI(0, 'R'), 0, 'absolute zero');
  close(toSI(9, 'R'), 5, '9 R = 5 K');
  close(convert(5, 'K', 'R'), 9, '5 K = 9 R');
  close(toSI(1, 'Btu'), 1055.05585262, 'one Btu');
});

test('an unknown unit is rejected, and so is a change of kind', () => {
  assert.throws(() => toSI(1, 'lb'), /unknown unit: lb/);
  assert.throws(() => fromSI(1, 'stone'), /unknown unit: stone/);
  assert.throws(() => convert(1, 'ft', 'kg'), /cannot convert ft to kg/);
});

test('a mile is 5280 feet, which is 1609.344 m, and a kilometre is 1000 m', () => {
  assert.equal(M_PER_MI, 5280 * M_PER_FT);
  close(M_PER_MI, 1609.344, 'mile');
  close(toSI(1, 'mi'), 1609.344, 'toSI mile');
  close(convert(1, 'mi', 'km'), 1.609344, 'mile in km');
  close(convert(60, 'mi', 'ft'), 316800, 'sixty miles in feet');
  assert.equal(M_PER_KM, 1000);
  assert.throws(() => convert(1, 'mi', 'kg'));
});
