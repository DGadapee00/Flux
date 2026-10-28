/** Impulse and momentum (id u4, Unit 3) notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u4',
  title: 'Impulse and momentum',
  chapters: '15',
  file: 'u4-impulse-momentum.html',
  load: () => import('../content/u4-impulse-momentum.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Principle of linear impulse and momentum', lab: 'impulse', ch: ['15'], topics: ['impulse'], home: true },
    { id: 's2', n: 2, title: 'Conservation of momentum', lab: null, ch: ['15'], topics: ['conservation'] },
    { id: 's3', n: 3, title: 'Impact', lab: 'impact', ch: ['15'], topics: ['impact'], home: true },
    { id: 's4', n: 4, title: 'Oblique impact', lab: 'impact', ch: ['15'], topics: ['oblique', 'impact'] },
    { id: 's5', n: 5, title: 'Angular momentum', lab: null, ch: ['15'], topics: ['angular'] },
    { id: 's6', n: 6, title: 'A rocket', lab: 'rocket', ch: ['15'], topics: ['rocket'], home: true },
    { id: 's7', n: 7, title: 'Application: a bicycle helmet', lab: 'helmet', ch: ['15'], topics: ['impulse'], problems: ['u4.15.helmet'], home: true },
    { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
