export default {
  id: 'view-factors',
  title: 'View factors',
  label: ['View factors'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`F_{12} = \frac{1}{A_1}\int_{A_1}\!\int_{A_2}\frac{\cos\theta_1\cos\theta_2}{\pi R^2}\,dA_2\,dA_1, \qquad A_1F_{12} = A_2F_{21}, \qquad \sum_j F_{ij} = 1`,
  idea: String.raw`Of the radiation leaving one surface, the view factor is the fraction that lands on another. It depends only on geometry: the area each patch presents to the other and the distance between them, integrated over both. Reciprocity, \(A_1F_{12} = A_2F_{21}\), and the rule that the fractions from one surface sum to 1 fill in most factors from a few known ones. A flat or convex surface cannot see itself, so its self factor is zero.`,
  requires: ['thermal-radiation', 'double-integrals'],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapter 10 derives the view factor and its algebra, with a catalogue of shapes.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.51, calendar: View factors (lecture 22)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course’s lecture on geometry in radiation.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, View factor',
      url: 'https://en.wikipedia.org/wiki/View_factor',
      kind: 'Reference',
      level: 'Intro',
      why: 'The definition, reciprocity, summation and the Nusselt unit-sphere picture.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml4140', lab: 'viewfactor', notes: ['s3'], note: 'Two long strips you move, resize and tilt, with rays fired and counted: a narrow strip sends 70% of its radiation to a wide one that sends back 14%, while w₁F₁₂ = w₂F₂₁. Crossed strings checked against the double integral.' },
  ],
};
