/** Unit 3 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'air over a warm plate', lab: 'thermal', scenario: 'air', read: (c) => ({ 'θ′(0)': [c.wall, 0.294], 'η at θ = 0.99': [c.etaT, 5.60], 'δt/δ': [c.ratio, 1.14] }) }],
  s3: [{ tag: 'air at 20 m/s', lab: 'nusselt', scenario: 'air-fast', read: (c) => ({ 'x_c (m)': [c.xc, 0.392], 'h̄': [c.hBar, 46.0] }) }],
  s2: [{ tag: 'water along a plate', lab: 'thermal', scenario: 'water', read: (c) => ({ 'θ′(0)': [c.wall, 0.607] }) }],
  s5: [
    { tag: 'water at 4 g/s', lab: 'tube', scenario: 'laminar', read: (c) => ({ Re: [c.Re, 784], 'T out (°C)': [c.To, 73.1], 'q (W)': [c.q, 888] }) },
  ],
  s6: [
    { tag: 'a plate at 60 °C', lab: 'plume', scenario: 'hot', read: (c) => ({ Nu: [c.Nu, 50.7], 'h (W/m²K)': [c.h, 4.40] }) },
  ],
  s7: [
    { tag: 'condensing on a wall at 90 °C', lab: 'boil', scenario: 'condense', read: (c) => ({ 'h (W/m²K)': [c.h, 11600], 'q (kW/m²)': [c.q / 1000, 116] }) },
  ],
};
