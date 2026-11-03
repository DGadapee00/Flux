export default {
  id: 'navier-stokes',
  title: 'Navier–Stokes equations',
  label: ['Navier–Stokes'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`\rho\,\frac{D\mathbf v}{Dt} = -\nabla p + \mu\,\nabla^2\mathbf v + \rho\,\mathbf g, \qquad \nabla\cdot\mathbf v = 0`,
  idea: String.raw`Add viscous shear to Euler's equation. In an incompressible Newtonian fluid, continuity lets the net viscous force on a parcel collapse to \(\mu\nabla^2\mathbf v\). That term spreads momentum from fast fluid to slow, as conduction spreads heat. With the no-slip condition at walls, the equations fix the flow. Exact solutions exist only for simple shapes; everything else is scaling, approximation or a computer.`,
  requires: ['euler-equations', 'viscosity', 'continuity'],
  related: [
    {
      id: 'heat-equation',
      note: String.raw`The viscous term \(\nu\nabla^2\mathbf v\) diffuses momentum as \(\alpha\nabla^2T\) diffuses heat.`,
    },
  ],
  sources: [
    {
      title: 'MIT 2.06, calendar: Lecture 9, viscous fluids and the Navier–Stokes equation',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The lecture that adds the viscous term, followed by three lectures of solutions.',
    },
    {
      title: 'Cleynen, Fluid Dynamics for Engineers',
      url: 'https://fluidmech.ninja/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Derives the equations term by term and solves the standard laminar cases.',
    },
  ],
  labs: [],
  candidate: 'Start a wall moving under still fluid and watch the velocity spread upward. It corrects the idea that viscosity acts everywhere at once: momentum diffuses in from the wall over a depth of order \\(\\sqrt{\\nu t}\\), as heat does.',
};
