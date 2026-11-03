export default {
  id: 'voltage-divider',
  title: 'Voltage dividers and resistive sensors',
  label: ['Voltage', 'divider'],
  subject: 'circuits',
  courses: ['bench', 'eel3111'],
  eq: String.raw`V_\text{out} = V_s\,\frac{R_2}{R_1 + R_2}, \qquad R_\text{fixed} = \sqrt{R_\text{light}\,R_\text{dark}}\ \text{(largest swing)}`,
  idea: String.raw`Two resistors in series split a voltage in proportion to their sizes. A load across the lower one sits in parallel with it and pulls the output down, harder when the divider's resistors are large. Put a sensor whose resistance changes, a light or temperature sensor, in one place and the output tracks what it senses. The fixed resistor that gives the largest swing is the geometric mean of the sensor's two extremes.`,
  requires: ['kirchhoff'],
  sources: [
    {
      title: 'Kuphaldt, Lessons in Electric Circuits',
      url: 'https://www.ibiblio.org/kuphaldt/electricCircuits/',
      kind: 'Free textbook (Design Science License)',
      level: 'Intro',
      why: 'The divider and its loading, from the text the course cites.',
    },
    {
      title: 'MIT 6.002, calendar: KVL, KCL resistive network analysis',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Where the divider sits in network analysis.',
    },
  ],
  labs: [
    { course: 'bench', lab: 'divider', notes: ['s1', 's2', 's3'], note: 'A potentiometer, an LDR and a thermistor in dividers, then a load across the output.' },
    { course: 'bench', lab: 'nightlight', notes: ['s4'], note: 'A night light’s LDR divider read by a 10-bit input, with the fixed resistor chosen.' },
  ],
};
