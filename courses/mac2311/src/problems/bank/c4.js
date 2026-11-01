import { simpson } from '@flux/subjects/math/quadrature.js';
import { formulaFamily, numericFamily, conceptFamily, citation } from './rework-kit.js';
const S = (p) => citation(5, p),
  A = (p) => citation(4, p),
  ch = 'v2.3',
  exam = 'c4';
/** Integral identity checked independently by differentiating the proposed primitive. */
function primitive(ask, key, F, f, reason, source, alt, wrong, at = 0.6) {
  return {
    ask: 'Find one antiderivative; omit the arbitrary constant. ' + ask,
    key,
    get: F,
    second: (x) => {
      const h = 1e-5,
        df = (F(x + h) - F(x - h)) / (2 * h);
      if (Math.abs(df - f(x)) > 1e-4 * Math.max(1, Math.abs(f(x))))
        throw Error('Primitive derivative disagrees');
      return F(x);
    },
    reason,
    source,
    alt,
    wrong,
    at,
    check: 'Differentiate this result to recover the entire integrand, including its scale factors.',
  };
}
const sym = (id, title, topics, forms, hints, level = 2) =>
  formulaFamily({ id: 'c4.' + id, exam, ch, title, topics, forms, hints, level });
const B = [
  sym(
    'parts',
    'Simplify one factor',
    ['parts', 'symbolic'],
    {
      linear: primitive(
        String.raw`$\int xe^x\,dx$.`,
        '(x-1)*exp(x)',
        (x) => (x - 1) * Math.exp(x),
        (x) => x * Math.exp(x),
        'Set u=x and dv=eˣdx. Subtract the remaining exponential integral.',
        S('5F-2(a)'),
        'x*exp(x)-exp(x)',
        'x*exp(x)',
      ),
      quadratic: primitive(
        String.raw`$\int x^2e^x\,dx$.`,
        '(x^2-2*x+2)*exp(x)',
        (x) => (x * x - 2 * x + 2) * Math.exp(x),
        (x) => x * x * Math.exp(x),
        'Apply parts twice; the first reduction leaves twice the linear-exponential integral.',
        S('5F-2(b)'),
        'exp(x)*x^2-2*x*exp(x)+2*exp(x)',
        '(x^2+2*x+2)*exp(x)',
      ),
    },
    [
      'Reverse the product rule. Choose u to become simpler under differentiation.',
      'For a polynomial times an exponential, repeat until the polynomial becomes constant.',
    ],
  ),
  sym(
    'cycle',
    'Solve for an integral that returns',
    ['parts', 'symbolic'],
    {
      exponential: primitive(
        String.raw`$\int e^x\cos x\,dx$.`,
        'exp(x)*(sin(x)+cos(x))/2',
        (x) => (Math.exp(x) * (Math.sin(x) + Math.cos(x))) / 2,
        (x) => Math.exp(x) * Math.cos(x),
        'Two integrations by parts return the negative of the original integral. Move it left and divide by two.',
        S('5F-4'),
        '(exp(x)*sin(x)+exp(x)*cos(x))/2',
        'exp(x)*(sin(x)+cos(x))',
      ),
      log: primitive(
        String.raw`$\int\cos(\ln x)\,dx$, $x>0$.`,
        'x*(cos(ln(x))+sin(ln(x)))/2',
        (x) => (x * (Math.cos(Math.log(x)) + Math.sin(Math.log(x)))) / 2,
        (x) => Math.cos(Math.log(x)),
        'Take dv=dx twice. The second round returns the original integral with a minus sign.',
        S('5F-5'),
        '(x*cos(ln(x))+x*sin(ln(x)))/2',
        'x*cos(ln(x))',
      ),
    },
    [
      'A repeated integral can be treated as an unknown in an equation.',
      'Keep the sign on the returning integral before moving it across the equals sign.',
    ],
    3,
  ),
  sym(
    'odd',
    'Save the differential factor',
    ['trig integrals'],
    {
      sine: primitive(
        String.raw`$\int\sin^3x\cos^2x\,dx$.`,
        '-cos(x)^3/3+cos(x)^5/5',
        (x) => -(Math.cos(x) ** 3) / 3 + Math.cos(x) ** 5 / 5,
        (x) => Math.sin(x) ** 3 * Math.cos(x) ** 2,
        'Save sin x dx, set u=cos x, and integrate −u²+u⁴.',
        S('5C-5'),
        'cos(x)^5/5-cos(x)^3/3',
        'cos(x)^3/3-cos(x)^5/5',
      ),
      cosine: primitive(
        String.raw`$\int\cos^3(3x)\,dx$.`,
        'sin(3*x)/3-sin(3*x)^3/9',
        (x) => Math.sin(3 * x) / 3 - Math.sin(3 * x) ** 3 / 9,
        (x) => Math.cos(3 * x) ** 3,
        'Save cos(3x)dx and use u=sin(3x). The differential contributes a factor 1/3.',
        S('5C-4'),
        '(3*sin(3*x)-sin(3*x)^3)/9',
        'sin(3*x)-sin(3*x)^3/3',
      ),
    },
    [
      'Save one factor whose partner has a convenient derivative.',
      'Replace the remaining even power with a Pythagorean identity, then transform dx.',
    ],
  ),
  sym(
    'even',
    'Lower an even power',
    ['trig integrals'],
    {
      square: primitive(
        String.raw`$\int\sin^2x\,dx$.`,
        'x/2-sin(2*x)/4',
        (x) => x / 2 - Math.sin(2 * x) / 4,
        (x) => Math.sin(x) ** 2,
        'Use sin²x=(1−cos2x)/2, then integrate the doubled angle.',
        S('5C-1'),
        '(2*x-sin(2*x))/4',
        'x/2-sin(2*x)/2',
      ),
      fourth: primitive(
        String.raw`$\int\sin^4x\,dx$.`,
        '3*x/8-sin(2*x)/4+sin(4*x)/32',
        (x) => (3 * x) / 8 - Math.sin(2 * x) / 4 + Math.sin(4 * x) / 32,
        (x) => Math.sin(x) ** 4,
        'Square the half-angle identity; lower cos²2x once more.',
        S('5C-3'),
        '(12*x-8*sin(2*x)+sin(4*x))/32',
        '3*x/8-sin(2*x)/4+sin(4*x)/8',
      ),
    },
    [
      'An even power needs an identity before a differential appears.',
      'Lower the power first; remember the reciprocal of each angle multiplier when integrating.',
    ],
  ),
  sym(
    'root',
    'Choose a branch before removing a root',
    ['trig sub', 'symbolic'],
    {
      inverse: primitive(
        String.raw`$\int(16-x^2)^{-3/2}\,dx$, $|x|<4$.`,
        'x/(16*sqrt(16-x^2))',
        (x) => x / (16 * Math.sqrt(16 - x * x)),
        (x) => (16 - x * x) ** -1.5,
        'Let x=4sinθ on the principal sine branch. The transformed integral is sec²θ/16.',
        S('5D-1, a=4 parameter substitution'),
        'x/16/(sqrt(16-x^2))',
        'x/sqrt(16-x^2)',
      ),
      cubic: primitive(
        String.raw`$\int x^3/\sqrt{16-x^2}\,dx$, $|x|<4$.`,
        '-16*sqrt(16-x^2)+(16-x^2)^(3/2)/3',
        (x) => -16 * Math.sqrt(16 - x * x) + (16 - x * x) ** 1.5 / 3,
        (x) => x ** 3 / Math.sqrt(16 - x * x),
        'The root substitution u=16−x² also works. Express x² as 16−u before integrating.',
        S('5D-2, a=4 parameter substitution'),
        '(16-x^2)^(3/2)/3-16*sqrt(16-x^2)',
        '4*sqrt(16-x^2)-(16-x^2)^(3/2)/3',
      ),
    },
    [
      'Match a root to a Pythagorean identity and restrict the angle.',
      'Transform the differential and every remaining x factor, not only the square root.',
    ],
  ),
  sym(
    'quadratic',
    'A numerator can split into two methods',
    ['trig sub'],
    {
      mixed: primitive(
        String.raw`$\int (x+1)/(x^2+4)\,dx$.`,
        'ln(x^2+4)/2+atan(x/2)/2',
        (x) => Math.log(x * x + 4) / 2 + Math.atan(x / 2) / 2,
        (x) => (x + 1) / (x * x + 4),
        'The x numerator gives a logarithm by substitution; the constant gives a scaled arctangent.',
        S('5D-3'),
        '(ln(x^2+4)+atan(x/2))/2',
        'ln(x^2+4)/2+atan(x/2)',
      ),
      shifted: primitive(
        String.raw`$\int (x^2+4x+13)^{-3/2}\,dx$.`,
        '(x+2)/(9*sqrt(x^2+4*x+13))',
        (x) => (x + 2) / (9 * Math.sqrt(x * x + 4 * x + 13)),
        (x) => (x * x + 4 * x + 13) ** -1.5,
        'Complete the square: (x+2)²+9. Set x+2=3tanθ; the remaining integral is cosθ/9.',
        S('5D-10'),
        '(x+2)/9/sqrt((x+2)^2+9)',
        '(x+2)/sqrt(x^2+4*x+13)',
      ),
    },
    [
      'Complete the square before choosing a trigonometric substitution.',
      'A quadratic with a linear numerator often splits into a derivative-over-function term and an arctangent.',
    ],
  ),
  sym(
    'distinct',
    'Decompose before integrating',
    ['partial fractions'],
    {
      constant: primitive(
        String.raw`$\int dx/[(x-2)(x+3)]$, on $x>2$.`,
        'ln(abs(x-2))/5-ln(x+3)/5',
        (x) => (Math.log(Math.abs(x - 2)) - Math.log(x + 3)) / 5,
        (x) => 1 / ((x - 2) * (x + 3)),
        'The coefficients are 1/5 and −1/5. Their sum must cancel the x term in the numerator.',
        S('5E-1'),
        'ln(abs((x-2)/(x+3)))/5',
        'ln(abs(x-2))-ln(x+3)',
        3,
      ),
      linear: primitive(
        String.raw`$\int x\,dx/[(x-2)(x+3)]$, on $x>2$.`,
        '2*ln(abs(x-2))/5+3*ln(x+3)/5',
        (x) => (2 * Math.log(Math.abs(x - 2)) + 3 * Math.log(x + 3)) / 5,
        (x) => x / ((x - 2) * (x + 3)),
        'Cover each factor: the coefficients are 2/5 and 3/5. Recombine to check the numerator.',
        S('5E-2'),
        '(2*ln(abs(x-2))+3*ln(x+3))/5',
        '2*ln(abs(x-2))/5-3*ln(x+3)/5',
        3,
      ),
    },
    [
      'A proper rational function can be decomposed after factoring its denominator.',
      'Clear denominators, then substitute each simple root to isolate a coefficient.',
    ],
  ),
  sym(
    'repeated',
    'Include every power and numerator degree',
    ['partial fractions'],
    {
      repeat: primitive(
        String.raw`$\int (3x+2)/[x(x+1)^2]\,dx$, $x>0$.`,
        '2*ln(x)-2*ln(x+1)-1/(x+1)',
        (x) => 2 * Math.log(x) - 2 * Math.log(x + 1) - 1 / (x + 1),
        (x) => (3 * x + 2) / (x * (x + 1) ** 2),
        'Use 2/x−2/(x+1)+1/(x+1)². The final power integrates to a negative reciprocal, not another logarithm.',
        S('5E-5'),
        '2*ln(x/(x+1))-1/(x+1)',
        '2*ln(x)-2*ln(x+1)+1/(x+1)',
      ),
      irreducible: primitive(
        String.raw`$\int (2x-9)/[(x^2+9)(x+2)]\,dx$, $x>0$.`,
        'ln(x^2+9)/2-ln(x+2)',
        (x) => Math.log(x * x + 9) / 2 - Math.log(x + 2),
        (x) => (2 * x - 9) / ((x * x + 9) * (x + 2)),
        'Allow (Ax+B)/(x²+9). Recombination gives A=1, B=0, and the simple-factor coefficient −1.',
        S('5E-6'),
        'ln((x^2+9)/(x+2)^2)/2',
        'ln(x^2+9)-ln(x+2)',
      ),
    },
    [
      'A repeated linear factor needs every power up to its multiplicity.',
      'An irreducible quadratic needs a general linear numerator. Solve coefficients before integrating.',
    ],
    3,
  ),
  numericFamily({
    id: 'c4.arc',
    exam,
    ch: 'v2.2',
    title: 'Length uses slant, not height',
    topics: ['arc length'],
    lab: 'technique',
    sim: ($) => ({
      lab: 'technique',
      scenario: 'arcLog',
      read: (c) => ({ answer: $.v.reversed ? -c.integral : c.integral }),
    }),
    hints: [
      'Derive ds from the distance formula.',
      'For y=ln(sin x), use 1+cot²x=csc²x on an interval where sin x is positive.',
    ],
    forms: {
      length: {
        ask: 'Find the length of y=ln(sin x) from x=π/4 to π/2.',
        answer: Math.log(1 + Math.SQRT2),
        second: () => simpson((x) => Math.hypot(1, Math.cos(x) / Math.sin(x)), Math.PI / 4, Math.PI / 2),
        reason: 'The positive slant is csc x. Integrating it gives ln tan(x/2); subtract endpoint values.',
        source: S('5C-13'),
        traps: [
          [Math.log(Math.SQRT2), 'That is only the vertical change in the graph, not its path length.'],
          [Math.PI / 4, 'That is the horizontal span. The slant factor exceeds one.'],
        ],
      },
      oriented: {
        ask: 'Evaluate the signed integral of √(1+cot²x) from π/2 down to π/4. This is an oriented integral, not a physical length.',
        answer: -Math.log(1 + Math.SQRT2),
        second: () => simpson((x) => 1 / Math.sin(x), Math.PI / 2, Math.PI / 4),
        reversed: true,
        reason:
          'The integrand stays positive but the limits are reversed. A physical length would keep the positive value.',
        traps: [
          [
            Math.log(1 + Math.SQRT2),
            'Those are the opposite limits. A definite integral changes sign under reversal.',
          ],
          [-Math.PI / 4, 'That omits the slant factor. The magnitude exceeds the horizontal span.'],
        ],
      },
    },
  }),
  numericFamily({
    id: 'c4.surface',
    level: 1,
    exam,
    ch: 'v2.2',
    title: 'A radius times a slant',
    topics: ['arc length', 'surface area'],
    lab: 'technique',
    sim: ($) => ({
      lab: 'technique',
      scenario: $.v.half ? 'coneY' : 'cone',
      read: (c) => ({ answer: c.integral }),
    }),
    hints: [
      'A narrow band has area circumference times slant width.',
      'For y=1−2x, the slant multiplier is √5. Determine the radius from the chosen axis.',
    ],
    forms: {
      xaxis: {
        ask: 'Rotate y=1−2x, 0≤x≤1/2, about the x axis. Find the lateral surface area without an end cap.',
        answer: (Math.PI * Math.sqrt(5)) / 2,
        second: () => simpson((x) => 2 * Math.PI * (1 - 2 * x) * Math.hypot(1, -2), 0, 0.5),
        reason: 'The radius is y and ds=√5 dx. Integrate 2π(1−2x)√5.',
        source: A('4G-2'),
        traps: [
          [Math.PI / 2, 'That omits the slant factor √5.'],
          [Math.PI * Math.sqrt(5), 'That doubles a surface already traced once.'],
        ],
      },
      yaxis: {
        ask: 'Rotate y=1−2x, 0≤x≤1/2, about the y axis. Find the lateral surface area without an end cap.',
        answer: (Math.PI * Math.sqrt(5)) / 4,
        second: () => Math.PI * 0.5 * Math.hypot(0.5, 1),
        half: true,
        reason: 'The radius is x. Integrate 2πx√5 from zero to 1/2, or use cone area πrℓ.',
        source: A('4G-3, final value; rewritten using x as parameter'),
        traps: [
          [(Math.PI * Math.sqrt(5)) / 2, 'That uses y as the radius, so it rotates about the other axis.'],
          [Math.PI / 4, 'That uses the horizontal differential without its slant multiplier.'],
        ],
      },
    },
  }),
];
const concepts = {
  choice: {
    title: 'Choose a transformation that can finish',
    topics: ['parts'],
    forms: {
      parts: {
        ask: 'For ∫x²eˣ dx, why is u=x² preferable to u=eˣ?',
        source: S('5F-2(b), method interpretation'),
        options: [
          [
            'Differentiation lowers the polynomial degree; the exponential integrates without increasing complexity.',
            'This makes the remaining polynomial simpler at each step.',
          ],
          [
            'The product rule has only one term.',
            'The second product-rule term is precisely the integral that must be retained.',
          ],
          [
            'All choices of u give equally short work.',
            'Valid choices can increase the polynomial degree and make the new integral harder.',
          ],
        ],
      },
      cycle: {
        ask: 'After parts twice, I=A−I. What is the next valid operation?',
        source: S('5F-4, displayed returning-integral equation'),
        options: [
          [
            'Add I to both sides, then divide by two.',
            'The repeated integral is an algebraic unknown; 2I=A.',
          ],
          ['Discard the returning I as a constant.', 'I depends on x and cannot be absorbed into C.'],
          [
            'Conclude that no antiderivative exists.',
            'A returning integral can close the calculation through algebra.',
          ],
        ],
      },
    },
  },
  differential: {
    title: 'The missing differential matters',
    topics: ['trig sub'],
    forms: {
      branch: {
        ask: 'With x=2sinθ and −π/2≤θ≤π/2, why can √(4−x²) be written as 2cosθ?',
        source: S('5D-1, principal branch interpretation'),
        options: [
          [
            'Cosθ is nonnegative on that branch.',
            'The general square-root identity is √(cos²θ)=|cosθ|; the chosen interval removes the absolute value.',
          ],
          [
            'A square root always cancels a square with no sign condition.',
            'For a negative quantity the square root of its square gives its opposite.',
          ],
          ['The differential dx is then dθ.', 'The differential is 2cosθ dθ and must also be transformed.'],
        ],
      },
      even: {
        ask: 'Why does u=sin x fail to turn ∫sin²x dx directly into ∫u² du?',
        source: S('5C-1, method interpretation'),
        options: [
          [
            'du=cos x dx; that factor is absent.',
            'The differential cannot be changed without accounting for its derivative. Half-angle reduction supplies an integrable expression.',
          ],
          ['Sin²x has no antiderivative.', 'Half-angle reduction gives an elementary primitive.'],
          [
            'Because substitution only works for odd functions.',
            'Substitution depends on the chain rule, not parity alone.',
          ],
        ],
      },
    },
  },
  decomposition: {
    title: 'A complete rational ansatz',
    topics: ['partial fractions'],
    forms: {
      repeated: {
        ask: 'What form is needed for a proper rational denominator x(x+1)²?',
        source: S('5E-5, decomposition interpretation'),
        options: [
          ['A/x+B/(x+1)+C/(x+1)².', 'Every power of the repeated linear factor must appear.'],
          ['A/x+B/(x+1)² alone.', 'That omits a needed independent numerator coefficient.'],
          [
            'Only logarithms, with no rational term in the primitive.',
            'The squared-factor term integrates to a reciprocal.',
          ],
        ],
      },
      quadratic: {
        ask: 'For a proper denominator (x²+9)(x+2), what numerator belongs over x²+9?',
        source: S('5E-6, ansatz interpretation'),
        options: [
          [
            'Ax+B before coefficients are solved.',
            'Its degree must be less than two, so a general linear numerator is required.',
          ],
          ['A constant must always suffice.', 'A linear term may be required by the original numerator.'],
          ['Ax²+Bx+C.', 'A quadratic numerator is not proper and duplicates a polynomial component.'],
        ],
      },
    },
  },
  geometry: {
    title: 'Which geometric quantity is being added?',
    topics: ['arc length', 'surface area'],
    forms: {
      slant: {
        ask: 'Why is ∫2πy dx generally too small for a surface rotated around the x axis?',
        source: A('4G-1, band-area interpretation'),
        options: [
          [
            'It omits the slant width ds=√(1+y′²)dx.',
            'Each band follows the curve, not its horizontal projection.',
          ],
          [
            'Every integral needs a factor of two.',
            'The missing multiplier depends on the slope, not a universal constant.',
          ],
          ['The correct integrand is πy².', 'That adds disk volumes per dx, not surface bands.'],
        ],
      },
      polygon: {
        ask: 'Why do inscribed cable chords approach smooth length from below?',
        source: 'OpenStax Calculus Volume 2, §2.4, arc-length polygon construction',
        options: [
          [
            'Each straight chord is no longer than its corresponding curve segment.',
            'Refinement follows the curve more closely while the smooth length stays fixed.',
          ],
          [
            'More polygon segments make the real cable grow.',
            'Only the approximation changes; the physical curve is fixed.',
          ],
          [
            'Cable length equals horizontal span for every sag.',
            'A nonzero slope gives a slant multiplier greater than one.',
          ],
        ],
      },
    },
  },
};
for (const [id, v] of Object.entries(concepts))
  B.push(
    conceptFamily({
      id: 'c4.' + id,
      exam,
      ch,
      title: v.title,
      topics: v.topics,
      forms: v.forms,
      hints: [
        'Name the rule or geometric element before manipulating symbols.',
        'Check the proposed rewrite by differentiating or recombining it.',
      ],
    }),
  );
export default B;
