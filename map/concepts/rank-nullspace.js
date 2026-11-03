export default {
  id: 'rank-nullspace',
  title: 'Rank, null space and solvability',
  label: ['Rank and', 'null space'],
  subject: 'linalg',
  courses: ['egn3203'],
  eq: String.raw`\operatorname{rank}A + \dim N(A) = n, \qquad A\mathbf x = \mathbf b \text{ solvable} \iff \mathbf b \in C(A), \qquad \mathbf x = \mathbf x_p + \mathbf x_n`,
  idea: String.raw`The rank is the number of pivots elimination finds: how many independent directions the columns really span. That span is the column space, and \(A\mathbf x = \mathbf b\) has a solution only when \(\mathbf b\) lies in it. The null space holds every \(\mathbf x\) that \(A\) sends to zero. Add any of them to one solution and you get another, so a nonzero null space means many answers. Rank plus the null space's dimension always equals the number of unknowns.`,
  requires: ['gaussian-elimination'],
  sources: [
    {
      title: 'Margalit and Rabinoff, Interactive Linear Algebra',
      url: 'https://textbooks.math.gatech.edu/ila/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Column space, null space and the rank theorem, each with a picture.',
    },
    {
      title: 'MIT 18.06SC Linear Algebra, Fall 2011',
      url: 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/',
      kind: 'Course',
      level: 'Course level',
      why: 'Unit I builds the four subspaces that decide when a system can be solved.',
    },
  ],
  labs: [],
  candidate: 'Tilt three planes until two of the equations agree. It corrects the idea that three equations in three unknowns always fix one answer: dependent rows leave a whole line of solutions, or none at all.',
};
