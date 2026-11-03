export default {
  id: 'reynolds-transport',
  title: 'Reynolds transport theorem',
  label: ['Reynolds', 'transport'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`\frac{dB_\text{sys}}{dt} = \frac{d}{dt}\int_\text{CV}\rho b\,dV + \int_\text{CS}\rho b\,(\mathbf v\cdot\mathbf n)\,dA`,
  idea: String.raw`The laws of physics are written for a fixed lump of matter, a system. A fluid machine is easier to study as a fixed region, a control volume, that matter flows through. The theorem links the two: the system's rate of change is what builds up inside the region plus the net flux of the property out through its surface. Put mass in for \(B\) and it is the mass balance; momentum and energy follow the same way.`,
  requires: ['mass-cv'],
  sources: [
    {
      title: 'MIT 2.06, Lecture notes: Control volume formulation',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/resources/mit2_06s13_notes_lens/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Builds the control-volume balances from a system in the course’s own notation.',
    },
    {
      title: 'Cleynen, Fluid Dynamics for Engineers',
      url: 'https://fluidmech.ninja/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'The integral balances for mass, momentum and energy, with worked control volumes.',
    },
  ],
  labs: [],
  candidate: 'Drag a fixed control volume through a flow while a dyed blob of fluid passes through it. It corrects the idea that a control volume follows the fluid: the blob is the system, the box stays put, and the flux term is the difference.',
};
