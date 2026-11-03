export default {
  id: 'fourier',
  title: 'Fourier’s law',
  label: ['Fourier’s law'],
  subject: 'heat',
  courses: ['eml4140', 'eml3100'],
  eq: String.raw`\mathbf q'' = -k\,\nabla T`,
  idea: String.raw`Heat flux in a solid points down the temperature gradient, at a rate set by the conductivity \(k\). Through a flat wall it becomes \(q'' = k\,\Delta T/L\). This is the vector field of heat transfer: its flux through a surface is the heat rate.`,
  requires: ['gradient'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §1.6 Mechanisms of heat transfer',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/1-6-mechanisms-of-heat-transfer',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Conduction through a slab, with the numbers worked.',
    },
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'The text MIT 2.51 uses. Chapter 1 introduces conduction; chapter 2 builds the equation.',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'wall', note: 'Shows the entropy generated as heat crosses a wall. It does not draw the temperature profile.' },
  ],
};
