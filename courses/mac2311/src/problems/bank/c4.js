import { simpson } from '@flux/subjects/math/quadrature.js';
import { formulaFamily, numericFamily, conceptFamily, citation, cf, fr, frTex, pw, sum } from './rework-kit.js';
const S = (p) => citation(5, p),
  A = (p) => citation(4, p),
  ch = 'v2.3',
  exam = 'c4';
/** Integral identity checked independently by differentiating the proposed primitive. */
function primitive(ask, key, F, f, reason, source, alt, wrong, at = 0.6, sample) {
  return {
    ask: 'Find one antiderivative; omit the arbitrary constant. ' + ask,
    key,
    sample,
    get: F,
    second: (x) => {
      const h = 1e-5,
        df = (F(x + h) - F(x - h)) / (2 * h);
      if (Math.abs(df - f(x)) > 1e-4 * Math.max(1, Math.abs(f(x))))
        throw Error('Primitive derivative disagrees');
      return F(x);
    },
    reason,
    ...(source ? { source } : {}),
    alt,
    wrong,
    at,
    check: 'Differentiate this result to recover the entire integrand, including its scale factors.',
  };
}
/**
 * Arc length of y=ln(sin x), y=ln(cos x) or y=(2/3)x^{3/2} between two ends, as a recipe. The
 * slant √(1+y′²) is csc x, sec x or √(1+x); each has a closed antiderivative, and the lab's
 * Simpson check integrates the slant itself. Reversed limits give the oriented integral.
 */
function arcForm([kind, a, b, aTex, bTex], reversed) {
  const lnTanHalf = (x) => Math.log(Math.tan(x / 2)),
    lnSecTan = (x) => Math.log(1 / Math.cos(x) + Math.tan(x));
  const curves = {
    sin: { y: 'y=ln(sin x)', slant: (x) => 1 / Math.sin(x), F: lnTanHalf, rise: (x) => Math.log(Math.sin(x)), tex: String.raw`\csc x`, why: 'The slant is csc x, whose antiderivative is ln tan(x/2).' },
    cos: { y: 'y=ln(cos x)', slant: (x) => 1 / Math.cos(x), F: lnSecTan, rise: (x) => Math.log(Math.cos(x)), tex: String.raw`\sec x`, why: 'The slant is sec x, whose antiderivative is ln(sec x+tan x).' },
    pow: { y: 'y=(2/3)x^{3/2}', slant: (x) => Math.sqrt(1 + x), F: (x) => (2 / 3) * (1 + x) ** 1.5, rise: (x) => (2 / 3) * x ** 1.5, tex: String.raw`\sqrt{1+x}`, why: 'The slant is √(1+x), whose antiderivative is (2/3)(1+x)^{3/2}.' },
  };
  const c = curves[kind],
    L = c.F(b) - c.F(a),
    span = b - a,
    profile = { name: `Slant of ${c.y}`, tex: c.tex, f: c.slant, F: c.F, a, b };
  return reversed
    ? {
        ask: `Evaluate the integral of the slant √(1+(y′)²) for ${c.y} from x=${bTex} down to ${aTex}. This is an oriented integral, not a physical length.`,
        answer: -L,
        second: () => simpson(c.slant, b, a),
        reversed: true,
        profile,
        reason: `${c.why} The limits run backward, so the value is the negative of the length.`,
        traps: [
          [L, 'Those are the opposite limits. A definite integral changes sign under reversal.'],
          [-span, 'That omits the slant factor. The magnitude exceeds the horizontal span.'],
        ],
      }
    : {
        ask: `Find the length of ${c.y} from x=${aTex} to ${bTex}.`,
        answer: L,
        second: () => simpson(c.slant, a, b),
        profile,
        reason: `${c.why} Subtract its values at the two ends.`,
        traps: [
          [Math.abs(c.rise(b) - c.rise(a)) || span / 2, 'That is only the vertical change in the graph, not its path length.'],
          [span, 'That is the horizontal span. The slant factor exceeds one.'],
        ],
      };
}
/** The segment y=b−mx from x=0 to b/m turned about the x or y axis: a cone, lateral area π·r·ℓ. */
function coneForm(b, m, axis) {
  const run = b / m,
    slant = Math.hypot(1, m),
    ell = run * slant,
    onX = axis === 'x',
    r = onX ? b : run,
    f = onX ? (x) => 2 * Math.PI * (b - m * x) * slant : (x) => 2 * Math.PI * x * slant,
    F = onX ? (x) => 2 * Math.PI * slant * (b * x - (m * x * x) / 2) : (x) => Math.PI * slant * x * x;
  return {
    ask: `Rotate y=${b}−${m === 1 ? '' : m}x, 0≤x≤${fr(run)}, about the ${axis} axis. Find the lateral surface area without an end cap.`,
    answer: Math.PI * r * ell,
    second: () => simpson(f, 0, run),
    profile: { name: `Surface integrand, y=${b}−${m}x about ${axis}`, tex: String.raw`2\pi ${onX ? 'y' : 'x'}\sqrt{${1 + m * m}}`, f, F, a: 0, b: run },
    reason: `The radius is ${onX ? 'y' : 'x'} and ds=√${1 + m * m} dx. Integrate 2π·${onX ? 'y' : 'x'}·√${1 + m * m}, or use the cone area πrℓ with r=${fr(r)} and ℓ=${fr(run)}√${1 + m * m}.`,
    traps: [
      [Math.PI * r * run, `That omits the slant factor √${1 + m * m}.`],
      [Math.PI * (onX ? run : b) * ell, `That uses ${onX ? 'x' : 'y'} as the radius, so it rotates about the other axis.`],
    ],
  };
}
/** Partial fractions as text: [[2,'x'],[-2,'(x+1)']] reads 2/x−2/(x+1). */
const fracSum = (...terms) =>
  terms
    .filter(([c]) => c)
    .map(([c, d], i) => `${c < 0 ? '−' : i ? '+' : ''}${Math.abs(c)}/${d}`)
    .join('');
/** A linear numerator px+q in TeX, signs joined. */
const linTex = (p, q) => {
  const lead = p === 0 ? '' : `${cf(p)}x`;
  if (!q) return lead || '0';
  return `${lead}${lead ? (q < 0 ? '-' : '+') : q < 0 ? '-' : ''}${Math.abs(q)}`;
};
const sym = (id, title, topics, forms, hints, level = 2) =>
  formulaFamily({ id: 'c4.' + id, exam, ch, title, topics, forms, hints, level });
const B = [
  sym(
    'parts',
    'Simplify one factor',
    ['parts', 'symbolic'],
    {
      linear: {
        source: S('5F-2(a)'),
        params: { k: [1, 2, 3, -1, -2, -3], b: [0, 1, 2, -1] },
        make: ({ k, b }) =>
          primitive(
            String.raw`$\int ${b === 0 ? 'x' : `(x${b < 0 ? '-' : '+'}${Math.abs(b)})`}e^{${cf(k)}x}\,dx$.`,
            `exp(${k}*x)*(${sum([1 / k, 'x'], [b / k - 1 / (k * k), ''])})`,
            (x) => Math.exp(k * x) * ((x + b) / k - 1 / (k * k)),
            (x) => (x + b) * Math.exp(k * x),
            `Set u=x${b ? (b < 0 ? b : `+${b}`) : ''} and dv=e^(${k}x)dx, so v=e^(${k}x)/${k}. Subtract the remaining exponential integral, which brings a second factor 1/${k}.`,
            undefined,
            `(x${b ? (b < 0 ? b : `+${b}`) : ''})*exp(${k}*x)/${k}-exp(${k}*x)/${k * k}`,
            `(x${b ? (b < 0 ? b : `+${b}`) : ''})*exp(${k}*x)/${k}`,
          ),
      },
      quadratic: {
        source: S('5F-2(b)'),
        params: { k: [1, 2, 3, -1, -2, -3] },
        make: ({ k }) =>
          primitive(
            String.raw`$\int x^2e^{${cf(k)}x}\,dx$.`,
            `exp(${k}*x)*(${sum([1 / k, 'x^2'], [-2 / (k * k), 'x'], [2 / k ** 3, ''])})`,
            (x) => Math.exp(k * x) * (x * x / k - (2 * x) / (k * k) + 2 / k ** 3),
            (x) => x * x * Math.exp(k * x),
            `Apply parts twice. Each round lowers the power of x and divides by another ${k}.`,
            undefined,
            `x^2*exp(${k}*x)/${k}-2*x*exp(${k}*x)/${k * k}+2*exp(${k}*x)/${k ** 3}`,
            `exp(${k}*x)*(${sum([1 / k, 'x^2'], [2 / (k * k), 'x'], [2 / k ** 3, ''])})`,
          ),
      },
      trig: {
        params: { fn: ['sin', 'cos'], k: [1, 2, 3, 4, 5, 6] },
        make: ({ fn, k }) => {
          const s = fn === 'sin';
          return primitive(
            String.raw`$\int x\,${'\\' + fn}(${cf(k)}x)\,dx$.`,
            s ? `-x*cos(${k}*x)/${k}+sin(${k}*x)/${k * k}` : `x*sin(${k}*x)/${k}+cos(${k}*x)/${k * k}`,
            (x) => (s ? -x * Math.cos(k * x) / k + Math.sin(k * x) / (k * k) : x * Math.sin(k * x) / k + Math.cos(k * x) / (k * k)),
            (x) => x * Math[fn](k * x),
            `Set u=x and dv=${fn}(${k}x)dx. Then v=${s ? '−cos' : 'sin'}(${k}x)/${k}, and the remaining integral of v gives the 1/${k * k} term.`,
            undefined,
            s ? `(sin(${k}*x)-${k}*x*cos(${k}*x))/${k * k}` : `(cos(${k}*x)+${k}*x*sin(${k}*x))/${k * k}`,
            s ? `-x*cos(${k}*x)/${k}` : `x*sin(${k}*x)/${k}`,
          );
        },
      },
      log: {
        params: { n: [1, 2, 3, 4, 0] },
        make: ({ n }) =>
          primitive(
            String.raw`$\int ${n === 0 ? '' : pw('x', n)}\ln x\,dx$, $x>0$.`,
            `x^${n + 1}*ln(x)/${n + 1}-x^${n + 1}/${(n + 1) ** 2}`,
            (x) => (x ** (n + 1) * Math.log(x)) / (n + 1) - x ** (n + 1) / (n + 1) ** 2,
            (x) => x ** n * Math.log(x),
            `Take u=ln x, which simplifies, and dv=${n === 0 ? 'dx' : `x^${n}dx`}. Then v=x^${n + 1}/${n + 1} and v du=x^${n}/${n + 1} dx.`,
            undefined,
            `x^${n + 1}*(${n + 1}*ln(x)-1)/${(n + 1) ** 2}`,
            `x^${n + 1}*ln(x)/${n + 1}`,
            1.4,
          ),
      },
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
      exponential: {
        source: S('5F-4'),
        params: { fn: ['cos', 'sin'], a: [1, 2, -1, 3], b: [1, 2, 3] },
        make: ({ fn, a, b }) => {
          const c = fn === 'cos',
            d = a * a + b * b;
          return primitive(
            String.raw`$\int e^{${cf(a)}x}${'\\' + fn}(${cf(b)}x)\,dx$.`,
            c ? `exp(${a}*x)*(${a}*cos(${b}*x)+${b}*sin(${b}*x))/${d}` : `exp(${a}*x)*(${a}*sin(${b}*x)-${b}*cos(${b}*x))/${d}`,
            (x) => (Math.exp(a * x) * (c ? a * Math.cos(b * x) + b * Math.sin(b * x) : a * Math.sin(b * x) - b * Math.cos(b * x))) / d,
            (x) => Math.exp(a * x) * Math[fn](b * x),
            `Two integrations by parts return the original integral times −${fr((b * b) / (a * a))}. Collect both copies: the factor is ${a * a}/(${a * a}+${b * b}).`,
            undefined,
            c ? `(${a}*exp(${a}*x)*cos(${b}*x)+${b}*exp(${a}*x)*sin(${b}*x))/${d}` : `(${a}*exp(${a}*x)*sin(${b}*x)-${b}*exp(${a}*x)*cos(${b}*x))/${d}`,
            c ? `exp(${a}*x)*(${a}*cos(${b}*x)+${b}*sin(${b}*x))` : `exp(${a}*x)*(${a}*sin(${b}*x)-${b}*cos(${b}*x))`,
          );
        },
      },
      log: {
        source: S('5F-5'),
        params: { fn: ['cos', 'sin'], b: [1, 2, 3] },
        make: ({ fn, b }) => {
          const c = fn === 'cos',
            d = 1 + b * b;
          return primitive(
            String.raw`$\int${'\\' + fn}(${cf(b)}\ln x)\,dx$, $x>0$.`,
            c ? `x*(cos(${b}*ln(x))+${b}*sin(${b}*ln(x)))/${d}` : `x*(sin(${b}*ln(x))-${b}*cos(${b}*ln(x)))/${d}`,
            (x) => (x * (c ? Math.cos(b * Math.log(x)) + b * Math.sin(b * Math.log(x)) : Math.sin(b * Math.log(x)) - b * Math.cos(b * Math.log(x)))) / d,
            (x) => Math[fn](b * Math.log(x)),
            `Take dv=dx twice. The second round returns the original integral times −${b * b}. Move it across and divide by ${d}.`,
            undefined,
            c ? `(x*cos(${b}*ln(x))+${b}*x*sin(${b}*ln(x)))/${d}` : `(x*sin(${b}*ln(x))-${b}*x*cos(${b}*ln(x)))/${d}`,
            c ? `x*cos(${b}*ln(x))` : `x*sin(${b}*ln(x))`,
            1.4,
          );
        },
      },
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
      sine: {
        source: S('5C-5'),
        params: { m: [2, 0, 1, 3, 4, 6], k: [1, 2, 3, 4] },
        make: ({ m, k }) => {
          const kx = k === 1 ? 'x' : `${k}*x`;
          return primitive(
            String.raw`$\int\sin^3${k === 1 ? 'x' : `(${k}x)`}${m === 0 ? '' : `\\cos${m === 1 ? '' : `^{${m}}`}${k === 1 ? 'x' : `(${k}x)`}`}\,dx$.`,
            `-cos(${kx})^${m + 1}/${(m + 1) * k}+cos(${kx})^${m + 3}/${(m + 3) * k}`,
            (x) => -(Math.cos(k * x) ** (m + 1)) / ((m + 1) * k) + Math.cos(k * x) ** (m + 3) / ((m + 3) * k),
            (x) => Math.sin(k * x) ** 3 * Math.cos(k * x) ** m,
            `Save sin(${k}x)dx and set u=cos(${k}x), so du=−${k}sin(${k}x)dx. Write sin² as 1−u² and integrate −(u^${m}−u^${m + 2})/${k}.`,
            undefined,
            `cos(${kx})^${m + 3}/${(m + 3) * k}-cos(${kx})^${m + 1}/${(m + 1) * k}`,
            `cos(${kx})^${m + 1}/${(m + 1) * k}-cos(${kx})^${m + 3}/${(m + 3) * k}`,
          );
        },
      },
      cosine: {
        source: S('5C-4'),
        params: { k: [3, 1, 2, 4, 5, 6], m: [0, 1, 2, 4] },
        make: ({ k, m }) => {
          const kx = k === 1 ? 'x' : `${k}*x`,
            arg = k === 1 ? 'x' : `(${k}x)`;
          return primitive(
            String.raw`$\int\cos^3${arg}${m === 0 ? '' : `\\sin${m === 1 ? '' : `^{${m}}`}${arg}`}\,dx$.`,
            `sin(${kx})^${m + 1}/${(m + 1) * k}-sin(${kx})^${m + 3}/${(m + 3) * k}`,
            (x) => Math.sin(k * x) ** (m + 1) / ((m + 1) * k) - Math.sin(k * x) ** (m + 3) / ((m + 3) * k),
            (x) => Math.cos(k * x) ** 3 * Math.sin(k * x) ** m,
            `Save cos(${k}x)dx and use u=sin(${k}x). The differential contributes a factor 1/${k}; write cos² as 1−u².`,
            undefined,
            `(${m + 3}*sin(${kx})^${m + 1}-${m + 1}*sin(${kx})^${m + 3})/${(m + 1) * (m + 3) * k}`,
            `sin(${kx})^${m + 1}/${m + 1}-sin(${kx})^${m + 3}/${m + 3}`,
          );
        },
      },
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
      square: {
        source: S('5C-1'),
        params: { fn: ['sin', 'cos'], k: [1, 2, 3, 4, 5, 6] },
        make: ({ fn, k }) => {
          const sg = fn === 'sin' ? '-' : '+',
            arg = k === 1 ? 'x' : `(${k}x)`;
          return primitive(
            String.raw`$\int${'\\' + fn}^2${arg}\,dx$.`,
            `x/2${sg}sin(${2 * k}*x)/${4 * k}`,
            (x) => x / 2 + ((fn === 'sin' ? -1 : 1) * Math.sin(2 * k * x)) / (4 * k),
            (x) => Math[fn](k * x) ** 2,
            `Use ${fn}²θ=(1${sg}cos2θ)/2 with θ=${k}x, then integrate the angle ${2 * k}x, which divides by ${2 * k}.`,
            undefined,
            `(${2 * k}*x${sg}sin(${2 * k}*x))/${4 * k}`,
            `x/2${sg}sin(${2 * k}*x)/${2 * k}`,
          );
        },
      },
      fourth: {
        source: S('5C-3'),
        params: { fn: ['sin', 'cos'], k: [1, 2, 3, 4, 5, 6] },
        make: ({ fn, k }) => {
          const sg = fn === 'sin' ? '-' : '+',
            arg = k === 1 ? 'x' : `(${k}x)`;
          return primitive(
            String.raw`$\int${'\\' + fn}^4${arg}\,dx$.`,
            `3*x/8${sg}sin(${2 * k}*x)/${4 * k}+sin(${4 * k}*x)/${32 * k}`,
            (x) => (3 * x) / 8 + ((fn === 'sin' ? -1 : 1) * Math.sin(2 * k * x)) / (4 * k) + Math.sin(4 * k * x) / (32 * k),
            (x) => Math[fn](k * x) ** 4,
            `Square the half-angle identity, then lower cos²(${2 * k}x) once more. Each angle multiplier divides its sine.`,
            undefined,
            `(${12 * k}*x${sg}${8}*sin(${2 * k}*x)+sin(${4 * k}*x))/${32 * k}`,
            `3*x/8${sg}sin(${2 * k}*x)/${4 * k}+sin(${4 * k}*x)/${8 * k}`,
          );
        },
      },
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
      inverse: {
        source: S('5D-1, a=4 parameter substitution'),
        params: { a: [4, 1, 2, 3, 5, 6], sign: ['-', '+'] },
        make: ({ a, sign }) => {
          const q = a * a,
            m = sign === '-';
          return primitive(
            m ? String.raw`$\int(${q}-x^2)^{-3/2}\,dx$, $|x|<${a}$.` : String.raw`$\int(${q}+x^2)^{-3/2}\,dx$.`,
            `x/(${q}*sqrt(${q}${sign}x^2))`,
            (x) => x / (q * Math.sqrt(q + (m ? -1 : 1) * x * x)),
            (x) => (q + (m ? -1 : 1) * x * x) ** -1.5,
            m
              ? `Let x=${a}sinθ on the principal branch, so the root is ${a}cosθ. The integral becomes sec²θ/${q}, giving tanθ/${q}.`
              : `Let x=${a}tanθ, so the root is ${a}secθ. The integral becomes cosθ/${q}, giving sinθ/${q}.`,
            undefined,
            `x/${q}/(sqrt(${q}${sign}x^2))`,
            `x/sqrt(${q}${sign}x^2)`,
            0.3 * a,
            m ? [0.05 * a, 0.9 * a] : undefined,
          );
        },
      },
      cubic: {
        source: S('5D-2, a=4 parameter substitution'),
        params: { a: [4, 1, 2, 3, 5, 6], power: [3, 2] },
        make: ({ a, power }) => {
          const q = a * a;
          return power === 3
            ? primitive(
                String.raw`$\int x^3/\sqrt{${q}-x^2}\,dx$, $|x|<${a}$.`,
                `-${q}*sqrt(${q}-x^2)+(${q}-x^2)^(3/2)/3`,
                (x) => -q * Math.sqrt(q - x * x) + (q - x * x) ** 1.5 / 3,
                (x) => x ** 3 / Math.sqrt(q - x * x),
                `The substitution u=${q}−x² also works. Express x² as ${q}−u before integrating.`,
                undefined,
                `(${q}-x^2)^(3/2)/3-${q}*sqrt(${q}-x^2)`,
                `${a}*sqrt(${q}-x^2)-(${q}-x^2)^(3/2)/3`,
                0.3 * a,
                [0.05 * a, 0.9 * a],
              )
            : primitive(
                String.raw`$\int x^2/\sqrt{${q}-x^2}\,dx$, $|x|<${a}$.`,
                `${q}*asin(x/${a})/2-x*sqrt(${q}-x^2)/2`,
                (x) => (q * Math.asin(x / a)) / 2 - (x * Math.sqrt(q - x * x)) / 2,
                (x) => (x * x) / Math.sqrt(q - x * x),
                `Let x=${a}sinθ. The integral becomes ${q}sin²θ dθ; lower the power, then return to x with sinθ=x/${a}.`,
                undefined,
                `(${q}*asin(x/${a})-x*sqrt(${q}-x^2))/2`,
                `${q}*asin(x/${a})/2`,
                0.3 * a,
                [0.05 * a, 0.9 * a],
              );
        },
      },
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
      mixed: {
        source: S('5D-3'),
        params: { a: [2, 1, 3, 4, 5], c: [1, 2, 3, -1, -2] },
        make: ({ a, c }) =>
          primitive(
            String.raw`$\int (x${c < 0 ? '-' : '+'}${Math.abs(c)})/(x^2+${a * a})\,dx$.`,
            `ln(x^2+${a * a})/2+(${fr(c / a)})*atan(x/${a})`,
            (x) => Math.log(x * x + a * a) / 2 + (c / a) * Math.atan(x / a),
            (x) => (x + c) / (x * x + a * a),
            `The x part gives a logarithm by substitution; the constant ${c} gives a scaled arctangent, ${fr(c / a)}·atan(x/${a}).`,
            undefined,
            `(${a}*ln(x^2+${a * a})+${2 * c}*atan(x/${a}))/${2 * a}`,
            `ln(x^2+${a * a})/2+${c}*atan(x/${a})`,
          ),
      },
      shifted: {
        source: S('5D-10'),
        params: { p: [2, 1, 3, -1, -2], b: [3, 1, 2, 4] },
        make: ({ p, b }) => {
          const q = p * p + b * b,
            lin = `${p < 0 ? '-' : '+'}${Math.abs(2 * p)}x`;
          return primitive(
            String.raw`$\int (x^2${lin}+${q})^{-3/2}\,dx$.`,
            `(x${p < 0 ? '-' : '+'}${Math.abs(p)})/(${b * b}*sqrt(x^2${p < 0 ? '-' : '+'}${Math.abs(2 * p)}*x+${q}))`,
            (x) => (x + p) / (b * b * Math.sqrt(x * x + 2 * p * x + q)),
            (x) => (x * x + 2 * p * x + q) ** -1.5,
            `Complete the square: (x${p < 0 ? '−' : '+'}${Math.abs(p)})²+${b * b}. Set x${p < 0 ? '−' : '+'}${Math.abs(p)}=${b}tanθ; the remaining integral is cosθ/${b * b}.`,
            undefined,
            `(x${p < 0 ? '-' : '+'}${Math.abs(p)})/${b * b}/sqrt((x${p < 0 ? '-' : '+'}${Math.abs(p)})^2+${b * b})`,
            `(x${p < 0 ? '-' : '+'}${Math.abs(p)})/sqrt(x^2${p < 0 ? '-' : '+'}${Math.abs(2 * p)}*x+${q})`,
          );
        },
      },
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
      constant: {
        source: S('5E-1'),
        params: { r: [2, 1, 3, 4], t: [3, 1, 2, 5, 4] },
        make: ({ r, t }) =>
          primitive(
            String.raw`$\int dx/[(x-${r})(x+${t})]$, on $x>${r}$.`,
            `ln(abs(x-${r}))/${r + t}-ln(x+${t})/${r + t}`,
            (x) => (Math.log(Math.abs(x - r)) - Math.log(x + t)) / (r + t),
            (x) => 1 / ((x - r) * (x + t)),
            `Cover each factor: the coefficients are 1/${r + t} and −1/${r + t}. Their sum must cancel the x term in the numerator.`,
            undefined,
            `ln(abs((x-${r})/(x+${t})))/${r + t}`,
            `ln(abs(x-${r}))-ln(x+${t})`,
            r + 1,
            [r + 0.1, r + 3],
          ),
      },
      linear: {
        source: S('5E-2'),
        params: { r: [2, 1, 3, 4], t: [3, 1, 2, 5, 4] },
        make: ({ r, t }) =>
          primitive(
            String.raw`$\int x\,dx/[(x-${r})(x+${t})]$, on $x>${r}$.`,
            `${r}*ln(abs(x-${r}))/${r + t}+${t}*ln(x+${t})/${r + t}`,
            (x) => (r * Math.log(Math.abs(x - r)) + t * Math.log(x + t)) / (r + t),
            (x) => x / ((x - r) * (x + t)),
            `Cover each factor: the coefficients are ${r}/${r + t} and ${t}/${r + t}. Recombine to check the numerator.`,
            undefined,
            `(${r}*ln(abs(x-${r}))+${t}*ln(x+${t}))/${r + t}`,
            `${r}*ln(abs(x-${r}))/${r + t}-${t}*ln(x+${t})/${r + t}`,
            r + 1,
            [r + 0.1, r + 3],
          ),
      },
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
      repeat: {
        source: S('5E-5'),
        params: { P: [2, 1, 3, -1, 4], R: [1, 2, -1, 3, -2] },
        make: ({ P, R }) =>
          primitive(
            String.raw`$\int (${linTex(P + R, P)})/[x(x+1)^2]\,dx$, $x>0$.`,
            sum([P, 'ln(x)'], [-P, 'ln(x+1)'], [-R, '1/(x+1)']),
            (x) => P * Math.log(x) - P * Math.log(x + 1) - R / (x + 1),
            (x) => ((P + R) * x + P) / (x * (x + 1) ** 2),
            `Use ${fracSum([P, 'x'], [-P, '(x+1)'], [R, '(x+1)²'])}. The squared power integrates to a negative reciprocal, not another logarithm.`,
            undefined,
            sum([P, 'ln(x/(x+1))'], [-R, '1/(x+1)']),
            sum([P, 'ln(x)'], [-P, 'ln(x+1)'], [R, '1/(x+1)']),
          ),
      },
      irreducible: {
        source: S('5E-6'),
        params: { A: [1, 2], B: [0, 1, 3, -2], a: [3, 1, 2], c: [2, 1, 3] },
        make: ({ A, B, a, c }) =>
          primitive(
            String.raw`$\int (${linTex(A * c + B, B * c - A * a * a)})/[(x^2+${a * a})(x+${c})]\,dx$, $x>0$.`,
            sum([A / 2, `ln(x^2+${a * a})`], [B / a, `atan(${a === 1 ? 'x' : `x/${a}`})`], [-A, `ln(x+${c})`]),
            (x) => (A * Math.log(x * x + a * a)) / 2 + (B / a) * Math.atan(x / a) - A * Math.log(x + c),
            (x) => ((A * c + B) * x + (B * c - A * a * a)) / ((x * x + a * a) * (x + c)),
            `Allow (Ax+B)/(x²+${a * a}) plus C/(x+${c}). Matching the numerator gives A=${A}, B=${B} and C=−${A}.`,
            undefined,
            sum([A / 2, `ln((x^2+${a * a})/(x+${c})^2)`], [B / a, `atan(${a === 1 ? 'x' : `x/${a}`})`]),
            sum([A, `ln(x^2+${a * a})`], [-A, `ln(x+${c})`]),
          ),
      },
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
    sim: {
      scenario: 'arcLog',
      setup(s, $) {
        s.custom = $.v.profile;
      },
      read: (c, s, $) => ({ answer: $.v.reversed ? -c.check : c.check }),
    },
    hints: [
      'Derive ds from the distance formula.',
      'For a logarithm of a sine or cosine, a Pythagorean identity turns 1+(y′)² into a perfect square.',
    ],
    forms: {
      length: {
        source: S('5C-13'),
        params: {
          curve: [
            ['sin', Math.PI / 4, Math.PI / 2, 'π/4', 'π/2'],
            ['sin', Math.PI / 6, Math.PI / 2, 'π/6', 'π/2'],
            ['sin', Math.PI / 3, Math.PI / 2, 'π/3', 'π/2'],
            ['sin', Math.PI / 6, Math.PI / 3, 'π/6', 'π/3'],
            ['sin', Math.PI / 3, (2 * Math.PI) / 3, 'π/3', '2π/3'],
            ['cos', 0, Math.PI / 4, '0', 'π/4'],
            ['cos', 0, Math.PI / 3, '0', 'π/3'],
            ['cos', -Math.PI / 4, Math.PI / 4, '−π/4', 'π/4'],
            ['cos', Math.PI / 6, Math.PI / 3, 'π/6', 'π/3'],
            ['pow', 0, 3, '0', '3'],
            ['pow', 0, 8, '0', '8'],
            ['pow', 3, 8, '3', '8'],
            ['pow', 0, 15, '0', '15'],
            ['pow', 8, 24, '8', '24'],
          ],
        },
        make: ({ curve }) => arcForm(curve, false),
      },
      oriented: {
        params: {
          curve: [
            ['sin', Math.PI / 4, Math.PI / 2, 'π/4', 'π/2'],
            ['sin', Math.PI / 6, Math.PI / 2, 'π/6', 'π/2'],
            ['cos', 0, Math.PI / 4, '0', 'π/4'],
            ['cos', 0, Math.PI / 3, '0', 'π/3'],
            ['pow', 0, 3, '0', '3'],
            ['pow', 0, 8, '0', '8'],
          ],
        },
        make: ({ curve }) => arcForm(curve, true),
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
    sim: {
      scenario: 'cone',
      setup(s, $) {
        s.custom = $.v.profile;
      },
      read: (c) => ({ answer: c.check }),
    },
    hints: [
      'A narrow band has area circumference times slant width.',
      'For a line of slope −m, the slant multiplier is √(1+m²). Determine the radius from the chosen axis.',
    ],
    forms: {
      xaxis: {
        source: A('4G-2'),
        params: { b: [1, 2, 3], m: [2, 1, 3, 4] },
        make: ({ b, m }) => coneForm(b, m, 'x'),
      },
      yaxis: {
        source: A('4G-3, final value; rewritten using x as parameter'),
        params: { b: [1, 2, 3], m: [2, 1, 3, 4] },
        make: ({ b, m }) => coneForm(b, m, 'y'),
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
      log: {
        ask: "For ∫x ln x dx, which choice finishes?",
        options: [
          ["u=ln x and dv=x dx.", "ln x simplifies when differentiated, and x is easy to integrate."],
          ["u=x and dv=ln x dx.", "That needs ∫ln x first and leaves a harder integral."],
          ["The substitution u=x².", "No factor 2x dx is left to absorb."],
        ],
      },
      substitute: {
        ask: "For ∫x e^(x²) dx, which method finishes fastest?",
        options: [
          ["The substitution u=x².", "The factor x dx is half of du."],
          ["Parts with u=x.", "That leaves ∫e^(x²)dx, which has no elementary antiderivative."],
          ["Partial fractions.", "Nothing here is a rational function."],
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
      tangent: {
        ask: "With x=3tanθ, what replaces dx?",
        options: [
          ["3sec²θ dθ.", "Differentiate the substitution itself."],
          ["3tanθ dθ.", "That copies x instead of differentiating it."],
          ["dθ.", "dx changes by the derivative factor."],
        ],
      },
      limits: {
        ask: "After u=x²+1 in ∫₀² 2x/(x²+1) dx, what are the new limits?",
        options: [
          ["1 and 5.", "Map each x limit through u=x²+1."],
          ["0 and 2.", "Those limits belong to x, not u."],
          ["0 and 4.", "The added one shifts both limits."],
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
      improper: {
        ask: "Why divide before decomposing (x³+1)/(x²−1)?",
        options: [
          ["The numerator’s degree is not below the denominator’s.", "Partial fractions need a proper fraction; division leaves a polynomial plus a proper remainder."],
          ["Because x²−1 does not factor.", "It factors as (x−1)(x+1)."],
          ["Division is never needed.", "An improper fraction cannot match a proper ansatz."],
        ],
      },
      cubed: {
        ask: "What form fits a proper fraction over (x−2)³?",
        options: [
          ["A/(x−2)+B/(x−2)²+C/(x−2)³.", "A repeated factor needs every power up to its multiplicity."],
          ["A/(x−2)³.", "One term cannot match a general quadratic numerator."],
          ["(Ax+B)/(x−2)³.", "A cubed linear factor takes a constant over each power."],
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
      span: {
        ask: "Why is the arc length ∫√(1+(y′)²)dx never less than the horizontal span?",
        options: [
          ["The integrand is at least one.", "Slope only adds to the length element."],
          ["Because y≥0.", "Height plays no part; slope does."],
          ["It can be less.", "A path between two x positions is never shorter than their separation."],
        ],
      },
      radius: {
        ask: "Turning y=f(x)≥0 about the x axis, what is a band’s radius?",
        options: [
          ["f(x).", "Each point turns about the x axis at distance y=f(x)."],
          ["x.", "x is the distance from the y axis."],
          ["√(1+(f′)²).", "That is the slant factor, not the radius."],
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
