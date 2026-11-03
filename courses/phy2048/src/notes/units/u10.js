/** Unit 10 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u10',
  title: 'Fluid mechanics',
  chapters: '14',
  file: 'u10-fluid-mechanics.html',
  load: () => import('../content/u10-fluid-mechanics.html?raw').then((m) => m.default),
  sections: [
    {
      id: 's1', n: 1, title: 'Density and pressure', lab: 'pressure-depth', ch: ['14'],
      topics: ['density', 'pressure'],
      problems: ['ch14.dam', 'ch14.concept-shape'],
      home: true,
    },
    {
      id: 's2', n: 2, title: 'Gauge and absolute pressure', lab: 'pressure-depth', ch: ['14'],
      topics: ['gauge'],
      problems: ['ch14.barometer', 'ch14.utube', 'ch14.concept-gauge'],
      home: true,
    },
    {
      id: 's3', n: 3, title: "Pascal's principle", lab: 'brake-hydraulics', ch: ['14'],
      topics: ['hydraulics'],
      problems: ['ch14.brakes', 'ch14.stroke'],
      home: true,
    },
    {
      id: 's4', n: 4, title: 'Buoyancy', lab: 'buoyancy', ch: ['14'],
      topics: ['buoyancy'],
      problems: ['ch14.woman', 'ch14.apparent', 'ch14.concept-float'],
      home: true,
    },
    {
      id: 's5', n: 5, title: 'Continuity and Bernoulli', lab: 'bernoulli', ch: ['14'],
      topics: ['continuity', 'bernoulli'],
      problems: ['ch14.nozzle', 'ch14.hose-p', 'ch14.fire', 'ch14.tank', 'ch14.concept-narrow'],
      home: true,
    },
    {
      id: 's6', n: 6, title: 'Viscosity and turbulence', lab: null, ch: ['14'],
      topics: ['viscosity'],
      problems: ['ch14.poiseuille', 'ch14.reynolds', 'ch14.concept-flow'],
    },
    { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
