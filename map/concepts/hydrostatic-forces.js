export default {
  id: 'hydrostatic-forces',
  title: 'Forces on submerged surfaces',
  label: ['Hydrostatic', 'forces'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`F_R = \rho g\,h_c A, \qquad y_\text{cp} = y_c + \frac{I_{xc}}{y_c A}`,
  idea: String.raw`Pressure grows with depth, so a gate or a dam face carries a load that rises toward its bottom edge. Integrate \(\rho g h\) over the face and the total is the pressure at the centroid times the area. The resultant does not act at the centroid: the deeper half pushes harder, so it acts lower, by the area moment of inertia over \(y_c A\). On a curved face, take the horizontal part on the face's vertical projection and the vertical part as the weight of fluid above it.`,
  requires: ['pressure', 'centroids'],
  sources: [
    {
      title: 'MIT 2.06, calendar: Lecture 1, fluid statics and forces on surfaces',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Where the course starts: the pressure field at rest, then the force it puts on a wall.',
    },
    {
      title: 'Cleynen, Fluid Dynamics for Engineers',
      url: 'https://fluidmech.ninja/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'A free text for the whole course. Its statics chapter works plane and curved surfaces.',
    },
  ],
  labs: [],
  candidate: 'Slide a rectangular gate deeper into a tank and watch the resultant arrow. It corrects the idea that the force acts at the centroid: it acts below it, and closes in on it as the gate goes deeper.',
};
