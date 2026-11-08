/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'Modes and conduction',
  chapters: '1',
  file: 'u1-conduction.html',
  load: () => import('../content/u1-conduction.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'The heat equation', lab: 'rod', ch: ['1'], topics: ['heat-equation'], home: true },
    { id: 's2', n: 2, title: 'Sines that fade', lab: 'rod', ch: ['1'], topics: ['fourier-series'] },
    { id: 's3', n: 3, title: 'Stepping on a grid', lab: 'rod', ch: ['1'], topics: ['diffusion-scale'] },
    { id: 's4', n: 4, title: 'Resistances in series', lab: 'resistance', ch: ['1'], topics: ['series'], home: true },
    { id: 's5', n: 5, title: 'The critical radius', lab: 'resistance', ch: ['1'], topics: ['critical'] },
    { id: 's7', n: 6, title: 'Fins', lab: 'fin', ch: ['1'], topics: ['fins'], home: true },
    { id: 's8', n: 7, title: 'Cooling a slab', lab: 'quench', ch: ['1'], topics: ['biot'], home: true },
    { id: 's9', n: 8, title: 'Touching a cold block', lab: 'touch', ch: ['1'], topics: ['contact'], home: true },
    { id: 's10', n: 9, title: 'How large a time step', lab: 'grid', ch: ['1'], topics: ['stability'], home: true },
    { id: 's6', n: 10, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
