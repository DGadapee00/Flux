/**
 * Unit 11 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { blurFor, divergenceFor, gsdFor, receivedDBm } from '../bank/u11.js';

export default {
  'u11.1.gsd': {
    traps: {
      g: [
        [($) => gsdFor($, 'aperture'), 'The ground per pixel uses the focal length, not the aperture: GSD = h p/f.'],
        [($) => gsdFor($, 'mm'), 'Put the focal length in metres, like the pixel and the height.'],
      ],
    },
  },
  'u11.2.blur': {
    traps: {
      b: [
        [($) => blurFor($, 'noFactor'), 'A circular aperture’s first dark ring is at 1.22 λ/D, not λ/D.'],
        [($) => blurFor($, 'diameter'), 'That is the Airy disc’s diameter. The Rayleigh criterion uses its radius, 1.22 λ/D.'],
      ],
    },
  },
  'u11.4.divergence': {
    traps: {
      t: [
        [($) => divergenceFor($, 'diameter'), 'w₀ is the waist radius, half the aperture.'],
        [($) => divergenceFor($, 'noPi'), 'The Gaussian beam’s divergence is λ/(π w₀).'],
      ],
    },
  },
  'u11.5.received': {
    traps: {
      p: [
        [($) => receivedDBm($, 'radius'), 'Use the telescope’s radius, half its diameter, in 1 − e^(−2r²/w²).'],
        [($) => receivedDBm($, 'dBW'), 'That is dBW. dBm compares with 1 mW: add 30 dB.'],
      ],
    },
  },
};
