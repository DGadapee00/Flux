export default {
  id: 'thevenin-norton',
  title: 'Thévenin and Norton equivalents',
  label: ['Thévenin and', 'Norton'],
  subject: 'circuits',
  courses: ['eel3111'],
  eq: String.raw`V_\text{th} = v_\text{oc}, \qquad I_N = i_\text{sc}, \qquad R_\text{th} = \frac{v_\text{oc}}{i_\text{sc}}, \qquad P_\text{max} = \frac{V_\text{th}^2}{4R_\text{th}}\ \text{at } R_L = R_\text{th}`,
  idea: String.raw`Seen from two terminals, any linear network gives a straight line of voltage against current. A line is fixed by two numbers, so the whole network acts like one source and one resistor: Thévenin's voltage in series, or Norton's current in parallel. The intercepts are the open-circuit voltage and the short-circuit current, and their ratio is the resistance. With dependent sources inside, find \(R_\text{th}\) with a test source instead of switching sources off. A load takes the most power when it matches \(R_\text{th}\), and then half the power is lost inside.`,
  requires: ['superposition'],
  related: [
    {
      id: 'internal-resistance',
      note: String.raw`A battery's emf and internal resistance are its Thévenin equivalent.`,
    },
  ],
  sources: [
    {
      title: 'MIT 6.002, calendar: Lecture 3 and recitation 3, Thévenin and Norton',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'One lecture and a recitation on the equivalents.',
    },
    {
      title: 'Kuphaldt, Lessons in Electric Circuits, Vol. I: DC',
      url: 'https://www.allaboutcircuits.com/textbook/direct-current/',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Thévenin, Norton and maximum power transfer in its network theorems chapter.',
    },
  ],
  labs: [],
  candidate: 'Sweep a load across a network and plot its terminal voltage against current, with the load power beside it. It corrects the idea that maximum power transfer is the efficient choice: at the peak, half the power heats the source.',
};
