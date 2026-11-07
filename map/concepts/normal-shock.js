export default {
  id: 'normal-shock',
  title: 'Normal shocks',
  label: ['Normal shocks'],
  subject: 'thermo',
  courses: ['eml3101'],
  eq: String.raw`\text{Ma}_2^2 = \frac{(k-1)\,\text{Ma}_1^2 + 2}{2k\,\text{Ma}_1^2 - (k-1)}, \qquad \frac{p_2}{p_1} = \frac{2k\,\text{Ma}_1^2 - (k-1)}{k+1}`,
  idea: String.raw`A supersonic stream can slow to subsonic in a jump only a few molecular paths thick. Across the jump mass, momentum and energy are conserved, but the process is far from reversible. Solving the three balances together gives the downstream Mach number, pressure and temperature from the upstream Mach number alone. Entropy rises across the shock, so stagnation pressure falls, and only a jump from supersonic to subsonic is possible. In a nozzle with too much back pressure a shock stands in the diverging section and moves toward the throat as the back pressure rises.`,
  requires: ['compressible-flow', 'momentum-cv'],
  sources: [
    {
      title: 'NASA Glenn, Beginner’s guide to aeronautics: Normal shocks interactive',
      url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/normal/',
      kind: 'Reference',
      level: 'Intro',
      why: 'The shock relations with a calculator to check them.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §17.8 Shock waves',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/17-8-shock-waves',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Shocks from a source faster than sound, as a first course shows them.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3101', lab: 'nozzle', notes: ['s2'], note: 'The same nozzle between choking and the design pressure: a normal shock enters the diverging part and walks to the exit as p_b falls, dropping the flow to subsonic and costing up to 37% of the stagnation pressure.' },
  ],
};
