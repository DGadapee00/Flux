/**
 * EML 3101 Thermodynamics II, in the order of MIT 16.050 Thermal Energy, Fall 2002
 * (docs/ocw/16-050.md), with Cleynen's Engineering Thermodynamics. EML 3101's app started with gas
 * mixtures; the other concepts here are gaps with candidate labs. 16.050's heat-transfer lectures
 * (27 to 37) are EML 4140's on this map. The last unit holds EML 3101 topics 16.050 does not teach.
 */
export default {
  course: 'eml3101',
  units: [
    { title: 'The second law (16.050 lectures 4 to 13)', concepts: ['carnot-limit', 'entropy', 'entropy-generation', 'exergy'] },
    { title: 'Gas power and propulsion cycles (lectures 14 to 19)', concepts: ['otto-diesel', 'brayton-cycle', 'jet-propulsion'] },
    { title: 'Vapour power cycles (lectures 20 to 23)', concepts: ['rankine-cycle'] },
    { title: 'Thermochemistry (lectures 24 to 26)', concepts: ['gas-mixtures', 'combustion'] },
    {
      title: 'Refrigeration, moist air and compressible flow (EML 3101, beyond 16.050)',
      concepts: ['vapour-compression', 'psychrometrics', 'compressible-flow', 'normal-shock'],
    },
  ],
};
