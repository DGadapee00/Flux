export default {
  id: 'axial-deformation',
  title: 'Axial deformation and indeterminate bars',
  label: ['Axial', 'deformation'],
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`\delta = \sum\frac{N_iL_i}{A_iE_i}, \qquad \sigma_\text{thermal} = E\alpha\,\Delta T\ \text{(fully restrained)}`,
  idea: String.raw`A bar stretches by \(NL/AE\) piece by piece, so its internal-force diagram, not the end load alone, sets how far it moves. When supports outnumber the equilibrium equations, the bar is indeterminate, and compatibility supplies the missing equation: the parts must fit together. Held between walls, the stiffer side takes more load, and a heated rail builds stress \(E\alpha\Delta T\) whatever its length.`,
  requires: ['stress-strain', 'stress-on-a-section'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 7: Force-deformation relationships and static indeterminacy',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec7/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Compatibility as the third ingredient beside equilibrium and material law.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.001, Lecture 15: Stress-strain-temperature relationships and thin-walled pressure vessels',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec14/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Thermal strain added to the force-deformation relation.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'axial', notes: ['s1', 's2'], note: 'Stepped and tapered bars: the displacement as a running sum of NL/AE.' },
    { course: 'egn3331', lab: 'indeterminate', notes: ['s4'], note: 'A bar between two walls shares a load in proportion to stiffness.' },
    { course: 'egn3331', lab: 'rail', notes: ['s6', 's7'], note: 'A welded rail stressed by heat, and a joint gap that must close first.' },
    { course: 'egn3331', lab: 'bridle', notes: ['s3', 's5'], note: 'A hoist bridle as a truss joint: the hook moves where every leg’s stretch agrees.' },
  ],
};
