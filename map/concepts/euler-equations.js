export default {
  id: 'euler-equations',
  title: 'Euler’s equation of motion',
  label: ['Euler’s', 'equation'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`\rho\,\frac{D\mathbf v}{Dt} = -\nabla p + \rho\,\mathbf g`,
  idea: String.raw`In rigid-body motion every parcel had the same acceleration. Let the acceleration vary from point to point, as the material derivative, and the same balance holds for any flow without friction. Pressure differences and gravity are the only forces. Integrate it along a streamline in steady flow and Bernoulli's equation comes out. Across curved streamlines it says pressure rises toward the outside of the bend.`,
  requires: ['material-derivative', 'rigid-body-fluid'],
  sources: [
    {
      title: 'MIT 2.06, Lecture notes: Differential forms',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/resources/mit2_06s13_notes_vo/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Derives the Euler equations from a force balance on a fluid element.',
    },
    {
      title: 'Cleynen, Fluid Dynamics for Engineers',
      url: 'https://fluidmech.ninja/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'The inviscid momentum equation and how Bernoulli follows from it.',
    },
  ],
  labs: [],
  candidate: 'Flow round a bend with pressure contours drawn across it. It corrects the idea that pressure is uniform across a stream: curved streamlines need higher pressure on the outside to turn the fluid.',
};
