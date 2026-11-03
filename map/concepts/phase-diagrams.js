export default {
  id: 'phase-diagrams',
  title: 'Binary phase diagrams and the lever rule',
  label: ['Phase', 'diagrams'],
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`W_L = \frac{C_\alpha - C_0}{C_\alpha - C_L}, \qquad W_\alpha = \frac{C_0 - C_L}{C_\alpha - C_L}`,
  idea: String.raw`A binary phase diagram maps which phases are stable at each temperature and overall composition. In a two-phase region, a horizontal tie line through the alloy's point ends at the two phases' compositions. Balancing the mass of one element across both phases gives the lever rule: each phase's share is the length of the opposite arm. A eutectic is the point where a liquid freezes straight into two solids at one temperature.`,
  requires: ['phases', 'point-defects'],
  sources: [
    {
      title: 'DoITPoMS, Phase diagrams and solidification (University of Cambridge)',
      url: 'https://www.doitpoms.ac.uk/tlplib/phase-diagrams/index.php',
      kind: 'Teaching package',
      level: 'Course level',
      why: 'Isomorphous and eutectic systems with the tie line and lever rule drawn.',
    },
    {
      title: 'Lever rule (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Lever_rule',
      kind: 'Reference article',
      level: 'Intro',
      why: 'The mass balance behind the rule in a few lines.',
    },
  ],
  labs: [],
  candidate: 'Drag a temperature line across a binary diagram and read the tie line. It corrects the common mix-up between the phases’ compositions and how much of each phase there is.',
};
