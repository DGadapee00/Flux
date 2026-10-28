/**
 * A bicycle's chain drive (Hibbeler §16.3). The crank turns the chainring; the chain carries the
 * motion to a cog on the rear hub; the cog and the wheel share one shaft.
 *
 * A roller chain of pitch p (ISO 606: 12.7 mm, half an inch, on every derailleur bicycle) wraps a
 * sprocket of N teeth as an N-sided polygon of side p. In one turn, N links pass. So on average
 * the chain moves N p per turn, and
 *
 *   v_chain = N_f p n_crank = N_r p n_wheel   ⇒   n_wheel = (N_f / N_r) n_crank,
 *
 * with n in turns per second. The wheel's rim then moves π D per turn: v = π D n_wheel.
 *
 * The polygon makes the chain surge. Its links sit on the pitch circle, of radius
 * r = p / (2 sin(π/N)), but the chain's line runs along a chord. While one tooth carries it,
 * the chain moves at ω r cos φ, with φ from −π/N to π/N. Its average over that tooth is
 * ω r sin(π/N)/(π/N) = ω N p/(2π): the tooth-count rule again. This is the second method.
 *
 * Pure functions, SI. Speeds of rotation are in rpm unless a name says rad/s.
 */
export const CHAIN_PITCH = 0.0127;

/** The pitch-circle radius of a sprocket of N teeth. */
export const pitchRadius = (N, p = CHAIN_PITCH) => p / (2 * Math.sin(Math.PI / N));

/** A tyre's outside diameter from its ETRTO size: the bead seat plus twice the section, about its width. */
export const tyreDiameter = (bead = 0.622, width = 0.025) => bead + 2 * width;

/**
 * The drive at a cadence: the wheel's speed, the bike's, the chain's, the pedal's, and how far one
 * crank turn carries the bike (the development).
 */
export function drive({ cadence, Nf, Nr, D, crank = 0.1725, p = CHAIN_PITCH }) {
  const nc = cadence / 60;
  const nw = (nc * Nf) / Nr;
  const v = Math.PI * D * nw;
  return {
    ratio: Nf / Nr,
    wheelRpm: nw * 60,
    wCrank: 2 * Math.PI * nc,
    wWheel: 2 * Math.PI * nw,
    v,
    kmh: v * 3.6,
    chain: Nf * p * nc,
    pedal: 2 * Math.PI * nc * crank,
    development: (Math.PI * D * Nf) / Nr,
  };
}

/** The cadence a speed needs in a gear, rpm. */
export const cadenceFor = ({ v, Nf, Nr, D }) => (60 * v * Nr) / (Math.PI * D * Nf);

/**
 * The chain's speed off a sprocket turning at ω (rad/s), averaged over one tooth by the
 * midpoint rule on ω r cos φ. With `phi` set, the speed at that angle instead.
 */
export function chordalChainSpeed(N, w, { p = CHAIN_PITCH, phi = null, steps = 400 } = {}) {
  const r = pitchRadius(N, p);
  if (phi !== null) return w * r * Math.cos(phi);
  const half = Math.PI / N;
  let sum = 0;
  for (let i = 0; i < steps; i++) sum += Math.cos(-half + ((i + 0.5) * 2 * half) / steps);
  return (w * r * sum) / steps;
}
