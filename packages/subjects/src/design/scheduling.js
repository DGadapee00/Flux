/**
 * Rate-monotonic scheduling of flight software tasks. Our own implementation of the textbook tests.
 *
 * Each task i runs for C_i every period T_i and must finish before its next release. The scheduler
 * is preemptive with fixed priorities, shortest period first. Liu and Layland (1973) showed every
 * deadline is met when the utilization U = Σ C_i/T_i is at most n(2^{1/n} − 1); above that bound the
 * set may still be schedulable (Wikipedia, Rate-monotonic scheduling).
 *
 * Closed form: response-time analysis. The worst response of task i comes when every task is released
 * together; it is the smallest R with R = C_i + Σ_{j higher} ⌈R/T_j⌉ C_j, found by iterating from
 * R = C_i. The task meets its deadline when R ≤ T_i.
 *
 * Second method: simulate the scheduler event by event from that common release, in whole
 * microseconds, over the longest period, and read each task's first response time off the run.
 */

/** Utilization, the Liu–Layland bound and the response-time analysis. Times in microseconds. */
export function scheduleClosed(tasks) {
  const order = [...tasks].sort((a, b) => a.T - b.T);
  const U = order.reduce((s, t) => s + t.C / t.T, 0);
  const n = order.length;
  const bound = n * (2 ** (1 / n) - 1);
  const response = {};
  for (let i = 0; i < n; i++) {
    const t = order[i];
    let R = t.C;
    for (let it = 0; it < 10000; it++) {
      let next = t.C;
      for (let j = 0; j < i; j++) next += Math.ceil(R / order[j].T) * order[j].C;
      if (next === R || next > t.T) {
        R = next;
        break;
      }
      R = next;
    }
    response[t.id] = R;
  }
  const misses = order.filter((t) => response[t.id] > t.T).map((t) => t.id);
  return { U, bound, response, misses, order };
}

/**
 * Second method: event-driven simulation of the preemptive scheduler from a common release at t = 0.
 * Returns each task's first response time (Infinity if its first job is not done by its deadline),
 * and the run as segments [start, end, id] for drawing.
 */
export function scheduleSimulated(tasks, horizon) {
  const order = [...tasks].sort((a, b) => a.T - b.T);
  const end = horizon ?? Math.max(...order.map((t) => t.T));
  const left = Object.fromEntries(order.map((t) => [t.id, 0])); // work left in the current job
  const nextRelease = Object.fromEntries(order.map((t) => [t.id, 0]));
  const released = Object.fromEntries(order.map((t) => [t.id, 0]));
  const first = Object.fromEntries(order.map((t) => [t.id, Infinity]));
  const segments = [];
  let now = 0;
  while (now < end) {
    for (const t of order) {
      if (nextRelease[t.id] <= now) {
        left[t.id] += t.C;
        released[t.id] = nextRelease[t.id];
        nextRelease[t.id] += t.T;
      }
    }
    const run = order.find((t) => left[t.id] > 0);
    const releaseAt = Math.min(...order.map((t) => nextRelease[t.id]));
    if (!run) {
      now = Math.min(releaseAt, end);
      continue;
    }
    const stop = Math.min(now + left[run.id], releaseAt, end);
    segments.push([now, stop, run.id]);
    left[run.id] -= stop - now;
    if (left[run.id] === 0 && released[run.id] === 0 && first[run.id] === Infinity) first[run.id] = stop;
    now = stop;
  }
  return { first, segments };
}

/** Both methods and their disagreement, for the tasks that meet their deadlines. */
export function scheduleChecked(tasks) {
  const c = scheduleClosed(tasks);
  const s = scheduleSimulated(tasks);
  let gap = 0;
  for (const t of c.order) {
    const a = c.response[t.id];
    const b = s.first[t.id];
    const meetsA = a <= t.T;
    const meetsB = b <= t.T;
    if (meetsA !== meetsB) gap = Math.max(gap, 1);
    else if (meetsA) gap = Math.max(gap, Math.abs(a - b) / t.T);
  }
  return { ...c, simFirst: s.first, segments: s.segments, gap };
}
