export default {
  id: 'poisson',
  title: 'Poisson’s ratio and three-dimensional Hooke’s law',
  label: ['Poisson, 3D', 'Hooke’s law'],
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`\varepsilon_x = \frac1E\left[\sigma_x - \nu(\sigma_y + \sigma_z)\right], \qquad \nu = -\frac{\varepsilon_\text{lat}}{\varepsilon_\text{long}}`,
  idea: String.raw`A bar stretched one way thins the other two. Poisson's ratio is how much, and it makes a stress in one direction change the strain in the others. A strain gauge reads strain along one line, not stress, so turning a reading into stress needs the strains in the other directions too. Rosettes of three gauges recover the whole in-plane strain.`,
  requires: ['stress-strain'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 13: Multiaxial strain and multiaxial stress-strain relationships',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec13/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Generalized Hooke’s law built up direction by direction.',
    },
    {
      title: 'MIT 3.11, calendar: Constitutive relations (18)',
      url: 'https://ocw.mit.edu/courses/3-11-mechanics-of-materials-fall-1999/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'Where the course’s reading (Roylance) treats isotropic constitutive laws.',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'poisson', notes: ['s3'], note: 'A stretched bar thinning sideways, and its volume change against ν.' },
    { course: 'egn3331', lab: 'strain3', notes: ['s4', 's5'], note: 'A second stress changes the strain in the first direction.' },
    { course: 'egn3331', lab: 'gauges', notes: ['s6', 's7', 's8'], note: 'Strain gauges on a propane cylinder: what each reads, and the stress it does not name.' },
  ],
};
