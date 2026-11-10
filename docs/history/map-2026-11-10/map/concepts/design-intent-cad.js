export default {
  id: 'design-intent-cad',
  title: 'Design intent and parametric CAD',
  label: ['Design intent', 'in CAD'],
  subject: 'design',
  courses: ['design'],
  eq: String.raw`\begin{gathered}\text{sketch} + \text{constraints} + \text{dimensions} \\ \to \text{features} \to \text{part}\end{gathered}`,
  idea: 'A parametric model is a recipe, not a shape. Each sketch is fully constrained by relations and dimensions, and each feature builds on the ones before it. Choose which dimensions drive the part from what matters to its function, and name them, so that changing one updates everything that depends on it. A model built this way survives design changes; one built by eye breaks when an early feature moves.',
  requires: ['design-process'],
  sources: [
    {
      title: 'MIT 2.007, Lecture 4: Sketching and drawings',
      url: 'https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/resources/mit2_007s09_lec04/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Communicating parts by sketch and working drawing, the start of a CAD workflow.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Solid modeling',
      url: 'https://en.wikipedia.org/wiki/Solid_modeling',
      kind: 'Reference',
      level: 'Deeper',
      why: 'Parametric and feature-based modelling, constraints, and design intent.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'intent', notes: ['s3'], note: 'One plate drawn four ways in a sketch, then edited: only the one dimensioned by intent keeps its sensor lined up. It shows sketch-level intent, not feature order.' },
  ],
};
