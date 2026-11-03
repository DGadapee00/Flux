export default {
  id: 'triple-integrals',
  title: 'Triple integrals',
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`\iiint_E f\,dV = \int\!\!\int\!\!\int f(x,y,z)\,dz\,dy\,dx`,
  idea: String.raw`The same idea one dimension up: cut a solid into small boxes, weight each by the function, and add. With \(f = 1\) it is the volume; with \(f\) a density it is the mass. Integrate one variable at a time, sweeping a plane through the solid.`,
  requires: ['double-integrals'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §5.4 Triple integrals',
      url: 'https://openstax.org/books/calculus-volume-3/pages/5-4-triple-integrals',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Limits for general solids, with sketches of each projection.',
    },
    {
      title: 'MIT 18.02SC, Part A: Triple integrals',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/4.-triple-integrals-and-surface-integrals-in-3-space/part-a-triple-integrals/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Mass, centre of mass and moment of inertia as triple integrals.',
    },
  ],
  labs: [
    { course: 'mac2313', lab: 'triple', note: 'Sweep a plane through a solid and add up its cubes.' },
  ],
};
