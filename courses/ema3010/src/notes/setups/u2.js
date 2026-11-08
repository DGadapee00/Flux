/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s3: [{ tag: 'a crystal at 40°', lab: 'slip', scenario: 'fortyfive', setup(s) { s.phi = 40; }, read: (c) => ({ m: [c.m, 0.492], 'τ_R (MPa)': [c.tau, 1.08], 'σ_y (MPa)': [c.sigmaY, 2.03] }) }],
  s2: [{ tag: 'carburizing at 900 °C', lab: 'diffusion', scenario: 'base', read: (c) => ({ D: [c.D, 5.91e-12], '√(Dt) (mm)': [c.ell * 1e3, 0.292], 'case (mm)': [c.depthMM, 0.278] }) }],
  s1: [{ tag: 'one electronvolt, hot and cold', lab: 'vacancy', scenario: 'hot', read: (c) => ({ fraction: [c.c, 9.12e-6], 'per cm³': [c.perCm3, 7.74e17] }) }],
  s5: [
    { tag: 'mild steel', lab: 'grain', scenario: 'fine', read: (c) => ({ 'σ_y (MPa)': [c.sy, 304] }) },
  ],
};
