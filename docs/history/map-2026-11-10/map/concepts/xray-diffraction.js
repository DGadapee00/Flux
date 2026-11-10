export default {
  id: 'xray-diffraction',
  title: 'X-ray diffraction and Bragg’s law',
  label: ['X-ray', 'diffraction'],
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`n\lambda = 2d\sin\theta, \qquad d_{hkl} = \frac{a}{\sqrt{h^2 + k^2 + l^2}}\ \text{(cubic)}`,
  idea: String.raw`X-rays have wavelengths near atomic spacings, so a crystal's planes of atoms act like a grating. Waves reflected from neighbouring planes add only when the extra path \(2d\sin\theta\) is a whole number of wavelengths. Each set of planes, named by its Miller indices, therefore shows up at one angle. Reading the angles back gives the plane spacings, and from them the lattice and its size.`,
  requires: ['crystal-structures', 'interference'],
  sources: [
    {
      title: 'MIT 3.091, Recitation 15: X-ray generation, diffraction, and Bragg’s law',
      url: 'https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/resources/mit3_091f18_rec15/',
      kind: 'Recitation notes',
      level: 'Course level',
      why: 'Bragg’s condition derived from path difference, then used.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 3.091, Recitation 14: Miller indices and interplanar spacing',
      url: 'https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/resources/mit3_091f18_rec14/',
      kind: 'Recitation notes',
      level: 'Course level',
      why: 'Naming planes and finding their spacing, which Bragg’s law needs.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'ema3010', lab: 'xrd', notes: ['s6'], note: 'Copper Kα X-rays on a cubic crystal: peaks appear only at the angles Bragg’s law allows, and the structure factor removes some of those. Checked by summing the structure factor over the cell and maximising the intensity from a stack of planes.' },
  ],
};
