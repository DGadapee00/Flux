/**
 * A battery that fades with every orbit, and an array that loses power each year (Build a satellite,
 * Power).
 *
 * In low orbit a battery cycles once per orbit, about 5 700 times a year. Each cycle costs capacity,
 * more the deeper it goes: here the fade per cycle is (C₀/6000)(d/1)² in Wh, with depth of discharge
 * d = E/C, a model of lithium-ion that reaches 80% after about 30 000 cycles at 20% depth. As the
 * battery fades, the same eclipse energy E is a deeper discharge, which fades it faster:
 *   dC/dn = −k (E/C)²,  k = C₀/6000   ⇒   C(n) = (C₀³ − 3kE²n)^{1/3}.
 * The array loses about 2.75% of its power a year to radiation: P(y) = P₀(1 − 0.0275)^y. Both must
 * still meet the loads at end of life, which is why they are sized for it, not for launch.
 *
 * The second method marches the capacity cycle by cycle with Runge–Kutta, about 57 000 cycles over ten
 * years.
 */

export const BUS = { E: 35, cyclesPerYear: 5700, fade: 0.0275, P0: 160, need: 120 };

export function ageClosed({ C0, years }) {
  const { E, cyclesPerYear, fade, P0, need } = BUS;
  const k = C0 / 6000;
  const n = years * cyclesPerYear;
  // Once C falls to E the battery is exhausted: a full discharge every eclipse.
  const cube = C0 ** 3 - 3 * k * E * E * n;
  const C = cube > E ** 3 ? Math.cbrt(cube) : E;
  const P = P0 * (1 - fade) ** years;
  return { k, n, C, dod0: E / C0, dod: E / C, exhausted: cube <= E ** 3, P, need, powerOk: P >= need, deadAt: (C0 ** 3 - E ** 3) / (3 * k * E * E) / cyclesPerYear };
}

export function ageMarch({ C0, years }) {
  const { E, cyclesPerYear } = BUS;
  const k = C0 / 6000;
  const n = Math.round(years * cyclesPerYear);
  let C = C0;
  const f = (c) => -k * (E / c) ** 2;
  const path = [[0, C0]];
  const step = 10;
  for (let i = 0; i < n; i += step) {
    const h = Math.min(step, n - i);
    const k1 = f(C);
    const k2 = f(C + (h / 2) * k1);
    const k3 = f(C + (h / 2) * k2);
    const k4 = f(C + h * k3);
    C += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    if (C <= E) {
      C = E;
      break;
    }
    if ((i / step) % 50 === 0) path.push([(i + h) / cyclesPerYear, C]);
  }
  path.push([years, C]);
  return { C, path };
}

export function ageChecked(state) {
  const cf = ageClosed(state);
  const m = ageMarch(state);
  return { ...cf, Cnum: m.C, path: m.path, gap: Math.abs(m.C - cf.C) / cf.C };
}
