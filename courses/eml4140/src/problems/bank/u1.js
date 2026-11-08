/**
 * Unit 1 bank: the heat equation on a rod. Original problems, written for the Rod lab, with staged
 * hints and named traps (../coaching/u1.js), each checked against the lab (`sim`).
 */
import { ALPHA } from '@flux/subjects/heat/rod.js';
import { pipe, wall } from '@flux/subjects/heat/resistance.js';
import { choice, kase, num, problem, range } from '../kit.js';
import { FIN, MATERIALS, finClosed } from '@flux/subjects/heat/fins.js';
import { MATERIALS as SLAB_MATERIALS, SLAB } from '@flux/subjects/heat/transient.js';
import { BODIES, SKIN, eff } from '@flux/subjects/heat/contact.js';
import { ROD } from '@flux/subjects/heat/explicit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
export const HALF = Math.log(2) / Math.PI ** 2;
/** The house wall with or without its 90 mm of glass wool, 20 °C inside and Tout outside. */
export const WALL = (ins, Tout) => ({ layers: [{ L: 0.013, k: 0.17 }, { L: ins, k: 0.04 }, { L: 0.1, k: 0.7 }], hIn: 8, hOut: 25, Tin: 20, Tout });
export const WOOL = { with: 0.09, without: 0 };
export const KINS = { rubber: 0.13, foam: 0.035 };
export const NAME = { copper: 'copper', aluminum: 'aluminum', steel: 'carbon steel', glass: 'Pyrex glass' };
/** The middle of the rod, θ, for the two profiles the problems use. */
export const midTheta = (profile, Fo) => Math.exp(-(Math.PI ** 2) * Fo) + (profile === 'wiggle' ? Math.exp(-25 * Math.PI ** 2 * Fo) / 3 : 0);

/** A very long pin fin: q = √(hPkA_c) θ_b, for D in mm. */
export const longFin = ($, area = (D) => (Math.PI * D * D) / 4) => {
  const D = Number($.D) / 1000;
  return Math.sqrt($.h * Math.PI * D * MATERIALS[$.mat].k * area(D)) * (FIN.Tb - FIN.Tinf);
};

/** Biot number of the lab's 4 cm plate. */
export const biot = ($, Lc = SLAB.L) => ($.h * Lc) / SLAB_MATERIALS[$.mat].k;

/** The joint temperature for the skin at 34 °C on a block at Tb. */
export const jointT = ($, weight = eff) => (weight(SKIN) * SKIN.T + weight(BODIES[$.body]) * $.Tb) / (weight(SKIN) + weight(BODIES[$.body]));

/** Fo for the lab's rod with N cells and a step of dt ms. */
export const fourier = ($, square = true) => {
  const dx = ROD.L / $.N;
  return (ROD.alpha * ($.dt / 1000)) / (square ? dx * dx : dx);
};

export default [
  problem({
    id: 'u1.1.half-time',
    title: 'How long to cool halfway',
    exam: 'u1',
    ch: '1',
    lab: 'rod',
    src: 'Flux, written for the Rod lab',
    topics: ['heat-equation'],
    principles: ['diffusion-time'],
    vars: { material: choice(['copper', 'copper, α = 117 mm²/s'], ['aluminum', 'aluminum, α = 97.1 mm²/s'], ['steel', 'carbon steel, α = 17.7 mm²/s']), L: range(5, 30, 1, 'cm', 0.01) },
    text: (T) => String.raw`A rod of ${T.material}, ${T.L} cm long, has its ends held at a fixed temperature. Its excess temperature starts as a half sine, $\theta_0 = \sin(\pi x/L)$. How long until the middle has lost half its excess?`,
    parts: [num('t', ($) => (HALF * $.L ** 2) / ALPHA[$.material], 's', { label: 't' })],
    level: 1,
    hints: ['A half sine keeps its shape and fades as exp(−π²αt/L²).', 'Set exp(−π²αt/L²) = ½: t = (ln 2/π²) L²/α. Put L in metres and α in m²/s.'],
    steps: ($) => [String.raw`$t = \dfrac{\ln 2}{\pi^2}\,\dfrac{L^2}{\alpha} = 0.0702\times\dfrac{(${$.L})^2}{${ALPHA[$.material]}} = ${Number(((HALF * $.L ** 2) / ALPHA[$.material]).toPrecision(3))}$ s`],
    sim: {
      scenario: 'copper',
      setup(s, $) {
        Object.assign(s, { profile: 'hump', material: $.material, L: $.L, Fo: HALF });
      },
      read: (c) => ({ t: c.t }),
    },
    cases: [kase('a 10 cm copper rod', { material: 'copper', L: 10 }, { t: 6.003 })],
  }),

  problem({
    id: 'u1.2.middle',
    title: 'The middle of the rod',
    exam: 'u1',
    ch: '1',
    lab: 'rod',
    src: 'Flux, written for the Rod lab',
    topics: ['fourier-series'],
    principles: ['modes'],
    vars: { profile: choice(['hump', 'a half sine, θ₀ = sin(πx/L)'], ['wiggle', 'a half sine with a ripple, θ₀ = sin(πx/L) + ⅓ sin(5πx/L)']), t: range(1, 10, 0.5, 's') },
    text: (T) => String.raw`A copper rod 10 cm long ($\alpha = 117$ mm²/s) has its ends held at 20 °C. Its excess temperature starts as ${T.profile}, times 80 °C. What is the temperature at the middle after ${T.t} s?`,
    parts: [num('T', ($) => 20 + 80 * midTheta($.profile, (ALPHA.copper * $.t) / 0.01), '°C', { label: 'T' })],
    level: 2,
    hints: ['Find Fo = αt/L², with L = 0.1 m.', 'Each sine fades on its own: mode n by exp(−(nπ)²Fo). At the middle, sin(π/2) = sin(5π/2) = 1. Then add the ends’ 20 °C.'],
    steps: ($) => {
      const Fo = (ALPHA.copper * $.t) / 0.01;
      return [String.raw`$\mathrm{Fo} = \dfrac{(1.17\times10^{-4})(${$.t})}{0.1^2} = ${Number(Fo.toPrecision(3))}$`, String.raw`$\theta = ${Number(midTheta($.profile, Fo).toPrecision(3))}$, so $T = 20 + 80\theta = ${Number((20 + 80 * midTheta($.profile, Fo)).toPrecision(3))}$ °C`];
    },
    sim: {
      scenario: 'copper',
      setup(s, $) {
        Object.assign(s, { profile: $.profile, material: 'copper', L: 0.1, Fo: (ALPHA.copper * $.t) / 0.01 });
      },
      read: (c) => ({ T: c.midC }),
    },
    cases: [kase('a half sine after 4 s', { profile: 'hump', t: 4 }, { T: 70.41 })],
  }),

  problem({
    id: 'u1.3.scale',
    title: 'Another rod, the same profile',
    exam: 'u1',
    ch: '1',
    lab: 'rod',
    src: 'Flux, written for the Rod lab',
    topics: ['diffusion-scale'],
    principles: ['diffusion-time'],
    vars: { material: choice(['aluminum', 'aluminum (97.1 mm²/s)'], ['steel', 'carbon steel (17.7 mm²/s)'], ['glass', 'Pyrex glass (0.75 mm²/s)']), t1: range(2, 20, 1, 's'), L2: range(5, 30, 1, 'cm', 0.01) },
    text: (T) => String.raw`A copper rod 10 cm long ($\alpha = 117$ mm²/s) reaches some temperature profile ${T.t1} s after it starts. A rod of ${T.material}, ${T.L2} cm long, starts from the same shape. How long does it take to reach the same profile?`,
    parts: [num('t2', ($) => $.t1 * ($.L2 / 0.1) ** 2 * (ALPHA.copper / ALPHA[$.material]), 's', { label: 't₂' })],
    level: 2,
    hints: ['The profile depends on time only through Fo = αt/L². Same profile, same Fo.', 't₂ = t₁ (L₂/L₁)² (α₁/α₂).'],
    steps: ($) => [String.raw`$t_2 = t_1\left(\dfrac{L_2}{L_1}\right)^2\dfrac{\alpha_1}{\alpha_2} = ${$.t1}\left(\dfrac{${$.L2}}{0.1}\right)^2\dfrac{117}{${ALPHA[$.material] * 1e6}} = ${Number(($.t1 * ($.L2 / 0.1) ** 2 * (ALPHA.copper / ALPHA[$.material])).toPrecision(3))}$ s`],
    sim: {
      scenario: 'copper',
      setup(s, $) {
        Object.assign(s, { material: $.material, L: $.L2, Fo: (ALPHA.copper * $.t1) / 0.01 });
      },
      read: (c) => ({ t2: c.t }),
    },
    cases: [kase('a 20 cm steel rod', { material: 'steel', t1: 5, L2: 20 }, { t2: 132.2 })],
  }),

  problem({
    id: 'u1.4.what-lasts',
    title: 'What is left',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'rod',
    src: 'Flux, written for the Rod lab',
    topics: ['fourier-series'],
    principles: ['modes'],
    vars: { ripple: choice(['fine', 'a fine ripple, five bumps along the rod'], ['coarse', 'a coarser ripple, three bumps along the rod']) },
    text: (T) => String.raw`A rod with its ends held at a fixed temperature starts with a broad hump of heat and ${T.ripple} on top of it. After a while, what is left of the starting shape?`,
    parts: [
      pick('left', 'what is left', [
        ['hump', 'mostly the broad hump', 'Mode n fades as exp(−(nπ)²Fo). The hump is n = 1; the ripple is n = 3 or 5, which fades 9 or 25 times faster.'],
        ['ripple', 'mostly the ripple', 'The ripple has the steepest gradients, so heat flows across it fastest: it goes first, not last.'],
        ['both', 'both, in the same proportion', 'Each sine fades at its own rate, and the rate grows as n². The proportions change.'],
      ], () => 'hump'),
    ],
    level: 2,
    hints: ['Write the start as a sum of sines that fit between the ends.', 'Which fades faster, sin(πx/L) or sin(5πx/L)?'],
    steps: () => ['The hump is the first mode and fades as exp(−π²Fo). A ripple of n bumps fades as exp(−n²π²Fo), n² times faster, so the hump is what remains.'],
    sim: {
      scenario: 'wiggle',
      setup(s) {
        s.Fo = 0.02;
      },
      read: (c) => ({ left: c.rippleShare < c.humpShare ? 'hump' : 'ripple' }),
    },
    cases: [kase('a fine ripple', { ripple: 'fine' }, { left: 'hump' })],
  }),

  problem({
    id: 'u1.5.wall',
    title: 'Heat through a wall',
    exam: 'u1',
    ch: '1',
    lab: 'resistance',
    src: 'Flux, written for the Resistance lab',
    topics: ['series'],
    principles: ['resistance'],
    vars: { wool: choice(['with', 'with 90 mm of glass wool (k = 0.04 W/m·K) between them'], ['without', 'with nothing between them']), Tout: range(-15, 5, 5, '°C') },
    text: (T) => `A wall is 13 mm of drywall (k = 0.17 W/m·K) and 100 mm of brick (k = 0.7 W/m·K), ${T.wool}. Inside, the air is at 20 °C with h = 8 W/m²·K; outside, ${T.Tout} °C with h = 25 W/m²·K. What heat flux crosses it, in W/m²?`,
    parts: [num('q', ($) => wall(WALL(WOOL[$.wool], $.Tout)).q, 'W/m²', { label: 'q' })],
    level: 2,
    hints: ['Every layer and both air films are resistances in series: L/k and 1/h.', 'q = (20 − T_out)/ΣR.'],
    steps: ($) => {
      const w = wall(WALL(WOOL[$.wool], $.Tout));
      return [String.raw`$\sum R = ${w.R.map((r) => Number(r.toPrecision(3))).join(' + ')} = ${Number(w.Rtot.toPrecision(3))}$ m²·K/W`, String.raw`$q = \dfrac{20 - (${$.Tout})}{${Number(w.Rtot.toPrecision(3))}} = ${Number(w.q.toPrecision(3))}$ W/m²`];
    },
    sim: {
      scenario: 'house',
      setup(s, $) {
        Object.assign(s, { mode: 'wall', ins: WOOL[$.wool], hOut: 25 });
      },
      read: (c, s, $) => ({ q: (c.q * (20 - $.Tout)) / 25 }),
    },
    cases: [kase('the notes’ wall', { wool: 'with', Tout: -5 }, { q: 9.49 })],
  }),

  problem({
    id: 'u1.6.drop',
    title: 'Which layer takes the drop?',
    exam: 'u1',
    ch: '1',
    lab: 'resistance',
    src: 'Flux, written for the Resistance lab',
    topics: ['series'],
    principles: ['resistance'],
    vars: { layer: choice(['wool', 'the 90 mm of glass wool'], ['brick', 'the 100 mm of brick']), Tout: range(-15, 5, 5, '°C') },
    text: (T) => `The insulated wall above: 13 mm drywall (k = 0.17), 90 mm glass wool (k = 0.04), 100 mm brick (k = 0.7), with h = 8 inside at 20 °C and h = 25 outside at ${T.Tout} °C. How many degrees does the temperature fall across ${T.layer}?`,
    parts: [num('dT', ($) => { const w = wall(WALL(0.09, $.Tout)); return w.drops[$.layer === 'wool' ? 2 : 3]; }, '°C', { label: 'ΔT' })],
    level: 2,
    hints: ['Find q from the total resistance first.', 'The drop across a layer is q times that layer’s resistance.'],
    steps: ($) => {
      const w = wall(WALL(0.09, $.Tout));
      const k = $.layer === 'wool' ? 2 : 3;
      return [String.raw`$q = ${Number(w.q.toPrecision(3))}$ W/m², so $\Delta T = q R = ${Number(w.q.toPrecision(3))}\times${Number(w.R[k].toPrecision(3))} = ${Number(w.drops[k].toPrecision(3))}$ °C`];
    },
    sim: {
      scenario: 'house',
      setup(s) {
        Object.assign(s, { mode: 'wall', ins: 0.09, hOut: 25 });
      },
      read: (c, s, $) => ({ dT: (c.drops[$.layer === 'wool' ? 2 : 3] * (20 - $.Tout)) / 25 }),
    },
    cases: [kase('the glass wool at −5 °C', { layer: 'wool', Tout: -5 }, { dT: 21.35 })],
  }),

  problem({
    id: 'u1.7.critical',
    title: 'The critical radius',
    exam: 'u1',
    ch: '1',
    lab: 'resistance',
    src: 'Flux, written for the Resistance lab',
    topics: ['critical'],
    principles: ['resistance'],
    vars: { mat: choice(['rubber', 'rubber (k = 0.13 W/m·K)'], ['foam', 'foam (k = 0.035 W/m·K)']), h: range(5, 25, 1, 'W/m²·K') },
    text: (T) => `A thin tube is to be insulated with ${T.mat}. The outer surface loses heat to air with h = ${T.h} W/m²·K. Below what outer radius, in mm, does adding insulation raise the heat loss?`,
    parts: [num('r', ($) => (KINS[$.mat] / $.h) * 1000, 'mm', { label: 'r_crit' })],
    level: 1,
    hints: ['Write the resistance per metre: ln(r₂/r₁)/(2πk) + 1/(2πr₂h).', 'It is smallest where its derivative in r₂ is zero: r₂ = k/h.'],
    steps: ($) => [String.raw`$r_\text{crit} = \dfrac{k}{h} = \dfrac{${KINS[$.mat]}}{${$.h}} = ${Number(((KINS[$.mat] / $.h) * 1000).toPrecision(3))}$ mm`],
    sim: {
      scenario: 'wire',
      setup(s, $) {
        Object.assign(s, { mode: 'pipe', k: KINS[$.mat], h: $.h });
      },
      read: (c) => ({ r: c.rCrit * 1000 }),
    },
    cases: [kase('rubber, h = 10', { mat: 'rubber', h: 10 }, { r: 13 })],
  }),

  problem({
    id: 'u1.8.wire',
    title: 'More insulation, more loss?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'resistance',
    src: 'Flux, written for the Resistance lab',
    topics: ['critical'],
    principles: ['resistance'],
    vars: { coat: choice(['six', 'a 6 mm outer radius'], ['nine', 'a 9 mm outer radius']) },
    text: (T) => `A bare 2 mm wire is coated with insulation (k = 0.1 W/m·K) to ${T.coat}. The air has h = 10 W/m²·K. Compared with the bare wire, does it lose more heat, less, or the same?`,
    parts: [
      pick('loss', 'its heat loss', [
        ['more', 'more', 'The outer radius is below k/h = 10 mm, where added surface beats added resistance.'],
        ['less', 'less', 'Insulation cuts the loss only past the critical radius k/h = 10 mm; here it is below it.'],
        ['same', 'the same', 'The loss depends on the outer radius: it rises until 10 mm.'],
      ], () => 'more'),
    ],
    level: 2,
    hints: ['Find the critical radius k/h.', 'Is the coated radius above it or below it?'],
    steps: () => ['r_crit = 0.1/10 = 10 mm. The coating ends below it, so the loss is higher than bare.'],
    sim: {
      scenario: 'wire',
      setup(s, $) {
        Object.assign(s, { mode: 'pipe', r1: 0.002, r2: $.coat === 'six' ? 0.006 : 0.009, k: 0.1, h: 10 });
      },
      read: (c) => ({ loss: c.Q > c.bare ? 'more' : c.Q < c.bare ? 'less' : 'same' }),
    },
    cases: [kase('to 6 mm', { coat: 'six' }, { loss: 'more' })],
  }),
  problem({
    id: 'u1.9.fin',
    title: 'A very long fin',
    exam: 'u1',
    ch: '1',
    lab: 'fin',
    src: 'Flux, written for the Fin lab',
    topics: ['fins'],
    principles: ['fins'],
    vars: { mat: choice(['aluminium', 'aluminium (k = 200 W/(m·K))'], ['copper', 'copper (k = 400 W/(m·K))'], ['steel', 'stainless steel (k = 15 W/(m·K))']), D: choice(['5', '5 mm'], ['10', '10 mm']), h: range(10, 50, 10, 'W/(m²·K)') },
    text: (T) => `A very long ${T.mat} pin fin, ${T.D} across, stands out of a wall at 100 °C into air at 25 °C with h = ${T.h}. How much heat does it shed, in W?`,
    parts: [num('q', ($) => longFin($), 'W', { label: 'q' })],
    level: 2,
    hints: ['A very long fin sheds √(hPkA_c) θ_b.', 'P = πD and A_c = πD²/4.'],
    steps: ($) => [String.raw`$q = \sqrt{hPkA_c}\,\theta_b = ${Number(longFin($).toPrecision(3))}$ W`],
    // Another route: the lab's full formula for a 5 m fin of 5 mm, scaled as q ∝ D^1.5.
    second: ($) => ({ q: finClosed({ k: MATERIALS[$.mat].k, h: $.h, L: 5 }).q * (Number($.D) / 5) ** 1.5 }),
    cases: [kase('aluminium, 5 mm, h = 25', { mat: 'aluminium', D: '5', h: 25 }, { q: 2.95 })],
  }),

  problem({
    id: 'u1.10.fin-help',
    title: 'Does the fin help?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'fin',
    src: 'Flux, written for the Fin lab',
    topics: ['fins'],
    principles: ['fins'],
    vars: { case: choice(['alu', 'an aluminium pin in still air'], ['nylon', 'a nylon pin in fast-flowing water']) },
    text: (T) => `Does adding ${T.case} to a hot wall shed more heat than the bare wall under it?`,
    parts: [
      pick('a', 'the fin', [
        ['yes', 'yes, much more', 'A good conductor in weak convection carries heat out along its whole length: effectiveness well above 1.'],
        ['no', 'no, less', 'A poor conductor in strong convection cannot carry heat to its side: it insulates the wall it covers.'],
        ['same', 'the same', 'A fin changes the area and the path for heat; the result is rarely a wash.'],
      ], ($) => ($.case === 'alu' ? 'yes' : 'no')),
    ],
    level: 1,
    hints: ['Compare kP with hA_c.', 'Effectiveness above 1 means the fin helps.'],
    steps: ($) => [$.case === 'alu' ? 'kP/(hA_c) is large: the fin helps.' : 'kP/(hA_c) is below 1: the fin hurts.'],
    sim: {
      scenario: 'alu',
      setup(s, $) {
        if ($.case === 'nylon') Object.assign(s, { mat: 'plastic', h: 500 });
      },
      read: (c) => ({ a: c.eff > 1.05 ? 'yes' : c.eff < 0.95 ? 'no' : 'same' }),
    },
    cases: [kase('nylon in water', { case: 'nylon' }, { a: 'no' })],
  }),
  problem({
    id: 'u1.11.biot',
    title: 'Lump or not?',
    exam: 'u1',
    ch: '1',
    lab: 'quench',
    src: 'Flux, written for the Quench lab',
    topics: ['biot'],
    principles: ['biot'],
    vars: { mat: choice(['steel', 'carbon steel (k = 45 W/(m·K))'], ['glass', 'glass (k = 1.4 W/(m·K))']), h: range(50, 500, 50, 'W/(m²·K)') },
    text: (T) => `A plate of ${T.mat}, 4 cm thick, is cooled on both faces with h = ${T.h}. What is its Biot number, hL/k, with L the half-thickness?`,
    parts: [num('bi', ($) => biot($), '', { label: 'Bi', abs: 1e-6 })],
    level: 1,
    hints: ['Cooled on both faces, the plate is symmetric: L is the half-thickness, 2 cm.', 'Bi = hL/k.'],
    steps: ($) => [String.raw`$\mathrm{Bi} = ${$.h} \times 0.02/${SLAB_MATERIALS[$.mat].k} = ${Number(biot($).toPrecision(3))}$`],
    sim: {
      scenario: 'steel',
      setup(s, $) {
        Object.assign(s, { mat: $.mat, h: $.h });
      },
      read: (c) => ({ bi: c.Bi }),
    },
    cases: [kase('the notes’ steel', { mat: 'steel', h: 500 }, { bi: 0.222 })],
  }),

  problem({
    id: 'u1.12.crack',
    title: 'Which one cracks?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'quench',
    src: 'Flux, written for the Quench lab',
    topics: ['biot'],
    principles: ['biot'],
    vars: { bi: choice(['small', 'Bi = 0.05'], ['large', 'Bi = 20']) },
    text: (T) => `A hot part is quenched with ${T.bi}. In the first moments, how do its centre and surface temperatures compare?`,
    parts: [
      pick('a', 'centre and surface', [
        ['together', 'they fall together', 'Small Bi: the inside conducts far faster than the outside convects.'],
        ['apart', 'the surface drops while the centre stays hot', 'Large Bi: the inside resists more than the outside, so the inside lags.'],
        ['centre', 'the centre drops first', 'Heat leaves through the surface; the centre can never lead.'],
      ], ($) => ($.bi === 'small' ? 'together' : 'apart')),
    ],
    level: 1,
    hints: ['Bi = (L/k)/(1/h): inside resistance over outside.', 'Below about 0.1, treat it as one lump.'],
    steps: ($) => [$.bi === 'small' ? 'Bi ≪ 1: one lump.' : 'Bi ≫ 1: steep gradients, a cold skin round a hot core.'],
    sim: {
      scenario: 'steel',
      setup(s, $) {
        if ($.bi === 'large') Object.assign(s, { mat: 'plastic', lt: 2.5 });
        else Object.assign(s, { h: 100 });
      },
      read: (c) => ({ a: c.dT < 10 ? 'together' : 'apart' }),
    },
    cases: [kase('a large Biot number', { bi: 'large' }, { a: 'apart' })],
  }),
  problem({
    id: 'u1.13.touch',
    title: 'The joint temperature',
    exam: 'u1',
    ch: '1',
    lab: 'touch',
    src: 'Flux, written for the Touch lab',
    topics: ['contact'],
    principles: ['contact'],
    vars: { body: choice(['steel', 'steel (e = 12 700)'], ['glass', 'glass (e = 1670)'], ['wood', 'pine wood (e = 300)']), Tb: range(0, 20, 5, '°C') },
    text: (T) => `A finger at 34 °C, with effusivity e = 1140 W·s^½/(m²·K), touches ${T.body} at ${T.Tb}. What temperature does the joint settle at, in °C?`,
    parts: [num('T', ($) => jointT($), '°C', { label: 'T_c' })],
    level: 2,
    hints: ['The joint is a weighted average of the two temperatures.', 'The weights are the effusivities √(kρc).'],
    steps: ($) => [String.raw`$T_c = (1140 \times 34 + e\,T_b)/(1140 + e) = ${Number(jointT($).toPrecision(3))}$ °C`],
    sim: {
      scenario: 'steel',
      setup(s, $) {
        Object.assign(s, { body: $.body, Tb: $.Tb });
      },
      read: (c) => ({ T: c.Tc }),
    },
    cases: [kase('the notes’ steel', { body: 'steel', Tb: 20 }, { T: 21.2 })],
  }),

  problem({
    id: 'u1.14.feel',
    title: 'Why metal feels cold',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'touch',
    src: 'Flux, written for the Touch lab',
    topics: ['contact'],
    principles: ['contact'],
    vars: { pair: choice(['steel', 'a steel rail and a wooden bench, both at 15 °C'], ['hot', 'a steel pan handle and a wooden spoon, both at 60 °C']) },
    text: (T) => `You touch ${T.pair}. Why does the steel feel more extreme?`,
    parts: [
      pick('why', 'because', [
        ['temp', 'the steel is at a more extreme temperature', 'Both are at the same temperature.'],
        ['eff', 'steel trades heat with the skin much faster, so the skin’s surface moves further', 'The joint is weighted by √(kρc), and steel’s is about 40 times wood’s.'],
        ['k', 'steel conducts better, and conductivity alone sets the joint', 'Conductivity matters, but so do density and heat capacity: the weight is √(kρc).'],
      ], () => 'eff'),
    ],
    level: 1,
    hints: ['Your nerves sense the skin’s surface temperature.', 'That is the joint temperature, weighted by effusivity.'],
    steps: () => ['The joint is pulled toward whichever body has the larger √(kρc): steel.'],
    sim: {
      scenario: 'steel',
      setup(s, $) {
        s.Tb = $.pair === 'hot' ? 60 : 15;
      },
      read: (c) => ({ why: Math.abs(c.Tc - (c.e1 * 34 + c.e2 * (c.Tc + 0)) / (c.e1 + c.e2)) >= 0 ? 'eff' : 'temp' }),
    },
    cases: [kase('the rail and the bench', { pair: 'steel' }, { why: 'eff' })],
  }),
  problem({
    id: 'u1.15.fourier',
    title: 'Is the step stable?',
    exam: 'u1',
    ch: '1',
    lab: 'grid',
    src: 'Flux, written for the Grid lab',
    topics: ['stability'],
    principles: ['stability'],
    vars: { N: choice(['10', '10'], ['20', '20'], ['40', '40']), dt: range(5, 50, 5, 'ms') },
    text: (T) => `A 10 cm copper rod (α = 1.1 × 10⁻⁴ m²/s) is split into ${T.N} cells and stepped explicitly with Δt = ${T.dt}. What is Fo = αΔt/Δx²?`,
    parts: [num('fo', ($) => fourier({ ...$, N: Number($.N) }), '', { label: 'Fo', abs: 1e-6 })],
    level: 1,
    hints: ['Δx = L/N.', 'Fo = αΔt/Δx², with Δt in seconds.'],
    steps: ($) => [String.raw`$\Delta x = 0.1/${$.N}$ m, $\mathrm{Fo} = 1.1\times10^{-4} \times ${$.dt / 1000}/\Delta x^2 = ${Number(fourier({ ...$, N: Number($.N) }).toPrecision(3))}$`],
    sim: {
      scenario: 'fine',
      setup(s, $) {
        Object.assign(s, { N: Number($.N), dtms: $.dt });
      },
      read: (c) => ({ fo: c.Fo }),
    },
    cases: [kase('40 cells at 30 ms', { N: '40', dt: 30 }, { fo: 0.528 })],
  }),

  problem({
    id: 'u1.16.refine',
    title: 'A finer grid',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'grid',
    src: 'Flux, written for the Grid lab',
    topics: ['stability'],
    principles: ['stability'],
    vars: { fo: choice(['low', 'Fo = 0.1'], ['near', 'Fo = 0.3']) },
    text: (T) => `An explicit heat-conduction run is stable at ${T.fo}. You halve Δx and keep Δt. Is it still stable?`,
    parts: [
      pick('s', 'after halving Δx', [
        ['yes', 'yes', 'Fo quadruples; it stays stable only if four times the old Fo is still at most ½.'],
        ['no', 'no', 'Fo quadruples, past ½: the finest mode now grows each step.'],
        ['always', 'always: a finer grid is always more accurate', 'Accuracy needs stability first; Fo = αΔt/Δx² grows as Δx shrinks.'],
      ], ($) => ($.fo === 'low' ? 'yes' : 'no')),
    ],
    level: 1,
    hints: ['Fo ∝ 1/Δx².', 'Stable while Fo ≤ ½.'],
    steps: ($) => [$.fo === 'low' ? 'Fo = 0.4 ≤ 0.5: stable.' : 'Fo = 1.2 > 0.5: unstable.'],
    sim: {
      scenario: 'fine',
      setup(s, $) {
        // Fo = 0.1 or 0.3 on 20 cells, then the grid doubled.
        Object.assign(s, { N: 40, dtms: $.fo === 'low' ? 22.7 : 68.2 });
      },
      read: (c) => ({ s: c.stable ? 'yes' : 'no' }),
    },
    cases: [kase('Fo = 0.3', { fo: 'near' }, { s: 'no' })],
  }),
];
