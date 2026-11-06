export default {
  id: 'pressure-vessels',
  title: 'Thin-walled pressure vessels',
  label: ['Pressure', 'vessels'],
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`\sigma_\text{hoop} = \frac{pr}{t}, \qquad \sigma_\text{long} = \frac{pr}{2t}, \qquad \sigma_\text{sphere} = \frac{pr}{2t}`,
  idea: String.raw`Cut a thin closed cylinder along its length and the pressure on the cut half must be held by the two walls: that gives the hoop stress. Cut it across and the end cap's push gives the longitudinal stress, half as large. A sphere is the same in every direction, so it needs half the wall of a cylinder for the same pressure.`,
  requires: ['stress-on-a-section', 'pressure'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 15: Thin-walled pressure vessels',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec14/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Hoop and axial stress from free-body cuts.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 3.11, calendar: Pressure vessel stresses and deformations (10)',
      url: 'https://ocw.mit.edu/courses/3-11-mechanics-of-materials-fall-1999/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'Where the course’s reading treats vessels, including deformation.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'vessel', notes: ['s1', 's2'], note: 'A closed cylinder against a sphere at the same pressure and wall.' },
    { course: 'egn3331', lab: 'tank', notes: ['s3'], note: 'A 20 lb propane cylinder at its service pressure.' },
  ],
};
