export default {
  id: 'creep',
  title: 'Creep',
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`\dot\varepsilon_s = A\,\sigma^n\exp\!\left(-\frac{Q_c}{RT}\right)`,
  idea: String.raw`Above roughly 0.4 of its absolute melting temperature, a loaded metal keeps stretching under constant stress. Atoms diffuse fast enough to let dislocations climb past obstacles, so strain builds at a steady rate and then speeds toward rupture. The rate rises with a power of stress and with temperature in the Arrhenius form, often with the same activation energy as self-diffusion. That is why turbine blades are single crystals of nickel alloys, and why lead pipes sag at room temperature.`,
  requires: ['diffusion', 'dislocations'],
  sources: [
    {
      title: 'DoITPoMS, Creep deformation of metals (University of Cambridge)',
      url: 'https://www.doitpoms.ac.uk/tlplib/creep/index.php',
      kind: 'Teaching package',
      level: 'Course level',
      why: 'The creep curve, its mechanisms and its temperature dependence.',
    },
    {
      title: 'Creep (deformation) (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Creep_(deformation)',
      kind: 'Reference article',
      level: 'Intro',
      why: 'Stages of creep and the power-law form, with examples.',
    },
  ],
  labs: [],
  candidate: 'Hold a turbine blade at constant load and raise the temperature, plotting strain against time. It corrects the idea that a load below yield causes no permanent strain.',
};
