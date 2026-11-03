export default {
  id: 'thermal-resistance',
  title: 'Thermal resistance',
  label: ['Thermal', 'resistance'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`q = \frac{T_1 - T_\infty}{\sum R}, \qquad R_\text{wall} = \frac{L}{kA}, \quad R_\text{cyl} = \frac{\ln(r_2/r_1)}{2\pi kL}, \quad R_\text{conv} = \frac{1}{hA}`,
  idea: String.raw`In steady conduction with no heat made inside, Fourier's law makes heat flow proportional to the temperature drop. The ratio is a resistance: \(L/kA\) for a wall, a log of the radii for a pipe wall, \(1/hA\) at a surface that loses heat to a fluid. Layers in series add their resistances, so the largest one sets the heat flow and takes the largest share of the drop. The overall coefficient \(U\) is one over the total resistance per unit area. Insulation on a thin pipe adds conduction resistance but also surface area, so below a critical radius \(k/h\) it raises the heat loss.`,
  requires: ['fourier'],
  related: [
    {
      id: 'current-resistance',
      note: String.raw`Ohm's law for heat: temperature drop for voltage, heat rate for current, \(L/kA\) for \(\rho L/A\).`,
    },
  ],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapter 2 builds resistances and the overall coefficient; it is the course text MIT 2.51 assigns.',
    },
    {
      title: 'MIT 2.51, calendar: Conduction, resistances, energy equation',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course’s second session: resistances come before the full heat equation.',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §1.6 Mechanisms of heat transfer',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/1-6-mechanisms-of-heat-transfer',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Conduction through a slab and the three modes, at a first-course level.',
    },
  ],
  labs: [],
  candidate: 'Stack wall layers and a surface film as resistances, and add insulation to a thin pipe. It corrects the idea that more insulation always cuts heat loss: below the critical radius it adds surface faster than resistance.',
};
