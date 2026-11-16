/**
 * A whole small satellite designed at once: every subsystem's budget for one design, and the margin
 * that limits it. Our own model, built from the course's subsystem models.
 *
 * A design names the orbit, the stations, the radio, the array and battery, the payload and its duty,
 * the surface finish and the attitude sensor. The budgets are:
 *   mass:        the predicted mass, basic plus each item's mean growth, against the allocation;
 *   power:       the array's energy each orbit against the load's, with the battery's losses;
 *   battery:     the deepest discharge against the depth allowed;
 *   temperature: the hottest and coldest the craft runs against the parts' limits;
 *   pointing:    bias plus three sigma against the payload's cone;
 *   link:        E_b/N_0 at the edge of view against what the modulation needs;
 *   data:        what the craft records a day against what its contacts can send;
 *   life:        the orbit's life under drag against the mission and the disposal rule.
 * Each budget reports the share of what it has that the design uses. Above 1 it fails. The largest
 * share limits the design.
 *
 * Loads are averaged in the closed form: the bus all the time, the payload for its duty share, the
 * transmitter for the share of the day a station sees the craft. That share is the ground track's
 * density integrated over the union of the stations' circles of view (coverage.js does one station).
 *
 * Second method, a day in the life: fly the craft for twenty days in ten-second steps. The orbit is
 * circular with the Sun in its plane, the worst case for eclipses; the Earth turns under it. Each
 * step the array charges the battery in sunlight, the payload runs within its duty share of each
 * orbit around noon, the radio sends whenever a station sees the craft, and the data store fills
 * and empties. The run must agree with the closed form on the eclipse share and the day's array and
 * load energy. The contact share is flown separately, one day from each of 24 starting turns of the
 * Earth (contactsFlown), because an orbit that nearly repeats its ground track each day keeps meeting
 * the stations the same way, and a continuous run then differs from the long-run average. That
 * difference is real, and the lab shows it. The temperature is stepped through an orbit and must radiate
 * what it takes in. The day in the life also gives what the averages cannot: the deepest discharge,
 * the fullest store and the longest wait for a contact.
 */
import { marginClosed } from './massmargin.js';
import { ETA_C, ETA_D, orbitGeometry } from '../mechanics/power.js';
import { ALBEDO, C_SPEC, EARTH_IR, FINISHES, SIGMA, SOLAR } from '../heat/spacecraft.js';
import { R_EARTH } from '../mechanics/kepler.js';
import { linkBudget, REQUIRED_DB } from '../em/link.js';
import { budgetChecked } from '../mechanics/pointingbudget.js';
import { CD, lifetimeClosed } from '../mechanics/orbitdecay.js';
import { capAngle, OMEGA_EARTH } from '../mechanics/coverage.js';
import { EARTH } from '../mechanics/passes.js';

const DEG = Math.PI / 180;
const DAY = 86400;
const TWO_PI = 2 * Math.PI;

/** Range (m) from a station to a craft at altitude h (km) seen at elevation ε (deg). */
export function slantRange(hkm, eps) {
  const e = eps * DEG;
  const R = EARTH.R;
  const r = R + hkm;
  return (Math.sqrt(r * r - (R * Math.cos(e)) ** 2) - R * Math.sin(e)) * 1e3;
}

/** Total length of a union of arcs on a circle, each [centre, width] in radians. */
function arcUnion(arcs) {
  const pieces = [];
  for (const [c, w] of arcs) {
    if (w <= 0) continue;
    if (w >= TWO_PI) return TWO_PI;
    const a = (((c - w / 2) % TWO_PI) + TWO_PI) % TWO_PI;
    const b = a + w;
    if (b > TWO_PI) pieces.push([a, TWO_PI], [0, b - TWO_PI]);
    else pieces.push([a, b]);
  }
  pieces.sort((x, y) => x[0] - y[0]);
  let total = 0;
  let lo = -1;
  let hi = -1;
  for (const [a, b] of pieces) {
    if (a > hi) {
      total += hi - lo;
      lo = a;
      hi = b;
    } else hi = Math.max(hi, b);
  }
  return total + (hi - lo);
}

/** The width in longitude of a station's circle of view at latitude β. */
function capWidth(beta, phi, lam) {
  const den = Math.cos(phi) * Math.cos(beta);
  const num = Math.cos(lam) - Math.sin(phi) * Math.sin(beta);
  if (Math.abs(den) < 1e-15) return num <= 0 ? TWO_PI : 0;
  const x = num / den;
  if (x <= -1) return TWO_PI;
  if (x >= 1) return 0;
  return 2 * Math.acos(x);
}

/**
 * Closed form: the long-run share of time any of the stations sees the craft. As in coverage.js, with
 * sin β = sin i sin u, the share is (1/2π²)∫ L(β(u)) du over u in [−π/2, π/2], where L is now the
 * longitude covered at latitude β by the union of the circles. Simpson's rule.
 */
export function unionShareClosed({ hkm, eps, incl }, stations, n = 4000) {
  if (!stations.length) return 0;
  const lam = capAngle(hkm, eps);
  const si = Math.sin(incl * DEG);
  const st = stations.map((s) => ({ phi: s.lat * DEG, lon: s.lon * DEG }));
  const m = n % 2 ? n + 1 : n;
  const h = Math.PI / m;
  let s = 0;
  for (let k = 0; k <= m; k++) {
    const beta = Math.asin(si * Math.sin(-Math.PI / 2 + k * h));
    const L = arcUnion(st.map((q) => [q.lon, capWidth(beta, q.phi, lam)]));
    s += (k === 0 || k === m ? 1 : k % 2 ? 4 : 2) * L;
  }
  return (s * h) / 3 / (2 * Math.PI * Math.PI);
}

/** The average load in watts: bus, payload over its duty, transmitter over the contact share. */
function averageLoad(d, share) {
  return d.loads.bus + d.duty * d.loads.payload + share * d.loads.tx;
}

/**
 * The craft's temperature through an orbit: Unit 6's isothermal sphere (heat/spacecraft.js), resized
 * to the craft's surface area S. A sphere's projected area is a quarter of its surface, so sunlight
 * falls on S/4; Earth's albedo and infrared fall on S through the view factor F. The electrical load
 * turns to heat. RK4 on m c dT/dt = in(t) − εσST⁴ through
 * forty orbits, each in three pieces (sun, shadow, sun). Over the last orbit the craft must radiate
 * what it takes in: that is the thermal part of the check.
 */
export function thermalOrbit({ finish, h, Q, mass, surface }, orbits = 40) {
  const { alpha, eps } = FINISHES[finish];
  const r = R_EARTH + h;
  const x = R_EARTH / r;
  const F = (1 - Math.sqrt(1 - x * x)) / 2;
  const w = Math.asin(x) / Math.PI; // the eclipse's share of the orbit
  const T = orbitGeometry(h).T;
  const ir = eps * EARTH_IR * surface * F;
  const qSun = alpha * SOLAR * (surface / 4) + alpha * ALBEDO * SOLAR * surface * F + ir + Q;
  const qShadow = ir + Q;
  const k = eps * SIGMA * surface;
  const mc = mass * C_SPEC;
  const avgIn = (1 - w) * qSun + w * qShadow;
  const pieces = [[0, 0.5 - w / 2, qSun], [0.5 - w / 2, 0.5 + w / 2, qShadow], [0.5 + w / 2, 1, qSun]];
  const dTdt = (q, Tk) => (q - k * Tk ** 4) / mc;
  let Tk = (avgIn / k) ** 0.25;
  let Tmax = 0;
  let Tmin = Infinity;
  let emitted = 0;
  const trace = [];
  for (let o = 0; o < orbits; o++) {
    const last = o === orbits - 1;
    for (const [a, z, q] of pieces) {
      const n = Math.max(2, Math.round(600 * (z - a)));
      const dt = ((z - a) * T) / n;
      for (let i = 0; i < n; i++) {
        const k1 = dTdt(q, Tk);
        const k2 = dTdt(q, Tk + (dt / 2) * k1);
        const k3 = dTdt(q, Tk + (dt / 2) * k2);
        const k4 = dTdt(q, Tk + dt * k3);
        const Tn = Tk + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        if (last) {
          emitted += (k * (Tk ** 4 + 4 * ((Tk + Tn) / 2) ** 4 + Tn ** 4) * dt) / 6;
          Tmax = Math.max(Tmax, Tk, Tn);
          Tmin = Math.min(Tmin, Tk, Tn);
          trace.push([a + ((z - a) * i) / n, Tk]);
        }
        Tk = Tn;
      }
    }
  }
  return { Tmax, Tmin, avgIn, emittedAvg: emitted / T, trace, qSun, qShadow, Thot: (qSun / k) ** 0.25, Tcold: (qShadow / k) ** 0.25, Tavg4: (avgIn / k) ** 0.25 };
}

/** Closed-form budgets for one design. Rates in kbit/s, energy in Wh, temperatures in K. */
export function missionClosed(d) {
  const orbit = { hkm: d.h, eps: d.eps, incl: d.incl };
  const g = orbitGeometry(d.h);
  const Ts = g.T - g.Te;
  const eclipseShare = g.Te / g.T;
  const share = unionShareClosed(orbit, d.stations);
  const Pavg = averageLoad(d, share);

  const mass = marginClosed(d.items, 0, d.limit);
  // Array energy each orbit (a sun-tracking array) against the load, eclipse share through the battery.
  const arrayWh = (d.Ppeak * Ts) / 3600;
  const loadWh = (Pavg * (Ts + g.Te / (ETA_C * ETA_D))) / 3600;
  const dod = (Pavg * g.Te) / ETA_D / 3600 / d.Ebatt;
  // Electrical power ends as heat inside the craft.
  const thermal = thermalOrbit({ finish: d.finish, h: d.h, Q: Pavg, mass: mass.mean, surface: d.surface });
  const range = slantRange(d.h, d.eps);
  const link = linkBudget({ ...d.radio, d: range });
  const point = d.pointing.R ? budgetChecked(d.pointing) : null;
  const made = ((d.duty * d.rate + d.house) * DAY) / 1000; // Mbit a day
  const capacity = (d.radio.Rb / 1000) * share * DAY / 1e3; // Mbit a day
  const B = (CD * d.area) / mass.mean;
  const life = lifetimeClosed({ z0: d.h, B, f107: d.f107 });

  const [Tlo, Thi] = d.Tlimits;
  const mid = (Tlo + Thi) / 2;
  const half = (Thi - Tlo) / 2;
  const budgets = [
    { id: 'mass', name: 'Mass', use: mass.mean / d.limit },
    { id: 'power', name: 'Power', use: loadWh / arrayWh },
    { id: 'battery', name: 'Battery', use: dod / d.dodMax },
    { id: 'thermal', name: 'Temperature', use: Math.max(thermal.Tmax - mid, mid - thermal.Tmin) / half },
    { id: 'pointing', name: 'Pointing', use: point ? point.threeSigma / d.pointing.R : null },
    { id: 'link', name: 'Link', use: 10 ** (-link.margin / 10) },
    // No station ever sees the craft: nothing comes down, a failure no share can measure.
    { id: 'data', name: 'Data', use: capacity > 0 ? made / capacity : null, never: !(capacity > 0) },
    { id: 'life', name: 'Orbital life', use: Math.max(d.lifeMin / life, life / d.lifeMax) },
  ];
  return { g, eclipseShare, share, Pavg, mass, arrayWh, loadWh, dod, thermal, range, link, point, made, capacity, B, life, budgets };
}

/**
 * The contact share flown: the whole orbits that fit in a day, from each of m starting turns of the
 * Earth, evenly spaced. A continuous run can sample only a few longitudes when the orbit nearly
 * repeats its ground track each day; spreading the start samples every longitude evenly, as the
 * long-run average assumes. Whole orbits sample every latitude as the average does.
 */
export function contactsFlown(d, m = 24, dt = 10) {
  if (!d.stations.length) return 0;
  const r = EARTH.R + d.h;
  const n = Math.sqrt(EARTH.mu / r ** 3);
  const cosLam = Math.cos(capAngle(d.h, d.eps));
  const ci = Math.cos(d.incl * DEG);
  const si = Math.sin(d.incl * DEG);
  const st = d.stations.map((s) => ({ sl: Math.sin(s.lat * DEG), cl: Math.cos(s.lat * DEG), lon: s.lon * DEG }));
  const T = TWO_PI / n;
  const perOrbit = Math.round(T / dt);
  const step = T / perOrbit;
  const steps = Math.round(DAY / T) * perOrbit;
  let seen = 0;
  for (let j = 0; j < m; j++) {
    const turn = (TWO_PI * j) / m;
    for (let k = 0; k < steps; k++) {
      const t = k * step;
      const u = n * t;
      const lat = Math.asin(Math.sin(u) * si);
      const lon = Math.atan2(Math.sin(u) * ci, Math.cos(u)) - OMEGA_EARTH * t - turn;
      const sl = Math.sin(lat);
      const cl = Math.cos(lat);
      for (const q of st) {
        if (q.sl * sl + q.cl * cl * Math.cos(lon - q.lon) >= cosLam) {
          seen++;
          break;
        }
      }
    }
  }
  return seen / (m * steps);
}

/** The day in the life: twenty days in ten-second steps. */
export function missionSimulated(d, days = 20, dt = 10) {
  const g = orbitGeometry(d.h);
  const r = EARTH.R + d.h;
  const n = Math.sqrt(EARTH.mu / r ** 3);
  const lam = capAngle(d.h, d.eps);
  const cosLam = Math.cos(lam);
  const ci = Math.cos(d.incl * DEG);
  const si = Math.sin(d.incl * DEG);
  const st = d.stations.map((s) => ({ sl: Math.sin(s.lat * DEG), cl: Math.cos(s.lat * DEG), lon: s.lon * DEG }));
  const cap = d.Ebatt * 3600;
  const steps = Math.round((days * DAY) / dt);
  const perDay = Math.round(DAY / dt);
  let E = cap;
  let Emin = cap;
  let store = 0; // Mbit
  let peak = 0;
  let sent = 0;
  let made = 0;
  let dark = 0;
  let seenSteps = 0;
  let arrayJ = 0;
  let loadJ = 0;
  let wasSeen = false;
  let gapStart = 0;
  let longest = 0;
  let contacts = 0;
  let first = -1;
  const trace = []; // the last day, every two minutes: [hours, charge share, store Mbit, lit, seen]
  const every = Math.round(120 / dt);
  for (let k = 0; k < steps; k++) {
    const t = k * dt;
    const u = n * t;
    // Orbit angle from noon in (−π, π]; the Sun lies in the orbit's plane at u = 0.
    const phi = Math.atan2(Math.sin(u), Math.cos(u));
    const lit = Math.PI - Math.abs(phi) >= g.half;
    const on = Math.abs(phi) < d.duty * Math.PI;
    // Ground track, ascending node on the x axis, the Earth turning under it.
    const lat = Math.asin(Math.sin(u) * si);
    const lon = Math.atan2(Math.sin(u) * ci, Math.cos(u)) - OMEGA_EARTH * t;
    const sl = Math.sin(lat);
    const cl = Math.cos(lat);
    let seen = false;
    for (const s of st) {
      if (s.sl * sl + s.cl * cl * Math.cos(lon - s.lon) >= cosLam) {
        seen = true;
        break;
      }
    }
    const Pa = lit ? d.Ppeak : 0;
    const Pl = d.loads.bus + (on ? d.loads.payload : 0) + (seen ? d.loads.tx : 0);
    arrayJ += Pa * dt;
    loadJ += Pl * dt;
    if (!lit) dark++;
    const net = Pa - Pl;
    E += net >= 0 ? net * ETA_C * dt : (net / ETA_D) * dt;
    if (E > cap) E = cap;
    if (E < 0) E = 0;
    Emin = Math.min(Emin, E);
    const rec = (((on ? d.rate : 0) + d.house) * dt) / 1000;
    made += rec;
    store += rec;
    if (seen) {
      seenSteps++;
      const out = Math.min(store, (d.radio.Rb / 1e6) * dt);
      store -= out;
      sent += out;
      if (!wasSeen) {
        contacts++;
        if (first < 0) first = t;
        else longest = Math.max(longest, t - gapStart);
      }
    } else if (wasSeen) gapStart = t;
    wasSeen = seen;
    peak = Math.max(peak, store);
    if (k >= steps - perDay && k % every === 0) trace.push([(t - (days - 1) * DAY) / 3600, E / cap, store, lit, seen]);
  }
  return {
    eclipseShare: dark / steps,
    share: seenSteps / steps,
    arrayWhDay: arrayJ / 3600 / days,
    loadWhDay: loadJ / 3600 / days,
    deepest: 1 - Emin / cap,
    peak,
    storeEnd: store,
    sentPerDay: sent / days,
    madePerDay: made / days,
    contactsPerDay: contacts / days,
    longestGapH: contacts > 1 ? longest / 3600 : null,
    trace,
  };
}

/**
 * Both methods. The gap is the worst relative difference on the eclipse share, the contact share
 * flown from spread starts, the day's array and load energy, and the heat radiated against the heat
 * taken in. The battery budget takes the day in the life's deepest discharge,
 * which sees the transmitter and payload running in eclipse; the averages cannot.
 */
export function missionChecked(d, days = 20, dt = 10) {
  const c = missionClosed(d);
  const s = { ...missionSimulated(d, days, dt), shareSpread: contactsFlown(d, 24, dt) };
  const arrayDay = (d.Ppeak * (1 - c.eclipseShare) * DAY) / 3600;
  const loadDay = (c.Pavg * DAY) / 3600;
  const rel = (a, b, floor) => Math.abs(a - b) / Math.max(Math.abs(b), floor);
  const gap = Math.max(
    rel(s.eclipseShare, c.eclipseShare, 0.02),
    rel(s.shareSpread, c.share, 0.02),
    rel(s.arrayWhDay, arrayDay, 1),
    rel(s.loadWhDay, loadDay, 1),
    rel(c.thermal.emittedAvg, c.thermal.avgIn, 1),
  );
  const budgets = c.budgets.map((b) => (b.id === 'battery' ? { ...b, use: s.deepest / d.dodMax, closedUse: b.use } : b));
  for (const b of budgets) b.ok = b.never ? false : b.use === null || b.use <= 1;
  // The limiting budget: one that can never close, or else the one using the largest share.
  const limiting = budgets.find((b) => b.never) || budgets.filter((b) => b.use !== null).reduce((a, b) => (b.use > a.use ? b : a));
  return { ...c, sim: s, arrayDay, loadDay, budgets, limiting, closes: budgets.every((b) => b.ok), gap, requiredDb: REQUIRED_DB };
}
