/** Unit 3 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a 3-2-1 turn', lab: 'attitude', scenario: 'tilted', read: (c) => ({ 'nose x': [c.R[0][0], 0.814], 'nose y': [c.R[1][0], 0.470], 'nose z': [c.R[2][0], -0.342] }) }],
  s2: [{ tag: 'pitched up 80°', lab: 'attitude', scenario: 'near', read: (c) => ({ 'ψ̇ (°/s)': [c.rates.psi, 5.76], 'φ̇ (°/s)': [c.rates.phi, 5.67] }) }],
  s5: [{ tag: 'holding against 10 mN·m', lab: 'pointing', scenario: 'pd', read: (c) => ({ 'offset (°)': [c.offsetDeg, 0.0573], 'slowest pole (1/s)': [c.slowest, -0.639], 'settling (s)': [c.settle, 6.26] }) }],
  s4: [{ tag: 'a brick about its middle axis', lab: 'spin', scenario: 'mid', read: (c) => ({ 'λ, theory (1/s)': [c.lin.lambda, 0.480], 'λ, measured (1/s)': [c.check.measured, 0.480] }) }],
  s3: [{ tag: 'the tilted craft as a quaternion', lab: 'attitude', scenario: 'tilted', read: (c) => ({ w: [c.q[0], 0.9515], x: [c.q[1], 0.0381], y: [c.q[2], 0.1893], z: [c.q[3], 0.2393] }) }],
};
