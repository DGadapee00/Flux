export default {
  id: 'internal-resistance',
  title: 'Internal resistance and voltage drop',
  label: ['Internal', 'resistance'],
  subject: 'circuits',
  courses: ['bench'],
  eq: String.raw`V_\text{terminal} = \mathcal E - I\,(r_\text{source} + r_\text{cable})`,
  idea: String.raw`A real source has resistance inside it, and so do the wires from it. Draw more current and more voltage is lost before it reaches the load. So the 5 V a USB port promises sags under a motor, and a short, thick cable keeps more of it. The same drop sets how hard you can push any battery or adapter.`,
  requires: ['kirchhoff'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §10.1 Electromotive force',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/10-1-electromotive-force',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'EMF, internal resistance and terminal voltage.',
    },
    {
      title: 'MIT 6.002, calendar: Thevenin and Norton equivalences',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Where a source with internal resistance becomes a Thévenin model.',
    },
  ],
  labs: [
    { course: 'bench', lab: 'usb-rail', notes: ['s6'], note: 'USB power on a breadboard: the rail voltage sags with current and cable.' },
  ],
};
