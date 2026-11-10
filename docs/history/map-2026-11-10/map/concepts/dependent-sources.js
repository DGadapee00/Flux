export default {
  id: 'dependent-sources',
  title: 'Dependent sources',
  label: ['Dependent', 'sources'],
  subject: 'circuits',
  courses: ['eel3111'],
  eq: String.raw`v = \mu\,v_x, \qquad i = g_m v_x, \qquad v = r_m i_x, \qquad i = \beta\,i_x`,
  idea: String.raw`A dependent source sets its voltage or current from a voltage or current elsewhere in the circuit. It is how a transistor or an amplifier is drawn in a linear model: a small controlling signal sets a large output. In node or mesh analysis it adds one more equation tying its value to the controlling variable. Its controlling variable must be written with the right direction, or the gain changes sign. Unlike an independent source, it is never switched off in superposition or when finding a Thévenin resistance.`,
  requires: ['nodal-analysis'],
  sources: [
    {
      title: 'MIT 6.002, calendar: Lecture 8, dependent sources and amplification',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course meets dependent sources as the model of an amplifier.',
      checked: '2026-11-06',
    },
    {
      title: 'Kuphaldt, Lessons in Electric Circuits, Vol. III: Semiconductors',
      url: 'https://www.allaboutcircuits.com/textbook/semiconductors/',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Transistor amplifiers, the devices that dependent sources stand in for.',
    },
  ],
  labs: [
    { course: 'eel3111', lab: 'dependent', notes: ['s4'], note: 'An amplifier drawn with a voltage-controlled source and a feedback resistor, with its gain swept: zero the source and the output collapses, while doubling it barely moves the gain from −R_f/R_s.' },
  ],
};
