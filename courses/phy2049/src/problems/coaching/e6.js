/** Exam 6 coaching (Ch 53–57) — see e1.js for the format. */
const BANDS = 'Going down in wavelength: radio (above 1 m), microwave (1 mm – 1 m), infrared (700 nm – 1 mm), visible (400–700 nm), ultraviolet (10–400 nm), X-ray (0.01–10 nm), gamma (below 0.01 nm).';
const SPECTRUM = 'Radio → microwave → infrared → visible → ultraviolet → X-ray → gamma: frequency rises and wavelength falls along that list.';
const SOURCE = 'The frequency is set by the source: the wave crests arrive at the boundary as often as they leave it, so it cannot change.';

export default {
  'e6.53.divergence': {
    hints: [
      String.raw`The small sphere is wholly inside the ball, so the charge it holds is $\rho$ times its own volume.`,
      String.raw`Gauss's law: $\Phi = Q_{\text{in}}/\varepsilon_0$. Convert r to metres before you cube it.`,
      String.raw`Divide by $V = \tfrac43\pi r^3$ and r cancels: $\Phi/V = \rho/\varepsilon_0$.`,
    ],
  },
  'e6.55.solar-sail': {
    hints: [
      String.raw`Sunlight spreads over a sphere, so $I = 1367\ \text{W/m}^2/r^2$ with r in AU.`,
      String.raw`A mirror sends the light back, reversing its momentum: the pressure is $2I/c$, twice the absorbed value.`,
      String.raw`$F = 2IA/c$, then Newton's second law: $a = F/m$.`,
    ],
  },
  'e6.53.radar-gun': {
    hints: [
      String.raw`The gun's own wavelength is $\lambda = c/f$, with f in hertz (1 GHz = 10⁹ Hz).`,
      String.raw`The car shifts the wave twice: once as a moving observer, once as a moving source. Each shift is $fv/c$.`,
      String.raw`So $\Delta f = 2fv/c$. A car closing in raises the echo's frequency.`,
    ],
  },
  'e6.53.f-from-lambda': {
    hints: [String.raw`In vacuum $c = f\lambda$, so $f = c/\lambda$ with λ in metres (nm × 10⁻⁹).`, String.raw`The period is $T = 1/f$.`],
  },
  'e6.53.B-from-E': {
    hints: [String.raw`In an EM wave in vacuum the fields are locked together: $E = cB$.`],
  },
  'e6.53.direction': {
    why: {
      dir: {
        1: String.raw`Work out $\vec{E}\times\vec{B}$ with $\hat{x}\times\hat{y} = \hat{z}$, $\hat{y}\times\hat{z} = \hat{x}$, $\hat{z}\times\hat{x} = \hat{y}$; reversing the order flips the sign.`,
        [-1]: String.raw`Work out $\vec{E}\times\vec{B}$ with $\hat{x}\times\hat{y} = \hat{z}$, $\hat{y}\times\hat{z} = \hat{x}$, $\hat{z}\times\hat{x} = \hat{y}$; reversing the order flips the sign.`,
        2: String.raw`The wave travels perpendicular to both $\vec{E}$ and $\vec{B}$, so it cannot move along either of them.`,
        [-2]: String.raw`The wave travels perpendicular to both $\vec{E}$ and $\vec{B}$, so it cannot move along either of them.`,
        3: String.raw`The wave travels perpendicular to both $\vec{E}$ and $\vec{B}$, so it cannot move along either of them.`,
        [-3]: String.raw`The wave travels perpendicular to both $\vec{E}$ and $\vec{B}$, so it cannot move along either of them.`,
      },
    },
  },
  'e6.53.wave-eq': {
    hints: [
      String.raw`Match the form $E_0\sin(kx - \omega t)$: the number in front of $x$ is $k$, and $\lambda = 2\pi/k$.`,
      String.raw`In vacuum $\omega = ck$, $f = \omega/2\pi$ and $B_0 = E_0/c$.`,
    ],
  },
  'e6.54.band': {
    hints: [BANDS],
    why: { band: { radio: BANDS, microwave: BANDS, ir: BANDS, vis: BANDS, uv: BANDS, xray: BANDS, gamma: BANDS } },
  },
  'e6.54.order': {
    hints: [SPECTRUM, 'All of them are light, so all travel at c in vacuum.'],
    why: {
      ans: {
        1: ($) => ($.qty === 3 ? 'Every EM wave travels at c in vacuum, whatever its band.' : SPECTRUM),
        2: ($) => ($.qty === 3 ? 'Every EM wave travels at c in vacuum, whatever its band.' : SPECTRUM),
        0: String.raw`Only the speed in vacuum is the same for every band. Frequency and wavelength differ, with $c = f\lambda$.`,
      },
    },
  },
  'e6.55.intensity': {
    hints: [String.raw`$I = \tfrac12 c\varepsilon_0 E_0^2$ — the ½ is the time average of $\sin^2$.`],
  },
  'e6.55.E-from-I': {
    hints: [String.raw`Turn $I = \tfrac12 c\varepsilon_0 E_0^2$ round: $E_0 = \sqrt{\dfrac{2I}{c\varepsilon_0}}$.`, String.raw`Then $B_0 = E_0/c$.`],
  },
  'e6.55.point-source': {
    hints: [
      String.raw`The power spreads over a sphere: $I = \dfrac{P}{4\pi r^2}$.`,
      String.raw`Then $E_0 = \sqrt{2I/(c\varepsilon_0)}$.`,
    ],
  },
  'e6.55.pressure': {
    hints: [
      String.raw`Absorbed light pushes with $p = I/c$; reflected light bounces back and pushes twice as hard, $p = 2I/c$.`,
      String.raw`Force = pressure × area.`,
    ],
  },
  'e6.56.malus-two': {
    hints: [
      'The first polarizer passes half of unpolarized light, whatever its angle.',
      String.raw`After that, Malus's law: $I_2 = I_1\cos^2\theta$, with θ between the two axes.`,
    ],
  },
  'e6.56.polarized-in': {
    hints: [String.raw`The light is already polarized, so there is no factor of ½: $I = I_0\cos^2\theta$.`],
  },
  'e6.56.brewster': {
    hints: [
      String.raw`Brewster's angle: $\tan\theta_B = \dfrac{n_2}{n_1}$.`,
      String.raw`At Brewster's angle the reflected and refracted rays are 90° apart, so $\theta_r = 90^\circ - \theta_B$.`,
    ],
  },
  'e6.57.in-medium': {
    hints: [
      String.raw`$v = c/n$ and $\lambda = \lambda_0/n$.`,
      String.raw`The frequency does not change: $f = c/\lambda_0$, the same as in vacuum.`,
    ],
  },
  'e6.57.what-changes': {
    hints: [String.raw`$v = c/n$ and $\lambda = \lambda_0/n$. Which quantity is fixed by the source?`],
    why: {
      ans: {
        [-1]: SOURCE,
        0: ($) => ($.q === 1 ? String.raw`Glass has $n > 1$, so light slows down: $v = c/n$.` : String.raw`The speed drops but the frequency does not, so the wavelength shrinks: $\lambda = \lambda_0/n$.`),
        1: ($) => ($.q === 3 ? SOURCE : String.raw`Glass has $n > 1$: $v = c/n$ and $\lambda = \lambda_0/n$ both get smaller.`),
        2: 'Colour follows frequency, and the frequency is set by the source, so the colour does not change.',
        3: 'Colour follows frequency, and the frequency is set by the source, so the colour does not change.',
      },
    },
  },
  'e6.57.plane-mirror': {
    hints: [
      'A plane-mirror image is as far behind the mirror as you are in front of it.',
      'Walking toward the mirror, you and your image both close in. For the minimum height, trace rays from your eyes to your feet and head: the mirror needs only half your height.',
    ],
  },
  'e6.57.two-mirrors': {
    hints: [String.raw`Two mirrors at angle θ make $\dfrac{360^\circ}{\theta} - 1$ images (when 360°/θ is a whole number).`],
  },

  // Class Activity 6 problems
  'e6.53.wave-terms': {
    hints: ['Look at the units the question names. A time is the period, a distance is the wavelength, a count per second is the frequency.'],
    why: {
      ans: {
        1: 'The period is a time: how long one cycle takes.',
        2: 'The wavelength is a distance: how far the wave moves in one cycle.',
        3: 'The frequency counts cycles each second. It is 1/T.',
        4: 'The amplitude is the peak value of the field, not a time or a distance.',
        5: String.raw`The speed is distance per time, $v = \lambda/T$. It is built from the period and the wavelength.`,
      },
    },
  },
  'e6.53.true-or-false': {
    hints: [
      String.raw`In vacuum every EM wave moves at $c$. Then $\lambda = c/f$ and one photon carries $E = hf$.`,
      String.raw`$\vec E$, $\vec B$ and the direction of travel are mutually perpendicular. An EM wave needs no medium.`,
    ],
  },
  'e6.53.light-year': {
    hints: [
      'A light-year is a distance: how far light goes in one year. So light from N light-years away takes N years.',
      String.raw`$1\ \text{ly} = c \times (1\ \text{yr}) = (3.00\times10^8\ \text{m/s})(3.156\times10^7\ \text{s})$.`,
    ],
  },
  'e6.53.photon-color': {
    hints: [String.raw`One photon carries $E = hf = hc/\lambda$. Which color has the highest frequency, which the lowest?`],
    why: {
      ans: {
        red: ($) => ($.q === 1 ? 'Red has the longest wavelength and lowest frequency of these, so its photons carry the least energy.' : 'Red is right for "least"; check which way the question asks.'),
        yellow: 'Yellow sits between red and green. It is neither the highest nor the lowest frequency here.',
        green: 'Green sits between yellow and blue. It is neither the highest nor the lowest frequency here.',
        blue: ($) => ($.q === -1 ? 'Blue has the shortest wavelength and highest frequency of these, so its photons carry the most energy.' : 'Blue is right for "most"; check which way the question asks.'),
        same: String.raw`All photons travel at the same speed, but their energy is $E = hf$. It grows with frequency.`,
      },
    },
  },
  'e6.53.photon-energy': {
    hints: [String.raw`$E = hc/\lambda$, with $\lambda$ in metres (nm × 10⁻⁹).`, String.raw`Divide joules by $1.6\times10^{-19}$ J/eV for electron-volts.`],
  },
  'e6.53.redshift': {
    hints: [
      String.raw`Light's Doppler formula: $f' = f\sqrt{\dfrac{1+v/c}{1-v/c}}$, with $v$ positive when approaching and negative when receding.`,
      String.raw`Receding lowers the frequency, a red shift. Approaching raises it, a blue shift. The first-order shortcut $f' \approx f(1 + v/c)$ is close but not exact at these speeds.`,
    ],
    why: {
      shift: {
        red: 'An approaching source crowds the crests together, so the frequency goes up: a blue shift.',
        blue: 'A receding source spreads the crests out, so the frequency goes down: a red shift.',
        none: 'Any relative motion along the line of sight shifts the frequency.',
      },
    },
  },
  'e6.54.rank-energy': {
    hints: [String.raw`$E = hf$, so photon energy follows frequency. From lowest: radio, microwave, infrared, visible, ultraviolet, X-ray, gamma.`],
  },
  'e6.54.uses': {
    hints: [BANDS, 'Think about wavelength: phones and ovens use centimetre waves, warm objects glow in the infrared, and the most penetrating radiation is X-ray or gamma.'],
  },
  'e6.54.source': {
    hints: ['The bigger the energy jump that makes a photon, the higher its band. Antennas make the lowest energies, nuclei the highest.'],
  },
  'e6.54.lambda-from-f': {
    hints: [String.raw`$\lambda = c/f$, with $f$ in hertz (1 GHz = 10⁹ Hz, 1 MHz = 10⁶ Hz, 1 kHz = 10³ Hz).`, BANDS],
  },
  'e6.55.rms-from-I': {
    hints: [
      String.raw`With rms fields there is no ½: $I = c\varepsilon_0E_{\text{rms}}^2$.`,
      String.raw`Then $B_{\text{rms}} = E_{\text{rms}}/c$.`,
    ],
  },
  'e6.55.peak-to-rms': {
    hints: [String.raw`rms is peak over $\sqrt2$: $E_{\text{rms}} = E_0/\sqrt2$.`, String.raw`$E = cB$ holds for peaks and for rms values alike.`],
  },
  'e6.55.detector-distance': {
    hints: [
      String.raw`(a) $I = P/4\pi r^2$, then $E_{\text{rms}} = \sqrt{I/(c\varepsilon_0)}$.`,
      String.raw`(b) Go backward: $I = c\varepsilon_0E_{\text{rms}}^2$, then $r = \sqrt{P/(4\pi I)}$.`,
    ],
  },
  'e6.55.solar-cell': {
    hints: [
      String.raw`Light power reaching the cell: $IA\cos\varphi$, with $\varphi$ measured from the normal.`,
      String.raw`Electrical power out is the efficiency times that: $P = \eta IA\cos\varphi$, with $\eta$ as a decimal.`,
    ],
  },
  'e6.55.wien': {
    hints: [String.raw`Wien's law: $\lambda_{\text{peak}}T = 2.898\times10^{-3}$ m·K, with $\lambda$ in metres.`, String.raw`Then $T_C = T - 273$.`],
  },
  'e6.55.glowing-glass': {
    hints: [
      'Convert both temperatures to kelvin before anything else.',
      String.raw`Wien gives the peak: $\lambda = 2.898\times10^{-3}/T$. Stefan–Boltzmann gives the power: $P = e\sigma AT^4$, and $P_{\text{net}} = e\sigma A(T^4 - T_0^4)$.`,
    ],
  },
  'e6.57.reflection-angle': {
    hints: ['Optics measures angles from the normal, not from the surface. The normal is 90° from the surface.', String.raw`Then the law of reflection: $\theta_i = \theta_r$.`],
  },
  'e6.57.ray-ideas': {
    hints: ['Rays are straight lines. A smooth surface keeps parallel rays parallel; a rough one scatters them. Light takes the quickest path.'],
  },
  'e6.57.absorb-scatter': {
    hints: [String.raw`Absorbed light warms the material. Small particles scatter as $1/\lambda^4$, strongly favoring blue; large droplets scatter all colors alike.`],
  },
  'e6.57.paper-color': {
    hints: ['You see the light that comes back to your eye: the colors the paper reflects. Absorbed colors never reach you.'],
    why: {
      ans: {
        mix: 'Absorbed light becomes heat in the paper. It never reaches your eye, so it adds nothing to the color.',
        black: 'Black means nothing is reflected. Here some color still comes back.',
        white: 'White means every color is reflected. Here some colors are absorbed.',
      },
    },
  },
  'e6.57.shadow': {
    hints: ['From a single point, every spot behind the object is lit or dark. From a source with size, some spots see part of it: the penumbra.'],
  },
};
