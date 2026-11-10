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
      title: 'Wikipedia, Euler equations (fluid dynamics)',
      url: 'https://en.wikipedia.org/wiki/Euler_equations_(fluid_dynamics)',
      kind: 'Reference',
      level: 'Deeper',
      why: 'The incompressible and compressible forms side by side, and Bernoulli’s theorem for steady inviscid flow.',
      checked: '2026-11-06',
    },
    {
      title: 'Cleynen, Fluid Dynamics for Engineers, Appendix A4.3: The Bernoulli equation from the Navier-Stokes equation',
      url: 'https://fluidmech.ninja/appendix.pdf',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Follows one particle along its path and drops the viscous term, which is how Bernoulli comes out of the momentum equation.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3015', lab: 'bend', notes: ['s3'], note: 'Flow round a bend, with the pressure rising from the inner wall to the outer. It shows the normal part of Euler’s equation only.' },
  ],
};
