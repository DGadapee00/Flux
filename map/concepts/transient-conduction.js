export default {
  id: 'transient-conduction',
  title: 'Transient conduction',
  label: ['Transient', 'conduction'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`\frac{T - T_\infty}{T_i - T_\infty} \approx C_1\,e^{-\lambda_1^2\,\text{Fo}}\cos\!\left(\lambda_1\frac{x}{L}\right), \qquad \text{Fo} = \frac{\alpha t}{L^2}, \quad \text{Bi} = \frac{hL}{k}`,
  idea: String.raw`When the Biot number is not small, the inside of a body lags its surface and the lumped model fails. Separation of variables solves the heat equation in a slab, cylinder or sphere as a series of decaying modes. Higher modes decay much faster, so after a short time the first term alone is accurate. Two numbers set the answer: Bi, the inside resistance against the surface one, and the Fourier number, time measured in units of \(L^2/\alpha\). A thick part takes four times as long to cool as one half its thickness.`,
  requires: ['lumped', 'fourier-series'],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapter 5 solves the slab, cylinder and sphere and gives one-term charts.',
    },
    {
      title: 'MIT 2.51, calendar: Transient conduction (session 6)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Follows lumped capacity, the case it extends.',
    },
  ],
  labs: [],
  candidate: 'Cool a steel and a plastic slab of the same size, with centre and surface temperatures plotted. It corrects the idea that the whole part cools together: with a large Biot number the surface is cold while the centre is still hot, which is what cracks a quenched part.',
};
