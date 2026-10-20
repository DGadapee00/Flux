/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'Particle kinematics',
  chapters: '1, 12',
  file: 'u1-particle-kinematics.html',
  load: () => import('../content/u1-particle-kinematics.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Units and significant figures', lab: null, ch: ['1'], topics: ['units', 'sig-figs', 'homogeneity'] },
    { id: 's2', n: 2, title: 'Rectilinear motion', lab: 'rectilinear', ch: ['12'], topics: ['rectilinear', 'distance', 'separation'], home: true },
    { id: 's3', n: 3, title: 'Erratic graphs', lab: 'rectilinear', ch: ['12'], topics: ['erratic'] },
    { id: 's4', n: 4, title: 'Projectile motion', lab: null, ch: ['12'], topics: ['projectile'] },
    { id: 's5', n: 5, title: 'Normal and tangential components', lab: 'path-nt', ch: ['12'], topics: ['normal-tangential'], home: true },
    { id: 's6', n: 6, title: 'Relative motion, translating axes', lab: 'relative', ch: ['12'], topics: ['relative'], home: true },
    { id: 's7', n: 7, title: 'Application: a train between stations', lab: 'train', ch: ['12'], topics: ['erratic'], problems: ['u1.12.train', 'u1.12.at-top'], home: true },
    { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
