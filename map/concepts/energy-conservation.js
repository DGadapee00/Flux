export default {
  id: 'energy-conservation',
  title: 'Potential energy and conservation',
  label: ['Energy', 'conservation'],
  subject: 'mechanics',
  courses: ['phy2048'],
  eq: String.raw`K_1 + U_1 = K_2 + U_2 + E_\text{th}, \qquad F_x = -\frac{dU}{dx}`,
  idea: String.raw`A conservative force stores the work it takes as potential energy, so kinetic plus potential stays fixed. Friction moves some of it into thermal energy instead. Only changes in potential energy matter, so its zero is a free choice. On a potential-energy curve a body can be only where its energy is above the curve, turns round where they meet, and rests at the bottoms.`,
  requires: ['work-energy'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §8.3 Conservation of energy',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/8-3-conservation-of-energy',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Mechanical energy with and without friction, worked on tracks and springs.',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §8.4 Potential energy diagrams and stability',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/8-4-potential-energy-diagrams-and-stability',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Reading turning points and equilibria off a U curve.',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'track', notes: ['s8', 's6'], note: 'A body on a track sharing kinetic and potential energy, with friction taking a share.' },
    { course: 'phy2048', lab: 'energy-diagram', notes: ['s9'], note: 'Motion read from a potential-energy curve: turning points, force and rest.' },
  ],
};
