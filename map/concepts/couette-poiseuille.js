export default {
  id: 'couette-poiseuille',
  title: 'Couette and Poiseuille flow',
  label: ['Couette and', 'Poiseuille flow'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`u(r) = \frac{\Delta p}{4\mu L}\left(R^2 - r^2\right), \qquad Q = \frac{\pi R^4}{8\mu L}\,\Delta p`,
  idea: String.raw`In a long straight channel the flow is the same at every station, so the Navier–Stokes equations shrink to one ordinary differential equation across the gap. A moving wall drags fluid along in a straight-line profile: Couette flow, the oil film in a journal bearing. A pressure drop pushes fluid through a pipe in a parabola: Poiseuille flow. Integrate the parabola and the flow rate goes as \(R^4\), so a small change in radius makes a large change in flow.`,
  requires: ['navier-stokes'],
  related: [
    {
      id: 'current-resistance',
      note: String.raw`Laminar flow is linear like Ohm's law: \(\Delta p = R_\text{hyd}Q\), with \(R_\text{hyd} = 8\mu L/\pi R^4\).`,
    },
  ],
  sources: [
    {
      title: 'MIT 2.06, calendar: Lectures 10 and 11, Navier–Stokes examples',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Bearings and laminar pipe flow are the course’s first exact solutions.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §14.7 Viscosity and turbulence',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/14-7-viscosity-and-turbulence',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Poiseuille’s law and the fourth-power dependence on radius, with blood-flow examples.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3015', lab: 'pipe', notes: ['s5'], note: 'Oil pushed down a tube: twice the radius carries sixteen times the flow. A slot shows h³, and the Reynolds number shows where the laminar answer ends.' },
  ],
};
