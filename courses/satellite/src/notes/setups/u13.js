/** Unit 13 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  levels: [
    { tag: 'the GEVS component spectrum', lab: 'levels', scenario: 'accept', read: (c) => ({ 'acceptance level (g rms)': [c.grms, 10.0] }) },
    { tag: 'protoflight on a 350 Hz bracket', lab: 'levels', scenario: 'stiff', read: (c) => ({ 'response (g rms)': [c.response, 29.8], 'test uses': [c.testUse, 0.46], 'flight unit keeps': [c.flightLeft, 0.49] }) },
    { tag: 'a prototype instead', lab: 'levels', scenario: 'prototype', read: (c) => ({ 'prototype uses': [c.testUse, 0.92], 'flight unit keeps': [c.flightLeft, 0.9] }) },
  ],
  tvac: [
    { tag: 'a 6U CubeSat, four cycles', lab: 'tvac', scenario: 'six', read: (c) => ({ 'heating (h)': [c.heatH, 2.0], 'cooling (h)': [c.coolH, 6.2], 'fastest (°C/min)': [c.peakRate, 0.88], 'cycle (h)': [c.cycleH, 56], 'campaign (days)': [c.campaignDays, 9.4] }) },
    { tag: 'a polished aluminium craft', lab: 'tvac', scenario: 'bare', read: (c) => ({ 'heating (h)': [c.heatH, 41], 'cooling (h)': [c.coolH, 78], 'campaign (days)': [c.campaignDays, 28] }) },
  ],
};
