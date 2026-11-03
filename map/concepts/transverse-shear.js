export default {
  id: 'transverse-shear',
  title: 'Transverse shear and shear flow',
  label: ['Transverse', 'shear'],
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`\tau = \frac{VQ}{It}, \qquad q = \frac{VQ}{I}`,
  idea: String.raw`Where the moment changes along a beam, layers must slide past each other, and that takes shear. It is largest at the neutral axis and zero at the top and bottom, and in an I beam the web carries most of it. Shear flow is that shear per length; it sets the nail spacing in a built-up beam. In a thin open section the shear flow forms a couple, so the load must pass through the shear centre or the section twists.`,
  requires: ['bending-stress'],
  sources: [
    {
      title: 'MIT 3.11, calendar: Normal and shear stresses in beams (21)',
      url: 'https://ocw.mit.edu/courses/3-11-mechanics-of-materials-fall-1999/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'Where the course’s reading derives the shear formula.',
    },
    {
      title: 'MIT 2.001, Lecture 18: Pure bending',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec18/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The bending stress whose change along the beam drives the shear.',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'shear', notes: ['s1', 's2', 's3', 's6'], note: 'Shear stress over a rectangle and an I section, peaking at the neutral axis.' },
    { course: 'egn3331', lab: 'nails', notes: ['s4'], note: 'Nail spacing as capacity divided by shear flow.' },
    { course: 'egn3331', lab: 'header', notes: ['s5'], note: 'A garage box beam: the flange nails work hardest at the supports.' },
    { course: 'egn3331', lab: 'strut', notes: ['s7'], note: 'Strut channel loaded through its web twists unless the load passes the shear centre.' },
  ],
};
