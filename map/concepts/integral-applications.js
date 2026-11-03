export default {
  id: 'integral-applications',
  title: 'Areas, volumes and work',
  label: ['Areas, volumes', 'and work'],
  subject: 'calculus',
  courses: ['mac2311'],
  eq: String.raw`V = \int_a^b \pi\,r(x)^2\,dx, \qquad V = \int_a^b 2\pi x\,h(x)\,dx`,
  idea: String.raw`Slice, approximate one slice, add. A solid of revolution cut across its axis gives disks; cut along it gives shells. Both must name the same volume. The same recipe gives the area between curves, the work to pump a tank and the centre of mass of a plate: decide what one thin piece contributes, then integrate.`,
  requires: ['fundamental-theorem'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 1, §6.2 Determining volumes by slicing',
      url: 'https://openstax.org/books/calculus-volume-1/pages/6-2-determining-volumes-by-slicing',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Disks and washers, with the slice drawn each time.',
    },
    {
      title: 'OpenStax Calculus Vol. 1, §6.5 Physical applications',
      url: 'https://openstax.org/books/calculus-volume-1/pages/6-5-physical-applications',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Mass, work and force from the same slice-and-add idea.',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'solids', notes: ['s7', 's8', 's6', 's9'], note: 'One solid sliced into disks and into shells; the two volumes agree.' },
    { course: 'mac2311', lab: 'spheroid', note: 'A stack of disks against a spheroid’s exact volume.' },
    { course: 'mac2311', lab: 'riemann', notes: ['s10'], note: 'Rectangles under a curve, the same sums a centre of mass is built from.' },
  ],
};
