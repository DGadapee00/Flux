/** Unit 10 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  buoyantForce, circleArea, flowSpeed, gaugePressure, pressureDownstream, submergedFraction,
  torricelli, uTubeHeight, wallForce,
} from '@flux/subjects/mechanics/fluids.js';

const dam = wallForce(1000, 80, 500, G);
const tube = uTubeHeight(1000, 800, 0.2);
const v1 = flowSpeed(5e-4, circleArea(0.018));
const v2 = flowSpeed(5e-4, circleArea(0.005));
const p2 = pressureDownstream({ p1: 4.24e5, v1, h1: 0, v2, h2: 0, rho: 1000, g: G });
const fv1 = flowSpeed(0.04, circleArea(0.064));
const fv2 = flowSpeed(0.04, circleArea(0.03));
const fp2 = pressureDownstream({ p1: 1.62e6, v1: fv1, h1: 0, v2: fv2, h2: 10, rho: 1000, g: G });
const sinkV = 2.7 / 2700;

export default {
  s1: [
    {
      tag: 'the dam',
      lab: 'pressure-depth',
      scenario: 'dam',
      read: (c) => ({
        p: [c.p, dam.p],
        F: [c.F, dam.F],
      }),
    },
  ],
  s2: [
    {
      tag: 'a mercury column',
      lab: 'pressure-depth',
      scenario: 'dam',
      setup: (s) => { s.rho = 13600; s.depth = 0.76; s.width = 1; },
      read: (c) => ({
        p: [c.pBottom, gaugePressure(13600, 0.76, G)],
      }),
    },
    {
      tag: 'two liquids',
      lab: 'pressure-depth',
      scenario: 'utube',
      read: (c) => ({
        h1: [c.h1, tube.h1],
        diff: [c.diff, tube.diff],
      }),
    },
  ],
  s3: [
    {
      tag: 'the brake',
      lab: 'brake-hydraulics',
      scenario: 'book',
      read: (c) => ({
        F2: [c.F2, 12500],
        x2: [c.x2, 0.0008],
      }),
    },
  ],
  s4: [
    {
      tag: 'a floating person',
      lab: 'buoyancy',
      scenario: 'woman',
      read: (c) => ({
        V: [c.V, 60 / 970],
        fraction: [c.fraction, submergedFraction(970, 1000)],
        Fb: [c.Fb, 60 * G],
      }),
    },
    {
      tag: 'a sunk block',
      lab: 'buoyancy',
      scenario: 'sink',
      read: (c) => ({
        weight: [c.weight, 2.7 * G],
        Fb: [c.Fb, buoyantForce(1000, sinkV, G)],
        apparent: [c.apparent, 2.7 * G - buoyantForce(1000, sinkV, G)],
      }),
    },
  ],
  s5: [
    {
      tag: 'the nozzle',
      lab: 'bernoulli',
      scenario: 'nozzle',
      read: (c) => ({
        v1: [c.v1, v1],
        v2: [c.v2, v2],
        p2: [c.p2, p2],
      }),
    },
    {
      tag: 'the fire hose',
      lab: 'fire-hose',
      scenario: 'book',
      read: (c) => ({
        v1: [c.v1, fv1],
        v2: [c.v2, fv2],
        p2: [c.p2, fp2],
      }),
    },
    {
      tag: 'a hole in a tank',
      lab: 'bernoulli',
      scenario: 'tank',
      read: (c) => ({
        v: [c.vExit, torricelli(5, G)],
      }),
    },
  ],
};
