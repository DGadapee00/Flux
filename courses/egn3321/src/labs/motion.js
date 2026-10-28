/**
 * Playing a lab's motion. A lab that moves keeps its clock in `state.t` and its play switch in
 * `state.show.play` (the Play toggle) or `state.anim.playing` (the Space key); main.js calls `tick`
 * every frame while `state.anim` exists. The clock runs at real speed times `rate` and wraps at the
 * end of the run, so the motion repeats while it plays.
 */

export const PLAY = { key: 'play', label: 'Play' };

export const playing = (state) => !!(state.show?.play || state.anim?.playing);

/** A fresh play state: stopped, at t = 0 unless `t` is given. */
export const stopped = (t = 0) => ({ t, anim: { playing: false }, show: { play: false } });

/**
 * Advance `state[key]` by dt·rate while playing, wrapping from `hi` back to `lo`.
 * Returns true when the lab must redraw.
 */
export function advance(state, dt, { lo = 0, hi, rate = 1, key = 't' }) {
  if (!playing(state) || !(hi > lo)) return false;
  let t = (state[key] ?? lo) + dt * rate;
  if (t > hi) t = lo + ((t - lo) % (hi - lo));
  state[key] = t;
  return true;
}
