export default {
  id: 'nodal-analysis',
  title: 'Node and mesh analysis',
  label: ['Node and mesh', 'analysis'],
  subject: 'circuits',
  courses: ['eel3111'],
  eq: String.raw`G\,\mathbf v = \mathbf i_s, \qquad G_{kk} = \sum \frac{1}{R}\ \text{at node } k, \quad G_{kj} = -\frac{1}{R_{kj}}; \qquad R\,\mathbf i = \mathbf v_s\ \text{(mesh)}`,
  idea: String.raw`Pick one node as ground and give every other node an unknown voltage. Kirchhoff's current law at each node, with Ohm's law for each branch, gives one linear equation per node, so the whole circuit becomes \(G\mathbf v = \mathbf i_s\). Mesh analysis does the same with loop currents and the voltage law. Choose the method with fewer unknowns: nodes minus one, or independent loops. A voltage source between two nodes joins them into a supernode; a current source shared by two meshes makes a supermesh. Either way the circuit is a matrix problem, solved by elimination.`,
  requires: ['kirchhoff', 'gaussian-elimination'],
  related: [
    {
      id: 'numerical-conduction',
      note: String.raw`A grid of equal resistors solved by nodes is the finite-difference conduction grid: each node sits at its neighbours' mean.`,
    },
  ],
  sources: [
    {
      title: 'MIT 6.002, calendar: Lecture 2, KVL, KCL and nodal analysis',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course reaches the node method in its second lecture, before any theorem.',
      checked: '2026-11-06',
    },
    {
      title: 'Kuphaldt, Lessons in Electric Circuits, Vol. I: DC',
      url: 'https://www.allaboutcircuits.com/textbook/direct-current/',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Branch current, mesh current and node voltage methods, each worked on one network.',
    },
  ],
  labs: [
    { course: 'eel3111', lab: 'nodes', notes: ['s1', 's2', 's3'], note: 'One circuit solved by node voltages and by mesh currents, with both matrices: two rails need one nodal equation and three mesh equations, a single loop the reverse.' },
  ],
};
