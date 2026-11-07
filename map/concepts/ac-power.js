export default {
  id: 'ac-power',
  title: 'AC power and power factor',
  label: ['AC power'],
  subject: 'circuits',
  courses: ['eel3111'],
  eq: String.raw`P = V_\text{rms}I_\text{rms}\cos\theta, \qquad Q = V_\text{rms}I_\text{rms}\sin\theta, \qquad \mathbf S = \mathbf V_\text{rms}\mathbf I_\text{rms}^{*} = P + jQ`,
  idea: String.raw`When current lags or leads the voltage, part of each cycle sends energy back to the source. The average power that does work is \(V_\text{rms}I_\text{rms}\cos\theta\); the rest sloshes in and out of inductors and capacitors as reactive power. The power factor \(\cos\theta\) is the share that does work. A motor's low power factor means the wires carry more current, and lose more \(I^2R\), than the work needs. A capacitor in parallel supplies the motor's reactive power locally and raises the factor toward 1.`,
  requires: ['impedance-analysis', 'electric-power'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §15.4 Power in an AC circuit',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/15-4-power-in-an-ac-circuit',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Average power and the power factor at a first-course level.',
      checked: '2026-11-06',
    },
    {
      title: 'Kuphaldt, Lessons in Electric Circuits, Vol. II: AC',
      url: 'https://www.allaboutcircuits.com/textbook/alternating-current/',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Its power factor chapter covers true, reactive and apparent power, and correction.',
    },
  ],
  labs: [],
  candidate: 'A motor load with a slider for its power factor and a correcting capacitor, the line current shown. It corrects the idea that volts times amps is the power used: at a low power factor the wires carry far more current than the work needs.',
};
