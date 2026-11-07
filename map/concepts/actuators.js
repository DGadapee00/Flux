export default {
  id: 'actuators',
  title: 'Actuators: motors, solenoids and hydraulics',
  label: ['Actuators'],
  subject: 'instruments',
  courses: ['design'],
  eq: String.raw`\begin{gathered}T = K_t\, i,\qquad \omega = \frac{V - iR}{K_e} \\ F = p\,A\end{gathered}`,
  idea: 'An actuator turns a signal into motion. A DC motor’s torque grows with current and its speed with voltage, so a motor at stall draws the most current. A servo adds a position sensor and a loop. A solenoid pulls a plunger over a short stroke. Hydraulic and pneumatic cylinders push with pressure times area: hydraulics for large, stiff forces, pneumatics for fast, light ones.',
  requires: ['magnetic-force', 'electric-power'],
  sources: [
    {
      title: 'MIT 2.007, Lecture 3: Actuators, DC motors, servomotors and pneumatics',
      url: 'https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/resources/mit2_007s09_lec03/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Motor torque and speed, servos and pneumatics for a design project.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.72, Lecture 14: Actuators, hydraulic and electromagnetic',
      url: 'https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/resources/mit2_72s09_lec14/',
      kind: 'Lecture notes',
      level: 'Deeper',
      why: 'Energy transfer in hydraulic and electromagnetic actuators, compared.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'motor', notes: ['s3'], note: 'A brushed DC motor from free running to stall: speed, current, power and efficiency. Solenoids and hydraulics are not covered.' },
  ],
};
