/** Unit 5 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u5',
  title: 'Momentum and collisions',
  chapters: '9',
  file: 'u5-momentum-and-collisions.html',
  load: () => import('../content/u5-momentum-and-collisions.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Linear momentum', lab: null, ch: ['9'], topics: ['momentum'], problems: ['ch9.momentum'] },
    { id: 's2', n: 2, title: 'Impulse', lab: 'impulse', ch: ['9'], topics: ['impulse'], problems: ['ch9.impulse', 'ch9.graph', 'ch9.bounce', 'ch9.meteor', 'ch9.concept-impulse'], home: true },
    { id: 's3', n: 3, title: 'Conservation of momentum', lab: 'collide', ch: ['9'], topics: ['momentum-conservation', 'collision'], problems: ['ch9.stick', 'ch9.recoil', 'ch9.concept-collide'], home: true },
    { id: 's4', n: 4, title: 'Types of collisions', lab: 'crash-reconstruction', ch: ['9'], topics: ['elastic', 'inelastic', 'restitution'], problems: ['ch9.elastic', 'ch9.partial', 'ch9.crash'], home: true },
    { id: 's5', n: 5, title: 'Collisions in two dimensions', lab: 'collide-2d', ch: ['9'], topics: ['oblique'], problems: ['ch9.oblique', 'ch9.concept-2d'], home: true },
    { id: 's6', n: 6, title: 'Center of mass', lab: 'center-of-mass', ch: ['9'], topics: ['center-of-mass'], problems: ['ch9.cm', 'ch9.concept-cm'], home: true },
    { id: 's7', n: 7, title: 'Rocket propulsion', lab: 'rocket', ch: ['9'], topics: ['rocket'], problems: ['ch9.rocket', 'ch9.concept-rocket'], home: true },
    { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
