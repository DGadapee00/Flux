export default {
  id: 'stress-on-a-section',
  title: 'Stress on a cut',
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`\sigma = \frac PA, \qquad \tau_\text{avg} = \frac VA, \qquad \text{FS} = \frac{\sigma_\text{fail}}{\sigma_\text{allow}}`,
  idea: String.raw`Cut a loaded member and the internal force spreads over the cut as stress. Across the cut it is normal stress; along it, shear. The same bar shows different stresses on different planes: an axial load puts its largest shear at 45 degrees. A pin in double shear is cut on two planes, so it carries half the stress. Designs keep stress below the failure value by a factor of safety.`,
  requires: ['static-equilibrium'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 8: Uniaxial loading and material properties',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec8/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Average stress in bars and connections, set up from cuts.',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §12.3 Stress, strain, and elastic modulus',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/12-3-stress-strain-and-elastic-modulus',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Tensile and shear stress defined on simple members.',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'cut', notes: ['s2', 's1', 's3'], note: 'A bar cut at any angle: normal and shear stress on the plane, with the shear largest at 45°.' },
    { course: 'egn3331', lab: 'truss-stress', notes: ['s4', 's7'], note: 'Stress in a Pratt truss’s members, against an allowable stress.' },
    { course: 'egn3331', lab: 'pins', notes: ['s5'], note: 'A pin in single and double shear, with bearing on the plate.' },
    { course: 'egn3331', lab: 'shackle', notes: ['s6'], note: 'A rated shackle: the bow pin is in double shear, and the proof load doubles the stress.' },
  ],
};
