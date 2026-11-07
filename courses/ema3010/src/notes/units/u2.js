/** Unit 2 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u2',
  title: 'Defects',
  chapters: '2',
  file: 'u2-defects.html',
  load: () => import('../content/u2-defects.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Vacancies in equilibrium', lab: 'vacancy', ch: ['2'], topics: ['vacancy'], home: true },
    { id: 's2', n: 2, title: 'Diffusion', lab: 'diffusion', ch: ['2'], topics: ['diffusion'], home: true },
    { id: 's3', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
