import {
  areaBetween,
  areaBetweenSimpson,
  diskSimpson,
  diskVolume,
  segmentLength,
  segmentSimpson,
  shellVolume,
  springSimpson,
  springWork,
  washerSimpson,
  washerVolume,
} from '../../math/calc2.js';
import { domain, kase, num, problem, range, tf } from '../kit.js';

const frame = { xMin: -0.6, xMax: 4.8, yMin: -2.8, yMax: 2.8, plane: 'xy' };

export default [
  problem({
    id: 'u1.vol.disk',
    exam: 'u1',
    ch: '2',
    lab: 'solids',
    src: 'OpenStax Calc 2 §2.2',
    title: 'Disk volume',
    kind: 'numeric',
    level: 1,
    topics: ['volumes'],
    vars: { b: range(1, 4, 0.05) },
    derive: ($) => ({ v: diskVolume($.b) }),
    second: ($) => ({ v: shellVolume($.b) }),
    text: (T) =>
      String.raw`The region under $y=\sqrt{x}$ from $0$ to $${T.b}$ is rotated about the $x$-axis. Find the volume.`,
    parts: [num('v', ($) => $.v, '', { label: 'volume', abs: 1e-6 })],
    hints: [
      'Slice across the axis. Each slice is a disk whose radius is the height of the curve.',
      String.raw`At $x$ the radius is $\sqrt{x}$, so the slice area is $\pi x$.`,
      (T) => String.raw`Integrate $\pi x$ from $0$ to $${T.b}$.`,
    ],
    steps: ($, f) => [
      String.raw`Disks: $V=\pi\int_0^{${f($.b)}} x\,dx=\pi b^2/2$.`,
      String.raw`The volume is $${f($.v)}$.`,
      'Shells, radius $y$ and length $b-y^2$, give the same volume.',
    ],
    sim: {
      scenario: 'disks',
      setup(slice, $) {
        slice.method = 'disks';
        slice.b = $.b;
        slice.n = 6;
        return domain(slice, frame);
      },
      read: (c) => ({ v: c.disk }),
    },
    cases: [kase('b=4', { b: 4 }, { v: 8 * Math.PI })],
  }),

  problem({
    id: 'u1.vol.shell',
    exam: 'u1',
    ch: '2',
    lab: 'solids',
    src: 'OpenStax Calc 2 §2.3',
    title: 'Shell volume',
    kind: 'numeric',
    level: 2,
    topics: ['volumes'],
    vars: { b: range(1, 4, 0.05) },
    derive: ($) => ({ v: shellVolume($.b) }),
    second: ($) => ({ v: diskVolume($.b) }),
    text: (T) =>
      String.raw`The same region, under $y=\sqrt{x}$ on $[0,${T.b}]$, is rotated about the $x$-axis. Find the volume with cylindrical shells.`,
    parts: [num('v', ($) => $.v, '', { label: 'volume', abs: 1e-6 })],
    hints: [
      'Shells about the $x$-axis lie along it. Slice in $y$, not in $x$.',
      (T) => String.raw`At height $y$ the shell has radius $y$. It runs from $x=y^2$ to $x=${T.b}$.`,
      (T) => String.raw`Integrate $2\pi y(${T.b}-y^2)$ from $y=0$ to $y=\sqrt{${T.b}}$.`,
    ],
    steps: ($, f) => [
      String.raw`Shells: $V=\int_0^{\sqrt{b}} 2\pi y(b-y^2)\,dy$.`,
      String.raw`The volume is $${f($.v)}$.`,
      'Disks give the same volume.',
    ],
    sim: {
      scenario: 'shells',
      setup(slice, $) {
        slice.method = 'shells';
        slice.b = $.b;
        slice.n = 5;
        return domain(slice, frame);
      },
      read: (c) => ({ v: c.shell }),
    },
    cases: [kase('b=4', { b: 4 }, { v: 8 * Math.PI })],
  }),

  problem({
    id: 'u1.vol.ratio',
    exam: 'u1',
    ch: '2',
    lab: 'solids',
    src: 'OpenStax Calc 2 §2.2',
    title: 'Volume over π',
    kind: 'numeric',
    level: 1,
    topics: ['volumes'],
    vars: { b: range(1, 4, 0.05) },
    derive: ($) => ({ q: diskVolume($.b) / Math.PI }),
    second: ($) => ({ q: diskSimpson($.b) / Math.PI }),
    text: (T) =>
      String.raw`For the solid under $y=\sqrt{x}$ on $[0,${T.b}]$, rotated about the $x$-axis, give the volume divided by $\pi$.`,
    parts: [num('q', ($) => $.q, '', { label: 'volume / π', abs: 1e-6 })],
    hints: [
      'Set up the disk integral. The factor $\\pi$ comes outside it.',
      String.raw`Each disk has area $\pi(\sqrt{x})^2=\pi x$.`,
      (T) => String.raw`So the volume over $\pi$ is $\int_0^{${T.b}}x\,dx$.`,
    ],
    steps: ($, f) => [
      String.raw`$V/\pi=b^2/2=${f($.q)}$.`,
      "Simpson's rule on the disk integrand gives the same quotient.",
    ],
    sim: {
      scenario: 'disks',
      setup(slice, $) {
        slice.method = 'disks';
        slice.b = $.b;
        slice.n = 6;
        return domain(slice, frame);
      },
      read: (c) => ({ q: c.overPi }),
    },
    cases: [kase('b=4', { b: 4 }, { q: 8 })],
  }),

  problem({
    id: 'u1.vol.same',
    exam: 'u1',
    ch: '2',
    src: 'OpenStax Calc 2 §2.3',
    title: 'Two slicings, one volume',
    kind: 'conceptual',
    level: 1,
    topics: ['volumes'],
    vars: { b: range(1, 4, 0.05) },
    derive: ($) => ({ same: Math.abs(diskVolume($.b) - shellVolume($.b)) < 1e-6 ? 1 : 0 }),
    second: ($) => ({ same: Math.abs(diskSimpson($.b) - shellVolume($.b)) < 1e-4 ? 1 : 0 }),
    text: (T) =>
      String.raw`True or false: for $y=\sqrt{x}$ on $[0,${T.b}]$, rotated about the $x$-axis, disks and shells give the same volume.`,
    parts: [tf('same', ($) => (Math.abs(diskVolume($.b) - shellVolume($.b)) < 1e-6 ? 1 : 0), { label: 'volumes agree' })],
    hints: [
      'Disks and shells slice one solid in two directions. Each integral is exact, not an estimate.',
      (T) => String.raw`Compute both: $\int_0^{${T.b}}\pi x\,dx$ and $\int_0^{\sqrt{${T.b}}}2\pi y(${T.b}-y^2)\,dy$.`,
    ],
    steps: () => ['The disk integral and the shell integral are two ways of adding the same solid.'],
    cases: [kase('b=4', { b: 4 }, { same: 1 })],
  }),

  problem({
    id: 'u1.area.gap',
    exam: 'u1',
    ch: '2',
    src: 'OpenStax Calc 2 §2.1',
    title: 'Area between two curves',
    kind: 'numeric',
    level: 1,
    topics: ['area'],
    vars: { b: range(0.1, 1, 0.01) },
    derive: ($) => ({ a: areaBetween($.b) }),
    second: ($) => ({ a: areaBetweenSimpson($.b) }),
    text: (T) => String.raw`Find the area between $y=x$ and $y=x^2$ on $[0,${T.b}]$.`,
    parts: [num('a', ($) => $.a, '', { label: 'area', abs: 1e-6 })],
    hints: [
      'The area between two curves is the integral of the top one minus the bottom one.',
      String.raw`On $[0,1]$, $x\ge x^2$, so the line is on top.`,
      (T) => String.raw`Integrate $x-x^2$ from $0$ to $${T.b}$.`,
    ],
    steps: ($, f) => [
      String.raw`$\int_0^b (x-x^2)\,dx=b^2/2-b^3/3$.`,
      String.raw`The area is $${f($.a)}$.`,
    ],
    cases: [kase('unit interval', { b: 1 }, { a: 1 / 6 })],
  }),

  problem({
    id: 'u1.vol.washer',
    exam: 'u1',
    ch: '2',
    src: 'OpenStax Calc 2 §2.2',
    title: 'Washer volume',
    kind: 'numeric',
    level: 2,
    topics: ['volumes'],
    vars: { b: range(0.1, 1, 0.01) },
    derive: ($) => ({ v: washerVolume($.b) }),
    second: ($) => ({ v: washerSimpson($.b) }),
    text: (T) =>
      String.raw`The region between $y=x$ and $y=x^2$ on $[0,${T.b}]$ is rotated about the $x$-axis. Find the volume.`,
    parts: [num('v', ($) => $.v, '', { label: 'volume', abs: 1e-6 })],
    hints: [
      'Each slice is a washer: a disk with a smaller disk removed.',
      'The outer radius is $x$. The inner radius is $x^2$.',
      (T) => String.raw`Integrate $\pi(x^2-x^4)$ from $0$ to $${T.b}$.`,
    ],
    steps: ($, f) => [
      String.raw`Washers: $\pi\int_0^b (x^2-x^4)\,dx$.`,
      String.raw`The volume is $${f($.v)}$.`,
      "Simpson's rule on the washer integrand agrees.",
    ],
    cases: [kase('unit interval', { b: 1 }, { v: (2 * Math.PI) / 15 })],
  }),

  problem({
    id: 'u1.arc.line',
    exam: 'u1',
    ch: '2',
    lab: 'arc',
    src: 'OpenStax Calc 2 §2.4',
    title: 'Length of a segment',
    kind: 'numeric',
    level: 1,
    topics: ['arc length'],
    vars: { b: range(1, 50, 1) },
    derive: ($) => ({ len: segmentLength($.b) }),
    second: ($) => ({ len: segmentSimpson($.b) }),
    text: (T) => String.raw`Find the arc length of $y=x$ from $(0,0)$ to $(${T.b},${T.b})$.`,
    parts: [num('len', ($) => $.len, '', { label: 'length', abs: 1e-6 })],
    hints: [
      String.raw`Arc length is $\int\sqrt{1+(y')^2}\,dx$.`,
      'For $y=x$ the slope is $1$ everywhere, so the integrand is a constant.',
      (T) => String.raw`Integrate that constant from $0$ to $${T.b}$. The distance formula checks it.`,
    ],
    steps: ($, f) => [
      String.raw`$\int_0^b \sqrt{2}\,dx=b\sqrt{2}$.`,
      String.raw`The length is $${f($.len)}$.`,
    ],
    sim: {
      scenario: 'line',
      setup(slice, $) {
        slice.kind = 'line';
        slice.b = $.b;
        const span = $.b;
        return domain(slice, { xMin: -0.2 * span, xMax: span * 1.2, yMin: -0.2 * span, yMax: span * 1.2, plane: 'xy' });
      },
      read: (c) => ({ len: c.length }),
    },
    cases: [kase('unit segment', { b: 1 }, { len: Math.SQRT2 })],
  }),

  problem({
    id: 'u1.work.spring',
    exam: 'u1',
    ch: '2',
    src: 'OpenStax Calc 2 §2.5',
    title: 'Work to stretch a spring',
    kind: 'numeric',
    level: 2,
    topics: ['work'],
    vars: { k: range(1, 10, 1), d: range(1, 5, 1) },
    derive: ($) => ({ w: springWork($.k, $.d) }),
    second: ($) => ({ w: springSimpson($.k, $.d) }),
    text: (T) =>
      String.raw`A spring pulls back with force $kx$. The constant is $${T.k}$ pounds per foot. It is stretched $${T.d}$ feet from rest. Find the work in foot-pounds.`,
    parts: [num('w', ($) => $.w, '', { label: 'work', abs: 1e-6 })],
    hints: [
      'Work by a varying force is the integral of the force over the distance.',
      (T) => String.raw`At a stretch of $x$ feet the force is $${String(T.k) === '1' ? '' : T.k}x$ pounds.`,
      (T) => String.raw`Integrate it from $x=0$ to $x=${T.d}$.`,
    ],
    steps: ($, f) => [
      String.raw`$W=kd^2/2=${f($.w)}$.`,
      "Simpson's rule on $kx$ agrees.",
    ],
    cases: [kase('k=4, d=2', { k: 4, d: 2 }, { w: 8 })],
  }),
];
