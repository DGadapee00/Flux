/** Work and energy (id u3, Unit 4) notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u3',
  title: 'Work and energy',
  chapters: '14',
  file: 'u3-work-energy.html',
  load: () => import('../content/u3-work-energy.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Principle of work and energy', lab: 'collar', ch: ['14'], topics: ['energy'], home: true },
    { id: 's2', n: 2, title: 'Work of a spring', lab: 'collar', ch: ['14'], topics: ['spring'] },
    { id: 's3', n: 3, title: 'Friction on a slide', lab: 'collar', ch: ['14'], topics: ['friction'], problems: ['u3.14.spring-sym'] },
    { id: 's4', n: 4, title: 'Power and efficiency', lab: null, ch: ['14'], topics: ['power'] },
    { id: 's5', n: 5, title: 'Path independence', lab: 'paths', ch: ['14'], topics: ['path'], home: true },
    { id: 's6', n: 6, title: 'Application: stopping sight distance', lab: 'stopping', ch: ['14'], topics: ['energy', 'friction'], problems: ['u3.14.stopping', 'u3.14.brake-scale'], home: true },
    { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
