export default {
  id: 'failure-theories',
  title: 'Yielding and fracture',
  label: ['Failure', 'theories'],
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`\sigma_\text{vM} = \sqrt{\sigma_1^2 - \sigma_1\sigma_2 + \sigma_2^2} \le \sigma_Y, \qquad \tau_\text{max} \le \frac{\sigma_Y}{2}\ \text{(Tresca)}`,
  idea: String.raw`A ductile metal yields when shear distortion is large enough, so Tresca and von Mises compare a combined stress with the tension-test yield. A brittle metal breaks when the largest tension is large enough, so it fails on a different plane. Twist a steel bar and it shears straight across; twist cast iron and it snaps on a 45 degree helix.`,
  requires: ['stress-transformation'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 18: Failure of materials and examples',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec17/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Tresca, von Mises and brittle criteria with examples.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.001, Lecture 17: Stress and strain transformations',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec16/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The principal stresses the criteria are written in.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'fracture', notes: ['s8', 's9'], note: 'Gray iron against steel in torsion: different planes, different rules.' },
  ],
};
