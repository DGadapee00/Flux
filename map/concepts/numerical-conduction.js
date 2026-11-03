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
    },
    {
      title: 'MIT 2.51, calendar: Multidimensional conduction, numerical simulation (sessions 8 and 9)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The two sessions that close the conduction part of the course.',
    },
  ],
  labs: [],
  candidate: 'Relax a 2D plate on a grid you can refine, and step a transient with a time-step slider. It corrects the idea that a smaller grid with the same time step is always more accurate: past the stability limit the solution oscillates and blows up.',
};
