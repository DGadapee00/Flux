export default {
  id: 'cylindrical-spherical',
  title: 'Cylindrical and spherical coordinates',
  label: ['Cylindrical and', 'spherical'],
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`dV = r\,dr\,d\theta\,dz, \qquad dV = \rho^2\sin\varphi\,d\rho\,d\varphi\,d\theta`,
  idea: String.raw`Match the coordinates to the shape. Cylindrical coordinates add a height to polar; spherical ones use a distance and two angles. Each volume element carries its own factor: \(r\) for cylinders, \(\rho^2\sin\varphi\) for spheres, because a cell near the equator is larger than one near a pole.`,
  requires: ['triple-integrals', 'polar-integrals'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §5.5 Triple integrals in cylindrical and spherical coordinates',
      url: 'https://openstax.org/books/calculus-volume-3/pages/5-5-triple-integrals-in-cylindrical-and-spherical-coordinates',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Both volume elements derived, then used on cones and balls.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.02SC, Part A: Triple integrals',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/4.-triple-integrals-and-surface-integrals-in-3-space/part-a-triple-integrals/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Spherical and cylindrical integrals with full solutions.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'mac2313', lab: 'cyl', note: String.raw`One wedge: \(\Delta V = r\,\Delta r\,\Delta\theta\,\Delta z\).` },
    { course: 'mac2313', lab: 'sph', note: String.raw`An equator cell beside a pole cell, to see \(\rho^2\sin\varphi\).` },
  ],
};
