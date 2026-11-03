/** References are by section; Flux writes its own prose, diagrams and generated examples. */
export const TEXTBOOK = {
  title: 'Engineering Mechanics: Statics',
  author: 'R. C. Hibbeler',
  sections: {
    2: 'Force vectors, unit vectors and dot products',
    3: 'Particle equilibrium',
    4: 'Force-system resultants',
    5: 'Rigid-body equilibrium',
    6: 'Structural analysis',
    7: 'Internal forces',
    8: 'Friction',
    9: 'Centre of gravity and centroid',
    10: 'Moments of inertia',
  },
};
export const OCW = 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/pages/lecture-notes/';
export const SOURCES = {
  bridle: {
    url: 'https://www.epal-pallets.org/eu-en/load-carriers/epal-euro-pallet',
    text: 'EPAL Euro pallet: 1200 × 800 mm, approximately 25 kg. Empty-pallet weight uses g = 9.81 m/s². Payloads and sling angles are assumed teaching inputs, not working-load ratings.',
  },
  shelf: {
    url: 'https://www.ikea.com/us/en/p/bergshult-shelf-white-70421238/',
    text: 'IKEA BERGSHULT shelf: 80 × 20 cm, published maximum load 10 kg. Wall-anchor spacing and load location are assumed. A rating is not an anchor design calculation.',
  },
  gantry: {
    url: 'https://mutcd.fhwa.dot.gov/htm/2009/part2/part2c.htm',
    text: 'FHWA MUTCD 2009 Table 2C-2: conventional-road W1-1 turn sign, 30 × 30 in. Pressure 600 Pa, 4 m span and panel depth are assumed teaching inputs; they are not code wind loads.',
  },
  jack: {
    url: 'https://www.torin-usa.com/',
    text: 'Torin BIG RED T10152 scissor jack: nominal capacity 1.5 US tons. The four 0.25 m arms are assumed geometry. The screw force is not the hand force or a safety rating.',
  },
  bookcase: {
    url: 'https://www.ikea.com/us/en/p/billy-bookcase-white-00263850/',
    text: 'IKEA BILLY bookcase: 80 × 28 × 202 cm. Weight 400 N, friction 0.3 and push height are assumed; the manufacturer requires wall anchoring.',
  },
};
