export default {
  id: 'trusses-frames',
  title: 'Trusses, frames and machines',
  label: ['Trusses and', 'frames'],
  subject: 'mechanics',
  courses: ['statics'],
  eq: String.raw`\text{each joint: } \sum F_x = \sum F_y = 0, \qquad m + r = 2j\ \text{(determinate plane truss)}`,
  idea: String.raw`A truss is two-force members pinned at joints, so each member only pulls or pushes along itself. Solve joint by joint, or cut through the truss and take moments to reach one member directly. A frame or machine has members that carry more than two forces; pull it apart into one free-body per member and the pin forces appear, equal and opposite. A shallow truss carries big chord forces even under modest loads.`,
  requires: ['static-equilibrium'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 3: Applying the equations of equilibrium, planar trusses',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec3/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The method of joints and determinacy.',
    },
    {
      title: 'Engineering Statics: Open and Interactive (Baker and Haynes)',
      url: 'https://engineeringstatics.org/',
      kind: 'Free textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'Trusses, frames and machines with interactive examples.',
    },
  ],
  labs: [
    { course: 'statics', lab: 'truss', notes: ['s2'], note: 'Plane trusses by joints and sections, with the residual at every joint.' },
    { course: 'statics', lab: 'frame', notes: ['s3'], note: 'An A-frame, a wall bracket and pliers, exploded into members to show the pin forces.' },
    { course: 'statics', lab: 'gantry', notes: ['s4'], note: 'A highway sign truss: depth lowers the chord forces, not the reactions.' },
    { course: 'statics', lab: 'jack', note: 'A scissor jack needs its greatest screw force when it is low.' },
  ],
};
