export default {
  id: 'stress-concentration',
  title: 'Stress concentration',
  label: ['Stress', 'concentration'],
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`\sigma_\text{max} = K_t\,\sigma_\text{nom}, \qquad K_t = 1 + 2\sqrt{\frac a\rho}\ \text{(elliptical hole)}`,
  idea: String.raw`Stress flowing round a hole or notch crowds at its edge. How much depends on how sharp the edge is across the load, not on the hole's size. A crack is a very sharp notch, so the peak is enormous; drilling a round hole at its tip blunts it and stops it growing.`,
  requires: ['stress-on-a-section'],
  sources: [
    {
      title: 'MIT 3.11, calendar: Experimental stress analysis (24)',
      url: 'https://ocw.mit.edu/courses/3-11-mechanics-of-materials-fall-1999/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'Where the course’s reading measures stress raisers.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.001, Lecture 18: Failure of materials and examples',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec17/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Stress raisers in the context of failure.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'crack', notes: ['s8', 'u9/s8'], note: 'A crack in a skin panel, stop-drilled to blunt its tip.' },
  ],
};
