/** Unit 8 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  axialStress, avgShear, bilinear, normalStrain, permanentSet, segmentElongation,
} from '@flux/subjects/mechanics/materials.js';
import { axleSplit, boardReactions, smoothLadder } from '@flux/subjects/mechanics/statics.js';

const car = axleSplit({
  wheelbase: 2.5, weight: 12000, frontShare: 0.52, height: 0.55, decel: 0, g: G,
});
const beam = boardReactions({ length: 6, inset: 0, weight: 70 * G, load: 50 * G, at: 1.5 });
const ladder = smoothLadder({ ladderW: 400, personW: 0, frac: 0, thetaDeg: 53 });
const rodForce = 550 * 9.8;
const rodArea = 0.3 * 1e-4;
const rodStress = axialStress(rodForce, rodArea);
const rodDelta = segmentElongation(rodForce, 2, rodArea, 2e11);
const pilForce = 2700 * 0.2 * 3 * 9.8 + 10000;
const pilStress = pilForce / 0.2;
const pilStrain = pilStress / 4.5e10;
const shStress = avgShear(50, 0.27);
const shStrain = normalStrain(0.15, 1.8);
const yielded = bilinear(0.01, 2e11, 250e6, 1e10);

export default {
  s1: [
    {
      tag: 'car on level ground',
      lab: 'car-balance',
      scenario: 'level',
      read: (c) => ({
        xRear: [c.xRear, car.xRear],
        front: [c.front, car.front],
        rear: [c.rear, car.rear],
      }),
    },
  ],
  s2: [
    {
      tag: 'scaffold',
      lab: 'beam',
      scenario: 'scaffold',
      read: (c) => ({
        left: [c.left, beam.left],
        right: [c.right, beam.right],
      }),
    },
  ],
  s3: [
    {
      tag: 'ladder at 53°',
      lab: 'ladder',
      scenario: 'book',
      read: (c) => ({
        normal: [c.normal, ladder.normal],
        friction: [c.friction, ladder.friction],
        mu: [c.mu, ladder.mu],
      }),
    },
  ],
  s4: [
    {
      tag: 'steel rod',
      lab: 'stress-strain',
      scenario: 'rod',
      read: (c) => ({
        stress: [c.rodStress, rodStress],
        delta: [c.rodDelta, rodDelta],
      }),
    },
    {
      tag: 'granite pillar',
      lab: 'stress-strain',
      scenario: 'pillar',
      read: (c) => ({
        stress: [c.pilStress, pilStress],
        strain: [c.pilStrain, pilStrain],
      }),
    },
    {
      tag: 'a shelf in shear',
      lab: 'stress-strain',
      scenario: 'shelf',
      read: (c) => ({
        stress: [c.shStress, shStress],
        strain: [c.shStrain, shStrain],
        modulus: [c.shMod, shStress / shStrain],
      }),
    },
  ],
  s5: [
    {
      tag: 'wire unloaded past yield',
      lab: 'stress-strain',
      scenario: 'yield',
      setup: (s) => {
        Object.assign(s, { mode: 'yield', yEps: 0.01, yE: 2e11, yY: 250e6, yEt: 1e10, unloaded: true });
      },
      read: (c) => ({
        stress: [c.yStress, yielded.stress],
        permanent: [c.permanent, permanentSet(0.01, yielded.stress, 2e11)],
      }),
    },
  ],
};
