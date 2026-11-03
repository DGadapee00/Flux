export default {
  id: 'dielectrics',
  title: 'Dielectrics and breakdown',
  label: ['Dielectrics and', 'breakdown'],
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`C = \kappa\,C_0, \qquad E = \frac{E_0}{\kappa}`,
  idea: String.raw`An insulator between the plates polarizes. Its bound charge partly cancels the field, so the same charge sits at a lower voltage and the capacitance rises by \(\kappa\). Push the field too high and the insulator stops insulating: in air, a spark. How easily a gas breaks down depends on the gap and the pressure together.`,
  requires: ['capacitance'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §8.4 Capacitor with a dielectric',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/8-4-capacitor-with-a-dielectric',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Battery connected versus isolated, the two cases the lab switches between.',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §8.5 Molecular model of a dielectric',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/8-5-molecular-model-of-a-dielectric',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Why polarization lowers the field, and where breakdown strength comes in.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'capacitor', notes: ['s10'], note: 'Slide a dielectric in with the battery on or off and watch Q, V and C.' },
    { course: 'phy2049', lab: 'breakdown', note: 'Spark gaps from a doorknob to a gas tube, on the breakdown curve against pressure times gap.' },
  ],
};
