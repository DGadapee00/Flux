/**
 * Worked examples the labs can show. `tag` matches the notes after "Worked example · ".
 * `read` pairs a lab value with the number printed in the notes. notes-check allows 2%.
 */
import { R_WATER, fromC, fromF, gas, mixP, toC, waterTP } from '@flux/subjects/thermo';

const AIR = gas('air');

const KJ = 1e3;

const onIsobar = (p, tC) => (s) => {
  s.p = p;
  s.h = waterTP(fromC(tC), p).h;
};

export const SETUPS = {
  u1: {
    s1: [
      {
        tag: 'which phase',
        lab: 'phase',
        scenario: 'boil',
        setup: onIsobar(500e3, 120),
        read: (c) => ({ T: [toC(c.T), 120], h: [c.h / 1e3, 504.0] }),
      },
      {
        tag: 'a pressure canner',
        lab: 'canner',
        scenario: 'sea',
        read: (c) => ({ Tc: [c.Tc, 115.2], Tf: [c.Tf, 239.4] }),
      },
    ],
    s2: [
      {
        tag: 'a tank with two phases',
        lab: 'phase',
        scenario: 'tank',
        setup(s) {
          s.T = fromC(151);
          s.v = 0.05;
        },
        read: (c) => ({ x: [c.x, 0.1281], p: [c.p / 1e3, 489.0] }),
      },
      {
        tag: 'two rigid tanks',
        lab: 'phase',
        scenario: 'tank',
        setup(s) {
          s.T = fromC(140);
        },
        read: (c) => ({ x: [c.x, 0.667], p: [c.p / 1e3, 361.5] }),
      },
      {
        tag: 'halfway through boiling',
        lab: 'phase',
        scenario: 'boil',
        setup(s) {
          s.p = 100e3;
          s.h = mixP(100e3, 0.5).h;
        },
        read: (c) => ({ v: [c.v, 0.8475], h: [c.h / 1e3, 1546] }),
      },
    ],
    s3: [
      {
        tag: 'interpolating twice',
        lab: 'phase',
        scenario: 'boil',
        setup: onIsobar(0.9e6, 275),
        read: (c) => ({ v: [c.v, 0.2736], h: [c.h / 1e3, 3001] }),
      },
      {
        tag: 'the liquid shortcut',
        lab: 'phase',
        scenario: 'boil',
        setup: onIsobar(500e3, 120),
        read: (c) => ({ h: [c.h / 1e3, 504.0], v: [c.v, 0.0010602] }),
      },
    ],
    s5: [
      {
        tag: 'steam at 3 MPa',
        lab: 'phase',
        scenario: 'boil',
        setup: onIsobar(3e6, 300),
        read: (c) => ({ v: [c.v, 0.08118], Z: [(c.p * c.v) / (R_WATER * 1e3 * c.T), 0.9206] }),
      },
    ],
  },
  u2: {
    s2: [
      {
        tag: 'expansion at constant pressure',
        lab: 'piston',
        scenario: 'isobaric',
        read: (c) => ({ W: [c.W / 1e3, 10.0], Q: [c.Q / 1e3, 35.64], T2: [toC(c.T2), 327.1] }),
      },
      {
        tag: 'expansion at constant temperature',
        lab: 'piston',
        scenario: 'isothermal',
        read: (c) => ({ W: [c.W / 1e3, 8.789], Q: [c.Q / 1e3, 8.789] }),
      },
      {
        tag: 'a compression',
        lab: 'piston',
        scenario: 'isothermal',
        setup(s) {
          s.p1 = 100e3;
          s.T1 = fromC(30);
          s.m = 1;
          s.V2 = (s.m * AIR.R * s.T1) / (s.p1 * 3);
        },
        read: (c) => ({ W: [c.W / 1e3, -95.6], Q: [c.Q / 1e3, -95.6] }),
      },
    ],
    s3: [
      {
        tag: 'a polytropic expansion',
        lab: 'piston',
        scenario: 'polytropic',
        read: (c) => ({ p2: [c.p2 / 1e3, 164.9], W: [c.W / 1e3, 11.34], T2: [toC(c.T2), 122.8], Q: [c.Q / 1e3, 2.534] }),
      },
      {
        tag: 'polytropic with n = 1.4',
        lab: 'piston',
        scenario: 'polytropic',
        setup(s) {
          const T1 = fromC(200);
          s.p1 = 800e3;
          s.T1 = T1;
          s.n = 1.4;
          s.m = (s.p1 * 0.02) / (AIR.R * T1);
          s.V2 = 0.05;
        },
        read: (c) => ({
          p2: [c.p2 / 1e3, 221.8],
          W: [c.W / 1e3, 12.27],
          T2: [toC(c.T2), 54.81],
          Q: [c.Q / 1e3, -0.1627],
        }),
      },
    ],
    s5: [
      {
        tag: 'boiling in a piston–cylinder',
        lab: 'piston',
        scenario: 'steam',
        read: (c) => ({ W: [c.W / 1e3, 21.04], Q: [c.Q / 1e3, 237.4], x2: [c.x2, 0.4252], T2: [toC(c.T2), 151.8] }),
      },
      {
        tag: 'past the dome',
        lab: 'piston',
        scenario: 'steam',
        setup(s) {
          s.m = 1;
          s.x1 = 0.4;
          s.V2 = 0.4986;
        },
        read: (c) => ({ W: [c.W / 1e3, 174.0], Q: [c.Q / 1e3, 1530] }),
      },
      {
        tag: 'a six-inch coil',
        lab: 'kettle',
        scenario: 'six',
        read: (c) => ({ Q: [c.q / 1e3, 335.0], t: [c.time, 363.6] }),
      },
      {
        tag: 'the eight-inch coil',
        lab: 'kettle',
        scenario: 'eight',
        read: (c) => ({ Q: [c.q / 1e3, 335.0], t: [c.time, 216.4] }),
      },
      {
        tag: 'half a kilogram',
        lab: 'kettle',
        scenario: 'half',
        read: (c) => ({ Q: [c.q / 1e3, 167.5], t: [c.time, 181.8] }),
      },
      {
        tag: 'a warmer start',
        lab: 'kettle',
        scenario: 'six',
        setup(s) { s.T1 = fromC(60); },
        read: (c) => ({ Q: [c.q / 1e3, 167.8], t: [c.time, 182.1] }),
      },
    ],
  },
  u3: {
    s1: [
      {
        tag: 'air in a duct',
        lab: 'nozzle',
        scenario: 'subsonic',
        read: (c) => ({ mdot: [c.mdot, 1.568] }),
      },
    ],
    s2: [
      {
        tag: 'a steam turbine',
        lab: 'devices',
        scenario: 'turbine',
        read: (c) => ({ W: [c.W / KJ, 1774], T2: [toC(c.T2), 45.81] }),
      },
    ],
    s3: [
      {
        tag: 'an air compressor',
        lab: 'devices',
        scenario: 'compressor',
        read: (c) => ({ W: [-c.W / KJ, 223.6] }),
      },
      {
        tag: 'a wetter exhaust',
        lab: 'devices',
        scenario: 'turbine',
        setup(s) {
          s.x2 = 0.8;
        },
        read: (c) => ({ W: [c.W / KJ, 2252] }),
      },
    ],
    s4: [
      {
        tag: 'a converging nozzle',
        lab: 'nozzle',
        scenario: 'subsonic',
        read: (c) => ({ V2: [c.V2, 298.1], T2: [toC(c.T2), 83.35], A2: [c.A2 * 1e4, 13.45], M2: [c.M2, 0.788] }),
      },
      {
        tag: 'expanding to 100 kPa',
        lab: 'nozzle',
        scenario: 'supersonic',
        read: (c) => ({ V2: [c.V2, 568.5], T2: [c.T2, 239.9], A2: [c.A2 * 1e4, 19.0], M2: [c.M2, 1.83] }),
      },
      {
        tag: 'a diffuser',
        lab: 'nozzle',
        scenario: 'diffuser',
        read: (c) => ({ V2: [c.V2, 151.1], T2: [c.T2, 319.7], A2: [c.A2 * 1e4, 141.1] }),
      },
      {
        tag: 'steam through a nozzle',
        lab: 'nozzle',
        scenario: 'steam',
        read: (c) => ({ V2: [c.V2, 773.4], dh: [-c.dh / KJ, 298.3], x2: [c.x2, 0.9895] }),
      },
    ],
    s5: [
      {
        tag: 'throttling steam',
        lab: 'devices',
        scenario: 'throttle',
        read: (c) => ({ T2: [toC(c.T2), 274.9] }),
      },
      {
        tag: 'hot liquid flashes',
        lab: 'devices',
        scenario: 'flash',
        read: (c) => ({ x2: [c.x2, 0.1533], T2: [toC(c.T2), 99.61] }),
      },
      {
        tag: 'throttling air',
        lab: 'devices',
        scenario: 'throttle-air',
        read: (c) => ({ T2: [toC(c.T2), 27.0] }),
      },
    ],
    s6: [
      {
        tag: 'hot and cold water',
        lab: 'devices',
        scenario: 'mixer',
        read: (c) => ({ T2: [toC(c.T2), 29.99] }),
      },
      {
        tag: 'a heat exchanger',
        lab: 'devices',
        scenario: 'exchanger',
        read: (c) => ({ Q: [c.Qx / KJ, 167.6], T2: [toC(c.T2), 41.72] }),
      },
    ],
    s7: [
      {
        tag: 'one shower',
        lab: 'heater',
        scenario: 'shower',
        read: (c) => ({ Q: [c.Q / KJ, 22.33], P: [c.elec / KJ, 22.79], maxGpm: [c.maxGpm, 2.96] }),
      },
      {
        tag: 'a shower in winter',
        lab: 'heater',
        scenario: 'winter',
        read: (c) => ({ P: [c.elec / KJ, 29.56], Tout: [toC(c.Tout), 45.1], maxGpm: [c.maxGpm, 2.28] }),
      },
      {
        tag: 'two showers',
        lab: 'heater',
        scenario: 'two',
        read: (c) => ({ P: [c.elec / KJ, 45.58], Tout: [toC(c.Tout), 41.8], maxGpm: [c.maxGpm, 3.95] }),
      },
    ],
  },
  u4: {
    s1: [
      {
        tag: 'a fair engine',
        lab: 'claims',
        scenario: 'fair',
        read: (c) => ({ eta: [c.eta, 0.4], QL: [c.QL / KJ, 300] }),
      },
    ],
    s2: [
      {
        tag: 'a kitchen freezer',
        lab: 'carnot',
        scenario: 'fridge',
        read: (c) => ({ copR: [c.copR, 6.379], copHP: [c.copHP, 7.379] }),
      },
    ],
    s3: [
      {
        tag: 'kelvin, not celsius',
        lab: 'carnot',
        scenario: 'engine',
        read: (c) => ({ eta: [c.eta, 0.6317], etaC: [c.etaC, 0.9455] }),
      },
      {
        tag: 'one kilogram of air',
        lab: 'carnot',
        scenario: 'engine',
        read: (c) => ({ qH: [c.qH / KJ, 163.8], wNet: [c.wNet / KJ, 103.5] }),
      },
      {
        tag: 'five hundred degrees Fahrenheit',
        lab: 'carnot',
        scenario: 'engine',
        setup(s) {
          s.TH = fromF(500);
          s.TL = fromF(100);
        },
        read: (c) => ({ eta: [c.eta, 0.4168] }),
      },
    ],
    s4: [
      {
        tag: 'an impossible engine',
        lab: 'claims',
        scenario: 'impossible',
        read: (c) => ({ eta: [c.eta, 0.8], carnot: [c.carnot, 0.625] }),
      },
    ],
    s5: [
      {
        tag: 'a pressure ratio of 12',
        lab: 'carnot',
        scenario: 'brayton',
        read: (c) => ({ etaB: [c.etaB, 0.4812], T2: [toC(c.T2), 307.4], wB: [c.wB / KJ, 489.4] }),
      },
      {
        tag: 'cold air at the same ratio',
        lab: 'carnot',
        scenario: 'brayton',
        read: (c) => ({ cold: [c.cold, 0.5085], etaB: [c.etaB, 0.4812] }),
      },
      {
        tag: 'a pressure ratio of 18',
        lab: 'carnot',
        scenario: 'brayton',
        setup(s) { s.rp = 18; },
        read: (c) => ({ etaB: [c.etaB, 0.5348], T2: [toC(c.T2), 375.2] }),
      },
    ],
    s6: [
      {
        tag: 'the rating point',
        lab: 'ac',
        scenario: 'rated',
        read: (c) => ({ copK: [c.copK, 35.98], copE: [c.copE, 3.224], power: [c.power / KJ, 3.273] }),
      },
      {
        tag: 'a hotter afternoon',
        lab: 'ac',
        scenario: 'hot',
        read: (c) => ({ copK: [c.copK, 21.59], ratio: [c.ratio, 0.1493] }),
      },
    ],
  },
  u5: {
    s2: [
      {
        tag: 'liquid water in the tables',
        lab: 'ts',
        scenario: 'heat',
        setup(s) {
          s.p = 1e5;
          s.T1 = fromC(20);
          s.T2 = fromC(80);
        },
        read: (c) => ({ q: [c.q / KJ, 251], ds: [c.ds, 778.9] }),
      },
    ],
    s3: [
      {
        tag: 'steam from 200 to 400',
        lab: 'ts',
        scenario: 'heat',
        read: (c) => ({ q: [c.q / KJ, 416.4], ds: [c.ds, 734.3] }),
      },
    ],
    s4: [
      {
        tag: 'still superheated',
        lab: 'efficiency',
        scenario: 'turbine',
        read: (c) => ({ w: [c.w / KJ, 373], sgen: [c.sgen, 143.4], T2: [toC(c.T2), 201.2] }),
      },
      {
        tag: 'into the dome',
        lab: 'ts',
        scenario: 'real',
        read: (c) => ({ w: [c.w / KJ, 882.8], sgen: [c.sgen, 488.4], x2: [c.x2, 0.9017] }),
      },
      {
        tag: 'straight down the isentrope',
        lab: 'ts',
        scenario: 'isen',
        read: (c) => ({ w: [c.w / KJ, 1039], sgen: [c.sgen, 0] }),
      },
    ],
    s5: [
      {
        tag: 'air to 800 kPa',
        lab: 'efficiency',
        scenario: 'compressor',
        read: (c) => ({ w: [c.w / KJ, 295], T2: [toC(c.T2), 305.9], sgen: [c.sgen, 107.2] }),
      },
      {
        tag: 'a nozzle at 92 percent',
        lab: 'efficiency',
        scenario: 'nozzle',
        read: (c) => ({ V2: [c.V2, 522.3], sgen: [c.sgen, 45.86] }),
      },
    ],
    s6: [
      {
        tag: 'the wood-frame wall',
        lab: 'wall',
        scenario: 'wall',
        read: (c) => ({ q: [c.q, 190.8], sgen: [c.sgen, 0.04987], lost: [c.lost, 14.67] }),
      },
      {
        tag: 'the attic ceiling',
        lab: 'wall',
        scenario: 'ceiling',
        read: (c) => ({ q: [c.q, 159], sgen: [c.sgen, 0.04155], lost: [c.lost, 12.22] }),
      },
      {
        tag: 'a milder day',
        lab: 'wall',
        scenario: 'mild',
        read: (c) => ({ q: [c.q, 99.94], sgen: [c.sgen, 0.0132] }),
      },
    ],
  },
};

/** An example's tag as the notes write it, without "Worked example · ". */
export function exampleTag(tagText) {
  return tagText.replace(/^\s*Worked examples?\s*(·\s*)?/, '').trim();
}

/** Index of each tag's setup, or −1 when that example has no lab setup. */
export function matchExamples(exam, sectionId, tags) {
  const list = setupsFor(exam, sectionId);
  let untagged = -1;
  return tags.map((raw) => {
    const tag = exampleTag(raw);
    if (!tag) untagged++;
    return list.findIndex((ex) => (tag ? ex.tag === tag : ex.tag == null && ex.n === untagged));
  });
}

export function setupsFor(exam, sectionId) {
  return SETUPS[exam]?.[sectionId] || [];
}

/** Reset the slice to the example's scenario, then write its numbers. */
export function applyExample(lab, slice, ex) {
  const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
  const id = ex.scenario ?? list[0]?.id;
  if (id != null && lab.applyScenario) lab.applyScenario(id, slice);
  ex.setup?.(slice);
  slice.dirty = true;
}
