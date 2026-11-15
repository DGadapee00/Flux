/**
 * A data budget: what a satellite records against what its passes can send down. Our own model.
 *
 * The craft records at an average g = payload + housekeeping (kbit/s), all day. One ground station
 * sees it in two groups of passes a day, twelve hours apart, each group k passes one orbit apart; a
 * mid-latitude station sees a low craft on a run of consecutive orbits, twice a day. Each pass is
 * taken as overhead, the longest, lasting t_p = Tλ/π with λ = arccos((R/r)cos ε) − ε (passes.js).
 * During a pass the radio sends at D kbit/s while the craft keeps recording.
 *
 * Per day the craft makes G = 86 400 g and can send 2k t_p D. If it can send more than it makes, the
 * store empties in each group of passes and peaks just before the group's first pass.
 *
 * Closed form: account for the store pass by pass. Between passes it grows by g times the gap; in a
 * pass it falls by (D − g) t_p, never below zero. Run the twelve-hour cycle until it repeats.
 * Second method: step the store second by second through the same days.
 */
import { passesClosed } from '../mechanics/passes.js';

const DAY = 86400;
const HALF = DAY / 2;

/** The pass schedule within one twelve-hour cycle: k passes one orbit apart, starting at t = 0. */
export function passSchedule({ hkm, eps, k }) {
  const p = passesClosed({ hkm, eps });
  const starts = Array.from({ length: k }, (_, i) => i * p.T);
  return { T: p.T, tp: p.tp, starts };
}

/** Closed form, pass by pass. Rates in kbit/s; the store in Mbit. */
export function dataClosed({ hkm, eps, k, payload, house, down }, days = 4) {
  const { T, tp } = passSchedule({ hkm, eps, k });
  const g = payload + house;
  const made = (g * DAY) / 1000;
  const sent = (2 * k * tp * down) / 1000;
  let store = 0;
  let peak = 0;
  const endOfDay = [];
  for (let c = 0; c < 2 * days; c++) {
    for (let i = 0; i < k; i++) {
      // The gap before this pass: from the end of the previous pass.
      const gap = i === 0 ? HALF - ((k - 1) * T + tp) : T - tp;
      store += (g * gap) / 1000;
      peak = Math.max(peak, store);
      store = Math.max(0, store - ((down - g) * tp) / 1000);
      // A radio slower than the recording leaves the store growing through the pass too.
      peak = Math.max(peak, store);
    }
    if (c % 2 === 1) endOfDay.push(store);
  }
  const growing = made > sent;
  return { T, tp, g, made, sent, margin: (sent - made) / made, peak, growing, perDay: growing ? made - sent : 0, endOfDay };
}

/** Second method: the store stepped second by second through the same days. */
export function dataStepped({ hkm, eps, k, payload, house, down }, days = 4, dt = 1) {
  const { T, tp, starts } = passSchedule({ hkm, eps, k });
  const g = payload + house;
  // The cycle starts at the end of the last pass of a group, as the closed form does.
  const offset = (k - 1) * T + tp;
  let store = 0;
  let peak = 0;
  const trace = [];
  const steps = Math.round((days * DAY) / dt);
  for (let n = 0; n < steps; n++) {
    const t = (n * dt + offset) % HALF;
    // The share of this step spent in a pass: integrate the pass indicator over [t, t + dt).
    let inPass = 0;
    for (const s of starts) {
      for (const base of [s, s + HALF]) inPass += Math.max(0, Math.min(t + dt, base + tp) - Math.max(t, base));
    }
    store += (g * dt) / 1000;
    store = Math.max(0, store - (down * inPass) / 1000);
    peak = Math.max(peak, store);
    if (n % 60 === 0) trace.push([(n * dt) / 3600, store]);
  }
  return { peak, trace };
}

/** Both methods and their relative gap on the peak store. */
export function dataChecked(state) {
  const c = dataClosed(state);
  const s = dataStepped(state);
  const gap = c.peak > 0 ? Math.abs(s.peak - c.peak) / c.peak : Math.abs(s.peak);
  return { ...c, stepPeak: s.peak, trace: s.trace, gap };
}
