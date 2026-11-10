export default {
  id: 'buckling',
  title: 'Buckling of columns',
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`P_\text{cr} = \frac{\pi^2EI}{(KL)^2}, \qquad \sigma_\text{max} = \frac PA\left[1 + \frac{ec}{r^2}\sec\left(\frac{L}{2r}\sqrt{\frac{P}{EA}}\right)\right]`,
  idea: String.raw`A slender column under compression can bow sideways at a load far below its crushing strength. Euler's load falls with the square of the effective length and follows the weak axis. Once that load would push the stress past yield, yielding governs instead. Real columns fail sooner still: a load off the axis bends them from the start, which the secant formula measures.`,
  requires: ['beam-deflection'],
  sources: [
    {
      title: 'Euler’s critical load (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Euler%27s_critical_load',
      kind: 'Reference article',
      level: 'Course level',
      why: 'The derivation and the effective-length factors in one place.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.001, Lecture 22: Beam deflection',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec20/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The elastic-curve equation that buckling solves as an eigenvalue problem.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'buckling', notes: ['s1', 's2'], note: 'Euler’s load against effective length, the weak axis and yield.' },
    { course: 'egn3331', lab: 'column', notes: ['s3'], note: 'A listed basement column checked at its Euler load and its allowable.' },
    { course: 'egn3331', lab: 'posts', notes: ['s4', 's5'], note: 'Deck posts loaded off centre: the secant formula and the tangent modulus.' },
  ],
};
