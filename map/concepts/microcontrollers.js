export default {
  id: 'microcontrollers',
  title: 'Microcontrollers and embedded control',
  label: ['Microcontrollers'],
  subject: 'instruments',
  courses: ['design'],
  eq: String.raw`\text{duty} = \frac{t_\text{on}}{T},\qquad V_\text{avg} = \text{duty} \times V_s`,
  idea: 'A microcontroller is a small computer with its own inputs and outputs. Digital pins read switches and drive logic; an analog-to-digital converter reads sensors. It cannot output a true analog voltage, so it switches a pin on and off quickly: pulse-width modulation, whose average sets a motor’s speed or a lamp’s brightness. A loop reads, decides and acts many times a second.',
  requires: ['pull-resistors', 'sensor-basics'],
  sources: [
    {
      title: 'Wikipedia, Microcontroller',
      url: 'https://en.wikipedia.org/wiki/Microcontroller',
      kind: 'Reference',
      level: 'Intro',
      why: 'What is inside one: inputs and outputs, converters, timers, interrupts and PWM.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.007, Lecture 14: Microcomputers, programming, electronics and sensors',
      url: 'https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/resources/mit2_007s09_lec14/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'A microcontroller as the brain of a design-course machine.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'pwm', notes: ['s4'], note: 'A timer’s PWM switching a coil: duty sets the average, frequency the ripple and the timer’s resolution.' },
  ],
};
