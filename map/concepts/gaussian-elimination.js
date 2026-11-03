export default {
  id: 'gaussian-elimination',
  title: 'Linear equations and elimination',
  label: ['Gaussian', 'elimination'],
  subject: 'linalg',
  courses: ['egn3203'],
  eq: String.raw`A\mathbf x = \mathbf b \;\longrightarrow\; U\mathbf x = \mathbf c, \qquad x_i = \frac{1}{u_{ii}}\Big(c_i - \sum_{j>i} u_{ij}x_j\Big), \qquad \text{cost} \approx \tfrac23 n^3`,
  idea: String.raw`A set of linear equations asks which mix of the columns of \(A\) makes \(\mathbf b\). Elimination subtracts multiples of one equation from the ones below it until the system is triangular, then back substitution reads off the unknowns from the bottom up. These row operations change the equations but not their solution. A zero where a pivot should be means a row swap, or that the system has no single answer. The work grows as \(n^3\), so doubling the unknowns costs eight times as much.`,
  requires: ['matrix-maps'],
  sources: [
    {
      title: 'Margalit and Rabinoff, Interactive Linear Algebra',
      url: 'https://textbooks.math.gatech.edu/ila/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Row reduction with the geometry of the planes shown alongside the algebra.',
    },
    {
      title: 'Hefferon, Linear Algebra',
      url: 'https://hefferon.net/linearalgebra/',
      kind: 'Open textbook',
      level: 'Deeper',
      why: 'Its first chapter is Gauss’s method, with proofs that it never changes the solution set.',
    },
  ],
  labs: [],
  candidate: 'Eliminate a 3×3 system one row operation at a time, with its three planes drawn. It corrects the idea that row operations change the answer: the planes tilt at every step, but they keep meeting at the same point.',
};
