export default {
  id: 'stress-transformation',
  title: 'Stress transformation and Mohr’s circle',
  label: ['Mohr’s circle'],
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`\sigma_{1,2} = \frac{\sigma_x + \sigma_y}{2} \pm \sqrt{\left(\frac{\sigma_x - \sigma_y}{2}\right)^2 + \tau_{xy}^2}`,
  idea: String.raw`The stresses on an element depend on how it is turned. Turning it by \(\theta\) moves its point round Mohr's circle by \(2\theta\). The circle's ends are the principal stresses, on planes with no shear, and its radius is the largest in-plane shear. Bending and torsion together meet at the outer fibre, where the principal stress is neither of them alone.`,
  requires: ['stress-on-a-section'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 16: Stress transformations and principal stress',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec15/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The transformation equations and Mohr’s circle derived.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 3.11, calendar: Tensor transformations, Mohr’s circle (17)',
      url: 'https://ocw.mit.edu/courses/3-11-mechanics-of-materials-fall-1999/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'The tensor view, from the course’s reading.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'mohr', notes: ['s1', 's2', 's3', 's4', 's5'], note: 'Turn the element and watch its point move round the circle by twice the angle.' },
    { course: 'egn3331', lab: 'combined', notes: ['s6'], note: 'Bending and torsion at the outer fibre: principal stress and von Mises.' },
    { course: 'egn3331', lab: 'hitch', notes: ['s7'], note: 'A trailer-ball shank: two loads add on one side and subtract on the other.' },
  ],
};
