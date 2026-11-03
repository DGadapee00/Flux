/**
 * EML 4140 Heat Transfer, in the order of MIT 2.51 Intermediate Heat and Mass Transfer, Fall 2008
 * (docs/ocw/2-51.md), whose readings are Lienhard's A Heat Transfer Textbook. EML 4140 has no Flux
 * app, so every new concept here is a gap with a candidate lab. Heat exchangers come last: 2.51's
 * calendar has no session for them, and Lienhard teaches them in chapter 3.
 */
export default {
  course: 'eml4140',
  units: [
    { title: 'Modes and conduction (2.51 sessions 1 to 3)', concepts: ['fourier', 'thermal-resistance', 'heat-equation'] },
    { title: 'Fins and transient conduction (sessions 4 to 9)', concepts: ['fins', 'lumped', 'transient-conduction', 'semi-infinite', 'numerical-conduction'] },
    {
      title: 'Convection (sessions 11 to 18)',
      concepts: ['thermal-boundary-layer', 'convection', 'internal-convection', 'natural-convection', 'boiling-condensation'],
    },
    { title: 'Mass transfer (sessions 19 to 22)', concepts: ['diffusion', 'mass-convection'] },
    { title: 'Radiation (sessions 23 to 26)', concepts: ['thermal-radiation', 'view-factors', 'radiation-networks'] },
    { title: 'Heat exchangers (EML 4140, Lienhard chapter 3)', concepts: ['heat-exchangers'] },
  ],
};
