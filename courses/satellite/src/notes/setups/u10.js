/** Unit 10 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  tasks: [
    { tag: 'the baseline processor', lab: 'tasks', scenario: 'nominal', read: (c) => ({ U: [c.U, 0.635], bound: [c.bound, 0.743], 'housekeeping (ms)': [c.response.hk / 1000, 490] }) },
    { tag: 'a processor two-thirds as fast', lab: 'tasks', scenario: 'slow', read: (c) => ({ U: [c.U, 0.953], 'housekeeping (ms)': [c.response.hk / 1000, 1878] }) },
  ],
  data: [
    { tag: 'S-band, three passes a group', lab: 'data', scenario: 'sband', read: (c) => ({ 'pass (min)': [c.tp / 60, 7.38], 'sending (min)': [c.sendMin, 44.3], 'sent (Gbit)': [c.sent / 1000, 2.66], 'made (Gbit)': [c.made / 1000, 2.33], margin: [c.margin, 0.138], 'peak (MB)': [c.peak / 8, 106] }) },
    { tag: 'a 30° mask', lab: 'data', scenario: 'mask', read: (c) => ({ 'pass (min)': [c.tp / 60, 3.45], 'sent (Gbit)': [c.sent / 1000, 1.24], 'grows (MB/day)': [c.perDay / 8, 136] }) },
  ],
};
