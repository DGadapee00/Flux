/** Unit 12 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  coverage: [
    { tag: 'one Arctic station', lab: 'coverage', scenario: 'polar', read: (c) => ({ 'λ (°)': [(c.lam * 180) / Math.PI, 14.1], 'minutes a day': [c.anyMinutes, 56], 'contacts a day': [c.passesPerDay, 9.6], 'longest wait (h)': [c.longestGapH, 11.1] }) },
    { tag: 'three stations spread around the world', lab: 'coverage', scenario: 'network', read: (c) => ({ 'minutes a day': [c.anyMinutes, 119], 'contacts a day': [c.passesPerDay, 21], 'longest wait (h)': [c.longestGapH, 4.5] }) },
  ],
};
