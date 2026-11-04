/**
 * The UNF MAP 2302 schedule, section by section, and where each section is taught in this app.
 * The schedule follows Nagle, Saff and Snider, Fundamentals of Differential Equations, 9th ed.
 * Only section numbers and our own short titles are recorded here. No text from the book.
 * The class dates change each term, so none are stored. spine.test.mjs checks every entry.
 */
export const SYLLABUS = Object.freeze({
  course: 'MAP 2302 at UNF',
  book: 'Nagle, Saff and Snider, Fundamentals of Differential Equations, 9th ed. (2018)',
  sections: [
    { sec: '1.1', title: 'Background', unit: 'u1', notes: ['s1'], lab: 'slope-field' },
    { sec: '1.2', title: 'Solutions and initial value problems', unit: 'u1', notes: ['s1', 's3'], lab: 'slope-field' },
    { sec: '2.2', title: 'Separable equations', unit: 'u1', notes: ['s2'], lab: 'slope-field' },
    { sec: '2.3', title: 'Linear equations', unit: 'u1', notes: ['s5', 's10'], lab: 'slope-field' },
    { sec: '2.4', title: 'Exact equations', unit: 'u1', notes: ['s12'], lab: 'exact-substitution' },
    { sec: '2.6', title: 'Substitutions and transformations', unit: 'u1', notes: ['s13'], lab: 'exact-substitution' },
    { sec: '3.2', title: 'Compartmental analysis', unit: 'u1', notes: ['s5', 's14'], lab: 'first-order-models' },
    { sec: '3.3', title: 'Heating and cooling of buildings', unit: 'u1', notes: ['s9', 's14'], lab: 'first-order-models' },
    { sec: '3.4', title: 'Newtonian mechanics', unit: 'u1', notes: ['s14'], lab: 'first-order-models' },
    { sec: '4.2', title: 'Homogeneous linear equations: the general solution', unit: 'u2', notes: ['s1'], lab: 'oscillator' },
    { sec: '4.3', title: 'Auxiliary equations with complex roots', unit: 'u2', notes: ['s1', 's2'], lab: 'oscillator' },
    { sec: '4.4', title: 'Nonhomogeneous equations: undetermined coefficients', unit: 'u2', notes: ['s3', 's5'], lab: 'resonance' },
    { sec: '4.6', title: 'Variation of parameters', unit: 'u2', notes: ['s11'], lab: 'variation' },
    { sec: '4.7', title: 'Variable-coefficient equations', unit: 'u2', notes: ['s12'], lab: 'cauchy-euler' },
    { sec: '4.9', title: 'The mass-spring oscillator', unit: 'u2', notes: ['s2', 's7', 's8'], lab: 'suspension' },
    { sec: '6.1', title: 'Basic theory of linear differential equations', unit: 'u2', notes: ['s13'], lab: 'higher-order' },
    { sec: '6.2', title: 'Homogeneous linear equations with constant coefficients', unit: 'u2', notes: ['s13'], lab: 'higher-order' },
    { sec: '6.3', title: 'Undetermined coefficients and the annihilator method', unit: 'u2', notes: ['s14'], lab: 'higher-order' },
    { sec: '6.4', title: 'Method of variation of parameters', unit: 'u2', notes: ['s14'], lab: 'variation' },
    { sec: '7.2', title: 'Definition of the Laplace transform', unit: 'u3', notes: ['s7'], lab: 'laplace' },
    { sec: '7.3', title: 'Properties of the Laplace transform', unit: 'u3', notes: ['s7', 's13'], lab: 'laplace-rules' },
    { sec: '7.5', title: 'Solving linear equations with Laplace transforms', unit: 'u3', notes: ['s8', 's9'], lab: 'laplace' },
  ],
});
