export default {
  id: 'light-intensity',
  title: 'Energy and intensity of light',
  label: ['Energy and', 'intensity'],
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`\mathbf S = \frac{1}{\mu_0}\,\mathbf E\times\mathbf B, \qquad I = \langle S\rangle = \frac{E_0^2}{2\mu_0 c}`,
  idea: String.raw`A wave carries energy in both its fields, shared equally. The Poynting vector points the way the energy flows, and its time average is the intensity, in watts per square metre. From a point source the intensity falls as \(1/r^2\). Sunlight arrives at Earth at about 1360 W/m².`,
  requires: ['em-waves'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §16.3 Energy carried by electromagnetic waves',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/16-3-energy-carried-by-electromagnetic-waves',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Energy density, the Poynting vector and intensity in one short section.',
    },
    {
      title: 'Feynman Lectures Vol. II, Ch. 27: Field energy and field momentum',
      url: 'https://www.feynmanlectures.caltech.edu/II_27.html',
      kind: 'Free lectures',
      level: 'Deeper',
      why: 'Where the Poynting vector comes from, and its surprising cases.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'emwave', notes: ['s11', 's12', 's13', 's14'], note: 'Field amplitudes and intensity, up to sunlight scale.' },
  ],
};
