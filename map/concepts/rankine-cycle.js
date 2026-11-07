export default {
  id: 'rankine-cycle',
  title: 'The Rankine cycle',
  label: ['Rankine cycle'],
  subject: 'thermo',
  courses: ['eml3101'],
  eq: String.raw`\eta = \frac{(h_3 - h_4) - (h_2 - h_1)}{h_3 - h_2}, \qquad w_\text{pump} \approx v_1\,(p_2 - p_1)`,
  idea: String.raw`A steam plant pumps liquid water to high pressure, boils it in a boiler, expands the steam through a turbine and condenses it back to liquid. Pumping a liquid costs little work because its volume is small, which is the cycle's great advantage over a gas cycle. Each device is a steady-flow energy balance, and the states come from steam tables. Raising boiler pressure or superheat raises efficiency. Reheat keeps the turbine exhaust from getting too wet, and feedwater heaters warm the water with bled steam so less heat is added at low temperature.`,
  requires: ['isentropic-efficiency', 'phases'],
  related: [
    {
      id: 'vapour-compression',
      note: String.raw`The same four devices run the other way: a pump for the compressor, a turbine for the throttle.`,
    },
  ],
  sources: [
    {
      title: 'MIT 16.050, calendar: Power cycles with two-phase media',
      url: 'https://ocw.mit.edu/courses/16-050-thermal-energy-fall-2002/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The four lectures on vapour power cycles.',
      checked: '2026-11-06',
    },
    {
      title: 'Cleynen, Engineering Thermodynamics',
      url: 'https://thermodynamicsbook.com/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'The Rankine cycle, reheat and regeneration, with steam-table states.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Rankine cycle',
      url: 'https://en.wikipedia.org/wiki/Rankine_cycle',
      kind: 'Reference',
      level: 'Intro',
      why: 'The cycle on a \\(T\\)–\\(s\\) diagram and its real-plant variants.',
      checked: '2026-11-06',
    },
  ],
  labs: [],
  candidate: 'A Rankine cycle on \\(T\\)–\\(s\\) with sliders for boiler pressure, superheat and reheat. It corrects the idea that a higher boiler pressure is free: it raises efficiency but leaves the turbine exhaust wetter, which reheat then fixes.',
};
