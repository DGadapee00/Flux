/** Exam 6 · Ch 53 (EM waves), 54 (spectrum), 55 (intensity), 56 (polarization), 57 (intro to optics). */
import { problem, kase, range, choice, num, mc, sym, EPS0, C_LIGHT, DEG, AXES6, axisCode, texNum, texDeg, qty, pq } from '../kit.js';
import { BANDS, spectrumBand } from '../../physics/emwave.js';
import { MEDIA } from '../../physics/optics.js';

const E6 = { exam: 'e6' };
const BAND_OPTS = BANDS.map((b) => [b.id, b.name]);
const nOf = (id) => MEDIA.find((m) => m.id === id).n;
const H = 6.63e-34; // Planck's constant, the notes' value
const EV = 1.6e-19; // J per eV, the notes' value
const LY = C_LIGHT * 3.156e7; // one light-year in metres: c times one year
const WIEN = 2.898e-3; // m·K
const SIGMA = 5.67e-8; // W/(m²·K⁴)
const bandName = (id) => BANDS.find((b) => b.id === id).name;
const BAND_PLURAL = { radio: 'radio waves', microwave: 'microwaves', ir: 'infrared radiation', vis: 'visible light', uv: 'ultraviolet light', xray: 'X-rays', gamma: 'gamma rays' };
const BAND_PLURAL_OPTS = BANDS.map((b) => [b.id, BAND_PLURAL[b.id]]);

export default [
  // ================================================================= 53
  problem({
    ...E6, id: 'e6.53.f-from-lambda', ch: '53', lab: 'emwave', title: 'Frequency from wavelength', kind: 'numeric', topics: ['em-waves'],
    vars: { lam: range(300, 800, 5, 'nm', 1e-9) },
    derive: ($) => ({ f: C_LIGHT / $.lam, T: $.lam / C_LIGHT }),
    text: (T) => `Light has a wavelength of ${T.lam} nm in vacuum. Find its frequency and period.`,
    parts: [num('f', ($) => $.f, 'Hz'), num('T', ($) => $.T, 's')],
    steps: ($, f) => [
      String.raw`$f = \dfrac{c}{\lambda} = \dfrac{${qty(C_LIGHT, 'm/s')}}{${qty($.lam, 'm')}} = ${texNum($.f)}\ \text{Hz}$`,
      String.raw`$T = \dfrac{1}{f} = \dfrac{1}{${qty($.f, 'Hz')}} = ${texNum($.T)}\ \text{s}$`,
    ],
    sim: {
      scenario: 'green',
      setup: (s, $) => void (s.lambda = $.lam),
      read: (c) => ({ f: c.em.f }),
    },
    cases: [kase('green laser', { lam: 532 }, { f: 5.639e14, T: 1.773e-15 })],
  }),
  problem({
    ...E6, id: 'e6.53.B-from-E', ch: '53', lab: 'emwave', title: 'Magnetic amplitude from electric amplitude', kind: 'numeric', topics: ['em-waves'],
    vars: { E0: range(1, 2000, 1, 'V/m') },
    derive: ($) => ({ B0: $.E0 / C_LIGHT }),
    text: (T) => `An EM wave in vacuum has an electric field amplitude of ${T.E0} V/m. What is its magnetic field amplitude?`,
    parts: [
      sym('B0_sym', 'E0/c', { E0: 'V/m' }, ($) => $.B0, { unit: 'T', label: String.raw`$B_0$ as a formula` }),
      num('B0', ($) => $.B0, 'T')],
    steps: ($, f) => [String.raw`$B_0 = \dfrac{E_0}{c} = \dfrac{${qty($.E0, 'V/m')}}{${qty(C_LIGHT, 'm/s')}} = ${texNum($.B0)}\ \text{T}$`],
    sim: {
      scenario: 'green',
      setup: (s, $) => void (s.E0 = $.E0),
      read: (c) => ({ B0: c.em.B0 }),
    },
    cases: [kase('lab default', { E0: 200 }, { B0: 6.667e-7 })],
  }),
  problem({
    ...E6, id: 'e6.53.direction', ch: '53', lab: 'emwave', title: 'Direction of travel from E and B', kind: 'conceptual', topics: ['em-waves', 'poynting'],
    vars: { Ed: choice([2, '+y'], [-2, '−y'], [3, '+z'], [-3, '−z']), Bd: choice([1, '+x'], [-1, '−x'], [2, '+y'], [-2, '−y'], [3, '+z'], [-3, '−z']) },
    derive: ($) => {
      const u = (c) => ({ x: (Math.abs(c) === 1) * Math.sign(c), y: (Math.abs(c) === 2) * Math.sign(c), z: (Math.abs(c) === 3) * Math.sign(c) });
      const a = u($.Ed);
      const b = u($.Bd);
      return { code: axisCode({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }) };
    },
    valid: ($) => Math.abs($.Ed) !== Math.abs($.Bd),
    text: (T) => `At some instant, a plane wave's E points ${T.Ed} and its B points ${T.Bd}. Which way is the wave traveling?`,
    parts: [mc('dir', AXES6.filter(([v]) => v !== 0), ($) => $.code)],
    hints: [String.raw`The wave travels along $\vec{S} = \dfrac{\vec{E}\times\vec{B}}{\mu_0}$.`],
    steps: () => [String.raw`Use the right-hand rule for $\vec{E}\times\vec{B}$. In the lab $\vec{E}$ is along $\hat{y}$ and $\vec{B}$ along $\hat{z}$, so $\hat{y}\times\hat{z} = \hat{x}$.`],
    sim: { scenario: 'green' },
    cases: [kase('lab', { Ed: 2, Bd: 3 }, { dir: 1 })],
  }),
  problem({
    ...E6, id: 'e6.53.wave-eq', ch: '53', lab: 'emwave', title: 'Reading a wave equation', kind: 'numeric', level: 2, topics: ['em-waves'],
    vars: { k: range(1, 50, 0.5, '×10⁶ rad/m', 1e6), E0: range(1, 500, 1, 'V/m') },
    derive: ($) => {
      const lam = (2 * Math.PI) / $.k;
      return { lam, w: $.k * C_LIGHT, f: C_LIGHT / lam, B0: $.E0 / C_LIGHT };
    },
    text: (T) => `E(x, t) = ${T.E0} sin[(${T.k} × 10⁶ rad/m)x − ωt] ŷ V/m in vacuum. Find λ, ω, f and B₀.`,
    parts: [
      sym('lam_sym', '2*pi/k', { k: '1/m' }, ($) => $.lam, { unit: 'm', label: String.raw`$\lambda$ as a formula` }),
      num('lam', ($) => $.lam, 'm', { label: String.raw`$\lambda$` }),
      num('w', ($) => $.w, 'rad/s', { label: String.raw`$\omega$` }),
      num('f', ($) => $.f, 'Hz'),
      num('B0', ($) => $.B0, 'T', { label: String.raw`$B_0$` }),
    ],
    steps: ($, f) => [
      String.raw`$\lambda = \dfrac{2\pi}{k} = \dfrac{2\pi}{${qty($.k, 'rad/m')}} = ${texNum($.lam)}\ \text{m}$`,
      String.raw`$\omega = ck = ${pq(C_LIGHT, 'm/s')}${pq($.k, 'rad/m')} = ${texNum($.w)}\ \text{rad/s}$`,
      String.raw`$f = \dfrac{\omega}{2\pi} = \dfrac{${qty($.w, 'rad/s')}}{2\pi} = ${texNum($.f)}\ \text{Hz}$`,
      String.raw`$B_0 = \dfrac{E_0}{c} = \dfrac{${qty($.E0, 'V/m')}}{${qty(C_LIGHT, 'm/s')}} = ${texNum($.B0)}\ \text{T}$`,
    ],
    cases: [kase('hand', { k: 10, E0: 30 }, { lam: 6.2832e-7, w: 3e15, f: 4.7746e14, B0: 1e-7 })],
  }),

  problem({
    ...E6, id: 'e6.53.divergence', ch: '53', lab: 'divergence', title: 'Flux out of a small sphere in a charged ball', kind: 'numeric', level: 2, topics: ['maxwell'],
    vars: { rho: range(0.5, 5, 0.5, 'μC/m³', 1e-6), r: range(5, 40, 1, 'cm', 1e-2) },
    derive: ($) => {
      const V = (4 / 3) * Math.PI * $.r ** 3;
      return { V, Q: $.rho * V, Phi: ($.rho * V) / EPS0, div: $.rho / EPS0 };
    },
    text: (T) => `A ball of radius 1.00 m holds charge spread evenly through it, ${T.rho} μC/m³. An imaginary sphere of radius ${T.r} cm sits wholly inside it, centred 0.50 m from the ball's centre. Find the electric flux out of the small sphere, and that flux divided by the small sphere's volume.`,
    parts: [num('Phi', ($) => $.Phi, 'N·m²/C', { label: 'Φ' }), num('div', ($) => $.div, 'N/(C·m)', { label: 'Φ/V' })],
    steps: ($) => [
      String.raw`$V = \tfrac43\pi r^3 = \tfrac43\pi(${qty($.r, 'm')})^3 = ${texNum($.V)}\ \text{m}^3$, and it holds $Q = \rho V = ${texNum($.Q)}\ \text{C}$`,
      String.raw`$\Phi = \dfrac{Q}{\varepsilon_0} = \dfrac{${qty($.Q, 'C')}}{${qty(EPS0, 'C²/N·m²')}} = ${texNum($.Phi)}\ \text{N·m}^2/\text{C}$`,
      String.raw`$\dfrac{\Phi}{V} = \dfrac{\rho}{\varepsilon_0} = ${texNum($.div)}\ \text{N/(C·m)}$, whatever the radius: this is $\nabla\cdot\vec E$ inside the ball`,
    ],
    sim: {
      scenario: 'inside',
      setup(s, $) {
        Object.assign(s, { mode: 'ball', rho: $.rho, r: $.r, d: 0.5 });
      },
      read: (c) => ({ Phi: c.dv.numeric.net, div: c.dv.perVolume }),
    },
    cases: [kase('the lab’s first setup, moved to 0.5 m', { rho: 1, r: 30 }, { Phi: 1.278e4, div: 1.13e5 })],
  }),
  problem({
    ...E6, id: 'e6.53.radar-gun', ch: '53', lab: 'radargun', title: 'Application: a police radar gun', kind: 'numeric', level: 2, topics: ['doppler'],
    vars: { f: choice([10.525, '10.525 GHz (X band)'], [24.15, '24.15 GHz (K band)'], [34.7, '34.7 GHz (Ka band)']), v: range(10, 50, 1, 'm/s') },
    derive: ($) => ({ df: (2 * $.f * 1e9 * $.v) / C_LIGHT, lam: C_LIGHT / ($.f * 1e9), mph: $.v / 0.44704 }),
    text: (T) => `A police radar gun sends ${T.f} microwaves at a car driving straight toward it at ${T.v} m/s. The echo comes back shifted in frequency. Find the wavelength the gun sends and the shift Δf between the echo and the gun's own signal.`,
    parts: [num('lam', ($) => $.lam, 'cm', { scale: 1e-2 }), num('df', ($) => $.df, 'Hz')],
    steps: ($, f) => [
      String.raw`$\lambda = \dfrac{c}{f} = \dfrac{${qty(C_LIGHT, 'm/s')}}{${qty($.f * 1e9, 'Hz')}} = ${texNum($.lam)}\ \text{m}$`,
      String.raw`The car receives $f(1 + v/c)$ as a moving observer and sends it back as a moving source, so the echo returns at $f(1 + v/c)^2 \approx f(1 + 2v/c)$.`,
      String.raw`$\Delta f = \dfrac{2fv}{c} = \dfrac{2${pq($.f * 1e9, 'Hz')}${pq($.v, 'm/s')}}{${qty(C_LIGHT, 'm/s')}} = ${texNum($.df)}\ \text{Hz}$, a rise, because the car is closing.`,
    ],
    sim: {
      scenario: 'notes',
      setup(s, $) {
        Object.assign(s, { f: $.f * 1e9, v: $.v });
      },
      read: (c) => ({ lam: c.rg.lambda, df: c.rg.shift }),
    },
    cases: [kase('the notes', { f: 24.15, v: 30 }, { lam: 1.242, df: 4830 })],
  }),

  // Class Activity 6 (Ch 53): definitions, true or false, light-years, photons, red shift.
  problem({
    ...E6, id: 'e6.53.wave-terms', ch: '53', lab: 'emwave', src: 'Class Activity 6 #3–4', title: 'Period, wavelength, frequency, amplitude', kind: 'conceptual', topics: ['em-waves'],
    vars: { q: choice([1, 'the time one full cycle takes'], [2, 'the distance the wave travels in one cycle'], [3, 'the number of cycles that pass a point each second'], [4, 'the largest value the field reaches']) },
    text: (T) => `Which property of a wave is ${T.q}?`,
    parts: [mc('ans', [[1, 'Period'], [2, 'Wavelength'], [3, 'Frequency'], [4, 'Amplitude'], [5, 'Speed']], ($) => $.q)],
    steps: () => [String.raw`The period $T$ is a time, in seconds. The wavelength $\lambda$ is a distance, in metres. The frequency $f = 1/T$ counts cycles per second, in hertz. The amplitude is the peak value. They are tied by $v = \lambda/T = f\lambda$.`],
    cases: [kase('Class Activity 6 #3', { q: 1 }, { ans: 1 }), kase('Class Activity 6 #4', { q: 2 }, { ans: 2 })],
  }),
  problem({
    ...E6, id: 'e6.53.true-or-false', ch: '53', lab: 'emwave', src: 'Class Activity 6 #1–2', title: 'True or false: EM waves in vacuum', kind: 'conceptual', topics: ['em-waves'],
    vars: {
      s: choice(
        [1, 'In vacuum, a higher-frequency EM wave travels faster than a lower-frequency one.'],
        [2, 'In vacuum, every EM wave travels at the same speed, whatever its frequency.'],
        [3, 'In vacuum, a higher-frequency EM wave has a shorter wavelength.'],
        [4, 'In an EM wave traveling through vacuum, E is always at right angles to B.'],
        [5, 'In an EM wave traveling through vacuum, E can point along B.'],
        [6, 'The lower the frequency of light, the less energy each photon carries.'],
        [7, 'Every photon carries the same energy, whatever its frequency.'],
        [8, 'An EM wave needs a medium, such as air, to travel through.'],
        [9, 'Mechanical waves, such as sound and water waves, can cross a vacuum.'],
      ),
    },
    derive: ($) => ({ truth: [2, 3, 4, 6].includes($.s) ? 1 : 0 }),
    text: (T) => `True or false? ${T.s}`,
    parts: [mc('ans', [[1, 'True'], [0, 'False']], ($) => $.truth)],
    steps: ($) => [
      {
        1: String.raw`False. Every EM wave travels at $c = 3.00\times10^8$ m/s in vacuum. Frequency changes the wavelength, not the speed.`,
        2: String.raw`True. Every EM wave travels at $c = 3.00\times10^8$ m/s in vacuum.`,
        3: String.raw`True. The speed is fixed at $c$, so $\lambda = c/f$ shrinks as $f$ grows.`,
        4: String.raw`True. $\vec E$ and $\vec B$ are perpendicular to each other and to the direction of travel, $\vec E\times\vec B$.`,
        5: String.raw`False. $\vec E$ and $\vec B$ are always perpendicular to each other and to the direction of travel.`,
        6: String.raw`True. One photon carries $E = hf$, so a lower frequency means less energy per photon.`,
        7: String.raw`False. One photon carries $E = hf$. A gamma-ray photon carries far more than a radio photon.`,
        8: 'False. An EM wave is a changing E field making a changing B field and back again. It needs no medium, which is how sunlight crosses space.',
        9: 'False. Mechanical waves are a disturbance of a material. With no material there is nothing to disturb. Only EM waves cross a vacuum.',
      }[$.s],
    ],
    cases: [kase('Class Activity 6 #1 B', { s: 2 }, { ans: 1 }), kase('Class Activity 6 #1 E', { s: 5 }, { ans: 0 }), kase('Class Activity 6 #2', { s: 8 }, { ans: 0 })],
  }),
  problem({
    ...E6, id: 'e6.53.light-year', ch: '53', src: 'Class Activity 6 #6–7', title: 'Light-years: a distance and a travel time', kind: 'numeric', topics: ['light-year'],
    vars: { D: range(1, 50000, 1, 'ly') },
    derive: ($) => ({ t: $.D, d: $.D * LY }),
    text: (T) => `A telescope sees a galaxy ${T.D} light-years away. How many years did its light take to reach the telescope? How far away is the galaxy in metres?`,
    parts: [num('t', ($) => $.t, 'yr', { label: 'Travel time' }), num('d', ($) => $.d, 'm', { label: 'Distance' })],
    steps: ($) => [
      String.raw`A light-year is the distance light travels in one year. So light from ${texNum($.D)} ly away travels for ${texNum($.t)} years.`,
      String.raw`$1\ \text{ly} = c\,(1\ \text{yr}) = ${pq(C_LIGHT, 'm/s')}(3.156\times10^7\ \text{s}) = ${texNum(LY)}\ \text{m}$`,
      String.raw`$d = ${pq($.D, 'ly')}${pq(LY, 'm/ly')} = ${texNum($.d)}\ \text{m}$`,
    ],
    cases: [kase('Class Activity 6 #7', { D: 15000 }, { t: 15000, d: 1.4202e20 })],
  }),
  problem({
    ...E6, id: 'e6.53.photon-color', ch: '53', lab: 'emwave', src: 'Class Activity 6 #8', title: 'Which color carries the most energy per photon?', kind: 'conceptual', topics: ['photons'],
    vars: { q: choice([1, 'the most'], [-1, 'the least']) },
    text: (T) => `In the visible spectrum, which of these colors has photons carrying ${T.q} energy?`,
    parts: [mc('ans', [['red', 'Red'], ['yellow', 'Yellow'], ['green', 'Green'], ['blue', 'Blue'], ['same', 'They all carry the same energy']], ($) => ($.q === 1 ? 'blue' : 'red'))],
    steps: () => [String.raw`A photon carries $E = hf = hc/\lambda$. Going red, yellow, green, blue, the wavelength shrinks and the frequency rises. Blue photons carry the most energy of these four and red the least.`],
    cases: [kase('Class Activity 6 #8', { q: 1 }, { ans: 'blue' }), kase('least', { q: -1 }, { ans: 'red' })],
  }),
  problem({
    ...E6, id: 'e6.53.photon-energy', ch: '53', lab: 'emwave', title: 'Energy of one photon', kind: 'numeric', topics: ['photons'],
    vars: { lam: range(380, 750, 5, 'nm', 1e-9) },
    derive: ($) => ({ E: (H * C_LIGHT) / $.lam, eV: (H * C_LIGHT) / $.lam / EV }),
    text: (T) => `Light has a wavelength of ${T.lam} nm in vacuum. Find the energy of one photon in joules and in electron-volts. Use h = 6.63 × 10⁻³⁴ J·s and 1 eV = 1.6 × 10⁻¹⁹ J.`,
    parts: [num('E', ($) => $.E, 'J'), num('eV', ($) => $.eV, 'eV', { label: 'In eV' })],
    steps: ($) => [
      String.raw`$E = \dfrac{hc}{\lambda} = \dfrac{(6.63\times10^{-34}\ \text{J·s})${pq(C_LIGHT, 'm/s')}}{${qty($.lam, 'm')}} = ${texNum($.E)}\ \text{J}$`,
      String.raw`$E = \dfrac{${qty($.E, 'J')}}{1.6\times10^{-19}\ \text{J/eV}} = ${texNum($.eV)}\ \text{eV}$`,
    ],
    cases: [kase('the notes, green light', { lam: 530 }, { E: 3.753e-19, eV: 2.346 })],
  }),
  problem({
    ...E6, id: 'e6.53.redshift', ch: '53', src: 'Class Activity 6 #9–10', title: 'Red shift and blue shift from a galaxy', kind: 'numeric', level: 2, topics: ['doppler'],
    vars: {
      line: choice([1, "hydrogen's 21 cm radio line, 1.42 GHz"], [2, "hydrogen's red line, 4.57 × 10¹⁴ Hz"]),
      v: range(0.5, 5, 0.1, '× 10⁷ m/s', 1e7),
      dir: choice([-1, 'moving away from'], [1, 'moving toward']),
    },
    derive: ($) => {
      const f = $.line === 1 ? 1.42e9 : 4.57e14;
      const b = ($.dir * $.v) / C_LIGHT;
      const fp = f * Math.sqrt((1 + b) / (1 - b));
      return { f, b, fp, df: fp - f, shift: $.dir === 1 ? 'blue' : 'red' };
    },
    text: (T) => `A galaxy is ${T.dir} Earth at ${T.v} × 10⁷ m/s. An astronomer on Earth watches ${T.line} as measured in the lab. What frequency does the astronomer receive from the galaxy, and by how much has it shifted? Is the light red-shifted or blue-shifted?`,
    parts: [
      num('fp', ($) => $.fp, 'Hz', { label: String.raw`$f'$ received`, tol: 0.002 }),
      num('df', ($) => $.df, 'Hz', { label: String.raw`$\Delta f = f' - f$` }),
      mc('shift', [['red', 'Red-shifted: lower frequency'], ['blue', 'Blue-shifted: higher frequency'], ['none', 'Not shifted']], ($) => $.shift),
    ],
    steps: ($) => [
      String.raw`Light's Doppler shift depends only on the relative velocity, with $v$ positive when approaching. Here $v/c = ${texNum($.b)}$.`,
      String.raw`$f' = f\sqrt{\dfrac{1+v/c}{1-v/c}} = ${pq($.f, 'Hz')}\sqrt{\dfrac{1 ${$.b < 0 ? '-' : '+'} ${texNum(Math.abs($.b))}}{1 ${$.b < 0 ? '+' : '-'} ${texNum(Math.abs($.b))}}} = ${texNum($.fp, 4)}\ \text{Hz}$`,
      String.raw`$\Delta f = f' - f = ${texNum($.df)}\ \text{Hz}$. ${$.shift === 'red' ? 'The frequency went down: a red shift, so the galaxy is receding.' : 'The frequency went up: a blue shift, so the galaxy is approaching.'}`,
    ],
    cases: [kase('Class Activity 6 #10', { line: 1, v: 2, dir: -1 }, { fp: 1.32829e9, df: -9.171e7, shift: 'red' })],
  }),

  // ================================================================= 54
  problem({
    ...E6, id: 'e6.54.band', ch: '54', lab: 'emwave', title: 'Which part of the spectrum?', kind: 'conceptual', topics: ['spectrum'],
    vars: { e: range(-13, 2, 0.5, '(log₁₀ λ in m)') },
    derive: ($) => ({ lam: 10 ** $.e, band: spectrumBand(10 ** $.e).id }),
    valid: ($) => BANDS.every((b) => Math.abs(Math.log10($.lam / Math.max(b.min, 1e-30))) > 0.05),
    text: (T, $, f) => `Electromagnetic radiation has a wavelength of ${f($.lam)} m. Which band is it in?`,
    parts: [mc('band', BAND_OPTS, ($) => $.band)],
    steps: () => ['From longest to shortest wavelength: radio > 1 m, microwave 1 mm–1 m, infrared 700 nm–1 mm, visible 400–700 nm, UV 10–400 nm, X-ray 0.01–10 nm, gamma < 0.01 nm.'],
    sim: {
      scenario: 'green',
      setup: (s, $) => void (s.lambda = $.lam),
      read: (c) => ({ band: c.em.band.id }),
    },
    cases: [kase('Wi-Fi', { e: -1 }, { band: 'microwave' }), kase('ultraviolet', { e: -6.5 }, { band: 'uv' })],
  }),
  problem({
    ...E6, id: 'e6.54.order', ch: '54', lab: 'emwave', title: 'Ordering the spectrum', kind: 'conceptual', topics: ['spectrum'],
    vars: { a: choice(...BAND_OPTS.map(([id, n], i) => [i, n])), b: choice(...BAND_OPTS.map(([id, n], i) => [i, n])), qty: choice([1, 'higher frequency'], [2, 'longer wavelength'], [3, 'higher speed in vacuum']) },
    valid: ($) => $.a !== $.b,
    text: (T) => `Which has the ${T.qty}: ${T.a} or ${T.b}?`,
    parts: [mc('ans', [[1, 'The first one'], [2, 'The second one'], [0, 'They are the same']], ($) => ($.qty === 3 ? 0 : ($.qty === 1) === $.a > $.b ? 1 : 2))],
    steps: () => ['All EM waves travel at c in vacuum. From lowest to highest frequency (longest to shortest wavelength): radio, microwave, infrared, visible, ultraviolet, X-ray, gamma.'],
    cases: [kase('x-ray vs radio frequency', { a: 5, b: 0, qty: 1 }, { ans: 1 }), kase('speed', { a: 1, b: 3, qty: 3 }, { ans: 0 })],
  }),

  // Class Activity 6 (Ch 54): ranking, uses and sources of each band, wavelength from frequency.
  problem({
    ...E6, id: 'e6.54.rank-energy', ch: '54', lab: 'emwave', src: 'Class Activity 6 #11', title: 'Ranking the spectrum by photon energy', kind: 'conceptual', topics: ['spectrum'],
    vars: { b: choice(...BAND_PLURAL_OPTS) },
    derive: ($) => ({ rank: BANDS.findIndex((x) => x.id === $.b) + 1 }),
    text: (T) => `Rank the seven bands of the EM spectrum by photon energy, from 1 (lowest) to 7 (highest). What rank does ${T.b} get?`,
    parts: [mc('rank', [1, 2, 3, 4, 5, 6, 7].map((k) => [k, k === 1 ? '1 (lowest energy)' : k === 7 ? '7 (highest energy)' : String(k)]), ($) => $.rank)],
    steps: () => [String.raw`Photon energy is $E = hf$, so the ranking follows frequency: radio (1), microwave (2), infrared (3), visible (4), ultraviolet (5), X-ray (6), gamma (7).`],
    cases: [kase('Class Activity 6 #11, visible', { b: 'vis' }, { rank: 4 }), kase('Class Activity 6 #11, X-rays', { b: 'xray' }, { rank: 6 })],
  }),
  problem({
    ...E6, id: 'e6.54.uses', ch: '54', lab: 'emwave', src: 'Class Activity 6 #12–14', title: 'Which band is at work?', kind: 'conceptual', topics: ['spectrum'],
    vars: {
      u: choice(
        [1, 'A cell phone talks to a cell tower'],
        [2, 'A microwave oven heats a bowl of soup'],
        [3, 'An FM station broadcasts music'],
        [4, 'You hold your hand above a hot stove burner and feel the warmth'],
        [5, 'A TV remote changes the channel'],
        [6, 'Under a blacklight in a dark room, a white shirt glows'],
        [7, 'A dentist images the roots of your teeth'],
        [8, 'A radiotherapy machine aims radiation from a radioactive source at a tumor'],
      ),
    },
    derive: ($) => ({ band: { 1: 'microwave', 2: 'microwave', 3: 'radio', 4: 'ir', 5: 'ir', 6: 'uv', 7: 'xray', 8: 'gamma' }[$.u] }),
    text: (T) => `${T.u}. Which part of the EM spectrum is doing the work?`,
    parts: [mc('band', BAND_OPTS, ($) => $.band)],
    steps: ($) => [
      {
        1: 'Cell phones use microwaves, roughly 0.7 to 6 GHz. Wavelengths of centimetres to tens of centimetres pass through walls and fit a small antenna.',
        2: 'A microwave oven runs at 2.45 GHz. The microwaves rotate water molecules back and forth, and that motion becomes heat.',
        3: 'FM radio runs near 100 MHz, a wavelength of about 3 m. That is radio.',
        4: 'You feel warmth from the burner as infrared. Anything warm radiates infrared; skin absorbs it and heats up.',
        5: 'A remote uses an infrared LED. Like visible light, it is blocked by walls, so the remote needs a line of sight.',
        6: 'A blacklight gives off ultraviolet. Whiteners in the cloth absorb the UV and re-emit visible light. That is fluorescence.',
        7: 'X-rays pass through soft tissue but are stopped by teeth and bone, so they image them.',
        8: 'Radiotherapy from a radioactive source uses gamma rays, which come from atomic nuclei.',
      }[$.u],
    ],
    cases: [
      kase('Class Activity 6 #12', { u: 1 }, { band: 'microwave' }),
      kase('Class Activity 6 #13', { u: 6 }, { band: 'uv' }),
      kase('Class Activity 6 #14', { u: 4 }, { band: 'ir' }),
    ],
  }),
  problem({
    ...E6, id: 'e6.54.source', ch: '54', lab: 'emwave', src: 'Class Activity 6 #15', title: 'What makes each band?', kind: 'conceptual', topics: ['spectrum'],
    vars: { b: choice(...BAND_PLURAL_OPTS) },
    derive: ($) => ({ src: { radio: 'acc', microwave: 'acc', ir: 'vib', vis: 'outer', uv: 'outer', xray: 'inner', gamma: 'nuc' }[$.b] }),
    text: (T) => `What is the usual source of ${T.b}?`,
    parts: [
      mc('src', [
        ['acc', 'Electrons accelerated back and forth in an antenna or circuit'],
        ['vib', 'Vibrating molecules in anything warm'],
        ['outer', 'Outer electrons jumping between energy levels in an atom'],
        ['inner', 'Inner electrons of heavy atoms, or fast electrons slamming to a stop'],
        ['nuc', 'Changes inside atomic nuclei'],
      ], ($) => $.src),
    ],
    steps: () => ['Radio and microwaves: electrons accelerated in antennas and circuits. Infrared: molecular vibration. Visible and ultraviolet: outer electrons jumping between levels, with bigger jumps for UV. X-rays: inner electrons of heavy atoms, or fast electrons stopping in a metal target. Gamma rays: atomic nuclei.'],
    cases: [
      kase('Class Activity 6 #15, radio', { b: 'radio' }, { src: 'acc' }),
      kase('Class Activity 6 #15, infrared', { b: 'ir' }, { src: 'vib' }),
      kase('Class Activity 6 #15, gamma', { b: 'gamma' }, { src: 'nuc' }),
    ],
  }),
  problem({
    ...E6, id: 'e6.54.lambda-from-f', ch: '54', lab: 'emwave', src: 'Class Activity 6 #16', title: 'Wavelength of a radio or Wi-Fi signal', kind: 'numeric', topics: ['spectrum'],
    vars: {
      dev: choice(
        [1, 'A Wi-Fi router at 5 GHz'],
        [2, 'A Wi-Fi router at 2.4 GHz'],
        [3, 'A microwave oven at 2.45 GHz'],
        [4, 'A cell phone at 1.9 GHz'],
        [5, 'An FM station at 101.5 MHz'],
        [6, 'An AM station at 880 kHz'],
      ),
    },
    derive: ($) => {
      const f = { 1: 5e9, 2: 2.4e9, 3: 2.45e9, 4: 1.9e9, 5: 101.5e6, 6: 880e3 }[$.dev];
      const lam = C_LIGHT / f;
      return { f, lam, band: spectrumBand(lam).id };
    },
    text: (T) => `${T.dev} sends EM waves through air, where they travel at c = 3.00 × 10⁸ m/s. Find the wavelength. Which band is it?`,
    parts: [num('lam', ($) => $.lam, 'm', { label: String.raw`$\lambda$` }), mc('band', BAND_OPTS, ($) => $.band)],
    steps: ($) => [
      String.raw`$\lambda = \dfrac{c}{f} = \dfrac{${qty(C_LIGHT, 'm/s')}}{${qty($.f, 'Hz')}} = ${texNum($.lam)}\ \text{m}$`,
      `${texNum($.lam)} m falls in the ${bandName($.band).toLowerCase()} band. Microwaves run from 1 mm to 1 m; radio is longer than 1 m.`,
    ],
    cases: [kase('Class Activity 6 #16 B', { dev: 1 }, { lam: 0.06, band: 'microwave' }), kase('AM radio', { dev: 6 }, { lam: 340.9, band: 'radio' })],
  }),

  // ================================================================= 55
  problem({
    ...E6, id: 'e6.55.intensity', ch: '55', lab: 'emwave', title: 'Intensity from field amplitude', kind: 'numeric', topics: ['intensity'],
    vars: { E0: range(1, 2000, 1, 'V/m') },
    derive: ($) => ({ I: 0.5 * C_LIGHT * EPS0 * $.E0 ** 2 }),
    text: (T) => `What is the average intensity of an EM wave with E₀ = ${T.E0} V/m?`,
    parts: [
      sym('I_sym', 'c*eps0*E0^2/2', { E0: 'V/m' }, ($) => $.I, { unit: 'W/m^2', label: String.raw`$I$ as a formula` }),
      num('I', ($) => $.I, 'W/m²')],
    steps: ($, f) => [String.raw`$I = \tfrac{1}{2}c\varepsilon_0 E_0^2 = \tfrac12${pq(C_LIGHT, 'm/s')}${pq(EPS0, 'C²/N·m²')}${pq($.E0, 'V/m')}^2 = ${texNum($.I)}\ \text{W/m}^2$`],
    sim: {
      scenario: 'sun',
      setup: (s, $) => void (s.E0 = $.E0),
      read: (c) => ({ I: c.em.Iavg }),
    },
    cases: [kase('lab default', { E0: 200 }, { I: 53.1 })],
  }),
  problem({
    ...E6, id: 'e6.55.E-from-I', ch: '55', lab: 'emwave', title: 'Field amplitudes from intensity', kind: 'numeric', topics: ['intensity'],
    vars: { I: range(10, 5000, 10, 'W/m²') },
    derive: ($) => {
      const E0 = Math.sqrt((2 * $.I) / (C_LIGHT * EPS0));
      return { E0, B0: E0 / C_LIGHT };
    },
    text: (T) => `Sunlight reaching a surface has an intensity of ${T.I} W/m². Find E₀ and B₀.`,
    parts: [
      sym('E0_sym', 'sqrt(2*I/(c*eps0))', { I: 'W/m^2' }, ($) => $.E0, { unit: 'V/m', label: String.raw`$E_0$ as a formula` }),
      num('E0', ($) => $.E0, 'V/m'), num('B0', ($) => $.B0, 'T')],
    steps: ($, f) => [
      String.raw`$E_0 = \sqrt{\dfrac{2I}{c\varepsilon_0}} = \sqrt{\dfrac{2${pq($.I, 'W/m²')}}{${pq(C_LIGHT, 'm/s')}${pq(EPS0, 'C²/N·m²')}}} = ${texNum($.E0)}\ \text{V/m}$`,
      String.raw`$B_0 = \dfrac{E_0}{c} = \dfrac{${qty($.E0, 'V/m')}}{${qty(C_LIGHT, 'm/s')}} = ${texNum($.B0)}\ \text{T}$`,
    ],
    sim: {
      scenario: 'sun',
      setup: (s, $) => void (s.E0 = $.E0),
      read: (c, s, $) => ({ '@I in the lab': [c.em.Iavg, $.I] }),
    },
    cases: [kase('sunlight', { I: 1000 }, { E0: 868.2, B0: 2.894e-6 })],
  }),
  problem({
    ...E6, id: 'e6.55.point-source', ch: '55', lab: 'emwave', title: 'Intensity from a point source', kind: 'numeric', topics: ['intensity'],
    vars: { P: range(1, 1000, 1, 'W'), r: range(0.5, 50, 0.5, 'm') },
    derive: ($) => {
      const I = $.P / (4 * Math.PI * $.r ** 2);
      return { I, E0: Math.sqrt((2 * I) / (C_LIGHT * EPS0)) };
    },
    text: (T) => `A ${T.P} W source radiates equally in all directions. Find the intensity and E₀ ${T.r} m away.`,
    parts: [
      sym('I_sym', 'P/(4*pi*r^2)', { P: 'W', r: 'm' }, ($) => $.I, { unit: 'W/m²', label: String.raw`$I$ as a formula` }),
      num('I', ($) => $.I, 'W/m²'),
      num('E0', ($) => $.E0, 'V/m'),
    ],
    steps: ($, f) => [
      String.raw`$I = \dfrac{P}{4\pi r^2} = \dfrac{${qty($.P, 'W')}}{4\pi${pq($.r, 'm')}^2} = ${texNum($.I)}\ \text{W/m}^2$`,
      String.raw`$E_0 = \sqrt{\dfrac{2I}{c\varepsilon_0}} = \sqrt{\dfrac{2${pq($.I, 'W/m²')}}{${pq(C_LIGHT, 'm/s')}${pq(EPS0, 'C²/N·m²')}}} = ${texNum($.E0)}\ \text{V/m}$`,
    ],
    cases: [kase('hand', { P: 100, r: 2 }, { I: 1.989, E0: 38.72 })],
  }),
  problem({
    ...E6, id: 'e6.55.pressure', ch: '55', lab: 'emwave', title: 'Radiation pressure on a sail', kind: 'numeric', level: 2, topics: ['intensity', 'radiation-pressure'],
    vars: { I: range(100, 2000, 10, 'W/m²'), A: range(1, 1000, 1, 'm²'), surf: choice([1, 'absorbs all the light'], [2, 'reflects all the light']) },
    derive: ($) => ({ p: ($.surf * $.I) / C_LIGHT, F: ($.surf * $.I * $.A) / C_LIGHT }),
    text: (T) => `Light of intensity ${T.I} W/m² hits a ${T.A} m² sail head-on. The sail ${T.surf}. Find the radiation pressure and the force.`,
    parts: [num('p', ($) => $.p, 'Pa'), num('F', ($) => $.F, 'N')],
    steps: ($, f) => [
      String.raw`$p = \dfrac{I}{c}$ if absorbed, $\dfrac{2I}{c}$ if reflected. Here: $p = \dfrac{${$.surf === 2 ? '2' : ''}${pq($.I, 'W/m²')}}{${qty(C_LIGHT, 'm/s')}} = ${texNum($.p)}\ \text{Pa}$`,
      String.raw`$F = pA = ${pq($.p, 'Pa')}${pq($.A, 'm²')} = ${texNum($.F)}\ \text{N}$`,
    ],
    cases: [kase('reflecting', { I: 1360, A: 100, surf: 2 }, { p: 9.067e-6, F: 9.067e-4 })],
  }),

  problem({
    ...E6, id: 'e6.55.solar-sail', ch: '55', lab: 'solarsail', title: 'Application: a solar sail', kind: 'numeric', level: 2, topics: ['radiation-pressure'],
    vars: { A: range(10, 1000, 1, 'm²'), m: range(5, 500, 5, 'kg'), r: choice([1, "Earth's distance from the Sun (1 AU)"], [1.52, "Mars's distance from the Sun (1.52 AU)"]) },
    derive: ($) => {
      const I = 1367 / ($.r * $.r);
      const F = (2 * I * $.A) / C_LIGHT;
      return { I, F, a: F / $.m };
    },
    text: (T) => `A ${T.m} kg spacecraft carries a perfectly reflecting sail of area ${T.A} m², facing the Sun head-on at ${T.r}. Sunlight at Earth's distance has an intensity of 1367 W/m². Find the force sunlight exerts on the sail and the craft's acceleration.`,
    parts: [num('F', ($) => $.F, 'mN', { scale: 1e-3 }), num('a', ($) => $.a, 'm/s²')],
    steps: ($, f) => [
      String.raw`Intensity falls as $1/r^2$: $I = \dfrac{1367\ \text{W/m}^2}{(${$.r})^2} = ${texNum($.I)}\ \text{W/m}^2$`,
      String.raw`A mirror reverses the light's momentum, so $p = 2I/c$ and $F = \dfrac{2IA}{c} = \dfrac{2${pq($.I, 'W/m²')}${pq($.A, 'm²')}}{${qty(C_LIGHT, 'm/s')}} = ${texNum($.F)}\ \text{N}$`,
      String.raw`$a = \dfrac{F}{m} = \dfrac{${qty($.F, 'N')}}{${qty($.m, 'kg')}} = ${texNum($.a)}\ \text{m/s}^2$`,
    ],
    sim: {
      scenario: 'notes',
      setup(s, $) {
        Object.assign(s, { A: $.A, m: $.m, r: $.r });
      },
      read: (c) => ({ F: c.ss.F, a: c.ss.a }),
    },
    cases: [kase('the notes', { A: 196, m: 300, r: 1 }, { F: 1.79, a: 5.95e-6 })],
  }),

  // Class Activity 6 (Ch 55): rms fields, a detector's distance, solar cells, blackbody radiation.
  problem({
    ...E6, id: 'e6.55.rms-from-I', ch: '55', lab: 'emwave', src: 'Class Activity 6 #18', title: 'rms fields from intensity', kind: 'numeric', topics: ['intensity'],
    vars: { I: range(10, 2000, 10, 'W/m²') },
    derive: ($) => {
      const Erms = Math.sqrt($.I / (C_LIGHT * EPS0));
      return { Erms, Brms: Erms / C_LIGHT };
    },
    text: (T) => `An EM wave has an intensity of ${T.I} W/m². Find the rms electric field and the rms magnetic field.`,
    parts: [
      sym('E_sym', 'sqrt(I/(c*eps0))', { I: 'W/m^2' }, ($) => $.Erms, { unit: 'V/m', label: String.raw`$E_{\text{rms}}$ as a formula` }),
      num('Erms', ($) => $.Erms, 'V/m', { label: String.raw`$E_{\text{rms}}$` }),
      num('Brms', ($) => $.Brms, 'T', { label: String.raw`$B_{\text{rms}}$` }),
    ],
    steps: ($) => [
      String.raw`With rms fields there is no ½: $I = c\varepsilon_0E_{\text{rms}}^2$, so $E_{\text{rms}} = \sqrt{\dfrac{I}{c\varepsilon_0}} = \sqrt{\dfrac{${qty($.I, 'W/m²')}}{${pq(C_LIGHT, 'm/s')}${pq(EPS0, 'C²/N·m²')}}} = ${texNum($.Erms)}\ \text{V/m}$`,
      String.raw`$B_{\text{rms}} = \dfrac{E_{\text{rms}}}{c} = \dfrac{${qty($.Erms, 'V/m')}}{${qty(C_LIGHT, 'm/s')}} = ${texNum($.Brms)}\ \text{T}$`,
    ],
    sim: {
      scenario: 'sun',
      setup: (s, $) => void (s.E0 = Math.SQRT2 * $.Erms),
      read: (c, s, $) => ({ '@I in the lab': [c.em.Iavg, $.I] }),
    },
    cases: [kase('Class Activity 6 #18', { I: 200 }, { Erms: 274.5, Brms: 9.149e-7 })],
  }),
  problem({
    ...E6, id: 'e6.55.peak-to-rms', ch: '55', lab: 'emwave', src: 'Class Activity 6 #17', title: 'Peak and rms fields', kind: 'numeric', topics: ['intensity', 'poynting'],
    vars: { E0: range(10, 2000, 10, 'V/m') },
    derive: ($) => ({ Erms: $.E0 / Math.SQRT2, B0: $.E0 / C_LIGHT, Brms: $.E0 / Math.SQRT2 / C_LIGHT }),
    text: (T) => `The peak electric field of an EM wave in vacuum is ${T.E0} V/m. Find the rms electric field, the peak magnetic field and the rms magnetic field.`,
    parts: [
      num('Erms', ($) => $.Erms, 'V/m', { label: String.raw`$E_{\text{rms}}$` }),
      num('B0', ($) => $.B0, 'T', { label: String.raw`$B_0$` }),
      num('Brms', ($) => $.Brms, 'T', { label: String.raw`$B_{\text{rms}}$` }),
    ],
    steps: ($) => [
      String.raw`$E_{\text{rms}} = \dfrac{E_0}{\sqrt2} = \dfrac{${qty($.E0, 'V/m')}}{\sqrt2} = ${texNum($.Erms)}\ \text{V/m}$`,
      String.raw`$B_0 = \dfrac{E_0}{c} = \dfrac{${qty($.E0, 'V/m')}}{${qty(C_LIGHT, 'm/s')}} = ${texNum($.B0)}\ \text{T}$`,
      String.raw`$B_{\text{rms}} = \dfrac{B_0}{\sqrt2} = \dfrac{E_{\text{rms}}}{c} = ${texNum($.Brms)}\ \text{T}$`,
    ],
    sim: {
      scenario: 'green',
      setup: (s, $) => void (s.E0 = $.E0),
      read: (c) => ({ B0: c.em.B0 }),
    },
    cases: [kase('Class Activity 6 #17', { E0: 570 }, { Erms: 403.1, B0: 1.9e-6, Brms: 1.3435e-6 })],
  }),
  problem({
    ...E6, id: 'e6.55.detector-distance', ch: '55', lab: 'emwave', src: 'Class Activity 6 #19', title: 'How far is the detector?', kind: 'numeric', level: 2, topics: ['intensity'],
    vars: { P: range(1, 200, 1, 'W'), r: range(0.5, 10, 0.5, 'm'), E2: range(1, 50, 1, 'V/m') },
    derive: ($) => {
      const I1 = $.P / (4 * Math.PI * $.r ** 2);
      const I2 = C_LIGHT * EPS0 * $.E2 ** 2;
      return { I1, E1: Math.sqrt(I1 / (C_LIGHT * EPS0)), I2, R: Math.sqrt($.P / (4 * Math.PI * I2)) };
    },
    text: (T) => `A ${T.P} W light source radiates equally in all directions. (a) Find the rms electric field ${T.r} m from it. (b) A detector reads an rms field of ${T.E2} V/m. How far is it from the source?`,
    parts: [
      num('E1', ($) => $.E1, 'V/m', { label: String.raw`(a) $E_{\text{rms}}$` }),
      sym('R_sym', 'sqrt(P/(4*pi*c*eps0*E2^2))', { P: 'W', E2: 'V/m' }, ($) => $.R, { unit: 'm', label: String.raw`(b) $r$ as a formula, with $E_2$ the detector's reading` }),
      num('R', ($) => $.R, 'm', { label: '(b) Distance' }),
    ],
    steps: ($) => [
      String.raw`(a) $I = \dfrac{P}{4\pi r^2} = \dfrac{${qty($.P, 'W')}}{4\pi${pq($.r, 'm')}^2} = ${texNum($.I1)}\ \text{W/m}^2$, then $E_{\text{rms}} = \sqrt{\dfrac{I}{c\varepsilon_0}} = ${texNum($.E1)}\ \text{V/m}$`,
      String.raw`(b) Run it backward. $I = c\varepsilon_0E_{\text{rms}}^2 = ${pq(C_LIGHT, 'm/s')}${pq(EPS0, 'C²/N·m²')}${pq($.E2, 'V/m')}^2 = ${texNum($.I2)}\ \text{W/m}^2$`,
      String.raw`$r = \sqrt{\dfrac{P}{4\pi I}} = \sqrt{\dfrac{${qty($.P, 'W')}}{4\pi${pq($.I2, 'W/m²')}}} = ${texNum($.R)}\ \text{m}$`,
    ],
    cases: [kase('Class Activity 6 #19', { P: 20, r: 2, E2: 10 }, { E1: 12.24, R: 2.448 })],
  }),
  problem({
    ...E6, id: 'e6.55.solar-cell', ch: '55', src: 'Class Activity 6 #20', title: 'Electrical power from a tilted solar cell', kind: 'numeric', topics: ['intensity'],
    vars: { A: range(0.5, 10, 0.5, 'm²'), I: range(100, 1400, 50, 'W/m²'), eta: range(5, 40, 1, '%', 0.01), phi: range(5, 80, 5, '°') },
    derive: ($) => ({ P0: $.eta * $.I * $.A, P: $.eta * $.I * $.A * Math.cos($.phi * DEG) }),
    text: (T) => `A solar cell of area ${T.A} m² sits in sunlight of intensity ${T.I} W/m². It turns ${T.eta}% of the light power that reaches it into electrical power. How much electrical power does it make (a) facing the Sun, with the rays along its normal, and (b) tilted so the rays make ${T.phi}° with its normal?`,
    parts: [num('P0', ($) => $.P0, 'W', { label: '(a) Facing the Sun' }), num('P', ($) => $.P, 'W', { label: '(b) Tilted' })],
    steps: ($) => [
      String.raw`(a) $P = \eta IA = ${pq($.eta, '')}${pq($.I, 'W/m²')}${pq($.A, 'm²')} = ${texNum($.P0)}\ \text{W}$`,
      String.raw`(b) Tilted, the cell catches only the area seen along the beam: $P = \eta IA\cos\varphi = ${pq($.P0, 'W')}\cos ${texDeg($.phi)} = ${texNum($.P)}\ \text{W}$`,
    ],
    cases: [kase('Class Activity 6 #20', { A: 2, I: 800, eta: 15, phi: 50 }, { P0: 240, P: 154.3 })],
  }),
  problem({
    ...E6, id: 'e6.55.wien', ch: '55', src: 'Class Activity 6 #21', title: "Temperature from the peak wavelength (Wien's law)", kind: 'numeric', topics: ['blackbody'],
    vars: { lam: range(300, 12000, 10, 'nm', 1e-9) },
    derive: ($) => ({ T: WIEN / $.lam, TC: WIEN / $.lam - 273 }),
    text: (T) => `A hot object's emission spectrum peaks at ${T.lam} nm. Treat it as a blackbody. What is its temperature in kelvin and in degrees Celsius?`,
    parts: [num('T', ($) => $.T, 'K'), num('TC', ($) => $.TC, '°C', { abs: 1 })],
    steps: ($) => [
      String.raw`Wien's law: $T = \dfrac{2.898\times10^{-3}\ \text{m·K}}{\lambda_{\text{peak}}} = \dfrac{2.898\times10^{-3}}{${qty($.lam, 'm')}} = ${texNum($.T)}\ \text{K}$`,
      String.raw`$T_C = T - 273 = ${texNum($.TC)}\ ^\circ\text{C}$`,
    ],
    cases: [kase('Class Activity 6 #21', { lam: 630 }, { T: 4600, TC: 4327 })],
  }),
  problem({
    ...E6, id: 'e6.55.glowing-glass', ch: '55', src: 'Class Activity 6 #22', title: 'A glowing glass sphere: peak and power', kind: 'numeric', level: 2, topics: ['blackbody'],
    vars: { TC: range(500, 2500, 10, '°C'), T0C: range(0, 40, 1, '°C'), A: range(0.05, 1, 0.05, 'm²'), e: range(0.5, 1, 0.05, '') },
    derive: ($) => {
      const T = $.TC + 273;
      const T0 = $.T0C + 273;
      const lam = WIEN / T;
      return { T, T0, lam, band: spectrumBand(lam).id, P: $.e * SIGMA * $.A * T ** 4, Pnet: $.e * SIGMA * $.A * (T ** 4 - T0 ** 4) };
    },
    text: (T) => `A glassblower heats a glass sphere to ${T.TC} °C. Its surface area is ${T.A} m² and its emissivity is ${T.e}. The room is at ${T.T0C} °C. Find the peak wavelength it emits, and which band that is. Then find the power it radiates and its net radiated power. Use σ = 5.67 × 10⁻⁸ W/(m²·K⁴).`,
    parts: [
      num('lam', ($) => $.lam, 'nm', { scale: 1e-9, label: String.raw`$\lambda_{\text{peak}}$` }),
      mc('band', BAND_OPTS, ($) => $.band, { label: 'Band of the peak' }),
      num('P', ($) => $.P, 'W', { label: 'Power radiated' }),
      num('Pnet', ($) => $.Pnet, 'W', { label: 'Net power radiated' }),
    ],
    steps: ($) => [
      String.raw`Kelvin first: $T = ${$.TC} + 273 = ${$.T}\ \text{K}$ and $T_0 = ${$.T0C} + 273 = ${$.T0}\ \text{K}$`,
      String.raw`Wien: $\lambda_{\text{peak}} = \dfrac{2.898\times10^{-3}}{${$.T}} = ${texNum($.lam * 1e9)}\ \text{nm}$, in the ${bandName($.band).toLowerCase()}. The sphere glows red, but most of its power is infrared.`,
      String.raw`Stefan–Boltzmann: $P = e\sigma AT^4 = ${pq($.e, '')}(5.67\times10^{-8})${pq($.A, 'm²')}(${$.T})^4 = ${texNum($.P)}\ \text{W}$`,
      String.raw`Net: $P_{\text{net}} = e\sigma A\left(T^4 - T_0^4\right) = ${texNum($.Pnet)}\ \text{W}$. The room's share is tiny next to the glowing glass.`,
    ],
    cases: [kase('Class Activity 6 #22', { TC: 2000, T0C: 27, A: 0.3, e: 0.9 }, { lam: 1275, band: 'ir', P: 4.086e5, Pnet: 4.085e5 })],
  }),

  // ================================================================= 56
  problem({
    ...E6, id: 'e6.56.malus-two', ch: '56', lab: 'polar', title: 'Unpolarized light through two polarizers', kind: 'numeric', topics: ['polarization', 'malus'],
    vars: { I0: range(10, 2000, 10, 'W/m²'), th: range(0, 90, 5, '°') },
    derive: ($) => ({ I1: $.I0 / 2, I: ($.I0 / 2) * Math.cos($.th * DEG) ** 2 }),
    text: (T) => `Unpolarized light of intensity ${T.I0} W/m² passes through two polarizers whose axes are ${T.th}° apart. Find the intensity after each one.`,
    parts: [num('I1', ($) => $.I1, 'W/m²', { label: 'After the first' }), num('I', ($) => $.I, 'W/m²', { label: 'After the second', abs: 1e-6 })],
    steps: ($, f) => [
      String.raw`The first polarizer passes half: $I_1 = \tfrac12 I_0 = \tfrac12${pq($.I0, 'W/m²')} = ${texNum($.I1)}\ \text{W/m}^2$`,
      String.raw`Malus: $I = I_1\cos^2\theta = ${pq($.I1, 'W/m²')}\cos^2 ${texDeg($.th)} = ${texNum($.I)}\ \text{W/m}^2$`,
    ],
    sim: {
      scenario: '45',
      setup: (s, $) => void Object.assign(s, { n: 2, a: 0, b: $.th }),
      read: (c, s, $) => ({ I1: (c.pol.steps[1].I / s.I0) * $.I0, I: (c.pol.I / s.I0) * $.I0 }),
    },
    cases: [kase('45°', { I0: 1000, th: 45 }, { I1: 500, I: 250 })],
  }),
  problem({
    ...E6, id: 'e6.56.malus-three', ch: '56', lab: 'polar', title: 'Three polarizers', kind: 'numeric', level: 2, topics: ['polarization', 'malus'],
    vars: { I0: range(10, 2000, 10, 'W/m²'), a: range(0, 90, 5, '°'), b: range(0, 180, 5, '°') },
    derive: ($) => ({ I: ($.I0 / 2) * Math.cos($.a * DEG) ** 2 * Math.cos(($.b - $.a) * DEG) ** 2 }),
    text: (T) => `Unpolarized light (${T.I0} W/m²) passes through three polarizers with axes at 0°, ${T.a}° and ${T.b}°. Find the final intensity.`,
    parts: [num('I', ($) => $.I, 'W/m²', { abs: 1e-6 })],
    hints: ['Apply Malus using the angle between each pair of neighbouring filters.'],
    steps: ($, f) => [
      String.raw`$I = \tfrac{1}{2}I_0\cos^2(${texDeg($.a)})\cos^2(${texDeg($.b - $.a)}) = \tfrac12${pq($.I0, 'W/m²')}(${texNum(Math.cos($.a * DEG) ** 2)})(${texNum(Math.cos(($.b - $.a) * DEG) ** 2)}) = ${texNum($.I)}\ \text{W/m}^2$`,
    ],
    sim: {
      scenario: 'three',
      setup: (s, $) => void Object.assign(s, { n: 3, a: 0, b: $.a, c: $.b }),
      read: (c, s, $) => ({ I: (c.pol.I / s.I0) * $.I0 }),
    },
    cases: [kase('crossed + 45°', { I0: 1000, a: 45, b: 90 }, { I: 125 })],
  }),
  problem({
    ...E6, id: 'e6.56.polarized-in', ch: '56', lab: 'polar', title: 'Polarized light through one filter', kind: 'numeric', topics: ['polarization', 'malus'],
    vars: { I0: range(10, 2000, 10, 'W/m²'), th: range(0, 90, 5, '°') },
    derive: ($) => ({ I: $.I0 * Math.cos($.th * DEG) ** 2 }),
    text: (T) => `Vertically polarized light of intensity ${T.I0} W/m² hits a polarizer whose axis is ${T.th}° from vertical. Find the transmitted intensity.`,
    parts: [num('I', ($) => $.I, 'W/m²', { abs: 1e-6 })],
    steps: ($, f) => [
      String.raw`$I = I_0\cos^2\theta = ${pq($.I0, 'W/m²')}\cos^2 ${texDeg($.th)} = ${texNum($.I)}\ \text{W/m}^2$ — no factor of $\tfrac{1}{2}$, because the light is already polarized`,
    ],
    sim: {
      scenario: '45',
      setup: (s, $) => void Object.assign(s, { n: 2, a: 0, b: $.th }),
      read: (c, s, $) => ({ I: (c.pol.I / c.pol.steps[1].I) * $.I0 }),
    },
    cases: [kase('hand', { I0: 800, th: 30 }, { I: 600 })],
  }),
  problem({
    ...E6, id: 'e6.56.brewster', ch: '56', lab: 'refraction', title: "Brewster's angle", kind: 'numeric', topics: ['polarization', 'reflection'],
    vars: { m1: choice(['air', 'air'], ['water', 'water']), m2: choice(['water', 'water'], ['glass', 'glass'], ['diamond', 'diamond']) },
    derive: ($) => {
      const tB = (Math.atan(nOf($.m2) / nOf($.m1)) * 180) / Math.PI;
      return { tB, tr: 90 - tB };
    },
    valid: ($) => $.m1 !== $.m2,
    text: (T, $) => `Light in ${T.m1} (n = ${nOf($.m1)}) reflects off ${T.m2} (n = ${nOf($.m2)}). At what angle of incidence is the reflected light completely polarized, and what is the refraction angle then?`,
    parts: [num('tB', ($) => $.tB, '°', { label: String.raw`$\theta_B$`, abs: 0.2, tol: 0.005 }), num('tr', ($) => $.tr, '°', { label: String.raw`$\theta$ refracted`, abs: 0.2, tol: 0.005 })],
    steps: ($, f) => [
      String.raw`$\tan\theta_B = \dfrac{n_2}{n_1} = \dfrac{${nOf($.m2)}}{${nOf($.m1)}} \;\Longrightarrow\; \theta_B = ${texDeg($.tB)}$`,
      String.raw`The reflected and refracted rays are $90^\circ$ apart, so $\theta_r = 90^\circ - ${texDeg($.tB)} = ${texDeg($.tr)}$`,
    ],
    sim: {
      scenario: 'air-glass',
      setup: (s, $) => void Object.assign(s, { n1: $.m1, n2: $.m2, theta: Math.round($.tB * 2) / 2 }),
      read: (c, s, $) => ({ '@θ₁ + θ₂ ≈ 90° at Brewster (to 0.5°)': [(c.ref.th1 + c.ref.theta2) / DEG, 90] }),
    },
    cases: [kase('air → glass', { m1: 'air', m2: 'glass' }, { tB: 56.31, tr: 33.69 })],
  }),

  // ================================================================= 57
  problem({
    ...E6, id: 'e6.57.in-medium', ch: '57', lab: 'refraction', title: 'Light inside a medium', kind: 'numeric', topics: ['optics', 'index'],
    vars: { m: choice(['water', 'water'], ['glass', 'glass'], ['diamond', 'diamond']), lam: range(400, 700, 5, 'nm', 1e-9) },
    derive: ($) => ({ n: nOf($.m), v: C_LIGHT / nOf($.m), ln: $.lam / nOf($.m), f: C_LIGHT / $.lam }),
    text: (T, $) => `Light with a vacuum wavelength of ${T.lam} nm enters ${T.m} (n = ${$.n}). Find its speed, its wavelength, and its frequency in the ${T.m}.`,
    parts: [num('v', ($) => $.v, 'm/s'), num('ln', ($) => $.ln, 'nm', { scale: 1e-9, label: 'λ in the medium' }), num('f', ($) => $.f, 'Hz')],
    steps: ($, f) => [
      String.raw`$v = \dfrac{c}{n} = \dfrac{${qty(C_LIGHT, 'm/s')}}{${$.n}} = ${texNum($.v)}\ \text{m/s}$`,
      String.raw`$\lambda_n = \dfrac{\lambda_0}{n} = \dfrac{${qty($.lam * 1e9, 'nm')}}{${$.n}} = ${texNum($.ln * 1e9)}\ \text{nm}$`,
      String.raw`$f$ does not change: $f = \dfrac{c}{\lambda_0} = \dfrac{${qty(C_LIGHT, 'm/s')}}{${qty($.lam, 'm')}} = ${texNum($.f)}\ \text{Hz}$`,
    ],
    sim: { scenario: 'air-water', setup: (s, $) => void Object.assign(s, { n1: 'air', n2: $.m }) },
    cases: [kase('water', { m: 'water', lam: 600 }, { v: 2.2556e8, ln: 451.1, f: 5e14 })],
  }),
  problem({
    ...E6, id: 'e6.57.what-changes', ch: '57', lab: 'refraction', title: 'What changes when light enters glass?', kind: 'conceptual', topics: ['optics', 'index'],
    vars: { q: choice([1, 'speed'], [2, 'wavelength'], [3, 'frequency'], [4, 'perceived color']) },
    text: (T) => `Light passes from air into glass. What happens to its ${T.q}?`,
    parts: [
      mc('ans', ($) => ($.q === 4
        ? [[2, 'It shifts toward red'], [3, 'It shifts toward blue'], [0, 'It stays the same']]
        : [[-1, 'Decreases'], [0, 'Stays the same'], [1, 'Increases']]), ($) => ($.q <= 2 ? -1 : 0)),
    ],
    steps: () => [String.raw`$v = c/n$ and $\lambda = \lambda_0/n$ both drop. The frequency — and so the perceived colour — is set by the source and stays the same.`],
    cases: [kase('frequency', { q: 3 }, { ans: 0 })],
  }),
  problem({
    ...E6, id: 'e6.57.plane-mirror', ch: '57', lab: 'mirrors', title: 'Plane mirror', kind: 'numeric', topics: ['reflection'],
    vars: { d: range(0.5, 10, 0.5, 'm'), h: range(1, 2.2, 0.05, 'm'), v: range(0.5, 3, 0.5, 'm/s') },
    derive: ($) => ({ sep: 2 * $.d, closing: 2 * $.v, mirror: $.h / 2 }),
    text: (T) => `You stand ${T.d} m in front of a plane mirror and are ${T.h} m tall. How far away does your image appear? How fast does your image approach you if you walk toward the mirror at ${T.v} m/s? What is the minimum mirror height needed to see your whole body?`,
    parts: [num('sep', ($) => $.sep, 'm', { label: 'Distance to the image' }), num('closing', ($) => $.closing, 'm/s', { label: 'Approach speed' }), num('mirror', ($) => $.mirror, 'm', { label: 'Minimum mirror height' })],
    steps: ($) => [
      String.raw`The image is as far behind the mirror as you are in front: $2d = 2${pq($.d, 'm')} = ${texNum($.sep)}\ \text{m}$ from you`,
      String.raw`You and your image both move toward the mirror, so the gap closes at $2v = 2${pq($.v, 'm/s')} = ${texNum($.closing)}\ \text{m/s}$`,
      String.raw`By the law of reflection, the mirror needs half your height: $\tfrac12 h = \tfrac12${pq($.h, 'm')} = ${texNum($.mirror)}\ \text{m}$`,
    ],
    cases: [kase('hand', { d: 3, h: 1.8, v: 1 }, { sep: 6, closing: 2, mirror: 0.9 })],
  }),
  problem({
    ...E6, id: 'e6.57.two-mirrors', ch: '57', lab: 'mirrors', title: 'Images in two angled mirrors', kind: 'numeric', topics: ['reflection'],
    vars: { a: choice([90, '90°'], [72, '72°'], [60, '60°'], [45, '45°'], [36, '36°'], [30, '30°']) },
    derive: ($) => ({ N: 360 / $.a - 1 }),
    text: (T) => `Two plane mirrors meet at ${T.a}. How many images of an object between them do you see?`,
    parts: [num('N', ($) => $.N, 'images', { tol: 0 })],
    steps: ($, f) => [String.raw`$N = \dfrac{360^\circ}{\alpha} - 1 = \dfrac{360^\circ}{${$.a}^\circ} - 1 = ${texNum($.N)}$`],
    cases: [kase('60°', { a: 60 }, { N: 5 })],
  }),
  // Class Activity 6 (Ch 57): rays, reflection angles, absorption, color, scattering, shadows.
  problem({
    ...E6, id: 'e6.57.reflection-angle', ch: '57', lab: 'mirrors', src: 'Class Activity 6 #28', title: 'Angle of reflection measured from the surface', kind: 'numeric', topics: ['reflection'],
    vars: { th: range(5, 85, 1, '°') },
    derive: ($) => ({ tr: 90 - $.th, ti: 90 - $.th, between: 180 - 2 * $.th }),
    text: (T) => `A ray reflects off a flat surface. The reflected ray makes ${T.th}° with the surface. Find the angle of reflection, the angle of incidence, and the angle between the incoming and reflected rays.`,
    parts: [
      num('tr', ($) => $.tr, '°', { label: String.raw`$\theta_r$`, abs: 0.2 }),
      num('ti', ($) => $.ti, '°', { label: String.raw`$\theta_i$`, abs: 0.2 }),
      num('between', ($) => $.between, '°', { label: 'Between the rays', abs: 0.2 }),
    ],
    steps: ($) => [
      String.raw`Angles in optics are measured from the normal, which is $90^\circ$ from the surface: $\theta_r = 90^\circ - ${texDeg($.th)} = ${texDeg($.tr)}$`,
      String.raw`Law of reflection: $\theta_i = \theta_r = ${texDeg($.ti)}$`,
      String.raw`The two rays sit on either side of the normal: $\theta_i + \theta_r = ${texDeg($.between)}$`,
    ],
    cases: [kase('Class Activity 6 #28', { th: 30 }, { tr: 60, ti: 60, between: 120 })],
  }),
  problem({
    ...E6, id: 'e6.57.ray-ideas', ch: '57', src: 'Class Activity 6 #26, 27, 29', title: 'Rays, reflection and least time', kind: 'conceptual', topics: ['rays', 'reflection'],
    vars: {
      q: choice(
        [1, 'Which model of light treats it as traveling in straight lines?'],
        [2, 'Parallel rays hit a rough surface and leave in many directions. What is this called?'],
        [3, 'Parallel rays hit a smooth mirror and leave still parallel. What is this called?'],
        [4, 'By Fermat\'s principle, light goes from one point to another along the path of least what?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'ray', 2: 'diffuse', 3: 'specular', 4: 'time' }[$.q] }),
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ($.q === 1
        ? [['ray', 'The ray model'], ['wave', 'The wave model'], ['field', 'The field model']]
        : $.q === 4
          ? [['time', 'Time'], ['distance', 'Distance'], ['bends', 'Number of bends']]
          : [['diffuse', 'Diffuse reflection'], ['specular', 'Specular reflection'], ['refraction', 'Refraction']]), ($) => $.ans),
    ],
    steps: ($) => [
      {
        1: 'The ray model draws light as straight lines from point to point. It handles mirrors and lenses. It cannot explain interference or diffraction, which need the wave model.',
        2: 'Diffuse reflection. Each ray still obeys the law of reflection, but the rough surface tilts the normal every which way, so the rays scatter and no image forms.',
        3: 'Specular reflection. A smooth surface has one normal, so parallel rays stay parallel and form an image.',
        4: 'Least time. In one material that is the straight line. Off a mirror it gives the law of reflection, and across a boundary it gives refraction, where the shortest path is not the fastest.',
      }[$.q],
    ],
    cases: [
      kase('Class Activity 6 #26', { q: 1 }, { ans: 'ray' }),
      kase('Class Activity 6 #27', { q: 2 }, { ans: 'diffuse' }),
      kase('Class Activity 6 #29', { q: 4 }, { ans: 'time' }),
    ],
  }),
  problem({
    ...E6, id: 'e6.57.absorb-scatter', ch: '57', src: 'Class Activity 6 #30, 32', title: 'Absorption and scattering', kind: 'conceptual', topics: ['absorption', 'scattering'],
    vars: {
      q: choice(
        [1, 'When a material absorbs light, what does the light\'s energy become?'],
        [2, 'Which kind of scattering makes the sky blue?'],
        [3, 'Which kind of scattering makes clouds look white?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'thermal', 2: 'rayleigh', 3: 'mie' }[$.q] }),
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ($.q === 1
        ? [['thermal', 'Thermal energy in the material'], ['reflected', 'Reflected light'], ['scattered', 'Scattered light']]
        : [['rayleigh', 'Rayleigh scattering, by particles much smaller than the wavelength'], ['mie', 'Mie scattering, by particles larger than the wavelength'], ['none', 'Neither: scattering does not depend on size or color']]), ($) => $.ans),
    ],
    steps: ($) => [
      {
        1: 'The light drives the charges in the material. In absorption that energy ends up as faster jiggling of atoms and molecules: thermal energy. The material warms up.',
        2: String.raw`Rayleigh scattering by air molecules goes as $1/\lambda^4$. Blue (450 nm) scatters about $(700/450)^4 = 5.9$ times as strongly as red (700 nm), so scattered blue fills the sky.`,
        3: 'Cloud droplets are larger than the wavelength. Mie scattering from them barely depends on color, so the scattered light stays white.',
      }[$.q],
    ],
    cases: [kase('Class Activity 6 #30', { q: 1 }, { ans: 'thermal' }), kase('Class Activity 6 #32', { q: 2 }, { ans: 'rayleigh' })],
  }),
  problem({
    ...E6, id: 'e6.57.paper-color', ch: '57', src: 'Class Activity 6 #31', title: 'What color does the paper look?', kind: 'conceptual', topics: ['absorption'],
    vars: { r: choice(['red', 'red'], ['orange', 'orange'], ['yellow', 'yellow'], ['green', 'green'], ['blue', 'blue'], ['violet', 'violet'], ['all', 'every color'], ['none', 'no color']) },
    derive: ($) => ({ ans: $.r === 'all' ? 'black' : $.r === 'none' ? 'white' : $.r }),
    text: (T, $) => `White light falls on a sheet of paper. The paper ${$.r === 'all' ? 'absorbs every color' : $.r === 'none' ? 'absorbs none of the colors and reflects them all' : `absorbs every color except ${T.r}`}. What color does it look?`,
    parts: [
      mc('ans', [['red', 'Red'], ['orange', 'Orange'], ['yellow', 'Yellow'], ['green', 'Green'], ['blue', 'Blue'], ['violet', 'Violet'], ['black', 'Black'], ['white', 'White'], ['mix', 'A mix of the colors it absorbs']], ($) => $.ans),
    ],
    steps: ($) => [
      `We see the colors an object reflects, not the ones it absorbs. ${$.r === 'all' ? 'With nothing reflected, the paper looks black.' : $.r === 'none' ? 'Reflecting every color, the paper looks white.' : `Only ${$.r} is reflected, so the paper looks ${$.r}.`}`,
    ],
    cases: [kase('Class Activity 6 #31', { r: 'yellow' }, { ans: 'yellow' }), kase('absorbs all', { r: 'all' }, { ans: 'black' })],
  }),
  problem({
    ...E6, id: 'e6.57.shadow', ch: '57', src: 'Class Activity 6 #33', title: 'Umbra, penumbra and the source', kind: 'conceptual', topics: ['shadows'],
    vars: {
      q: choice(
        [1, 'Under a streetlight, a fire hydrant casts a shadow that is all umbra, with no penumbra. How is the streetlight acting?'],
        [2, 'A shadow has a dark core and a soft gray edge. How is the light source acting?'],
        [3, 'A small bulb lights a ball, which casts a shadow on a wall. The bulb moves closer to the ball. What happens to the shadow?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'point', 2: 'extended', 3: 'larger' }[$.q] }),
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ($.q === 3
        ? [['larger', 'It gets larger'], ['smaller', 'It gets smaller'], ['same', 'It stays the same size']]
        : [['point', 'As a point source'], ['extended', 'As an extended source'], ['either', 'Either one; it depends on the distance to the object']]), ($) => $.ans),
    ],
    steps: ($) => [
      {
        1: 'A point source sends rays from one point, so every spot behind the object is either fully lit or fully dark. All umbra, no penumbra, means the source acts as a point.',
        2: 'Some spots see part of an extended source and some see none. The part-lit spots are the penumbra, the soft gray edge.',
        3: 'Rays from the bulb fan out past the ball. Closer to the ball, they fan out at a wider angle, so the shadow on the wall grows.',
      }[$.q],
    ],
    cases: [kase('Class Activity 6 #33', { q: 1 }, { ans: 'point' }), kase('closer bulb', { q: 3 }, { ans: 'larger' })],
  }),
];
