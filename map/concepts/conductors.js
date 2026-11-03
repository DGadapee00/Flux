export default {
  id: 'conductors',
  title: 'Conductors in equilibrium',
  label: ['Conductors in', 'equilibrium'],
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`\mathbf E_\text{inside} = 0, \qquad E_\text{surface} = \frac{\sigma}{\varepsilon_0}\ \text{(normal)}`,
  idea: String.raw`Free charge in a conductor moves until it feels no force, so the field inside is zero once things settle. Gauss's law then puts all excess charge on the surface, and the field just outside points straight out with size \(\sigma/\varepsilon_0\). A closed metal shell hides its inside from outside fields. That is a Faraday cage.`,
  requires: ['gauss-law'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §6.4 Conductors in electrostatic equilibrium',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/6-4-conductors-in-electrostatic-equilibrium',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Each property argued from Gauss’s law, including cavities.',
    },
    {
      title: 'Feynman Lectures Vol. II, Ch. 5: Application of Gauss’ law',
      url: 'https://www.feynmanlectures.caltech.edu/II_05.html',
      kind: 'Free lectures',
      level: 'Deeper',
      why: 'Why a closed conductor shields its inside, said more carefully than most texts.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'conductors', notes: ['s13', 's14', 's15'], note: String.raw`Surface charge \(\sigma\) on spheres and cages, coloured by sign, with image charges.` },
  ],
};
