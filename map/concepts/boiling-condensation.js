export default {
  id: 'boiling-condensation',
  title: 'Boiling and condensation',
  label: ['Boiling and', 'condensation'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`q'' = h\,(T_s - T_\text{sat}), \qquad \overline{h}_\text{film} \propto \left[\frac{g\,\rho_l(\rho_l - \rho_v)\,h_{fg}\,k_l^3}{\mu_l\,(T_\text{sat} - T_s)\,L}\right]^{1/4}`,
  idea: String.raw`When a fluid changes phase at a surface, the latent heat carries far more energy than warming does, so \(h\) can be hundreds of times larger. A film of condensate on a cold wall is the main resistance, and Nusselt's analysis treats it as a thin falling layer. In boiling, bubbles stir the liquid at the wall and the heat flux climbs steeply with wall superheat. At a critical flux a vapour blanket forms, the flux drops, and an electrically heated wire can melt.`,
  requires: ['convection', 'phases'],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapter 9 covers film condensation, the boiling curve and the burnout flux.',
    },
    {
      title: 'MIT 2.51, calendar: Condensation (session 18)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'The course’s session on phase change at a wall.',
    },
  ],
  labs: [],
  candidate: 'Walk up the boiling curve of water by raising the wall temperature. It corrects the idea that a hotter wall always boils faster: past the critical flux a vapour film insulates it and the flux falls.',
};
