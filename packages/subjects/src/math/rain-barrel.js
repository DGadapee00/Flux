/** Nonnegative roof inflow and a closed draw-off valve. Integrating q gives delivered volume;
 * storage is capped and excess spills. Time is minutes and flow is litres/minute. */
export function rainInflow(profile, peak, T, t) {
  const x = Math.max(0, Math.min(T, t));
  let delivered, flow;
  if (profile === 'ramp') {
    delivered = (peak * x * x) / (2 * T);
    flow = (peak * x) / T;
  } else if (profile === 'sine') {
    delivered = ((peak * T) / Math.PI) * (1 - Math.cos((Math.PI * x) / T));
    flow = peak * Math.sin((Math.PI * x) / T);
  } else {
    delivered = peak * x;
    flow = peak;
  }
  return { delivered, flow: t >= T || t < 0 ? 0 : flow };
}
export function rainBarrel({ profile = 'ramp', peak = 20, T = 20, t = 10, capacity, initial = 0 }) {
  if (!(capacity > 0 && T > 0 && peak >= 0 && t >= 0 && initial >= 0 && initial <= capacity))
    throw new RangeError('Positive capacity/duration and valid nonnegative inputs required');
  const { delivered, flow } = rainInflow(profile, peak, T, t),
    uncapped = initial + delivered;
  const stored = Math.min(capacity, uncapped),
    spill = Math.max(0, uncapped - capacity);
  return {
    delivered,
    flow,
    stored,
    spill,
    storageRate: uncapped >= capacity ? 0 : flow,
    fraction: stored / capacity,
  };
}
