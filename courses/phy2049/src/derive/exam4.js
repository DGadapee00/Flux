/**
 * Exam 4's step-through derivations: the integrals students set up by hand (Ch 44, 47).
 *
 * Each derivation is a short run of decisions. At every step the student picks the next line from a
 * few candidates; a wrong pick says why it is wrong. Every line that is chosen joins the working,
 * and each line carries the lab's live numbers: both sides of an equation, or the same quantity
 * written a new way, evaluated at the lab's present setup. Swapping I for dq/dt, or sin φ for a/r,
 * changes the symbols and leaves the number alone. scripts/derive-check.mjs holds every line to that.
 *
 * Shape of a derivation:
 *   id, lab, title, goal              — goal is prose with inline $…$
 *   applies(state)                    — the lab setup this derivation is about
 *   scenario                          — the lab scenario to load when it does not apply
 *   prepare(state)                    — optional: make the setup readable (close the switch, say)
 *   steps: [{ ask, options, line, values, units?, show?, after? }]
 *     ask      prose: the decision to make
 *     options  [{ tex | text, ok?, why? }]: exactly one ok; `why` explains a wrong pick
 *     line     TeX for the line this step adds to the working
 *     values   (state, computed) → { show: text, eq: [[a, b], …] }: the line evaluated now; each
 *              pair must agree (the check script and the ✓ beside the line both test it)
 *     units    optional TeX: the line's units, balanced
 *     show     optional key for the picture: what to light up in the lab while on this step
 *     after    optional prose shown once the step is done
 *   done                              — prose for the end: what the working showed
 *   overlay(key, state, computed)     — the picture for `show`: primitives in scene units
 *   notes                             — where the class notes derive the same thing: { exam, section,
 *                                       h3 | box } (an h3's text, or a box's tag); it gets a button
 */
import { UNITS_PER_METER as U, MU0 } from '../physics/constants.js';
import { RC_GEOM } from '../labs/rc.js';
import { Bpolyline, squarePoints, quarterLoopPoints, halfLoopPoints, hairpinPoints, sectorPoints, rectPoints, runPoints } from '../physics/bfield.js';
import { SECTOR_THETA, sectorOuter } from '../labs/biot.js';

const PI = Math.PI;

/** n significant figures with an SI prefix: 441 μA, 7.59 V, 1.00. */
export function sig(x, unit = '', n = 3) {
  if (!Number.isFinite(x)) return '—';
  const a = Math.abs(x);
  if (a === 0) return `0${unit ? ` ${unit}` : ''}`;
  if (!unit) return Number(x.toPrecision(n)).toString();
  const steps = [
    [1e9, 'G'],
    [1e6, 'M'],
    [1e3, 'k'],
    [1, ''],
    [1e-3, 'm'],
    [1e-6, 'μ'],
    [1e-9, 'n'],
    [1e-12, 'p'],
  ];
  const [d, p] = steps.find(([d]) => a >= d * 0.9995) || steps[steps.length - 1];
  return `${Number((x / d).toPrecision(n))} ${p}${unit}`;
}
const neg = (s) => s.replace(/^-/, '−');

// ---------------------------------------------------------------- RC (Ch 44)

/** The RC loop's corners and parts, for boxes drawn over the circuit. */
function rcOverlay(key) {
  const { XL, XR, YT, YB, YM, RES, BAT_H, GAP } = RC_GEOM;
  const box = (x0, y0, x1, y1, html, lx, ly) => [
    { kind: 'path', pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]].map(([x, y]) => [x, y, 0.02]), color: 'mark', width: 3 },
    { kind: 'label', at: [lx, ly, 0], html },
  ];
  if (key === 'loop') {
    const d = 0.35;
    return [
      { kind: 'path', pts: [[XL + d, YB + d], [XL + d, YT - d], [XR - d, YT - d], [XR - d, YB + d], [XL + d, YB + d]].map(([x, y]) => [x, y, 0.02]), color: 'mark', width: 2.5, dashed: true },
      { kind: 'label', at: [(XL + XR) / 2, YB + d + 0.35, 0], html: 'walk the loop: <i>ε</i> − <i>V<sub>R</sub></i> − <i>V<sub>C</sub></i> = 0' },
    ];
  }
  if (key === 'R') return box(RES[0] - 0.12, YT - 0.32, RES[1] + 0.12, YT + 0.32, '<i>V<sub>R</sub></i> = <i>IR</i> = <i>R dq/dt</i>', (RES[0] + RES[1]) / 2, YT - 0.6);
  if (key === 'C') return box(XR - 0.5, YM - GAP - 0.3, XR + 0.5, YM + GAP + 0.3, '<i>V<sub>C</sub></i> = <i>q/C</i>', XR - 1.35, YM - 0.75);
  if (key === 'bat') return box(XL - 0.5, YM - BAT_H - 0.45, XL + 0.5, YM + BAT_H + 0.45, '<i>ε</i>', XL + 0.95, YM - 0.5);
  return [];
}

/** At the lab's present moment: the charge, current, and both sides of the separated equation. */
function rcNow(s, c) {
  const r = c.rc;
  const C = r.Ceq;
  return { r, C, E: s.E, V0: s.V0, R: s.R, t: s.t, tau: r.tau, q: r.q, I: r.I };
}

const rcCharge = {
  id: 'rc-charge',
  notes: { exam: 'e4', section: 's7', h3: 'Charging' },
  lab: 'rc',
  title: 'Charging: from the loop rule to q(t)',
  goal: 'A battery $\\varepsilon$ charges an empty capacitor $C$ through $R$. Find the charge $q(t)$.',
  applies: (s) => s.mode === 'charge',
  scenario: 'charge',
  // The lines are evaluated at the lab's present moment, so there has to be one: one τ in.
  prepare(s) {
    if (!s.closed || !(s.t > 0)) {
      s.closed = true;
      s.t = s.R * (s.net === 'parallel' ? s.C1 + s.C2 : s.net === 'series' ? (s.C1 * s.C2) / (s.C1 + s.C2) : s.C1);
    }
  },
  steps: [
    {
      ask: 'Walk around the loop with the current. The battery raises the potential by $\\varepsilon$. What does the loop rule say?',
      options: [
        { tex: String.raw`\mathcal{E} - IR - \frac{q}{C} = 0`, ok: true },
        { tex: String.raw`\mathcal{E} + IR + \frac{q}{C} = 0`, why: 'Walking with the current, a resistor and a charging capacitor each lower the potential. Both terms are drops.' },
        { tex: String.raw`\mathcal{E} - IR = 0`, why: 'That leaves out the capacitor. Its voltage $q/C$ grows as it charges, and that is what slows the current.' },
        { tex: String.raw`\mathcal{E} - I(R + C) = 0`, why: '$C$ is not a resistance. The capacitor’s voltage is $q/C$, not $IC$; the units of $IC$ are not volts.' },
      ],
      line: String.raw`\mathcal{E} - IR - \frac{q}{C} = 0`,
      units: String.raw`\text{V} = \text{A}\cdot\Omega = \text{C}/\text{F}`,
      show: 'loop',
      values: (s, c) => {
        const n = rcNow(s, c);
        return { show: `${sig(n.E, 'V')} − ${sig(n.I * n.R, 'V')} − ${sig(n.q / n.C, 'V')} = ${sig(n.E - n.I * n.R - n.q / n.C, 'V')}`, eq: [[n.E, n.I * n.R + n.q / n.C]] };
      },
    },
    {
      ask: 'Two unknowns, $I$ and $q$, but they are linked. Which swap leaves an equation in $q$ alone?',
      options: [
        { tex: String.raw`I = \frac{dq}{dt}`, ok: true },
        { tex: String.raw`I = \frac{q}{t}`, why: 'That is an average over the whole time since the switch closed. The current changes every instant; the rate right now is $dq/dt$.' },
        { tex: String.raw`I = \frac{q}{RC}`, why: 'At $t = 0$ that gives $I = 0$, but the current is largest then, $\\varepsilon/R$, because the empty capacitor has no voltage yet.' },
        { tex: String.raw`I = \frac{\mathcal{E}}{R}`, why: 'Only at the very first instant. As $q/C$ grows, less of $\\varepsilon$ is left across $R$.' },
      ],
      line: String.raw`\mathcal{E} - R\frac{dq}{dt} - \frac{q}{C} = 0`,
      show: 'R',
      after: 'The current through $R$ is the rate charge piles up on $C$: same quantity, new symbol.',
      values: (s, c) => {
        const n = rcNow(s, c);
        // dq/dt from the charge itself: (q(t + h) − q(t − h)) / 2h on the charging curve.
        const h = n.tau * 1e-4;
        const q = (t) => n.C * n.E * (1 - Math.exp(-t / n.tau));
        const dqdt = (q(n.t + h) - q(n.t - h)) / (2 * h);
        return { show: `dq/dt = ${sig(dqdt, 'A')}, and the lab’s I = ${sig(n.I, 'A')}`, eq: [[dqdt, n.I]] };
      },
    },
    {
      ask: 'Separate the variables: every $q$ on one side with $dq$, every $t$ on the other with $dt$. First $R\\,\\dfrac{dq}{dt} = \\dfrac{C\\mathcal{E} - q}{C}$. Then?',
      options: [
        { tex: String.raw`\frac{dq}{C\mathcal{E} - q} = \frac{dt}{RC}`, ok: true },
        { tex: String.raw`\frac{dq}{q} = \frac{dt}{RC}`, why: 'That drops the battery. While it charges, the bracket is $C\\varepsilon - q$: how much charge is still to come.' },
        { tex: String.raw`\frac{dq}{C\mathcal{E} - q} = RC\,dt`, why: 'Check the units. The left side has none (C over C). $RC\\,dt$ is seconds squared; $dt/RC$ has none.' },
        { tex: String.raw`dq\,(C\mathcal{E} - q) = RC\,dt`, why: 'To get $q$ out of the right side, divide both sides by $(C\\varepsilon - q)$, don’t multiply.' },
      ],
      line: String.raw`\frac{dq}{C\mathcal{E} - q} = \frac{dt}{RC}`,
      units: String.raw`\frac{\text{C}}{\text{C}} = \frac{\text{s}}{\Omega\cdot\text{F}} = \frac{\text{s}}{\text{s}}\ \ \text{(no units)}`,
      values: (s, c) => {
        const n = rcNow(s, c);
        const left = n.I / (n.C * n.E - n.q);
        const right = 1 / n.tau;
        return { show: `per second, now: left ${sig(left, '/s')}, right 1/RC = ${sig(right, '/s')}`, eq: [[left, right]] };
      },
    },
    {
      ask: 'Integrate both sides. The capacitor starts empty when the switch closes. What are the limits?',
      options: [
        { tex: String.raw`\int_0^{q}\frac{dq'}{C\mathcal{E} - q'} = \int_0^{t}\frac{dt'}{RC}`, ok: true },
        { tex: String.raw`\int_0^{C\mathcal{E}}\frac{dq'}{C\mathcal{E} - q'} = \int_0^{\infty}\frac{dt'}{RC}`, why: 'That runs the whole charge to the end and loses the moment you want. Stop at a general time $t$, where the charge is $q$.' },
        { tex: String.raw`\int_{C\mathcal{E}}^{q}\frac{dq'}{C\mathcal{E} - q'} = \int_0^{t}\frac{dt'}{RC}`, why: 'At $t = 0$ the capacitor is empty, so the charge starts at $0$, not $C\\varepsilon$. The lower limits must match: $q = 0$ when $t = 0$.' },
      ],
      line: String.raw`\int_0^{q}\frac{dq'}{C\mathcal{E} - q'} = \int_0^{t}\frac{dt'}{RC}`,
      after: 'The primes mark the variable being integrated, so it doesn’t clash with the upper limit.',
      values: (s, c) => {
        const n = rcNow(s, c);
        // The left side summed numerically, the right side exactly: the two areas agree.
        const N = 400;
        let left = 0;
        for (let i = 0; i < N; i++) {
          const qm = ((i + 0.5) / N) * n.q;
          left += n.q / N / (n.C * n.E - qm);
        }
        return { show: `left (summed in 400 slices) = ${sig(left)}, right t/RC = ${sig(n.t / n.tau)}`, eq: [[left, n.t / n.tau]] };
      },
    },
    {
      ask: 'What is $\\displaystyle\\int \\frac{dq\'}{C\\mathcal{E} - q\'}$?',
      options: [
        { tex: String.raw`-\ln\left(C\mathcal{E} - q'\right)`, ok: true },
        { tex: String.raw`\ln\left(C\mathcal{E} - q'\right)`, why: 'Let $u = C\\varepsilon - q\'$. Then $du = -dq\'$, so the integral is $-\\int du/u = -\\ln u$. The minus sign comes from the chain rule.' },
        { tex: String.raw`\frac{1}{(C\mathcal{E} - q')^2}`, why: 'That is the pattern of a derivative. The integral of $1/u$ is $\\ln u$.' },
        { tex: String.raw`\frac{(C\mathcal{E} - q')^2}{2}`, why: 'That would be $\\int u\\,du$. Here $u$ is in the denominator: $\\int du/u = \\ln u$.' },
      ],
      line: String.raw`-\ln\left(\frac{C\mathcal{E} - q}{C\mathcal{E}}\right) = \frac{t}{RC}`,
      after: 'Between the limits: $-\\ln(C\\varepsilon - q) + \\ln(C\\varepsilon)$, and two logs subtract into the log of a ratio.',
      values: (s, c) => {
        const n = rcNow(s, c);
        const left = -Math.log((n.C * n.E - n.q) / (n.C * n.E));
        return { show: `left = ${sig(left)}, right = ${sig(n.t / n.tau)}`, eq: [[left, n.t / n.tau]] };
      },
    },
    {
      ask: 'Undo the log: multiply by $-1$, raise $e$ to both sides, and solve for $q$.',
      options: [
        { tex: String.raw`q = C\mathcal{E}\left(1 - e^{-t/RC}\right)`, ok: true },
        { tex: String.raw`q = C\mathcal{E}\,e^{-t/RC}`, why: 'That starts full at $t = 0$: it is discharging. From $(C\\varepsilon - q)/C\\varepsilon = e^{-t/RC}$, solve for $q$ and the 1 appears.' },
        { tex: String.raw`q = C\mathcal{E}\left(1 - e^{-RC/t}\right)`, why: 'The exponent is $t/RC$, time over the time constant. $RC/t$ would put the fast change at late times.' },
        { tex: String.raw`q = C\mathcal{E} - e^{-t/RC}`, why: 'Check the units. $e^{-t/RC}$ is a pure number and can’t be taken from a charge. It multiplies $C\\varepsilon$.' },
      ],
      line: String.raw`q(t) = C\mathcal{E}\left(1 - e^{-t/\tau}\right), \qquad \tau = RC`,
      units: String.raw`\text{F}\cdot\text{V} = \text{C}`,
      values: (s, c) => {
        const n = rcNow(s, c);
        const q = n.C * n.E * (1 - Math.exp(-n.t / n.tau));
        return { show: `formula ${sig(q, 'C')}, lab ${sig(n.q, 'C')}`, eq: [[q, n.q]] };
      },
    },
    {
      ask: 'Last, the current. Differentiate $q(t)$.',
      options: [
        { tex: String.raw`I = \frac{dq}{dt} = \frac{\mathcal{E}}{R}\,e^{-t/\tau}`, ok: true },
        { tex: String.raw`I = \frac{dq}{dt} = C\mathcal{E}\,e^{-t/\tau}`, why: 'The chain rule brings down $1/\\tau = 1/RC$ from the exponent: $C\\varepsilon/RC = \\varepsilon/R$. Check the units: $C\\varepsilon$ is coulombs, not amperes.' },
        { tex: String.raw`I = \frac{dq}{dt} = \frac{\mathcal{E}}{R}\left(1 - e^{-t/\tau}\right)`, why: 'That grows. The current falls: it is largest at $t = 0$, when the capacitor is empty.' },
      ],
      line: String.raw`I(t) = \frac{\mathcal{E}}{R}\,e^{-t/\tau}`,
      units: String.raw`\text{V}/\Omega = \text{A}`,
      show: 'R',
      values: (s, c) => {
        const n = rcNow(s, c);
        const I = (n.E / n.R) * Math.exp(-n.t / n.tau);
        return { show: `formula ${sig(I, 'A')}, lab ${sig(n.I, 'A')}`, eq: [[I, n.I]] };
      },
    },
  ],
  done: 'Each line held the same charging capacitor, written a new way, and each gave the lab’s number. Drag the time or change $R$ and $C$: every line still agrees.',
  overlay: rcOverlay,
};

const rcDischarge = {
  id: 'rc-discharge',
  notes: { exam: 'e4', section: 's7', h3: 'Discharging' },
  lab: 'rc',
  title: 'Discharging: q(t) with no battery',
  goal: 'A capacitor charged to $V_0$ discharges through $R$. Find $q(t)$.',
  applies: (s) => s.mode === 'discharge',
  scenario: 'discharge',
  prepare(s) {
    if (!s.closed || !(s.t > 0)) {
      s.closed = true;
      s.t = s.R * (s.net === 'parallel' ? s.C1 + s.C2 : s.net === 'series' ? (s.C1 * s.C2) / (s.C1 + s.C2) : s.C1);
    }
  },
  steps: [
    {
      ask: 'There is no battery. The capacitor drives the current. Walking the loop with the current, what does the loop rule say?',
      options: [
        { tex: String.raw`\frac{q}{C} - IR = 0`, ok: true },
        { tex: String.raw`\frac{q}{C} + IR = 0`, why: 'Walking with the current the capacitor raises the potential (it is the source) and the resistor lowers it. One gain, one drop.' },
        { tex: String.raw`\mathcal{E} - IR - \frac{q}{C} = 0`, why: 'That is the charging loop. With the battery gone, there is no $\\varepsilon$.' },
      ],
      line: String.raw`\frac{q}{C} - IR = 0`,
      units: String.raw`\text{C}/\text{F} = \text{A}\cdot\Omega = \text{V}`,
      show: 'loop',
      values: (s, c) => {
        const n = rcNow(s, c);
        return { show: `${sig(n.q / n.C, 'V')} − ${sig(n.I * n.R, 'V')} = ${sig(n.q / n.C - n.I * n.R, 'V')}`, eq: [[n.q / n.C, n.I * n.R]] };
      },
    },
    {
      ask: 'The current drains the capacitor. How is $I$ related to $q$ now?',
      options: [
        { tex: String.raw`I = -\frac{dq}{dt}`, ok: true },
        { tex: String.raw`I = \frac{dq}{dt}`, why: 'The charge is falling, so $dq/dt$ is negative, while the current $I$ is a positive size. The current carries charge away: $I = -dq/dt$.' },
        { tex: String.raw`I = \frac{q}{t}`, why: 'That is an average. The current is the rate at this instant.' },
      ],
      line: String.raw`\frac{q}{C} + R\frac{dq}{dt} = 0`,
      show: 'C',
      after: 'This sign is the one difference from charging. Everything after follows from it.',
      values: (s, c) => {
        const n = rcNow(s, c);
        const h = n.tau * 1e-4;
        const q = (t) => n.C * n.V0 * Math.exp(-t / n.tau);
        const dqdt = (q(n.t + h) - q(n.t - h)) / (2 * h);
        return { show: `dq/dt = ${neg(sig(dqdt, 'A'))}, so −dq/dt = ${sig(-dqdt, 'A')} = the lab’s I`, eq: [[-dqdt, n.I]] };
      },
    },
    {
      ask: 'Separate the variables and put in the limits. At $t = 0$ the charge is $Q_0 = CV_0$.',
      options: [
        { tex: String.raw`\int_{Q_0}^{q}\frac{dq'}{q'} = -\int_0^{t}\frac{dt'}{RC}`, ok: true },
        { tex: String.raw`\int_{0}^{q}\frac{dq'}{q'} = -\int_0^{t}\frac{dt'}{RC}`, why: 'The capacitor starts full, at $Q_0$, not empty. And $\\int_0 dq/q$ would diverge at $q = 0$.' },
        { tex: String.raw`\int_{Q_0}^{q}\frac{dq'}{q'} = \int_0^{t}\frac{dt'}{RC}`, why: 'The minus sign from $I = -dq/dt$ has gone missing. Without it the charge would grow.' },
      ],
      line: String.raw`\int_{Q_0}^{q}\frac{dq'}{q'} = -\int_0^{t}\frac{dt'}{RC}`,
      units: String.raw`\frac{\text{C}}{\text{C}} = \frac{\text{s}}{\text{s}}`,
      values: (s, c) => {
        const n = rcNow(s, c);
        const Q0 = n.C * n.V0;
        const N = 400;
        let left = 0;
        for (let i = 0; i < N; i++) {
          const qm = Q0 + ((i + 0.5) / N) * (n.q - Q0);
          left += (n.q - Q0) / N / qm;
        }
        return { show: `left (summed) = ${neg(sig(left))}, right −t/RC = ${neg(sig(-n.t / n.tau))}`, eq: [[left, -n.t / n.tau]] };
      },
    },
    {
      ask: 'Integrate and solve for $q$.',
      options: [
        { tex: String.raw`q(t) = Q_0\,e^{-t/RC}`, ok: true },
        { tex: String.raw`q(t) = Q_0\left(1 - e^{-t/RC}\right)`, why: 'That starts at zero and grows: it is charging. Here $\\ln(q/Q_0) = -t/RC$, so $q/Q_0 = e^{-t/RC}$.' },
        { tex: String.raw`q(t) = Q_0 - \frac{t}{RC}`, why: '$\\int dq/q$ is $\\ln q$, not $q$. Undoing the log gives an exponential, not a straight line.' },
      ],
      line: String.raw`\ln\frac{q}{Q_0} = -\frac{t}{RC} \quad\Rightarrow\quad q(t) = Q_0\,e^{-t/\tau}`,
      units: String.raw`\text{C}`,
      values: (s, c) => {
        const n = rcNow(s, c);
        const q = n.C * n.V0 * Math.exp(-n.t / n.tau);
        return { show: `formula ${sig(q, 'C')}, lab ${sig(n.q, 'C')}`, eq: [[q, n.q]] };
      },
    },
  ],
  done: 'One sign, $I = -dq/dt$, turns the charging working into this one. The time constant is the same $RC$.',
  overlay: rcOverlay,
};

// ---------------------------------------------------------------- Biot–Savart (Ch 47)

/** The piece the wire derivation follows: a little below P, close enough to see r, a and y together. */
function wirePiece(s) {
  const p = s.probe;
  const a = Math.hypot(p.x, p.z);
  const half = s.L / 2 - s.L / 48;
  // where the piece sits on the wire (the wire's own coordinate)
  const yw = Math.min(half, Math.max(-half, p.y - Math.max(1.5 * a, 0.15)));
  const y = yw - p.y; // measured from the foot of the perpendicular from P
  const r = Math.hypot(y, a);
  const y1 = -s.L / 2 - p.y;
  const y2 = s.L / 2 - p.y;
  return { p, a, yw, y, r, y1, y2 };
}

const wireIntegral = (y, a) => y / (a * a * Math.hypot(y, a));

const biotWire = {
  id: 'biot-wire',
  notes: { exam: 'e4', section: 's12', h3: 'Field of a straight wire of length L' },
  lab: 'biot',
  title: 'A straight wire: setting up Biot–Savart',
  goal: 'A straight wire of length $L$ carries $I$. Find $B$ at $P$, a distance $a$ from the wire.',
  applies: (s) => s.kind === 'wire' && Math.hypot(s.probe.x, s.probe.z) > 0.02,
  scenario: 'wire',
  steps: [
    {
      ask: 'Cut the wire into pieces. The wire runs along $y$ in this picture. What is one piece?',
      options: [
        { tex: String.raw`d\ell = dy`, ok: true },
        { tex: String.raw`d\ell = dx`, why: 'The wire runs along $y$. The $x$ direction is across the wire, toward $P$.' },
        { tex: String.raw`d\ell = r\,d\theta`, why: 'That is a piece of an arc. This wire is straight.' },
        { tex: String.raw`d\ell = L`, why: 'That is the whole wire. Each piece is a different distance from $P$, so they have to be taken one at a time.' },
      ],
      line: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{|d\vec\ell\times\hat r|}{r^2}, \qquad d\ell = dy`,
      show: 'dl',
      values: (s) => {
        const w = wirePiece(s);
        return { show: `the gold piece sits at y = ${neg(sig(w.y, 'm'))} from the point opposite P`, eq: [] };
      },
    },
    {
      ask: 'Measure $y$ from the point on the wire opposite $P$. How far is the piece from $P$?',
      options: [
        { tex: String.raw`r = \sqrt{y^2 + a^2}`, ok: true },
        { tex: String.raw`r = a`, why: 'Only the piece straight across from $P$ is a distance $a$ away. Pieces further along are farther.' },
        { tex: String.raw`r = y + a`, why: '$y$ runs along the wire and $a$ runs across it. They are the two legs of a right triangle, so they add as squares.' },
      ],
      line: String.raw`r = \sqrt{y^2 + a^2}`,
      units: String.raw`\text{m}`,
      show: 'r',
      values: (s) => {
        const w = wirePiece(s);
        return { show: `y = ${neg(sig(w.y, 'm'))}, a = ${sig(w.a, 'm')}, r = ${sig(w.r, 'm')}`, eq: [[w.r * w.r, w.y * w.y + w.a * w.a]] };
      },
    },
    {
      ask: '$|d\\vec\\ell\\times\\hat r| = d\\ell\\,\\sin\\varphi$, where $\\varphi$ is the angle between the wire and the line to $P$. Write $\\sin\\varphi$ with lengths.',
      options: [
        { tex: String.raw`\sin\varphi = \frac{a}{r}`, ok: true },
        { tex: String.raw`\sin\varphi = \frac{y}{r}`, why: 'The side next to $\\varphi$ is $y$, along the wire. $y/r$ is $\\cos\\varphi$; the side across from $\\varphi$ is $a$.' },
        { tex: String.raw`\sin\varphi = \frac{a}{y}`, why: 'Sine is opposite over the hypotenuse, and the hypotenuse is $r$. $a/y$ is a tangent.' },
      ],
      line: String.raw`\sin\varphi = \frac{a}{r} = \frac{a}{\sqrt{y^2 + a^2}}`,
      show: 'angle',
      values: (s) => {
        const w = wirePiece(s);
        const phi = Math.atan2(w.a, -w.y);
        return { show: `φ = ${sig((phi * 180) / PI)}°, sin φ = ${sig(Math.sin(phi))}, a/r = ${sig(w.a / w.r)}`, eq: [[Math.sin(phi), w.a / w.r]] };
      },
    },
    {
      ask: 'Put the pieces into $dB$. Every piece’s $d\\vec B$ points the same way at $P$ (around the wire), so the sizes add. What is $dB$?',
      options: [
        { tex: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{a\,dy}{(y^2 + a^2)^{3/2}}`, ok: true },
        { tex: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{dy}{y^2 + a^2}`, why: 'That drops $\\sin\\varphi$. The cross product keeps only the part of $d\\ell$ across the line to $P$.' },
        { tex: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{a\,dy}{y^2 + a^2}`, why: '$\\sin\\varphi = a/r$ brings one more $1/r$: $r^2 \\cdot r = (y^2 + a^2)^{3/2}$.' },
      ],
      line: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{a\,dy}{(y^2 + a^2)^{3/2}}`,
      units: String.raw`\frac{\text{T·m}}{\text{A}}\cdot\text{A}\cdot\frac{\text{m}\cdot\text{m}}{\text{m}^3} = \text{T}`,
      show: 'r',
      values: (s) => {
        const w = wirePiece(s);
        const dy = s.L / 24;
        const dB = ((MU0 * s.I) / (4 * PI)) * ((w.a * dy) / w.r ** 3);
        return { show: `the gold piece (dy = ${sig(dy, 'm')}) adds dB = ${sig(dB, 'T')}`, eq: [] };
      },
    },
    {
      ask: 'Add up every piece. Measured from the point opposite $P$, where does the wire start and end?',
      options: [
        { tex: String.raw`y_1 = -\tfrac{L}{2} - y_P \ \text{ to } \ y_2 = \tfrac{L}{2} - y_P`, ok: true },
        { tex: String.raw`y = 0 \ \text{ to } \ L`, why: '$r = \\sqrt{y^2 + a^2}$ measures $y$ from the point opposite $P$, not from the end of the wire. The limits must be in that same $y$.' },
        { tex: String.raw`y = -\infty \ \text{ to } \ \infty`, why: 'That is an infinite wire. This one has ends; the infinite wire is the last step.' },
      ],
      line: String.raw`B = \frac{\mu_0 I a}{4\pi}\int_{y_1}^{y_2}\frac{dy}{(y^2 + a^2)^{3/2}}`,
      show: 'limits',
      after: 'Here $y_P$ is how far $P$ sits above the wire’s middle. With $P$ opposite the middle, the limits are $\\pm L/2$.',
      values: (s, c) => {
        const w = wirePiece(s);
        const N = 2000;
        let sum = 0;
        for (let i = 0; i < N; i++) {
          const y = w.y1 + ((i + 0.5) / N) * (w.y2 - w.y1);
          sum += ((w.y2 - w.y1) / N) / (y * y + w.a * w.a) ** 1.5;
        }
        const B = ((MU0 * s.I * w.a) / (4 * PI)) * sum;
        return { show: `limits ${neg(sig(w.y1, 'm'))} to ${sig(w.y2, 'm')}; summed, B = ${sig(B, 'T')}; the lab’s Σ dB = ${sig(c.biot.magFull, 'T')}`, eq: [[B, c.biot.magFull]] };
      },
    },
    {
      ask: 'The integral table gives the antiderivative. Which one?',
      options: [
        { tex: String.raw`\int\frac{dy}{(y^2 + a^2)^{3/2}} = \frac{y}{a^2\sqrt{y^2 + a^2}}`, ok: true },
        { tex: String.raw`\int\frac{dy}{(y^2 + a^2)^{3/2}} = \frac{-1}{\sqrt{y^2 + a^2}}`, why: 'That is $\\int y\\,dy/(y^2 + a^2)^{3/2}$, with a $y$ on top. It is the one for the component along the wire.' },
        { tex: String.raw`\int\frac{dy}{(y^2 + a^2)^{3/2}} = \ln\!\left(y + \sqrt{y^2 + a^2}\right)`, why: 'That is $\\int dy/\\sqrt{y^2 + a^2}$, the power $1/2$. Ours is $3/2$.' },
      ],
      line: String.raw`B = \frac{\mu_0 I}{4\pi a}\left[\frac{y}{\sqrt{y^2 + a^2}}\right]_{y_1}^{y_2}`,
      units: String.raw`\frac{\text{T·m}}{\text{A}}\cdot\frac{\text{A}}{\text{m}} = \text{T}`,
      after: 'Check it by differentiating: $\\dfrac{d}{dy}\\dfrac{y}{a^2\\sqrt{y^2+a^2}} = \\dfrac{1}{(y^2+a^2)^{3/2}}$.',
      values: (s, c) => {
        const w = wirePiece(s);
        const B = ((MU0 * s.I * w.a) / (4 * PI)) * (wireIntegral(w.y2, w.a) - wireIntegral(w.y1, w.a));
        return { show: `closed form ${sig(B, 'T')}; the lab’s Σ dB = ${sig(c.biot.magFull, 'T')}`, eq: [[B, c.biot.magFull]] };
      },
    },
    {
      ask: 'Now let the wire grow very long. What does each end of the bracket tend to?',
      options: [
        { tex: String.raw`\frac{y}{\sqrt{y^2+a^2}} \to \pm 1, \quad B \to \frac{\mu_0 I}{2\pi a}`, ok: true },
        { tex: String.raw`\frac{y}{\sqrt{y^2+a^2}} \to \pm 1, \quad B \to \frac{\mu_0 I}{4\pi a}`, why: 'The bracket is $1 - (-1) = 2$, not 1: both halves of the wire contribute.' },
        { tex: String.raw`\frac{y}{\sqrt{y^2+a^2}} \to \infty, \quad B \to \infty`, why: 'For large $y$, $\\sqrt{y^2 + a^2} \\approx |y|$, so the ratio tends to $\\pm 1$. Far pieces add almost nothing.' },
      ],
      line: String.raw`B_\infty = \frac{\mu_0 I}{2\pi a}`,
      units: String.raw`\text{T}`,
      values: (s, c) => {
        const w = wirePiece(s);
        const Binf = (MU0 * s.I) / (2 * PI * w.a);
        return { show: `long-wire limit ${sig(Binf, 'T')}; this finite wire gives ${sig(c.biot.magFull, 'T')} = ${sig((100 * c.biot.magFull) / Binf)}% of it`, eq: [[Binf, c.biot.an.ideal]] };
      },
    },
  ],
  done: 'Every line is the same field at $P$. The summed integral, the closed form and the lab’s $\\Sigma\\,dB$ agree. Move $P$ or change $L$ and they still do.',
  overlay(key, s) {
    const w = wirePiece(s);
    const P = [s.probe.x * U, s.probe.y * U, s.probe.z * U];
    const foot = [0, s.probe.y * U, 0];
    const piece = [0, w.yw * U, 0];
    const out = [];
    if (key === 'dl' || key === 'r' || key === 'angle') {
      out.push({ kind: 'path', pts: [[0, (w.yw - s.L / 48) * U, 0], [0, (w.yw + s.L / 48) * U, 0]], color: 'I', width: 9 });
      out.push({ kind: 'label', at: [-0.55, w.yw * U, 0], html: '<i>dy</i>' });
    }
    if (key === 'r' || key === 'angle') {
      out.push({ kind: 'path', pts: [piece, P], color: 'white', width: 2, dashed: true });
      out.push({ kind: 'label', at: [(piece[0] + P[0]) / 2 + 0.2, (piece[1] + P[1]) / 2 - 0.25, (piece[2] + P[2]) / 2], html: '<i>r</i>' });
      out.push({ kind: 'path', pts: [foot, P], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: [(foot[0] + P[0]) / 2, foot[1] + 0.3, (foot[2] + P[2]) / 2], html: '<i>a</i>' });
      out.push({ kind: 'path', pts: [foot, piece], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: [-0.4, (foot[1] + piece[1]) / 2, 0], html: '<i>y</i>' });
    }
    if (key === 'angle') out.push({ kind: 'label', at: [0.3, piece[1] + 0.45, 0], html: '<i>φ</i>' });
    if (key === 'limits') {
      for (const [yy, t] of [
        [-s.L / 2, 'y<sub>1</sub>'],
        [s.L / 2, 'y<sub>2</sub>'],
      ]) {
        out.push({ kind: 'dot', at: [0, yy * U, 0], color: 'mark' });
        out.push({ kind: 'label', at: [-0.5, yy * U, 0], html: `<i>${t}</i>` });
      }
      out.push({ kind: 'dot', at: foot, color: 'white' });
      out.push({ kind: 'label', at: [-0.6, foot[1], 0], html: '<i>y</i> = 0' });
      out.push({ kind: 'path', pts: [foot, P], color: 'mark', width: 2, dashed: true });
    }
    return out;
  },
};

const biotLoop = {
  id: 'biot-loop',
  notes: { exam: 'e4', section: 's12', box: 'Worked example · Problem-solving video · on the axis of a loop' },
  lab: 'biot',
  title: 'A current loop: B on its axis',
  goal: 'A circular loop of radius $R$ carries $I$. Find $B$ at $P$ on its axis, a height $z$ above the center.',
  applies: (s) => s.kind === 'loop' && Math.hypot(s.probe.x, s.probe.z) < 0.01,
  scenario: 'loop',
  prepare(s) {
    if (s.kind === 'loop') {
      s.probe.x = 0;
      s.probe.z = 0;
    }
  },
  steps: [
    {
      ask: 'Take one piece $d\\ell$ of the ring. How far is it from $P$?',
      options: [
        { tex: String.raw`r = \sqrt{R^2 + z^2}`, ok: true },
        { tex: String.raw`r = R`, why: '$R$ is the distance to the center, in the plane of the loop. $P$ is above the plane, a height $z$.' },
        { tex: String.raw`r = z`, why: '$z$ is how far $P$ is from the center. The piece is out on the rim, $R$ to the side.' },
      ],
      line: String.raw`r = \sqrt{R^2 + z^2}\ \ \text{for every piece}`,
      units: String.raw`\text{m}`,
      show: 'r',
      after: 'Every piece of the ring is the same distance from $P$. That is what makes this integral easy.',
      values: (s) => {
        const z = s.probe.y;
        return { show: `R = ${sig(s.R, 'm')}, z = ${sig(z, 'm')}, r = ${sig(Math.hypot(s.R, z), 'm')}`, eq: [] };
      },
    },
    {
      ask: 'What is the angle between $d\\vec\\ell$ (around the ring) and $\\hat r$ (from the piece to $P$)?',
      options: [
        { tex: String.raw`90^\circ, \ \text{so}\ |d\vec\ell\times\hat r| = d\ell`, ok: true },
        { tex: String.raw`\sin\varphi = \frac{R}{r}`, why: '$d\\vec\\ell$ runs around the ring, sideways. $\\hat r$ runs from the rim inward and up to $P$. They are perpendicular for every piece.' },
        { tex: String.raw`0^\circ, \ \text{so}\ d\vec\ell\times\hat r = 0`, why: 'Then the loop would make no field. $d\\vec\\ell$ is never along $\\hat r$ here.' },
      ],
      line: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{d\ell}{R^2 + z^2}`,
      units: String.raw`\text{T}`,
      show: 'dl',
      values: () => ({ show: 'dℓ is tangent to the ring; r̂ points from the rim to P', eq: [] }),
    },
    {
      ask: 'Each $d\\vec B$ tilts away from the axis. Around the ring the sideways parts cancel in pairs. Which part survives?',
      options: [
        { tex: String.raw`dB_z = dB\,\frac{R}{r}`, ok: true },
        { tex: String.raw`dB_z = dB\,\frac{z}{r}`, why: '$d\\vec B$ is perpendicular to $\\hat r$. Its tilt from the axis is the angle $\\hat r$ makes with the plane, so the axial part is $R/r$. $z/r$ is the sideways part that cancels.' },
        { tex: String.raw`dB_z = dB`, why: 'Each $d\\vec B$ is tilted off the axis. Only its axial part adds up; the rest cancels with the piece across the ring.' },
      ],
      line: String.raw`dB_z = \frac{\mu_0 I}{4\pi}\,\frac{d\ell}{R^2 + z^2}\cdot\frac{R}{\sqrt{R^2 + z^2}}`,
      show: 'comp',
      values: (s) => {
        const r = Math.hypot(s.R, s.probe.y);
        return { show: `the axial share R/r = ${sig(s.R / r)}; the sideways share z/r = ${sig(s.probe.y / r)} cancels`, eq: [] };
      },
    },
    {
      ask: 'Nothing in $dB_z$ changes around the ring except $d\\ell$. What is $\\oint d\\ell$?',
      options: [
        { tex: String.raw`\oint d\ell = 2\pi R`, ok: true },
        { tex: String.raw`\oint d\ell = \pi R^2`, why: 'That is the area inside the loop. Adding up $d\\ell$ around the ring gives its length.' },
        { tex: String.raw`\oint d\ell = R`, why: 'That is the radius. The pieces go all the way round.' },
      ],
      line: String.raw`B = \frac{\mu_0 I R}{4\pi (R^2 + z^2)^{3/2}}\,(2\pi R) = \frac{\mu_0 I R^2}{2\,(R^2 + z^2)^{3/2}}`,
      units: String.raw`\frac{\text{T·m}}{\text{A}}\cdot\frac{\text{A}\cdot\text{m}^2}{\text{m}^3} = \text{T}`,
      values: (s, c) => {
        const B = (MU0 * s.I * s.R * s.R) / (2 * (s.R * s.R + s.probe.y ** 2) ** 1.5);
        return { show: `closed form ${sig(B, 'T')}; the lab’s Σ dB = ${sig(c.biot.magFull, 'T')}`, eq: [[B, c.biot.magFull]] };
      },
    },
    {
      ask: 'Check a limit. At the center of the loop, $z = 0$. What is $B$ there?',
      options: [
        { tex: String.raw`B = \frac{\mu_0 I}{2R}`, ok: true },
        { tex: String.raw`B = \frac{\mu_0 I}{2\pi R}`, why: 'That is a long straight wire. The loop’s pieces are all a distance $R$ away and all add along the axis.' },
        { tex: String.raw`B = 0`, why: 'The pieces cancel only sideways. Along the axis every piece adds, and at the center all of $d\\vec B$ is axial.' },
      ],
      line: String.raw`B_{\text{center}} = \frac{\mu_0 I}{2R}`,
      units: String.raw`\text{T}`,
      values: (s, c) => {
        const B0 = (MU0 * s.I) / (2 * s.R);
        return { show: `at the center ${sig(B0, 'T')}; at P, ${sig(c.biot.magFull, 'T')} (smaller, farther away)`, eq: [] };
      },
    },
  ],
  done: 'Symmetry did the integral: every piece is the same distance away and the sideways parts cancel. Raise $P$ and the field falls off as $1/(R^2 + z^2)^{3/2}$.',
  overlay(key, s) {
    const z = s.probe.y * U;
    const R = s.R * U;
    const piece = [R, 0, 0];
    const P = [0, z, 0];
    const out = [];
    if (key === 'r' || key === 'dl' || key === 'comp') {
      out.push({ kind: 'path', pts: [[R, 0, 0.35], [R, 0, -0.35]], color: 'I', width: 9 });
      out.push({ kind: 'label', at: [R + 0.45, -0.1, 0], html: '<i>dℓ</i>' });
    }
    if (key === 'r' || key === 'comp') {
      out.push({ kind: 'path', pts: [piece, P], color: 'white', width: 2, dashed: true });
      out.push({ kind: 'label', at: [R / 2 + 0.25, z / 2 + 0.2, 0], html: '<i>r</i>' });
      out.push({ kind: 'path', pts: [[0, 0, 0], piece], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: [R / 2, -0.3, 0], html: '<i>R</i>' });
      out.push({ kind: 'path', pts: [[0, 0, 0], P], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: [-0.35, z / 2, 0], html: '<i>z</i>' });
    }
    if (key === 'comp') {
      // dB from this piece is along dl × r: (z, R, 0) in the xy plane, perpendicular to r.
      const r = Math.hypot(R, z);
      const L = 1.4;
      const tip = [P[0] + (L * z) / r, P[1] + (L * R) / r, 0];
      out.push({ kind: 'path', pts: [P, tip], color: 'B', width: 4 });
      out.push({ kind: 'label', at: [tip[0] + 0.3, tip[1] + 0.1, 0], html: '<i>dB</i>' });
      out.push({ kind: 'path', pts: [P, [P[0], tip[1], 0]], color: 'B', width: 2, dashed: true });
      out.push({ kind: 'label', at: [-0.55, tip[1], 0], html: '<i>dB<sub>z</sub></i>' });
      out.push({ kind: 'path', pts: [[P[0], tip[1], 0], tip], color: 'white', width: 1.5, dashed: true });
    }
    return out;
  },
};

// ---------------------------------------------------------------- Ampère (Ch 47)

const ampereThick = {
  id: 'ampere-thick',
  notes: { exam: 'e4', section: 's14', h3: 'Long straight wire, outside and inside' },
  lab: 'ampere',
  title: 'Inside a thick wire: Ampère’s law',
  goal: 'A long wire of radius $a$ carries $I$ spread evenly over its cross-section. Find $B$ a distance $r < a$ from its axis.',
  applies: (s) => {
    const w = s.wires?.[0];
    return !!w && s.wires.length === 1 && w.a > 0 && Math.hypot(w.x - s.cx, w.z - s.cz) < 1e-3 && s.r < w.a;
  },
  scenario: 'thick',
  steps: [
    {
      ask: 'Choose the Amperian loop. You want $B$ at a distance $r$ from the axis.',
      options: [
        { text: 'A circle of radius $r$, centred on the wire’s axis', ok: true },
        { text: 'A square through the point', why: 'On a square the distance to the axis changes as you go round, so $B$ does too. Then $\\oint \\vec B\\cdot d\\vec\\ell$ can’t be written as $B$ times a length.' },
        { text: 'A circle of radius $a$, at the wire’s surface', why: 'The loop has to pass through the point where you want $B$, at radius $r$.' },
      ],
      line: String.raw`\text{loop: circle of radius } r,\ \ \vec B \parallel d\vec\ell,\ \ |\vec B| \text{ the same all round}`,
      show: 'loop',
      after: 'By symmetry $\\vec B$ circles the axis and has one size on the whole circle. That is the only reason Ampère’s law can be solved for $B$.',
      values: (s, c) => ({ show: `on the loop, B along dℓ runs from ${sig(c.amp.BtMin, 'T')} to ${sig(c.amp.BtMax, 'T')}: the same all round`, eq: [[c.amp.BtMin, c.amp.BtMax]] }),
    },
    {
      ask: 'Work out the left side, $\\oint \\vec B\\cdot d\\vec\\ell$.',
      options: [
        { tex: String.raw`\oint \vec B\cdot d\vec\ell = B\,(2\pi r)`, ok: true },
        { tex: String.raw`\oint \vec B\cdot d\vec\ell = B\,\pi r^2`, why: 'That is an area. The loop integral adds $B$ along the length of the loop: its circumference.' },
        { tex: String.raw`\oint \vec B\cdot d\vec\ell = B\,(2\pi a)`, why: 'The loop is at radius $r$, inside the wire, not at its surface $a$.' },
      ],
      line: String.raw`\oint \vec B\cdot d\vec\ell = B\,(2\pi r)`,
      units: String.raw`\text{T}\cdot\text{m}`,
      show: 'loop',
      values: (s, c) => {
        const B = c.amp.Bsym;
        return { show: `B·2πr = ${sig(B * 2 * PI * s.r, 'T·m')}; the lab’s ∮ B·dℓ, summed = ${sig(c.amp.circ, 'T·m')}`, eq: [[B * 2 * PI * s.r, c.amp.circ]] };
      },
    },
    {
      ask: 'Now the right side: the current through the loop. The current density is uniform, $J = I/\\pi a^2$.',
      options: [
        { tex: String.raw`I_{\text{enc}} = J\,\pi r^2 = I\,\frac{r^2}{a^2}`, ok: true },
        { tex: String.raw`I_{\text{enc}} = I\,\frac{r}{a}`, why: 'Current goes with the area it crosses, and area goes as radius squared.' },
        { tex: String.raw`I_{\text{enc}} = I`, why: 'That is true only for a loop outside the wire. Inside, the loop encloses only part of the cross-section.' },
      ],
      line: String.raw`I_{\text{enc}} = J\,\pi r^2 = I\,\frac{r^2}{a^2}`,
      units: String.raw`\frac{\text{A}}{\text{m}^2}\cdot\text{m}^2 = \text{A}`,
      show: 'enc',
      after: '$J\\pi r^2$ and $I r^2/a^2$ are the same current written two ways.',
      values: (s, c) => {
        const w = s.wires[0];
        const Ienc = (w.I * s.r * s.r) / (w.a * w.a);
        return { show: `I r²/a² = ${sig(Ienc, 'A')}; the lab’s I_enc = ${sig(c.amp.Ienc, 'A')}`, eq: [[Ienc, c.amp.Ienc]] };
      },
    },
    {
      ask: 'Set the two sides equal: $B(2\\pi r) = \\mu_0 I_{\\text{enc}}$. Solve for $B$.',
      options: [
        { tex: String.raw`B = \frac{\mu_0 I\,r}{2\pi a^2}`, ok: true },
        { tex: String.raw`B = \frac{\mu_0 I}{2\pi r}`, why: 'That is the field outside the wire, where all of $I$ is enclosed. Inside, only $Ir^2/a^2$ is.' },
        { tex: String.raw`B = \frac{\mu_0 I\,r^2}{2\pi a^2}`, why: 'Divide by $2\\pi r$: one power of $r$ cancels. $B$ grows in proportion to $r$ inside.' },
      ],
      line: String.raw`B = \frac{\mu_0 I\,r}{2\pi a^2}`,
      units: String.raw`\frac{\text{T·m}}{\text{A}}\cdot\frac{\text{A}\cdot\text{m}}{\text{m}^2} = \text{T}`,
      show: 'loop',
      values: (s, c) => {
        const w = s.wires[0];
        const B = (MU0 * w.I * s.r) / (2 * PI * w.a * w.a);
        return { show: `formula ${sig(B, 'T')}; the lab’s B on the loop = ${sig(c.amp.Bsym, 'T')}`, eq: [[B, c.amp.Bsym]] };
      },
    },
    {
      ask: 'On an exam the current density is often not uniform. Say $J = \\alpha r\'$, growing outward. Now $I_{\\text{enc}}$ needs an integral over thin rings of radius $r\'$ and width $dr\'$. What is it?',
      options: [
        { tex: String.raw`I_{\text{enc}} = \int_0^{r}\alpha r'\,(2\pi r'\,dr') = \frac{2\pi\alpha r^3}{3}`, ok: true },
        { tex: String.raw`I_{\text{enc}} = \alpha r\cdot\pi r^2`, why: '$J$ changes with $r\'$, so you can’t multiply it by an area. Add up thin rings, each with its own $J$.' },
        { tex: String.raw`I_{\text{enc}} = \int_0^{r}\alpha r'\,dr' = \frac{\alpha r^2}{2}`, why: 'Each ring’s area is $2\\pi r\'\\,dr\'$, not $dr\'$. Check the units: $J\\,dr$ is A/m, not A.' },
      ],
      line: String.raw`I_{\text{enc}} = \int_0^{r} J(r')\,2\pi r'\,dr' \quad\Rightarrow\quad B = \frac{\mu_0 \alpha r^2}{3}`,
      units: String.raw`\frac{\text{A}}{\text{m}^3}\cdot\text{m}\cdot\text{m}\cdot\text{m} = \text{A}`,
      after: 'The lab’s wire is uniform, so this step has no lab number. With $J$ uniform, the same integral gives back $J\\pi r^2$.',
      values: (s) => {
        const w = s.wires[0];
        const J = w.I / (PI * w.a * w.a);
        const N = 400;
        let sum = 0;
        for (let i = 0; i < N; i++) {
          const rr = ((i + 0.5) / N) * s.r;
          sum += J * 2 * PI * rr * (s.r / N);
        }
        return { show: `check with this wire’s uniform J: ∫ J 2πr′ dr′ = ${sig(sum, 'A')} = Jπr² = ${sig(J * PI * s.r * s.r, 'A')}`, eq: [[sum, J * PI * s.r * s.r]] };
      },
    },
  ],
  done: 'Ampère’s law turned the field problem into a current-counting problem. Grow the loop past the wire’s surface and $I_{\\text{enc}}$ stops at $I$: outside, $B = \\mu_0 I/2\\pi r$.',
  overlay(key, s) {
    const w = s.wires[0];
    const out = [];
    const cx = s.cx * U;
    const cz = s.cz * U;
    const circle = (rad, y) => {
      const pts = [];
      for (let i = 0; i <= 96; i++) pts.push([cx + rad * Math.cos((i / 96) * 2 * PI), y, cz + rad * Math.sin((i / 96) * 2 * PI)]);
      return pts;
    };
    if (key === 'loop') {
      out.push({ kind: 'path', pts: circle(s.r * U, 0.06), color: 'mark', width: 4 });
      out.push({ kind: 'label', at: [cx + s.r * U + 0.4, 0.3, cz], html: 'loop, radius <i>r</i>' });
    }
    if (key === 'enc') {
      out.push({ kind: 'disc', at: [cx, 0.05, cz], radius: s.r * U, color: 'mark' });
      out.push({ kind: 'label', at: [cx, 0.45, cz], html: '<i>I</i><sub>enc</sub> = <i>J</i>π<i>r</i>²' });
      out.push({ kind: 'path', pts: circle(w.a * U, 0.06), color: 'I', width: 2, dashed: true });
      out.push({ kind: 'label', at: [cx - w.a * U - 0.9, 0.3, cz], html: 'wire, radius <i>a</i>' });
    }
    return out;
  },
};

// The class sheet's two Biot–Savart derivations (Class Activity 4, #15 and #16).

const atCentre = (s) => Math.hypot(s.probe.x, s.probe.y, s.probe.z) < 0.01;
const LEAD = 0.6; // the quarter loop's leads, as the lab draws them
const ORIGIN = { x: 0, y: 0, z: 0 };

const biotSquare = {
  id: 'biot-square',
  notes: { exam: 'e4', section: 's12', h3: 'Field at the center of a loop' },
  lab: 'biot',
  title: 'A square loop: B at its centre',
  goal: 'A square loop of side $L$ carries $I$ counterclockwise. Find $B$ at its centre $P$.',
  applies: (s) => s.kind === 'square' && atCentre(s),
  scenario: 'square',
  prepare(s) {
    if (s.kind === 'square') s.probe = { x: 0, y: 0, z: 0 };
  },
  steps: [
    {
      ask: 'Break the loop into its four straight sides. How do their fields at $P$ compare?',
      options: [
        { text: 'All four are equal and point the same way, out of the page', ok: true },
        { text: 'Opposite sides cancel, because their currents run opposite ways', why: 'Opposite currents on opposite sides of $P$ make fields the same way at $P$. Point your thumb along each side’s current: your fingers curl out of the page at the centre every time.' },
        { text: 'Only the two sides parallel to the current arrows count', why: 'Every side carries the current, and each sits $L/2$ from $P$. The square looks the same after a quarter turn, so all four give the same field.' },
      ],
      line: String.raw`B = 4\,B_{\text{side}}`,
      show: 'side',
      after: 'Counterclockwise current, seen from above: the field at the centre points up, out of the page.',
      values: (s, c) => {
        const side = squarePoints(s.L, 24).slice(0, 25);
        const B1 = Bpolyline(s.I, side, ORIGIN, 4).y;
        return { show: `one side alone: ${sig(B1, 'T')}; four times that: ${sig(4 * B1, 'T')}; the lab’s Σ dB: ${sig(c.biot.magFull, 'T')}`, eq: [[4 * B1, c.biot.magFull]] };
      },
    },
    {
      ask: 'One side is a straight wire of length $L$. How far is $P$ from it?',
      options: [
        { tex: String.raw`a = \tfrac{L}{2}`, ok: true },
        { tex: String.raw`a = L`, why: '$P$ is in the middle of the square, halfway between opposite sides.' },
        { tex: String.raw`a = \tfrac{L}{\sqrt2}`, why: 'That is the distance to a corner. The straight-wire formula needs the perpendicular distance, to the middle of the side.' },
      ],
      line: String.raw`a = \frac{L}{2}, \qquad P \text{ opposite the middle of the side}`,
      units: String.raw`\text{m}`,
      show: 'a',
      values: (s) => ({ show: `L = ${sig(s.L, 'm')}, a = ${sig(s.L / 2, 'm')}`, eq: [] }),
    },
    {
      ask: 'From the straight-wire result, $B = \\dfrac{\\mu_0 I}{4\\pi a}\\left[\\dfrac{y}{\\sqrt{y^2+a^2}}\\right]_{-L/2}^{L/2}$. What is the bracket with $a = L/2$?',
      options: [
        { tex: String.raw`\frac{L/2}{\sqrt{L^2/4 + L^2/4}} \times 2 = \sqrt2`, ok: true },
        { tex: String.raw`2`, why: 'That is an infinite wire, where each end gives 1. This side ends at $45^\\circ$ each way: $\\sin 45^\\circ = 1/\\sqrt2$ each.' },
        { tex: String.raw`\frac{1}{\sqrt2}`, why: 'That is one half of the side. Both halves count: $\\sin 45^\\circ + \\sin 45^\\circ$.' },
      ],
      line: String.raw`B_{\text{side}} = \frac{\mu_0 I}{4\pi (L/2)}\,\sqrt2 = \frac{\sqrt2\,\mu_0 I}{2\pi L}`,
      units: String.raw`\frac{\text{T·m}}{\text{A}}\cdot\frac{\text{A}}{\text{m}} = \text{T}`,
      show: 'side',
      values: (s) => {
        const side = squarePoints(s.L, 24).slice(0, 25);
        const B1 = Bpolyline(s.I, side, ORIGIN, 4).y;
        const f = (Math.SQRT2 * MU0 * s.I) / (2 * PI * s.L);
        return { show: `formula ${sig(f, 'T')}; one side summed in the lab ${sig(B1, 'T')}`, eq: [[f, B1]] };
      },
    },
    {
      ask: 'Add the four sides.',
      options: [
        { tex: String.raw`B = \frac{2\sqrt2\,\mu_0 I}{\pi L}`, ok: true },
        { tex: String.raw`B = \frac{\sqrt2\,\mu_0 I}{2\pi L}`, why: 'That is one side. All four add.' },
        { tex: String.raw`B = 0`, why: 'They don’t cancel: every side’s field at the centre points out of the page.' },
      ],
      line: String.raw`B = 4\cdot\frac{\sqrt2\,\mu_0 I}{2\pi L} = \frac{2\sqrt2\,\mu_0 I}{\pi L}, \ \text{out of the page}`,
      units: String.raw`\text{T}`,
      values: (s, c) => {
        const B = (2 * Math.SQRT2 * MU0 * s.I) / (PI * s.L);
        return { show: `formula ${sig(B, 'T')}; the lab’s Σ dB = ${sig(c.biot.magFull, 'T')}, all of it along the axis`, eq: [[B, c.biot.magFull], [c.biot.Bfull.y, c.biot.magFull]] };
      },
    },
  ],
  done: 'A square is four finite wires. The same straight-wire integral, with limits $\\pm L/2$ and $a = L/2$, does every side. Compare a circle of radius $L/2$: $\\mu_0 I/L$. The square gives $0.90$ of that, because its corners are farther away.',
  overlay(key, s) {
    const h = (s.L / 2) * U;
    const out = [];
    if (key === 'side' || key === 'a') {
      out.push({ kind: 'path', pts: [[h, 0.02, h], [h, 0.02, -h]], color: 'I', width: 8 });
      out.push({ kind: 'label', at: [h - 1.3, 0.2, h * 0.6], html: 'one side, length <i>L</i>' });
    }
    if (key === 'a') {
      out.push({ kind: 'path', pts: [[0, 0.03, 0], [h, 0.03, 0]], color: 'mark', width: 3 });
      out.push({ kind: 'label', at: [h / 2, 0.3, 0.3], html: '<i>a</i> = <i>L</i>/2' });
      out.push({ kind: 'path', pts: [[0, 0.03, 0], [h, 0.03, h]], color: 'white', width: 1.5, dashed: true });
      out.push({ kind: 'path', pts: [[0, 0.03, 0], [h, 0.03, -h]], color: 'white', width: 1.5, dashed: true });
      out.push({ kind: 'label', at: [h * 0.55, 0.3, -h * 0.75], html: '45°' });
    }
    return out;
  },
};

const biotQuarter = {
  id: 'biot-quarter',
  notes: { exam: 'e4', section: 's12', h3: 'Field at the center of a loop' },
  lab: 'biot',
  title: 'A quarter loop: B at its centre',
  goal: 'A wire comes straight in, turns a quarter circle of radius $R$, and leaves straight out. Find $B$ at the centre $P$.',
  applies: (s) => s.kind === 'quarter' && atCentre(s),
  scenario: 'quarter',
  prepare(s) {
    if (s.kind === 'quarter') s.probe = { x: 0, y: 0, z: 0 };
  },
  steps: [
    {
      ask: 'Start with the two straight leads. Each lies on a line through $P$. What does a lead add to $B$ at $P$?',
      options: [
        { text: 'Nothing: on the lead $d\\vec L \\parallel \\hat r$, so $d\\vec L\\times\\hat r = 0$', ok: true },
        { tex: String.raw`\frac{\mu_0 I}{4\pi R}`, why: 'That is the field beside the end of a long wire, a distance $R$ to the side. Here $P$ is not beside the lead; it is on the lead’s own line.' },
        { tex: String.raw`\frac{\mu_0 I}{2\pi R}`, why: 'That is a long wire with $P$ a distance $R$ to its side. A lead pointing straight at $P$ has no sideways part.' },
      ],
      line: String.raw`d\vec L \parallel \hat r \ \Rightarrow\ d\vec B_{\text{lead}} = \frac{\mu_0 I}{4\pi}\frac{d\vec L\times\hat r}{r^2} = 0`,
      show: 'leads',
      values: (s) => {
        const q = quarterLoopPoints(s.R, LEAD);
        const a = Bpolyline(s.I, q.leadIn, ORIGIN, 4);
        const b = Bpolyline(s.I, q.leadOut, ORIGIN, 4);
        const both = Math.hypot(a.x + b.x, a.y + b.y, a.z + b.z);
        return { show: `the two leads, summed in the lab: ${both < 1e-15 ? '0 T' : sig(both, 'T')}`, eq: [] };
      },
    },
    {
      ask: 'On the arc, every piece is a distance $R$ from $P$. What is $|d\\vec L\\times\\hat r|$?',
      options: [
        { tex: String.raw`dL`, ok: true },
        { tex: String.raw`dL\,\sin\theta, \ \theta \text{ changing along the arc}`, why: 'On a circle the piece runs along the rim and $\\hat r$ points to the centre: they are perpendicular at every piece, so $\\sin 90^\\circ = 1$.' },
        { tex: String.raw`0`, why: 'That is the leads. On the arc $d\\vec L$ is perpendicular to $\\hat r$.' },
      ],
      line: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{dL}{R^2}`,
      units: String.raw`\frac{\text{T·m}}{\text{A}}\cdot\frac{\text{A}\cdot\text{m}}{\text{m}^2} = \text{T}`,
      show: 'arc',
      values: (s) => ({ show: `every piece of the arc is R = ${sig(s.R, 'm')} from P`, eq: [] }),
    },
    {
      ask: 'Nothing in $dB$ changes along the arc except $dL$. What is $\\int dL$ over a quarter circle?',
      options: [
        { tex: String.raw`\int dL = \frac{\pi R}{2}`, ok: true },
        { tex: String.raw`\int dL = 2\pi R`, why: 'That is a full circle. A quarter circle is a quarter of that.' },
        { tex: String.raw`\int dL = \pi R`, why: 'That is a half circle.' },
      ],
      line: String.raw`B = \frac{\mu_0 I}{4\pi R^2}\cdot\frac{\pi R}{2} = \frac{\mu_0 I}{8R}`,
      units: String.raw`\text{T}`,
      values: (s, c) => {
        const B = (MU0 * s.I) / (8 * s.R);
        return { show: `formula ${sig(B, 'T')}; the lab’s Σ dB, leads included = ${sig(c.biot.magFull, 'T')}`, eq: [[B, c.biot.magFull]] };
      },
    },
    {
      ask: 'Which way does $\\vec B$ point at $P$? Seen from above, the current runs counterclockwise around $P$ on the arc.',
      options: [
        { text: 'Out of the page (up, in the lab)', ok: true },
        { text: 'Into the page', why: 'Curl the fingers of your right hand the way the current goes round $P$, counterclockwise: your thumb points out of the page.' },
        { text: 'In the plane, along one of the leads', why: '$d\\vec L\\times\\hat r$ is perpendicular to both, and both lie in the plane. The field at $P$ is perpendicular to the plane.' },
      ],
      line: String.raw`\vec B = \frac{\mu_0 I}{8R}\ \text{out of the page}`,
      values: (s, c) => ({ show: `the lab’s B points ${c.biot.Bfull.y > 0 ? 'up (out of the page)' : 'down'}: B_y = ${sig(c.biot.Bfull.y, 'T')} of |B| = ${sig(c.biot.magFull, 'T')}`, eq: [[c.biot.Bfull.y, c.biot.magFull]] }),
    },
  ],
  done: 'Any arc works the same way: $B = \\dfrac{\\mu_0 I}{4\\pi R}\\,\\theta$ for an arc of angle $\\theta$. A full loop ($2\\pi$) gives $\\mu_0 I/2R$, a half loop $\\mu_0 I/4R$, a quarter $\\mu_0 I/8R$. Leads aimed at the centre never count.',
  overlay(key, s) {
    const R = s.R * U;
    const Ld = (s.R + LEAD) * U;
    const out = [];
    if (key === 'leads') {
      out.push({ kind: 'path', pts: [[0, 0.03, -Ld], [0, 0.03, 0]], color: 'white', width: 2, dashed: true });
      out.push({ kind: 'path', pts: [[-Ld, 0.03, 0], [0, 0.03, 0]], color: 'white', width: 2, dashed: true });
      out.push({ kind: 'label', at: [0.5, 0.3, -R - 0.9], html: '<i>dL</i> ∥ <i>r̂</i>' });
      out.push({ kind: 'label', at: [-R - 0.9, 0.3, 0.5], html: '<i>dL</i> ∥ <i>r̂</i>' });
    }
    if (key === 'arc') {
      const phi = (3 * PI) / 4;
      const pt = [R * Math.cos(phi), 0.03, -R * Math.sin(phi)];
      const t = [Math.sin(phi), 0, Math.cos(phi)]; // along the arc at φ (the piece is drawn both ways from pt)
      const d = 0.35;
      out.push({ kind: 'path', pts: [[pt[0] - d * t[0], 0.03, pt[2] - d * t[2]], [pt[0] + d * t[0], 0.03, pt[2] + d * t[2]]], color: 'I', width: 9 });
      out.push({ kind: 'label', at: [pt[0] - 0.5, 0.3, pt[2] - 0.5], html: '<i>dL</i>' });
      out.push({ kind: 'path', pts: [pt, [0, 0.03, 0]], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: [pt[0] / 2 + 0.3, 0.3, pt[2] / 2 + 0.3], html: '<i>R</i>, along <i>r̂</i>' });
    }
    return out;
  },
};

// ---- More flat circuits with P in the plane of the wire, the way the class sheets draw them.
// The lab lies the circuit flat and looks down on it: "out of the page" is up.

const sumB = (I, pts) => Bpolyline(I, pts, ORIGIN, 4);
const dirWord = (By) => (By > 0 ? 'out of the page (up)' : 'into the page (down)');
/** A circle through P's plane, for drawing an arc of the circuit. */
const ringPts = (r, phi0, phi1, y = 0.04, n = 40) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const phi = phi0 + ((phi1 - phi0) * i) / n;
    pts.push([r * U * Math.cos(phi), y, -r * U * Math.sin(phi)]);
  }
  return pts;
};
const at = (r, phi, y = 0.3) => [r * U * Math.cos(phi), y, -r * U * Math.sin(phi)];

const biotHalf = {
  id: 'biot-half',
  lab: 'biot',
  notes: { exam: 'e4', section: 's12', box: 'Worked example · Problem-solving video · semicircle with straight leads' },
  title: 'A half loop with straight leads (class example)',
  goal: 'A wire runs along a line through $P$, rises over a semicircle of radius $R$ centred on $P$, and carries on along the same line. The current runs left to right. Find $\\vec B$ at $P$.',
  applies: (s) => s.kind === 'half' && atCentre(s),
  scenario: 'half',
  prepare(s) {
    if (s.kind === 'half') s.probe = { x: 0, y: 0, z: 0 };
  },
  steps: [
    {
      ask: 'Start with the two straight parts. They lie on a line through $P$. What do they add at $P$?',
      options: [
        { text: 'Nothing: there $d\\vec L \\parallel \\hat r$, so $d\\vec L\\times\\hat r = 0$', ok: true },
        { tex: String.raw`\frac{\mu_0 I}{4\pi R}\ \text{each}`, why: 'That would be for $P$ beside the end of a wire, off its line. Here $P$ is on the line the straight parts run along.' },
        { tex: String.raw`\frac{\mu_0 I}{2\pi R}`, why: 'That is a long wire with $P$ a distance $R$ to its side. These wires have no sideways part as seen from $P$.' },
      ],
      line: String.raw`d\vec L\parallel\hat r\ \Rightarrow\ dB_{\text{straight}} = 0`,
      show: 'leads',
      values: (s) => {
        const h = halfLoopPoints(s.R, LEAD);
        const B = sumB(s.I, h.leadIn).y + sumB(s.I, h.leadOut).y;
        return { show: `the straight parts, summed in the lab: ${Math.abs(B) < 1e-15 ? '0 T' : sig(B, 'T')}`, eq: [] };
      },
    },
    {
      ask: 'On the arc, every piece is $R$ from $P$. What is $|d\\vec L\\times\\hat r|$ there?',
      options: [
        { tex: String.raw`dL\ \ (\text{the angle is } 90^\circ)`, ok: true },
        { tex: String.raw`dL\,\sin\theta,\ \theta \text{ changing}`, why: 'Along a circle the piece runs along the rim and $\\hat r$ points to the centre. They are perpendicular at every piece.' },
        { tex: String.raw`0`, why: 'That is the straight parts. On the arc $d\\vec L\\perp\\hat r$.' },
      ],
      line: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{dL}{R^2}`,
      units: String.raw`\frac{\text{T·m}}{\text{A}}\cdot\frac{\text{A}\cdot\text{m}}{\text{m}^2} = \text{T}`,
      show: 'arc',
      values: (s) => ({ show: `every piece of the arc is R = ${sig(s.R, 'm')} from P`, eq: [] }),
    },
    {
      ask: 'Add up the arc. With $dL = R\\,d\\theta$, what are the limits, and what is $B$?',
      options: [
        { tex: String.raw`B = \frac{\mu_0 I}{4\pi R^2}\int_0^{\pi} R\,d\theta = \frac{\mu_0 I}{4R}`, ok: true },
        { tex: String.raw`B = \frac{\mu_0 I}{4\pi R^2}\int_0^{2\pi} R\,d\theta = \frac{\mu_0 I}{2R}`, why: 'That is a full loop. A semicircle runs through $\\pi$, not $2\\pi$.' },
        { tex: String.raw`B = \frac{\mu_0 I}{4\pi R^2}\int_0^{\pi} d\theta = \frac{\mu_0 I}{4\pi R^2}\,\pi`, why: '$dL = R\\,d\\theta$: the $R$ is part of the arc length. Check the units: $\\mu_0 I/R^2$ is not a field.' },
      ],
      line: String.raw`B = \frac{\mu_0 I}{4\pi R^2}\int_0^{\pi} R\,d\theta = \frac{\mu_0 I}{4R}`,
      units: String.raw`\frac{\text{T·m}}{\text{A}}\cdot\frac{\text{A}}{\text{m}} = \text{T}`,
      values: (s, c) => {
        const B = (MU0 * s.I) / (4 * s.R);
        return { show: `formula ${sig(B, 'T')}; the lab’s Σ dB = ${sig(c.biot.magFull, 'T')}`, eq: [[B, c.biot.magFull]] };
      },
    },
    {
      ask: 'Which way does $\\vec B$ point at $P$? The current goes left to right over the top of the arc.',
      options: [
        { text: 'Into the page: left to right over the top is clockwise round $P$', ok: true },
        { text: 'Out of the page', why: 'Over the top from left to right is clockwise. Curl your right hand’s fingers clockwise: the thumb points into the page.' },
        { text: 'Along the straight wire', why: '$d\\vec L\\times\\hat r$ is perpendicular to both, and both lie in the page. $\\vec B$ at $P$ is perpendicular to the page.' },
      ],
      line: String.raw`\vec B = \frac{\mu_0 I}{4R}\ \text{into the page}`,
      values: (s, c) => ({ show: `the lab’s B at P points ${dirWord(c.biot.Bfull.y)}`, eq: [[-c.biot.Bfull.y, c.biot.magFull]] }),
    },
  ],
  done: 'Straight parts aimed at $P$ never count. An arc through angle $\\theta$ gives $\\mu_0 I\\theta/4\\pi R$: $\\pi$ for this half loop. Reverse the current and only the direction flips.',
  overlay(key, s) {
    const R = s.R * U;
    const L = (s.R + LEAD) * U;
    const out = [];
    if (key === 'leads') {
      out.push({ kind: 'path', pts: [[-L, 0.04, 0], [L, 0.04, 0]], color: 'white', width: 2, dashed: true });
      out.push({ kind: 'label', at: [-R - 1.2, 0.3, 0.45], html: '<i>dL</i> ∥ <i>r̂</i>' });
      out.push({ kind: 'label', at: [R + 1.2, 0.3, 0.45], html: '<i>dL</i> ∥ <i>r̂</i>' });
    }
    if (key === 'arc') {
      out.push({ kind: 'path', pts: ringPts(s.R, (2 * PI) / 3 - 0.08, (2 * PI) / 3 + 0.08), color: 'I', width: 9 });
      out.push({ kind: 'label', at: at(s.R + 0.06, (2 * PI) / 3), html: '<i>dL</i>' });
      out.push({ kind: 'path', pts: [at(s.R, (2 * PI) / 3, 0.04), [0, 0.04, 0]], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: at(s.R / 2, (2 * PI) / 3 - 0.35), html: '<i>R</i>' });
    }
    return out;
  },
};

const biotEnd = {
  id: 'biot-end',
  lab: 'biot',
  notes: { exam: 'e4', section: 's12', box: 'Worked example · Problem-solving video · above the end of a wire' },
  title: 'P beside one end of a straight wire (class example)',
  goal: 'A straight wire of length $L$ carries $I$. $P$ is a distance $a$ from the wire, opposite one of its ends. Find $B$ at $P$.',
  applies: (s) => s.kind === 'wire' && Math.abs(Math.abs(s.probe.y) - s.L / 2) < 0.01 && Math.hypot(s.probe.x, s.probe.z) > 0.02,
  scenario: 'end',
  prepare(s) {
    if (s.kind === 'wire' && !(Math.abs(Math.abs(s.probe.y) - s.L / 2) < 0.01)) s.probe = { x: 0.15, y: -s.L / 2, z: 0 };
  },
  steps: [
    {
      ask: 'Measure $y$ along the wire from the point opposite $P$, which is the wire’s end. Where does the wire run?',
      options: [
        { tex: String.raw`y = 0 \ \text{ to } \ L`, ok: true },
        { tex: String.raw`y = -\tfrac{L}{2} \ \text{ to } \ \tfrac{L}{2}`, why: 'That puts $P$ opposite the middle. Here $P$ is opposite an end, so the wire starts at $y = 0$.' },
        { tex: String.raw`y = 0 \ \text{ to } \ \infty`, why: 'That is a wire with no far end. This one stops at $L$.' },
      ],
      line: String.raw`r = \sqrt{y^2 + a^2},\qquad 0 \le y \le L`,
      show: 'limits',
      values: (s) => ({ show: `a = ${sig(Math.hypot(s.probe.x, s.probe.z), 'm')}, L = ${sig(s.L, 'm')}`, eq: [] }),
    },
    {
      ask: 'One piece $dy$ at $y$. With $|d\\vec L\\times\\hat r| = dy\\,\\sin\\varphi$ and $\\sin\\varphi = a/r$, what is $dB$?',
      options: [
        { tex: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{a\,dy}{(y^2 + a^2)^{3/2}}`, ok: true },
        { tex: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{dy}{y^2 + a^2}`, why: 'That drops $\\sin\\varphi = a/r$. The cross product keeps only the part of $d\\vec L$ across the line to $P$.' },
        { tex: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{dy}{a^2}`, why: 'Only the piece at $y = 0$ is a distance $a$ away. $r$ changes along the wire, so it stays inside the integral.' },
      ],
      line: String.raw`dB = \frac{\mu_0 I}{4\pi}\,\frac{a\,dy}{(y^2 + a^2)^{3/2}}`,
      show: 'r',
      values: () => ({ show: 'r changes along the wire: it stays inside the integral', eq: [] }),
    },
    {
      ask: 'Integrate from $0$ to $L$ with the table integral $\\displaystyle\\int\\frac{dy}{(y^2+a^2)^{3/2}} = \\frac{y}{a^2\\sqrt{y^2+a^2}}$.',
      options: [
        { tex: String.raw`B = \frac{\mu_0 I}{4\pi a}\,\frac{L}{\sqrt{L^2 + a^2}}`, ok: true },
        { tex: String.raw`B = \frac{\mu_0 I}{2\pi a}\,\frac{L}{\sqrt{L^2 + 4a^2}}`, why: 'That is $P$ opposite the middle of the wire, limits $\\pm L/2$.' },
        { tex: String.raw`B = \frac{\mu_0 I}{4\pi a}`, why: 'That is the limit for a very long wire. A finite wire gives the factor $L/\\sqrt{L^2 + a^2}$, less than 1.' },
      ],
      line: String.raw`B = \frac{\mu_0 I a}{4\pi}\left[\frac{y}{a^2\sqrt{y^2+a^2}}\right]_0^L = \frac{\mu_0 I}{4\pi a}\,\frac{L}{\sqrt{L^2 + a^2}}`,
      units: String.raw`\text{T}`,
      values: (s, c) => {
        const a = Math.hypot(s.probe.x, s.probe.z);
        const B = ((MU0 * s.I) / (4 * PI * a)) * (s.L / Math.hypot(s.L, a));
        return { show: `formula ${sig(B, 'T')}; the lab’s Σ dB = ${sig(c.biot.magFull, 'T')}`, eq: [[B, c.biot.magFull]] };
      },
    },
    {
      ask: 'Let the wire grow very long. What does $B$ become, and how does it compare with an endless wire?',
      options: [
        { tex: String.raw`B \to \frac{\mu_0 I}{4\pi a}:\ \text{half of } \frac{\mu_0 I}{2\pi a}`, ok: true },
        { tex: String.raw`B \to \frac{\mu_0 I}{2\pi a}`, why: 'That is a wire running off both ways from $P$. This one starts opposite $P$, so it is half of that.' },
        { tex: String.raw`B \to 0`, why: '$L/\\sqrt{L^2 + a^2} \\to 1$ as $L$ grows, not 0.' },
      ],
      line: String.raw`B_{\text{long}} = \frac{\mu_0 I}{4\pi a}`,
      values: (s, c) => {
        const a = Math.hypot(s.probe.x, s.probe.z);
        return { show: `long-wire limit ${sig((MU0 * s.I) / (4 * PI * a), 'T')}; this wire gives ${sig(c.biot.magFull, 'T')}`, eq: [] };
      },
    },
  ],
  done: 'Remember $\\mu_0 I/4\\pi a$: a long wire that ends opposite $P$ gives half an endless wire. It is the piece the hairpin needs.',
  overlay(key, s) {
    const a = Math.hypot(s.probe.x, s.probe.z);
    const P = [s.probe.x * U, s.probe.y * U, s.probe.z * U];
    const foot = [0, s.probe.y * U, 0];
    const far = [0, -s.probe.y * U, 0];
    const yw = s.probe.y + Math.sign(-s.probe.y) * Math.min(s.L * 0.4, Math.max(2 * a, 0.2));
    const piece = [0, yw * U, 0];
    const out = [];
    if (key === 'limits') {
      out.push({ kind: 'dot', at: foot, color: 'mark' });
      out.push({ kind: 'label', at: [-0.7, foot[1], 0], html: '<i>y</i> = 0' });
      out.push({ kind: 'dot', at: far, color: 'mark' });
      out.push({ kind: 'label', at: [-0.7, far[1], 0], html: '<i>y</i> = <i>L</i>' });
      out.push({ kind: 'path', pts: [foot, P], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: [P[0] / 2, foot[1] - 0.35, 0], html: '<i>a</i>' });
    }
    if (key === 'r') {
      out.push({ kind: 'path', pts: [[0, (yw - 0.04) * U, 0], [0, (yw + 0.04) * U, 0]], color: 'I', width: 9 });
      out.push({ kind: 'label', at: [-0.5, piece[1], 0], html: '<i>dy</i>' });
      out.push({ kind: 'path', pts: [piece, P], color: 'white', width: 2, dashed: true });
      out.push({ kind: 'label', at: [P[0] / 2 + 0.25, (piece[1] + P[1]) / 2, 0], html: '<i>r</i>' });
      out.push({ kind: 'path', pts: [foot, P], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: [P[0] / 2, foot[1] - 0.35, 0], html: '<i>a</i>' });
    }
    return out;
  },
};

const biotHairpin = {
  id: 'biot-hairpin',
  lab: 'biot',
  notes: { exam: 'e4', section: 's12', h3: 'Field at the center of a loop' },
  title: 'A hairpin: half loop with long parallel leads',
  goal: 'Two long parallel wires, $2R$ apart, are joined by a semicircle of radius $R$. Find $\\vec B$ at $P$, the centre of the semicircle.',
  applies: (s) => s.kind === 'hairpin' && atCentre(s),
  scenario: 'hairpin',
  prepare(s) {
    if (s.kind === 'hairpin') s.probe = { x: 0, y: 0, z: 0 };
  },
  steps: [
    {
      ask: 'Split it into three parts: the two straight wires and the semicircle. Which parts make a field at $P$?',
      options: [
        { text: 'All three', ok: true },
        { text: 'Only the semicircle', why: 'These straight wires don’t point at $P$. Each runs a distance $R$ to the side of $P$, so $d\\vec L\\times\\hat r \\ne 0$. Compare the half loop, where the straight parts lie on a line through $P$.' },
        { text: 'Only the two straight wires', why: 'The semicircle is centred on $P$: every piece is $R$ away and perpendicular to $\\hat r$. It counts.' },
      ],
      line: String.raw`B = B_{\text{top}} + B_{\text{arc}} + B_{\text{bottom}}`,
      show: 'parts',
      values: (s, c) => {
        const h = hairpinPoints(s.R, 20);
        const parts = [h.top, h.arc, h.bottom].map((p) => sumB(s.I, p).y);
        return { show: `top ${sig(Math.abs(parts[0]), 'T')}, arc ${sig(Math.abs(parts[1]), 'T')}, bottom ${sig(Math.abs(parts[2]), 'T')}; together ${sig(Math.abs(parts[0] + parts[1] + parts[2]), 'T')}`, eq: [[Math.abs(parts[0] + parts[1] + parts[2]), c.biot.magFull]] };
      },
    },
    {
      ask: 'One straight wire is long, and $P$ is a distance $R$ beside its end. What field does it make at $P$?',
      options: [
        { tex: String.raw`\frac{\mu_0 I}{4\pi R}`, ok: true },
        { tex: String.raw`\frac{\mu_0 I}{2\pi R}`, why: 'That is an endless wire, running off both ways from $P$. This one ends opposite $P$: limits $0$ to $\\infty$ give half of that.' },
        { tex: String.raw`0`, why: 'That is for a wire aimed at $P$. This wire runs past $P$’s side.' },
      ],
      line: String.raw`B_{\text{top}} = B_{\text{bottom}} = \frac{\mu_0 I}{4\pi R}\left[\frac{y}{\sqrt{y^2 + R^2}}\right]_0^{\infty} = \frac{\mu_0 I}{4\pi R}`,
      units: String.raw`\text{T}`,
      show: 'lead',
      values: (s) => {
        const B1 = Math.abs(sumB(s.I, hairpinPoints(s.R, 20).top).y);
        return { show: `formula ${sig((MU0 * s.I) / (4 * PI * s.R), 'T')}; one 20 m wire summed in the lab ${sig(B1, 'T')}`, eq: [[(MU0 * s.I) / (4 * PI * s.R), B1]] };
      },
    },
    {
      ask: 'The semicircle is half a loop. What does it give at its centre?',
      options: [
        { tex: String.raw`\frac{\mu_0 I}{4R}`, ok: true },
        { tex: String.raw`\frac{\mu_0 I}{2R}`, why: 'That is a full loop. $\\int dL = \\pi R$ for a semicircle.' },
        { tex: String.raw`\frac{\mu_0 I}{4\pi R}`, why: 'That is one long straight wire. The arc gives $\\dfrac{\\mu_0 I}{4\\pi R^2}\\cdot\\pi R$.' },
      ],
      line: String.raw`B_{\text{arc}} = \frac{\mu_0 I}{4\pi R^2}\,(\pi R) = \frac{\mu_0 I}{4R}`,
      show: 'arc',
      values: (s) => {
        const B = Math.abs(sumB(s.I, hairpinPoints(s.R, 20).arc).y);
        return { show: `formula ${sig((MU0 * s.I) / (4 * s.R), 'T')}; the arc summed in the lab ${sig(B, 'T')}`, eq: [[(MU0 * s.I) / (4 * s.R), B]] };
      },
    },
    {
      ask: 'In along the top, round the bend, back along the bottom: all three parts turn the same way round $P$. Add them.',
      options: [
        { tex: String.raw`B = \frac{\mu_0 I}{4R} + \frac{\mu_0 I}{2\pi R}\ \text{into the page}`, ok: true },
        { tex: String.raw`B = \frac{\mu_0 I}{4R} - \frac{\mu_0 I}{2\pi R}`, why: 'Check each part with the right-hand rule: the top wire, the bend and the bottom wire all circle $P$ clockwise. Nothing cancels.' },
        { tex: String.raw`B = \frac{\mu_0 I}{4R} + \frac{\mu_0 I}{4\pi R}`, why: 'There are two straight wires, each giving $\\mu_0 I/4\\pi R$.' },
      ],
      line: String.raw`\vec B = \frac{\mu_0 I}{4R}\left(1 + \frac{2}{\pi}\right)\ \text{into the page}`,
      values: (s, c) => {
        const B = (MU0 * s.I) / (4 * s.R) + (MU0 * s.I) / (2 * PI * s.R);
        return { show: `formula ${sig(B, 'T')}; the lab’s Σ dB = ${sig(c.biot.magFull, 'T')}, pointing ${dirWord(c.biot.Bfull.y)}`, eq: [[B, c.biot.magFull], [-c.biot.Bfull.y, c.biot.magFull]] };
      },
    },
  ],
  done: 'The difference from the half loop is where the straight wires point. Aimed at $P$, a wire adds nothing. Running past $P$, a long wire that ends opposite $P$ adds $\\mu_0 I/4\\pi R$.',
  overlay(key, s) {
    const R = s.R * U;
    const out = [];
    if (key === 'parts' || key === 'lead') {
      out.push({ kind: 'path', pts: [[-6, 0.04, -R], [0, 0.04, -R]], color: 'I', width: 7 });
      out.push({ kind: 'label', at: [-2.5, 0.3, -R - 0.45], html: 'top wire' });
    }
    if (key === 'lead') {
      out.push({ kind: 'path', pts: [[0, 0.04, -R], [0, 0.04, 0]], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: [0.45, 0.3, -R / 2], html: '<i>R</i>' });
      out.push({ kind: 'label', at: [-1.9, 0.3, -R + 0.55], html: 'it ends opposite <i>P</i>' });
    }
    if (key === 'parts') {
      out.push({ kind: 'path', pts: [[-6, 0.04, R], [0, 0.04, R]], color: 'I', width: 7 });
      out.push({ kind: 'label', at: [-2.5, 0.3, R + 0.45], html: 'bottom wire' });
      out.push({ kind: 'label', at: [R + 0.7, 0.3, 0], html: 'arc' });
    }
    if (key === 'arc') {
      out.push({ kind: 'path', pts: ringPts(s.R, PI / 2, -PI / 2), color: 'I', width: 6 });
      out.push({ kind: 'path', pts: [at(s.R, PI / 4, 0.04), [0, 0.04, 0]], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: at(s.R / 2, PI / 4 + 0.4), html: '<i>R</i>' });
    }
    return out;
  },
};

const biotSector = {
  id: 'biot-sector',
  lab: 'biot',
  notes: { exam: 'e4', section: 's12', h3: 'Field at the center of a loop' },
  title: 'A pie slice: two arcs with radial sides',
  goal: 'A loop is made of two arcs of angle $\\theta$, radii $a$ and $b$ ($a < b$), joined by two radial sides. Current runs out along one side, counterclockwise round the outer arc, back in, and clockwise round the inner arc. Find $\\vec B$ at the centre $P$.',
  applies: (s) => s.kind === 'sector' && (s.arc ?? 90) === 90 && !s.rev && atCentre(s),
  scenario: 'sector',
  prepare(s) {
    if (s.kind === 'sector') s.probe = { x: 0, y: 0, z: 0 };
  },
  steps: [
    {
      ask: 'Start with the two radial sides. What do they add at $P$?',
      options: [
        { text: 'Nothing: they point at $P$, so $d\\vec L\\parallel\\hat r$', ok: true },
        { text: 'They cancel each other, because their currents are opposite', why: 'The answer is right but the reason isn’t: each one is zero on its own, because it points straight at $P$.' },
        { text: 'Each gives $\\mu_0 I/4\\pi a$', why: 'A wire aimed at $P$ has no sideways part as seen from $P$: $d\\vec L\\times\\hat r = 0$.' },
      ],
      line: String.raw`dB_{\text{radial}} = 0`,
      show: 'radial',
      values: (s) => {
        const q = sectorPoints(s.R, sectorOuter(s), SECTOR_THETA);
        const B = sumB(s.I, q.out).y + sumB(s.I, q.back).y;
        return { show: `the radial sides, summed in the lab: ${Math.abs(B) < 1e-15 ? '0 T' : sig(B, 'T')}`, eq: [] };
      },
    },
    {
      ask: 'An arc of radius $r$ and angle $\\theta$, centred on $P$. What field does it make at $P$?',
      options: [
        { tex: String.raw`\frac{\mu_0 I}{4\pi r^2}\,(r\theta) = \frac{\mu_0 I\theta}{4\pi r}`, ok: true },
        { tex: String.raw`\frac{\mu_0 I\theta}{2\pi r}`, why: 'Check it with a full circle, $\\theta = 2\\pi$: it must give $\\mu_0 I/2r$. This gives $\\mu_0 I/r$.' },
        { tex: String.raw`\frac{\mu_0 I\theta}{4\pi r^2}`, why: 'The arc length is $r\\theta$, so one power of $r$ cancels. Check the units: this is not a field.' },
      ],
      line: String.raw`B_{\text{arc}} = \frac{\mu_0 I\theta}{4\pi r}`,
      show: 'outer',
      values: (s) => {
        const b = sectorOuter(s);
        const B = Math.abs(sumB(s.I, sectorPoints(s.R, b, SECTOR_THETA).outer).y);
        return { show: `outer arc: formula ${sig((MU0 * s.I * SECTOR_THETA) / (4 * PI * b), 'T')}, summed in the lab ${sig(B, 'T')}`, eq: [[(MU0 * s.I * SECTOR_THETA) / (4 * PI * b), B]] };
      },
    },
    {
      ask: 'The outer arc runs counterclockwise and the inner arc clockwise. How do their fields at $P$ combine?',
      options: [
        { text: 'They oppose: outer out of the page, inner into it', ok: true },
        { text: 'They add: both out of the page', why: 'Use the right-hand rule on each. Counterclockwise gives out of the page; clockwise gives into it.' },
        { text: 'They cancel exactly', why: 'They are the same angle but different radii. The nearer arc, radius $a$, makes the stronger field.' },
      ],
      line: String.raw`B = B_a - B_b`,
      show: 'both',
      values: (s) => {
        const q = sectorPoints(s.R, sectorOuter(s), SECTOR_THETA);
        const Bi = sumB(s.I, q.inner).y;
        const Bo = sumB(s.I, q.outer).y;
        return { show: `inner arc ${sig(Math.abs(Bi), 'T')} ${Bi < 0 ? 'into' : 'out of'} the page; outer arc ${sig(Math.abs(Bo), 'T')} ${Bo < 0 ? 'into' : 'out of'} it`, eq: [] };
      },
    },
    {
      ask: 'Put it together.',
      options: [
        { tex: String.raw`B = \frac{\mu_0 I\theta}{4\pi}\left(\frac1a - \frac1b\right)\ \text{into the page}`, ok: true },
        { tex: String.raw`B = \frac{\mu_0 I\theta}{4\pi}\left(\frac1a + \frac1b\right)`, why: 'The arcs circle $P$ in opposite senses, so their fields subtract.' },
        { tex: String.raw`B = \frac{\mu_0 I\theta}{4\pi}\left(\frac1b - \frac1a\right)\ \text{out of the page}`, why: 'Same size, wrong winner. $1/a > 1/b$: the inner arc wins, and it points into the page.' },
      ],
      line: String.raw`\vec B = \frac{\mu_0 I\theta}{4\pi}\left(\frac1a - \frac1b\right)\ \text{into the page}`,
      units: String.raw`\frac{\text{T·m}}{\text{A}}\cdot\text{A}\cdot\frac{1}{\text{m}} = \text{T}`,
      values: (s, c) => {
        const B = ((MU0 * s.I * SECTOR_THETA) / (4 * PI)) * (1 / s.R - 1 / sectorOuter(s));
        return { show: `formula ${sig(B, 'T')} (θ = 90°); the lab’s Σ dB = ${sig(c.biot.magFull, 'T')}, pointing ${dirWord(c.biot.Bfull.y)}`, eq: [[B, c.biot.magFull], [-c.biot.Bfull.y, c.biot.magFull]] };
      },
    },
  ],
  done: 'Every flat loop at its centre comes down to two questions: which parts aim at $P$ (they add nothing), and which way each arc circles $P$. Arcs give $\\mu_0 I\\theta/4\\pi r$ and add or subtract by direction.',
  overlay(key, s) {
    const a = s.R;
    const b = sectorOuter(s);
    const th = SECTOR_THETA;
    const out = [];
    if (key === 'radial') {
      out.push({ kind: 'path', pts: [[0, 0.04, 0], at(b, 0, 0.04)], color: 'white', width: 2, dashed: true });
      out.push({ kind: 'path', pts: [[0, 0.04, 0], at(b, th, 0.04)], color: 'white', width: 2, dashed: true });
      out.push({ kind: 'label', at: at((a + b) / 2, -0.25), html: '<i>dL</i> ∥ <i>r̂</i>' });
      out.push({ kind: 'label', at: at((a + b) / 2, th + 0.3), html: '<i>dL</i> ∥ <i>r̂</i>' });
    }
    if (key === 'outer' || key === 'both') {
      out.push({ kind: 'path', pts: ringPts(b, 0, th), color: 'I', width: 6 });
      out.push({ kind: 'label', at: at(b + 0.08, th / 2), html: key === 'both' ? 'outer: counterclockwise, out' : '<i>b</i>, angle <i>θ</i>' });
    }
    if (key === 'both') {
      out.push({ kind: 'path', pts: ringPts(a, th, 0), color: 'mark', width: 6 });
      out.push({ kind: 'label', at: at(a * 0.45, th / 2), html: 'inner: clockwise, into' });
    }
    return out;
  },
};

const biotRect = {
  id: 'biot-rect',
  lab: 'biot',
  notes: { exam: 'e4', section: 's12', h3: 'Field at the center of a loop' },
  title: 'A rectangular loop: B at its centre',
  goal: 'A rectangular loop, $W$ wide and $H$ high, carries $I$ counterclockwise. Find $B$ at its centre $P$.',
  applies: (s) => s.kind === 'rect' && atCentre(s),
  scenario: 'rect',
  prepare(s) {
    if (s.kind === 'rect') s.probe = { x: 0, y: 0, z: 0 };
  },
  steps: [
    {
      ask: 'Break the loop into its four straight sides. How do their fields at $P$ compare?',
      options: [
        { text: 'All point out of the page; opposite sides are equal in pairs', ok: true },
        { text: 'All four are equal', why: 'Only for a square. The sides of length $W$ are $H/2$ from $P$, the sides of length $H$ are $W/2$ away.' },
        { text: 'Opposite sides cancel', why: 'Opposite currents on opposite sides of $P$ circle it the same way. Every side’s field points out of the page.' },
      ],
      line: String.raw`B = 2B_W + 2B_H`,
      show: 'sides',
      values: (s, c) => {
        const W = s.L;
        const H = s.R;
        const bw = Math.abs(sumB(s.I, runPoints({ x: W / 2, z: H / 2 }, { x: -W / 2, z: H / 2 }, 24)).y);
        const bh = Math.abs(sumB(s.I, runPoints({ x: W / 2, z: -H / 2 }, { x: W / 2, z: H / 2 }, 24)).y);
        return { show: `one W side ${sig(bw, 'T')}, one H side ${sig(bh, 'T')}; 2B_W + 2B_H = ${sig(2 * bw + 2 * bh, 'T')}; the lab’s Σ dB ${sig(c.biot.magFull, 'T')}`, eq: [[2 * bw + 2 * bh, c.biot.magFull]] };
      },
    },
    {
      ask: 'Take a side of length $W$. It is $H/2$ from $P$, and its ends are a distance $d = \\tfrac12\\sqrt{W^2 + H^2}$ from $P$. Using the straight-wire result with limits $\\pm W/2$, what is $B_W$?',
      options: [
        { tex: String.raw`B_W = \frac{\mu_0 I}{4\pi (H/2)}\cdot\frac{W}{d}`, ok: true },
        { tex: String.raw`B_W = \frac{\mu_0 I}{4\pi (W/2)}\cdot\frac{H}{d}`, why: 'That is the other pair. A side of length $W$ is a distance $H/2$ from $P$.' },
        { tex: String.raw`B_W = \frac{\mu_0 I}{2\pi (H/2)}`, why: 'That is an endless wire. This side is seen only out to its corners: the bracket is $2\\cdot\\tfrac{W/2}{d} = W/d$, less than 2.' },
      ],
      line: String.raw`B_W = \frac{\mu_0 I}{4\pi (H/2)}\left[\frac{x}{\sqrt{x^2 + (H/2)^2}}\right]_{-W/2}^{W/2} = \frac{\mu_0 I W}{2\pi H d}`,
      units: String.raw`\text{T}`,
      show: 'W',
      values: (s) => {
        const W = s.L;
        const H = s.R;
        const d = Math.hypot(W, H) / 2;
        const f = (MU0 * s.I * W) / (2 * PI * H * d);
        const bw = Math.abs(sumB(s.I, runPoints({ x: W / 2, z: H / 2 }, { x: -W / 2, z: H / 2 }, 24)).y);
        return { show: `formula ${sig(f, 'T')}; one W side summed in the lab ${sig(bw, 'T')}`, eq: [[f, bw]] };
      },
    },
    {
      ask: 'Swap $W$ and $H$ for the other pair, and add all four.',
      options: [
        { tex: String.raw`B = \frac{2\mu_0 I\sqrt{W^2 + H^2}}{\pi W H}\ \text{out of the page}`, ok: true },
        { tex: String.raw`B = \frac{\mu_0 I\sqrt{W^2 + H^2}}{\pi W H}`, why: 'That counts one of each pair. There are two sides of each length.' },
        { tex: String.raw`B = \frac{2\sqrt2\,\mu_0 I}{\pi W}`, why: 'That is the square, $W = H$. Here the two pairs differ.' },
      ],
      line: String.raw`B = 2\cdot\frac{\mu_0 I}{2\pi d}\left(\frac{W}{H} + \frac{H}{W}\right) = \frac{2\mu_0 I\sqrt{W^2 + H^2}}{\pi W H}`,
      units: String.raw`\text{T}`,
      values: (s, c) => {
        const B = (2 * MU0 * s.I * Math.hypot(s.L, s.R)) / (PI * s.L * s.R);
        return { show: `formula ${sig(B, 'T')}; the lab’s Σ dB = ${sig(c.biot.magFull, 'T')}, pointing ${dirWord(c.biot.Bfull.y)}`, eq: [[B, c.biot.magFull], [c.biot.Bfull.y, c.biot.magFull]] };
      },
    },
  ],
  done: 'Check: with $W = H = L$ this gives $2\\sqrt2\\,\\mu_0 I/\\pi L$, the square. Make $W$ much longer than $H$ and it tends to $2\\mu_0 I/\\pi H$: two long wires $H/2$ away.',
  overlay(key, s) {
    const w = (s.L / 2) * U;
    const h = (s.R / 2) * U;
    const out = [];
    if (key === 'sides' || key === 'W') {
      out.push({ kind: 'path', pts: [[w, 0.04, h], [-w, 0.04, h]], color: 'I', width: 7 });
      out.push({ kind: 'label', at: [0, 0.3, h + 0.45], html: 'length <i>W</i>' });
    }
    if (key === 'sides') {
      out.push({ kind: 'path', pts: [[w, 0.04, -h], [w, 0.04, h]], color: 'mark', width: 7 });
      out.push({ kind: 'label', at: [w + 0.9, 0.3, 0], html: 'length <i>H</i>' });
    }
    if (key === 'W') {
      out.push({ kind: 'path', pts: [[0, 0.04, 0], [0, 0.04, h]], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: [0.5, 0.3, h / 2], html: '<i>H</i>/2' });
      out.push({ kind: 'path', pts: [[0, 0.04, 0], [w, 0.04, h]], color: 'white', width: 1.5, dashed: true });
      out.push({ kind: 'path', pts: [[0, 0.04, 0], [-w, 0.04, h]], color: 'white', width: 1.5, dashed: true });
      out.push({ kind: 'label', at: [w * 0.55, 0.3, h * 0.2], html: '<i>d</i>' });
    }
    return out;
  },
};

const biotSemis = {
  id: 'biot-semis',
  lab: 'biot',
  notes: { exam: 'e4', section: 's12', h3: 'Field at the center of a loop' },
  title: 'Two semicircles, radii a and b (Worksheet 4 #15)',
  goal: 'Two semicircles share a centre $P$: radius $a$ inside, $b$ outside, joined by flat pieces along the line through $P$. The current runs counterclockwise round the inner one and clockwise round the outer one. Find $\\vec B$ at $P$.',
  applies: (s) => s.kind === 'sector' && s.arc === 180 && !!s.rev && atCentre(s),
  scenario: 'semis',
  prepare(s) {
    if (s.kind === 'sector') s.probe = { x: 0, y: 0, z: 0 };
  },
  steps: [
    {
      ask: 'The sheet says to ignore the flat pieces. Why is that safe here?',
      options: [
        { text: 'They lie on the line through $P$: $d\\vec L\\parallel\\hat r$, so they add nothing', ok: true },
        { text: 'They are short, so their field is small', why: 'Length isn’t the reason. Each flat piece points straight at $P$, so $d\\vec L\\times\\hat r = 0$ however long it is.' },
        { text: 'Their two fields cancel', why: 'Each is zero by itself, because it points at $P$. Nothing needs to cancel.' },
      ],
      line: String.raw`d\vec L\parallel\hat r\ \Rightarrow\ dB_{\text{flat}} = 0`,
      show: 'flats',
      values: (s) => {
        const q = sectorPoints(s.R, sectorOuter(s), PI, true);
        const B = sumB(s.I, q.out).y + sumB(s.I, q.back).y;
        return { show: `the flat pieces, summed in the lab: ${Math.abs(B) < 1e-15 ? '0 T' : sig(B, 'T')}`, eq: [] };
      },
    },
    {
      ask: 'On either semicircle, $d\\vec L$ runs along the arc and $\\hat r$ points from the piece to $P$. What is $|d\\vec L\\times\\hat r|$, and how far is each piece from $P$?',
      options: [
        { tex: String.raw`dL,\ \text{with } r = a \text{ on the inner arc and } r = b \text{ on the outer}`, ok: true },
        { tex: String.raw`dL\,\sin\theta,\ \theta \text{ changing along the arc}`, why: 'On a circle centred on $P$, $d\\vec L$ is tangent and $\\hat r$ is radial: $90^\\circ$ at every piece.' },
        { tex: String.raw`dL,\ \text{with } r = b - a`, why: 'Each piece’s distance is to $P$, the centre: $a$ for the inner arc, $b$ for the outer.' },
      ],
      line: String.raw`d\vec L = r\,d\theta\ \hat\theta,\quad |d\vec L\times\hat r| = r\,d\theta,\quad dB = \frac{\mu_0 I}{4\pi}\frac{r\,d\theta}{r^2}`,
      show: 'arcs',
      values: (s) => ({ show: `a = ${sig(s.R, 'm')}, b = ${sig(sectorOuter(s), 'm')}`, eq: [] }),
    },
    {
      ask: 'Integrate one semicircle, $\\theta$ from $0$ to $\\pi$.',
      options: [
        { tex: String.raw`B_r = \frac{\mu_0 I}{4\pi r}\int_0^{\pi} d\theta = \frac{\mu_0 I}{4r}`, ok: true },
        { tex: String.raw`B_r = \frac{\mu_0 I}{2r}`, why: 'That is a full loop, $\\theta$ to $2\\pi$. A semicircle is half of it.' },
        { tex: String.raw`B_r = \frac{\mu_0 I}{4\pi r^2}`, why: '$dL = r\\,d\\theta$: one $r$ cancels. Check the units: this is not a field.' },
      ],
      line: String.raw`B_a = \frac{\mu_0 I}{4a},\qquad B_b = \frac{\mu_0 I}{4b}`,
      units: String.raw`\frac{\text{T·m}}{\text{A}}\cdot\frac{\text{A}}{\text{m}} = \text{T}`,
      show: 'arcs',
      values: (s) => {
        const q = sectorPoints(s.R, sectorOuter(s), PI, true);
        const Ba = Math.abs(sumB(s.I, q.inner).y);
        return { show: `inner: formula ${sig((MU0 * s.I) / (4 * s.R), 'T')}, summed in the lab ${sig(Ba, 'T')}`, eq: [[(MU0 * s.I) / (4 * s.R), Ba]] };
      },
    },
    {
      ask: 'Directions. The inner arc runs counterclockwise round $P$, the outer clockwise. Use the right-hand rule on each.',
      options: [
        { text: 'Inner: out of the page. Outer: into the page. They oppose.', ok: true },
        { text: 'Both out of the page', why: 'Clockwise and counterclockwise give opposite directions. Curl your fingers each way.' },
        { text: 'Inner: into the page. Outer: out of the page.', why: 'Counterclockwise curl puts your thumb out of the page, so the inner arc points out.' },
      ],
      line: String.raw`\vec B_a\ \text{out},\quad \vec B_b\ \text{in}`,
      show: 'dirs',
      values: (s) => {
        const q = sectorPoints(s.R, sectorOuter(s), PI, true);
        const Bi = sumB(s.I, q.inner).y;
        const Bo = sumB(s.I, q.outer).y;
        return { show: `in the lab: inner ${Bi > 0 ? 'out of' : 'into'} the page, outer ${Bo > 0 ? 'out of' : 'into'} the page`, eq: [[Bi, Math.abs(Bi)], [-Bo, Math.abs(Bo)]] };
      },
    },
    {
      ask: 'Add them, with their directions.',
      options: [
        { tex: String.raw`\vec B = \frac{\mu_0 I}{4}\left(\frac1a - \frac1b\right)\ \text{out of the page}`, ok: true },
        { tex: String.raw`\vec B = \frac{\mu_0 I}{4}\left(\frac1a + \frac1b\right)`, why: 'They point opposite ways, so they subtract.' },
        { tex: String.raw`\vec B = \frac{\mu_0 I}{4}\left(\frac1b - \frac1a\right)\ \text{into the page}`, why: '$a < b$, so $1/a > 1/b$: the inner arc wins, and it points out of the page.' },
      ],
      line: String.raw`\vec B = \frac{\mu_0 I}{4}\left(\frac1a - \frac1b\right)\ \text{out of the page}`,
      units: String.raw`\text{T}`,
      values: (s, c) => {
        const B = ((MU0 * s.I) / 4) * (1 / s.R - 1 / sectorOuter(s));
        return { show: `formula ${sig(B, 'T')}; the lab’s Σ dB = ${sig(c.biot.magFull, 'T')}, pointing ${dirWord(c.biot.Bfull.y)}`, eq: [[B, c.biot.magFull], [c.biot.Bfull.y, c.biot.magFull]] };
      },
    },
  ],
  done: 'For part A: label $d\\vec L$ tangent to each arc, in the current’s direction, and $\\vec r$ from each piece to $P$, of length $a$ or $b$. Same method as the pie slice with $\\theta = \\pi$.',
  overlay(key, s) {
    const a = s.R;
    const b = sectorOuter(s);
    const out = [];
    if (key === 'flats') {
      out.push({ kind: 'path', pts: [[-b * U - 0.4, 0.04, 0], [b * U + 0.4, 0.04, 0]], color: 'white', width: 2, dashed: true });
      out.push({ kind: 'label', at: [b * U + 0.9, 0.3, 0.45], html: '<i>dL</i> ∥ <i>r̂</i>' });
    }
    if (key === 'arcs' || key === 'dirs') {
      out.push({ kind: 'path', pts: ringPts(a, 0, PI), color: 'mark', width: 6 });
      out.push({ kind: 'path', pts: ringPts(b, 0, PI), color: 'I', width: 6 });
    }
    if (key === 'arcs') {
      out.push({ kind: 'path', pts: [[0, 0.04, 0], at(a, PI / 3, 0.04)], color: 'white', width: 2 });
      out.push({ kind: 'label', at: at(a * 0.55, PI / 3 + 0.35), html: '<i>a</i>' });
      out.push({ kind: 'path', pts: [[0, 0.04, 0], at(b, (2 * PI) / 3, 0.04)], color: 'white', width: 2 });
      out.push({ kind: 'label', at: at(b * 0.6, (2 * PI) / 3 + 0.25), html: '<i>b</i>' });
    }
    if (key === 'dirs') {
      out.push({ kind: 'label', at: at(a * 0.55, PI / 2), html: 'inner: ccw, out' });
      out.push({ kind: 'label', at: at(b + 0.1, PI / 2), html: 'outer: cw, in' });
    }
    return out;
  },
};

const biotWireLoop = {
  id: 'biot-wireloop',
  lab: 'biot',
  notes: { exam: 'e4', section: 's12', h3: 'Field at the center of a loop' },
  title: 'A loop that cancels a wire’s field (Worksheet 4 #14)',
  goal: 'A long straight wire carries $I$ down the page, a distance $d$ to the right of a loop’s centre. The loop has radius $R$. What current, and which way round, must the loop carry for $B = 0$ at its centre?',
  applies: (s) => s.kind === 'wireloop' && atCentre(s),
  scenario: 'wireloop',
  prepare(s) {
    if (s.kind === 'wireloop') s.probe = { x: 0, y: 0, z: 0 };
  },
  steps: [
    {
      ask: 'First the wire alone. It is long, and the loop’s centre is a distance $d$ from it. What field does it make there?',
      options: [
        { tex: String.raw`B_w = \frac{\mu_0 I}{2\pi d}`, ok: true },
        { tex: String.raw`B_w = \frac{\mu_0 I}{2\pi R}`, why: 'The distance that counts is from the wire to the centre, $d$, not the loop’s radius.' },
        { tex: String.raw`B_w = \frac{\mu_0 I}{4\pi d}`, why: 'That is half a wire, one that ends opposite the point. This wire runs past the centre both ways.' },
      ],
      line: String.raw`B_w = \frac{\mu_0 I}{2\pi d}`,
      units: String.raw`\text{T}`,
      show: 'wire',
      values: (s, c) => {
        const f = (MU0 * s.I) / (2 * PI * s.L);
        return { show: `formula ${sig(f, 'T')}; the 40 m wire summed in the lab ${sig(Math.abs(c.biot.Bwire.y), 'T')}`, eq: [[f, Math.abs(c.biot.Bwire.y)]] };
      },
    },
    {
      ask: 'Which way does the wire’s field point at the loop’s centre? The current runs down the page and the centre is to the wire’s left.',
      options: [
        { text: 'Into the page', ok: true },
        { text: 'Out of the page', why: 'Point your right thumb down the page along the current. On the wire’s left side your fingers go into the page.' },
        { text: 'Down the page, along the wire', why: 'A wire’s field circles it; it is never along the current.' },
      ],
      line: String.raw`\vec B_w\ \text{into the page}`,
      show: 'wire',
      values: (s, c) => ({ show: `the lab: the wire’s field at the centre points ${c.biot.Bwire.y < 0 ? 'into' : 'out of'} the page`, eq: [[-c.biot.Bwire.y, Math.abs(c.biot.Bwire.y)]] }),
    },
    {
      ask: 'Now the loop alone, at its own centre. What field does a loop of radius $R$ with current $I_L$ make there?',
      options: [
        { tex: String.raw`B_L = \frac{\mu_0 I_L}{2R}`, ok: true },
        { tex: String.raw`B_L = \frac{\mu_0 I_L}{2\pi R}`, why: 'That is a long straight wire. A loop’s pieces are all $R$ away and all add: $\\frac{\\mu_0 I_L}{4\\pi R^2}\\cdot 2\\pi R$.' },
        { tex: String.raw`B_L = \frac{\mu_0 I_L}{4R}`, why: 'That is a half loop. The full circle has $\\int dL = 2\\pi R$.' },
      ],
      line: String.raw`B_L = \frac{\mu_0 I_L}{4\pi R^2}\,(2\pi R) = \frac{\mu_0 I_L}{2R}`,
      units: String.raw`\text{T}`,
      show: 'loop',
      values: (s, c) => {
        const f = (MU0 * Math.abs(s.IL ?? 0)) / (2 * s.R);
        return { show: `with the slider’s ${sig(Math.abs(s.IL ?? 0), 'A')}: formula ${sig(f, 'T')}, the loop summed in the lab ${sig(Math.abs(c.biot.Bloop.y), 'T')}`, eq: [[f, Math.abs(c.biot.Bloop.y)]] };
      },
    },
    {
      ask: 'For zero at the centre the two must be equal and opposite. Solve for $I_L$.',
      options: [
        { tex: String.raw`\frac{\mu_0 I_L}{2R} = \frac{\mu_0 I}{2\pi d}\ \Rightarrow\ I_L = \frac{I R}{\pi d}`, ok: true },
        { tex: String.raw`I_L = \frac{\pi d\,I}{R}`, why: 'Upside down. Multiply both sides by $2R/\\mu_0$: $I_L = 2R\\cdot\\frac{I}{2\\pi d} = \\frac{IR}{\\pi d}$.' },
        { tex: String.raw`I_L = \frac{I R}{d}`, why: 'The $\\pi$ from the wire’s $2\\pi d$ stays: the loop has no $\\pi$, the wire does.' },
      ],
      line: String.raw`I_L = \frac{I R}{\pi d}`,
      units: String.raw`\text{A}\cdot\frac{\text{m}}{\text{m}} = \text{A}`,
      values: (s) => ({ show: `I_L = ${sig((s.I * s.R) / (PI * s.L), 'A')} for these numbers`, eq: [] }),
    },
    {
      ask: 'Which way round must the loop’s current go?',
      options: [
        { text: 'Counterclockwise, so its field points out of the page', ok: true },
        { text: 'Clockwise', why: 'Clockwise gives a field into the page: it would add to the wire’s, not cancel it.' },
        { text: 'Either way', why: 'Only one direction opposes the wire’s field, which is into the page.' },
      ],
      line: String.raw`I_L = \frac{I R}{\pi d}\ \text{counterclockwise}`,
      after: 'Try it: set the loop-current slider to this value (positive is counterclockwise) and the lab’s |ΣdB| drops to zero.',
      values: (s, c) => ({ show: `the lab now: net |B| at the centre = ${sig(c.biot.magFull, 'T')} with I_L = ${sig(s.IL ?? 0, 'A')}`, eq: [] }),
    },
  ],
  done: 'With $I = 30$ A, $R = 0.2$ m and $d = 0.4$ m: $I_L = 30(0.2)/(0.4\\pi) = 4.77$ A, counterclockwise.',
  overlay(key, s) {
    const d = s.L * U;
    const R = s.R * U;
    const out = [];
    if (key === 'wire') {
      out.push({ kind: 'path', pts: [[d, 0.04, -3], [d, 0.04, 3]], color: 'I', width: 7 });
      out.push({ kind: 'path', pts: [[0, 0.04, 0], [d, 0.04, 0]], color: 'mark', width: 2.5 });
      out.push({ kind: 'label', at: [d / 2, 0.3, -0.35], html: '<i>d</i>' });
    }
    if (key === 'loop') {
      out.push({ kind: 'path', pts: ringPts(s.R, 0, 2 * PI, 0.04, 64), color: 'mark', width: 5 });
      out.push({ kind: 'path', pts: [[0, 0.04, 0], [-R * 0.7, 0.04, R * 0.7]], color: 'white', width: 2 });
      out.push({ kind: 'label', at: [-R * 0.45, 0.3, R * 0.25], html: '<i>R</i>' });
    }
    return out;
  },
};

export const EXAM4 = [rcCharge, rcDischarge, biotWire, biotEnd, biotHalf, biotQuarter, biotHairpin, biotSector, biotSemis, biotWireLoop, biotSquare, biotRect, biotLoop, ampereThick];
