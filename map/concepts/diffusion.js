export default {
  id: 'diffusion',
  title: 'Diffusion and Fick’s laws',
  label: ['Diffusion'],
  subject: 'matsci',
  courses: ['ema3010', 'eml4140'],
  eq: String.raw`J = -D\,\nabla C, \qquad \frac{\partial C}{\partial t} = D\,\nabla^2 C, \qquad D = D_0\exp\!\left(-\frac{Q_d}{RT}\right)`,
  idea: String.raw`Atoms hop between sites, mostly into vacancies, and more hop down a concentration gradient than up it. The net flux is \(-D\) times the gradient: Fick's first law, the same form as Fourier's law with concentration in place of temperature. Conserve atoms in a small volume, as the heat equation conserves energy, and the divergence theorem gives Fick's second law, the heat equation with \(D\) in place of the thermal diffusivity \(\alpha\). So depth grows as \(\sqrt{Dt}\), and \(D\) rises steeply with temperature because each hop needs a vacancy and an energy barrier.`,
  requires: ['point-defects', 'gradient', 'divergence-theorem'],
  related: [
    {
      id: 'heat-equation',
      note: String.raw`Fick's second law has the heat equation's form: concentration for temperature, \(D\) for \(\alpha\).`,
    },
  ],
  sources: [
    {
      title: 'MIT 3.091, Recitation 26: Steady state diffusion',
      url: 'https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/resources/mit3_091f18_rec26/',
      kind: 'Recitation notes',
      level: 'Course level',
      why: 'Fick’s first law and steady flux, worked as the course does.',
      checked: '2026-11-06',
    },
    {
      title: 'DoITPoMS, Diffusion (University of Cambridge)',
      url: 'https://www.doitpoms.ac.uk/tlplib/diffusion/index.php',
      kind: 'Teaching package',
      level: 'Course level',
      why: 'Both of Fick’s laws, the error-function solution and the atomic mechanisms.',
      checked: '2026-11-06',
    },
  ],
  labs: [],
  candidate: 'Carburize a steel surface and watch the carbon profile deepen with time. It corrects the idea that twice the time gives twice the depth: depth grows with the square root of time.',
};
