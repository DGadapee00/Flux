/** Unit 17 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  confusion: [
    { tag: 'pushed along the track', lab: 'separation', scenario: 'along', read: (c) => ({ 'drift (km/h)': [c.drift * 3.6, 10.8], 'to 10 km (min)': [c.reachH * 60, 49] }) },
    { tag: 'pushed outward', lab: 'separation', scenario: 'radial', read: (c) => ({ 'furthest (km)': [c.boundKm, 3.6] }) },
    { tag: 'a gentle push', lab: 'separation', scenario: 'slow', read: (c) => ({ 'drift (km/h)': [c.drift * 3.6, 2.2], 'to 10 km (h)': [c.reachH, 4.3] }) },
  ],
};
