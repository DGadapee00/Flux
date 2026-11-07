/** Unit 3 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
const nozzle = (xf) => (s) => Object.assign(s, { u0: 1, L: 0.5, CR: 4, ramp: 0, xf });

export default {
  s1: [{ tag: 'a particle leaving the nozzle', lab: 'nozzle', scenario: 'steady', setup: nozzle(1), read: (c) => ({ u: [c.u, 4], accel: [c.accel, 96] }) }],
  s2: [{ tag: 'crossing the nozzle', lab: 'nozzle', scenario: 'steady', setup: nozzle(1), read: (c) => ({ T: [c.T, 0.313] }) }],
  s3: [
    {
      tag: 'a water elbow',
      lab: 'bend',
      scenario: 'elbow',
      setup(s) {
        Object.assign(s, { fluid: 'water', V: 2, R: 0.3, w: 0.2, profile: 'vortex' });
      },
      read: (c) => ({ uIn: [c.uIn, 2.89], dp: [c.dp / 1000, 3.12] }),
    },
  ],
  s7: [{ tag: 'air along a 1 m plate', lab: 'layer', scenario: 'air', read: (c) => ({ ReL: [c.ReL, 3.25e5], 'δ (mm)': [c.deltaEnd * 1000, 8.6], 'δ halfway (mm)': [c.delta(0.5) * 1000, 6.1] }) }],
  s6: [{ tag: 'a 1/25 ship model', lab: 'model', scenario: 'tank', read: (c) => ({ Vm: [c.Vm, 2], ReM: [c.ReM, 8.0e6], nu: [c.nuNeeded, 8.0e-9] }) }],
  s5: [{ tag: 'olive oil in a 4 mm tube', lab: 'pipe', scenario: 'oil', read: (c) => ({ 'Q (mL/s)': [c.Q * 1e6, 1.12], V: [c.V, 0.089], Re: [c.Re, 5.8] }) }],
  s10: [{ tag: 'water in 5 cm steel', lab: 'headloss', scenario: 'smooth', read: (c) => ({ Re: [c.Re, 50930], f: [c.f, 0.0237], 'h_L (m)': [c.hL, 0.2505] }) }],
  s9: [{ tag: 'a jet on a turning vane', lab: 'vane', scenario: 'fixed180', read: (c) => ({ 'ṁ (kg/s)': [c.mdot, 6.27], 'F_x (N)': [c.Fx, 250.8] }) }],
  s8: [{ tag: 'a steady nozzle', lab: 'transport', scenario: 'nozzle', read: (c) => ({ uIn: [c.uIn, 0.696], uOut: [c.uOut, 0.941], F: [c.sysRate, 2.46] }) }],
  s4: [{ tag: 'air squeezed by a piston', lab: 'continuity', scenario: 'piston', read: (c) => ({ in: [c.in, 0.468], out: [c.out, 0.252], net: [c.net, -0.216], rate: [c.dRhoDt, 2.4] }) }],
};
