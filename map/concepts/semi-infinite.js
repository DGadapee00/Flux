export default {
  id: 'semi-infinite',
  title: 'Semi-infinite solids',
  label: ['Semi-infinite', 'solids'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`\frac{T - T_s}{T_i - T_s} = \operatorname{erf}\!\left(\frac{x}{2\sqrt{\alpha t}}\right), \qquad T_c = \frac{\sqrt{k\rho c}_A\,T_A + \sqrt{k\rho c}_B\,T_B}{\sqrt{k\rho c}_A + \sqrt{k\rho c}_B}`,
  idea: String.raw`Early in a heating, or in a body thick enough, the far side has not felt the change yet. The heat equation then has a solution that depends on \(x\) and \(t\) only through \(x/\sqrt{\alpha t}\): an error-function profile. The heated depth grows as \(\sqrt{\alpha t}\). When two such bodies touch, the contact temperature is a weighted mean, and the weight is \(\sqrt{k\rho c}\). That is why steel at room temperature feels colder than wood at the same temperature.`,
  requires: ['heat-equation'],
  related: [
    {
      id: 'diffusion',
      note: String.raw`Carburizing a steel surface gives the same error-function profile, with \(D\) in place of \(\alpha\).`,
    },
  ],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapter 5 derives the similarity solution and the contact temperature.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.51, calendar: Semi-infinite bodies (lecture 7)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course gives it its own lecture after the series solutions.',
      checked: '2026-11-06',
    },
  ],
  labs: [],
  candidate: 'Touch a hand to steel, glass and wood, all at room temperature, and read the contact temperature. It corrects the idea that metal feels cold because it is colder: it draws heat faster, because its \\(\\sqrt{k\\rho c}\\) is larger.',
};
