/** Unit 14 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  rocket: [
    { tag: 'disposal on hydrazine', lab: 'propellant', scenario: 'mono', read: (c) => ({ 'Δv (m/s)': [c.total, 92.8], 'exhaust (m/s)': [c.ue, 2160], 'propellant (kg)': [c.mp, 0.47], 'system (kg)': [c.system, 1.14], 'wet (kg)': [c.wet, 11.14] }) },
  ],
  budget: [
    { tag: 'three years at 400 km', lab: 'propellant', scenario: 'electric', read: (c) => ({ 'drag makeup (m/s)': [c.makeup, 126], 'disposal (m/s)': [c.dispose, 58], 'total (m/s)': [c.total, 184] }) },
  ],
  tanks: [
    { tag: 'the disposal on cold gas', lab: 'propellant', scenario: 'cold', read: (c) => ({ 'propellant (kg)': [c.mp, 1.64], 'system (kg)': [c.system, 4.6], 'wet (kg)': [c.wet, 14.6], 'most it can give (m/s)': [c.ceiling, 374] }) },
  ],
  electric: [
    { tag: 'raising 400 km to 550 km', lab: 'spiral', scenario: 'raise', read: (c) => ({ 'thrust (mN)': [c.mN, 2.7], 'per kW (mN)': [c.perKW, 68], 'Δv (m/s)': [c.dv, 84], 'days': [c.days, 4.3], 'propellant (g)': [c.mp * 1000, 68] }) },
    { tag: 'twice the specific impulse', lab: 'spiral', scenario: 'high', read: (c) => ({ 'thrust (mN)': [c.mN, 1.36], 'days': [c.days, 8.5], 'propellant (g)': [c.mp * 1000, 34] }) },
  ],
};
