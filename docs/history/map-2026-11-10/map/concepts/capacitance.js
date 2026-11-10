export default {
  id: 'capacitance',
  title: 'Capacitance',
  subject: 'em',
  courses: ['phy2049', 'eel3111'],
  eq: String.raw`C = \frac{Q}{\Delta V}, \qquad C_\text{plates} = \frac{\varepsilon_0 A}{d}, \qquad U = \tfrac12 C\,\Delta V^2`,
  idea: String.raw`Two conductors holding equal and opposite charge make a capacitor. The charge it holds per volt depends only on its shape: for parallel plates, more area and a smaller gap give more. Charging it stores energy in the field between the plates, \(\tfrac12\varepsilon_0E^2\) per unit volume.`,
  requires: ['electric-potential', 'gauss-law'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §8.1 Capacitors and capacitance',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/8-1-capacitors-and-capacitance',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Parallel plate, spherical and cylindrical capacitors, each from Gauss’s law.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: Capacitors',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving04/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'The four-step method: field, potential difference, then C, then energy.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'capacitor', notes: ['s8', 's9'], note: 'Plates you resize and space, with a battery connected or the capacitor isolated.' },
  ],
};
