export default {
  id: 'torsion',
  title: 'Torsion of shafts',
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`\tau = \frac{T\rho}{J}, \qquad \phi = \frac{TL}{GJ}, \qquad P = T\omega`,
  idea: String.raw`Twist a round shaft and its shear stress grows linearly from the centre, so the core carries little torque and a hollow shaft keeps most of its strength. The angle of twist is \(TL/GJ\), added segment by segment. A motor's power and speed set its torque. A closed thin tube resists twist through shear flow all the way round; one lengthwise slit destroys that.`,
  requires: ['stress-on-a-section', 'stress-strain'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 24: Torsion and twisting',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec22/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Shear stress and twist in circular shafts.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.001, Lecture 25: Torsion examples',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec23/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Series shafts, indeterminate shafts and power.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'torsion', notes: ['s1', 's2'], note: 'Shear stress across solid and hollow shafts.' },
    { course: 'egn3331', lab: 'twist', notes: ['s3', 's4'], note: 'Power and speed to torque, and shafts in series or held at both ends.' },
    { course: 'egn3331', lab: 'motor', notes: ['s5'], note: 'A motor shaft sized by stress, not twist.' },
    { course: 'egn3331', lab: 'tubes', notes: ['s6', 's7'], note: 'A closed tube against the same tube slit along its length.' },
  ],
};
