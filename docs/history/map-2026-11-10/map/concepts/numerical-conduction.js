export default {
  id: 'numerical-conduction',
  title: 'Multidimensional and numerical conduction',
  label: ['Numerical', 'conduction'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`T_{i,j}^{\,n+1} = T_{i,j}^{\,n} + \text{Fo}_\Delta\left(T_{i+1,j} + T_{i-1,j} + T_{i,j+1} + T_{i,j-1} - 4T_{i,j}\right)^n, \qquad \text{Fo}_\Delta \le \tfrac14`,
  idea: String.raw`Real parts have corners and holes, so the heat equation has no neat solution. Put the body on a grid and replace each derivative with a difference between neighbouring nodes. In steady 2D conduction each node settles to the mean of its four neighbours. In a transient, stepping forward in time is Euler's method on every node at once. The explicit step is stable only if the grid Fourier number stays at or below \(1/4\) in 2D, so a finer grid forces much smaller time steps.`,
  requires: ['heat-equation', 'euler-method'],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapters 4 and 5 cover shape factors and finite-difference solutions.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.51, calendar: Multidimensional conduction, numerical simulation (lectures 8 and 9)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The two lectures that close the conduction part of the course.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml4140', lab: 'grid', notes: ['s10'], note: 'The explicit scheme on a copper rod with sliders for cells and time step: at Δt = 30 ms, 20 cells are stable but 40 cells push Fo past ½ and the finest mode blows up. The run is checked exactly against each mode’s growth factor.' },
  ],
};
