/**
 * Unit 5, beyond the numeric drills: four conceptual questions, each option with its own reason,
 * a compound gear train (the `gearbox` lab), and the unit's application, a road bike's drivetrain (the `bike` lab).
 */
import { instantCenter, rollingPoint, sliderCrank } from '@flux/subjects/mechanics/rigid2d.js';
import { cadenceFor, chordalChainSpeed, drive, tyreDiameter } from '@flux/subjects/mechanics/drivetrain.js';
import { CASSETTE } from '../../labs/bike.js';
import { train } from '../../labs/gearbox.js';
import { choice, kase, num, problem, range } from '../kit.js';

const DEG = Math.PI / 180;
const RPM = (2 * Math.PI) / 60;

/** A choice part whose options each carry a `why`. */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/**
 * Where the instantaneous centre is, from two points of each body and their velocities: the second
 * method. The perpendiculars to the velocities cross at the centre, or never (translation).
 */
function icOf(body) {
  const P = (x, y) => ({ x, y, z: 0 });
  let a;
  let b;
  let pin = null;
  let ground = false;
  let onBody;
  if (body === 'ladder') {
    // Foot at (3, 0) sliding out, top at (0, 4) sliding down.
    a = [P(3, 0), P(1, 0)];
    b = [P(0, 4), P(0, -1)];
    onBody = (c) => Math.abs(4 * c.x + 3 * c.y - 12) < 1e-6 && c.x >= 0 && c.x <= 3;
  } else if (body === 'wheel') {
    const R = 0.5;
    const m1 = rollingPoint({ radius: R, speed: 2, phi: 90 * DEG });
    const m2 = rollingPoint({ radius: R, speed: 2, phi: 200 * DEG });
    a = [P(m1.rx, R + m1.ry), P(m1.vx, m1.vy)];
    b = [P(m2.rx, R + m2.ry), P(m2.vx, m2.vy)];
    ground = true;
    onBody = (c) => Math.hypot(c.x, c.y - R) <= R + 1e-6;
  } else if (body === 'translate') {
    a = [P(0, 0), P(1, 0.5)];
    b = [P(2, 1), P(1, 0.5)];
    onBody = () => true;
  } else {
    // A crank disc turning about a pin at the origin.
    a = [P(1, 0), P(0, 1)];
    b = [P(0, 1), P(-1, 0)];
    pin = P(0, 0);
    onBody = (c) => Math.hypot(c.x, c.y) <= 1 + 1e-6;
  }
  const c = instantCenter(a[0], a[1], b[0], b[1]);
  if (!c) return 'none';
  if (pin && Math.hypot(c.x - pin.x, c.y - pin.y) < 1e-6) return 'pin';
  if (ground && Math.abs(c.y) < 1e-6) return 'contact';
  return onBody(c) ? 'on' : 'off';
}

/** Each kind of drive: +1 keeps the sense, −1 reverses it. */
const DRIVES = {
  pair: [-1],
  idler: [-1, -1],
  open: [1],
  crossed: [-1],
  ring: [1],
};
const senseOf = (drive) => (DRIVES[drive].reduce((p, s) => p * s, 1) > 0 ? 'same' : 'opposite');

/** Rim speeds and accelerations, sampled degree by degree round the wheel: the second method. */
function rimPoint(ask) {
  const name = { 0: 'contact', 90: 'back', 180: 'top', 270: 'front' };
  const rows = Array.from({ length: 360 }, (_, i) => ({ phi: i, ...rollingPoint({ radius: 0.4, speed: 2, phi: i * DEG }) }));
  if (ask === 'accel') {
    const as = rows.map((r) => r.aMag);
    return Math.max(...as) - Math.min(...as) < 1e-9 ? 'all' : name[rows.reduce((p, r) => (r.aMag > p.aMag ? r : p)).phi] ?? 'other';
  }
  const best = rows.reduce((p, r) => ((ask === 'fastest' ? r.speed > p.speed : r.speed < p.speed) ? r : p));
  return name[best.phi] ?? 'other';
}

/** The slider's x(θ) from the loop closure alone, differentiated numerically: the second method. */
function sliderSigns(at) {
  const r = 0.2;
  const l = 0.8;
  const w = 10;
  const th = { outer: 0, inner: 180, quarter: 90 }[at] * DEG;
  const x = (t) => r * Math.cos(th + w * t) + Math.sqrt(l * l - (r * Math.sin(th + w * t)) ** 2);
  const h = 1e-4;
  const v = (x(h) - x(-h)) / (2 * h);
  const a = (x(h) - 2 * x(0) + x(-h)) / (h * h);
  // The slider sits at x > 0, so "toward the crank" is −x.
  const word = (q, eps) => (Math.abs(q) < eps ? 'zero' : q < 0 ? 'toward' : 'away');
  return { v: word(v, 1e-6), a: word(a, 1e-3) };
}
function sliderClosed(at) {
  const row = sliderCrank({ r: 0.2, l: 0.8, theta: { outer: 0, inner: 180, quarter: 90 }[at] * DEG, omega: 10, alpha: 0 });
  const word = (q) => (Math.abs(q) < 1e-9 ? 'zero' : q < 0 ? 'toward' : 'away');
  return { v: word(row.v), a: word(row.a) };
}

const more = [
  problem({
    id: 'u5.16.ic-where',
    title: 'Where is the instantaneous centre?',
    exam: 'u5',
    ch: '16',
    kind: 'conceptual',
    lab: 'ic',
    src: 'Hibbeler §16.6',
    topics: ['ic'],
    vars: {
      body: choice(
        ['ladder', 'a ladder whose foot slides along the floor while its top slides down the wall'],
        ['wheel', 'a wheel rolling without slip'],
        ['translate', 'a bar sliding so that every point has the same velocity'],
        ['crank', 'a crank disc turning about its fixed pin'],
      ),
    },
    text: (T) => `Think of ${T.body}. Where is its instantaneous centre of zero velocity?`,
    parts: [
      pick('ic', 'the instantaneous centre', [
        ['contact', 'the point touching the ground', 'For a wheel rolling without slip, the contact point has the ground’s velocity, zero. Nothing else here rolls on the ground.'],
        ['pin', 'the fixed pin', 'A body turning about a fixed pin has that pin at rest at every instant: the pin is the centre.'],
        ['off', 'a point off the body, where the perpendiculars to the end velocities cross', 'For the ladder, the perpendicular to the foot’s velocity is vertical and the top’s is horizontal. They cross at the far corner of the rectangle, off the ladder.'],
        ['none', 'nowhere: the perpendiculars never cross', 'All velocities equal means the perpendiculars are parallel. The body translates, ω = 0, and the centre is at infinity.'],
      ], ($) => icOf($.body)),
    ],
    level: 1,
    hints: ['The instantaneous centre lies on the perpendicular to every point’s velocity.',
      'Draw the perpendiculars at two points whose velocity directions you know, and see where they cross.',
    ],
    steps: ($) => [
      'Pick two points whose velocity directions are known, and draw the perpendicular to each velocity.',
      { ladder: 'Foot: velocity horizontal, perpendicular vertical. Top: velocity vertical, perpendicular horizontal. They cross off the ladder.', wheel: 'The contact point does not slip, so it is at rest: it is the centre.', translate: 'Equal velocities give parallel perpendiculars. They never cross: ω = 0.', crank: 'The pin does not move. Every perpendicular passes through it.' }[$.body],
    ],
    second: ($) => ({ ic: icOf($.body) }),
    cases: [kase('Hibbeler §16.6', { body: 'ladder' }, { ic: 'off' })],
  }),

  problem({
    id: 'u5.16.train-sense',
    title: 'Same way or the other way?',
    exam: 'u5',
    ch: '16',
    kind: 'conceptual',
    lab: 'gearbox',
    src: 'Hibbeler §16.3',
    topics: ['gears', 'belt'],
    vars: {
      drive: choice(
        ['pair', 'two external gears in mesh'],
        ['idler', 'three external gears in a row, the middle one an idler'],
        ['open', 'two pulleys joined by an open belt'],
        ['crossed', 'two pulleys joined by a crossed belt'],
        ['ring', 'a pinion driving a ring gear from inside'],
      ),
    },
    text: (T) => `The driver turns clockwise. The drive is ${T.drive}. Which way does the last member turn?`,
    parts: [
      pick('sense', 'the last member', [
        ['same', 'clockwise, the same way', 'An open belt, a ring gear, or an even number of external meshes keeps the sense.'],
        ['opposite', 'counterclockwise, the other way', 'A crossed belt, or an odd number of external meshes, reverses the sense.'],
      ], ($) => senseOf($.drive)),
    ],
    level: 1,
    hints: ['Look at the contact point. Its velocity is the same for both members; ask which way each must turn to give it.',
      'Each external mesh reverses the sense. Count them.',
    ],
    steps: ($) => [
      'Where two members touch, they share one velocity.',
      { pair: 'One external mesh: the sense reverses.', idler: 'Two external meshes: reversed twice, so the same sense. The idler changes nothing else.', open: 'The belt runs round the outside of both pulleys: the same sense.', crossed: 'The crossed belt meets the second pulley on the other side: the sense reverses.', ring: 'The pinion touches the ring on its inside: both turn the same way.' }[$.drive],
    ],
    second: ($) => ({ sense: senseOf($.drive) }),
    cases: [kase('Hibbeler §16.3', { drive: 'idler' }, { sense: 'same' })],
  }),

  problem({
    id: 'u5.16.rim-point',
    title: 'Which point of a rolling wheel?',
    exam: 'u5',
    ch: '16',
    kind: 'conceptual',
    lab: 'rolling',
    src: 'Hibbeler §16.6, §16.7',
    topics: ['rolling'],
    vars: { ask: choice(['fastest', 'moves fastest'], ['slowest', 'moves slowest'], ['accel', 'has the largest acceleration']) },
    text: (T) => `A wheel rolls without slip along level ground at a steady speed. Which point of its rim ${T.ask}?`,
    parts: [
      pick('point', 'the point', [
        ['top', 'the top', 'The top is 2R from the contact point, the farthest any rim point gets. It moves at 2v.'],
        ['front', 'the front, level with the centre', 'The front is R√2 from the contact point. It moves at v√2: between the contact’s 0 and the top’s 2v.'],
        ['contact', 'the point touching the ground', 'The contact point is the instantaneous centre: its velocity is zero. Its acceleration is not.'],
        ['all', 'every rim point equally', 'At steady speed, every rim point has acceleration v²/R toward the centre. Their speeds differ.'],
      ], ($) => ({ fastest: 'top', slowest: 'contact', accel: 'all' })[$.ask]),
    ],
    level: 2,
    hints: ['Speeds come from the instantaneous centre: ω times the distance from the contact point.',
      'For the acceleration, use the centre instead: it moves at constant velocity, so each rim point only circles it.',
    ],
    steps: ($) => [
      { fastest: 'Speed is ω times the distance from the contact point. The top is farthest, 2R: it moves at 2v.', slowest: 'The contact point is the instantaneous centre. Its speed is zero.', accel: 'The centre does not accelerate. Relative to it, each rim point moves on a circle at steady speed, with acceleration v²/R inward. Every rim point: the same size.' }[$.ask],
    ],
    second: ($) => ({ point: rimPoint($.ask) }),
    cases: [kase('Hibbeler §16.7', { ask: 'accel' }, { point: 'all' })],
  }),

  problem({
    id: 'u5.16.dead-centre',
    title: 'The slider at a dead centre',
    exam: 'u5',
    ch: '16',
    kind: 'conceptual',
    lab: 'slider-crank',
    src: 'Hibbeler §16.7',
    topics: ['acceleration'],
    vars: { at: choice(['outer', 'the outer dead centre, θ = 0'], ['inner', 'the inner dead centre, θ = 180°'], ['quarter', 'θ = 90°']) },
    text: (T) => `A crank turns counterclockwise at constant $\\omega$ and drives a slider through a rod longer than the crank. The crank is at ${T.at}. Which way are the slider's velocity and acceleration?`,
    parts: [
      pick('v', 'velocity', [
        ['zero', 'zero', 'At a dead centre the crank pin moves across the slider line, and the rod is not turning: the slider stops for an instant.'],
        ['toward', 'toward the crank', 'From θ = 0 to 180°, counterclockwise, the slider moves in, toward the crank.'],
        ['away', 'away from the crank', 'The slider moves out only on the return half, θ from 180° to 360°.'],
      ], ($) => sliderClosed($.at).v),
      pick('a', 'acceleration', [
        ['zero', 'zero', 'A slider that stops and turns round is accelerating. At θ = 90° the rod is turning, and that leaves an acceleration too.'],
        ['toward', 'toward the crank', 'At the outer dead centre the slider is turned back in: a = −rω²(1 + r/ℓ).'],
        ['away', 'away from the crank', 'At the inner dead centre it is turned back out: a = rω²(1 − r/ℓ). At θ = 90° it is already slowing its inward run.'],
      ], ($) => sliderClosed($.at).a),
    ],
    level: 2,
    hints: ['Zero velocity does not mean zero acceleration. Ask what happens just before and just after.',
      'At θ = 90° the crank pin moves straight in, but the rod is tilted and turning: work out which way the slider’s speed is changing.',
    ],
    steps: ($) => ({
      outer: ['The slider is at its farthest point: v = 0.', String.raw`It is being pulled back in: $a = -r\omega^2(1 + r/\ell)$, toward the crank.`],
      inner: ['The slider is at its nearest point: v = 0.', String.raw`It is being pushed back out: $a = r\omega^2(1 - r/\ell)$, away from the crank.`],
      quarter: [String.raw`The crank pin moves straight in at $r\omega$, and so does the slider: toward the crank.`, String.raw`The slider's fastest inward speed comes before 90°. Here the rod is tilted by $\sin\phi = r/\ell$ and the slider is already slowing: $a = r^2\omega^2/(\ell\cos\phi) > 0$, away from the crank.`],
    })[$.at],
    second: ($) => sliderSigns($.at),
    cases: [kase('Hibbeler §16.7', { at: 'outer' }, { v: 'zero', a: 'toward' })],
  }),

  problem({
    id: 'u5.16.train',
    title: 'A compound gear train',
    exam: 'u5',
    ch: '16',
    lab: 'gearbox',
    src: 'Hibbeler §16.3',
    topics: ['gears'],
    // Designed numbers: the stage ratios are picked as 2, 2.5 or 3 and 1.5, 2 or 2.5, and the
    // tooth counts follow, so every speed is a round number of rpm.
    vars: {
      layout: choice(['compound', 'compound'], ['idler', 'idler']),
      rpm: range(24000, 36000, 2000, 'rpm'),
      N1: range(16, 24, 4, 'teeth'),
      k2: range(2, 3, 0.5, ''),
      N3: range(20, 40, 10, 'teeth'),
      k4: range(1.5, 2.5, 0.5, ''),
      m: range(1.5, 3, 0.5, 'mm'),
    },
    derive: ($) => ({ N2: $.N1 * $.k2, N4: $.N3 * $.k4, idler: $.layout === 'idler' }),
    valid: ($) => Math.abs($.N2 - $.N4) > 1e-9,
    text: (T, $) => ($.layout === 'idler'
      ? String.raw`A motor spins pinion 1 (${T.N1} teeth) at ${T.rpm} rpm. Pinion 1 meshes with idler gear 2 (${$.N2} teeth), and gear 2 meshes with gear 4 (${$.N4} teeth) on the output shaft. Every gear has module ${T.m} mm, so its pitch radius is $mN/2$. Find the output shaft's speed and the pitch-line speed at mesh 1–2.`
      : String.raw`A motor spins pinion 1 (${T.N1} teeth) at ${T.rpm} rpm. Pinion 1 meshes with gear 2 (${$.N2} teeth) on shaft 2. Gear 3 (${T.N3} teeth) on that shaft meshes with gear 4 (${$.N4} teeth) on the output shaft. Every gear has module ${T.m} mm, so its pitch radius is $mN/2$. Find the output shaft's speed and the pitch-line speed at mesh 1–2.`),
    parts: [
      num('w4', ($) => Math.abs(train($).w4), 'rpm', {
        label: 'output speed',
        traps: [
          [($) => ($.rpm * $.N1) / $.N2, 'That is shaft 2’s speed. Carry on through the next mesh to shaft 4.'],
          [($) => ($.rpm * $.rpm) / Math.abs(train($).w4), 'The ratio is upside down. Each mesh slows the larger gear: ω_driven = (N_driver/N_driven) ω_driver.'],
        ],
      }),
      num('v12', ($) => train($).v12, 'm/s', {
        label: 'pitch-line speed, mesh 1–2',
        traps: [
          [($) => ((($.m * $.N1) / 2000) * $.rpm), 'Convert rpm to rad/s first: multiply by 2π/60.'],
          [($) => (($.m * $.N1) / 2) * $.rpm * RPM, 'The module is in millimetres. Convert the radius to metres.'],
          [($) => (($.m * $.N1) / 1000) * $.rpm * RPM, 'mN is the pitch diameter. The radius is mN/2.'],
        ],
      }),
    ],
    level: 2,
    hints: ['At each mesh the two pitch circles share one speed, so ω is inversely proportional to the tooth count.',
      String.raw`Two gears on one shaft share one $\omega$. An idler meshes on both sides, so its tooth count cancels.`,
      String.raw`The pitch-line speed is $r_1\omega_1$, with $r_1 = mN_1/2$ in metres and $\omega_1$ in rad/s.`,
    ],
    steps: ($, sig) => {
      const t = train($);
      return [
        $.layout === 'idler'
          ? String.raw`Through the idler: $\omega_4 = \frac{N_1}{N_2}\cdot\frac{N_2}{N_4}\,\omega_1 = \frac{${$.N1}}{${$.N4}}(${sig($.rpm)}) = ${sig(Math.abs(t.w4))}\ \mathrm{rpm}$.`
          : String.raw`Two stages: $\omega_4 = \frac{N_1 N_3}{N_2 N_4}\,\omega_1 = \frac{${$.N1}\cdot${$.N3}}{${$.N2}\cdot${$.N4}}(${sig($.rpm)}) = ${sig(Math.abs(t.w4))}\ \mathrm{rpm}$.`,
        String.raw`Two external meshes: shaft 4 turns the same way as the motor.`,
        String.raw`$r_1 = mN_1/2 = ${sig(t.r1 * 1000)}\ \mathrm{mm}$, $\omega_1 = ${sig($.rpm * RPM)}\ \mathrm{rad/s}$, so $v = r_1\omega_1 = ${sig(t.v12)}\ \mathrm{m/s}$.`,
      ];
    },
    // Second: roll the pitch circles. In 1 s the pitch line of each mesh moves r ω; divide by the next radius.
    second: ($) => {
      const r = (N) => ($.m * N) / 2000;
      const w1 = $.rpm * RPM;
      const s12 = r($.N1) * w1;
      const w2 = s12 / r($.N2);
      const s34 = ($.layout === 'idler' ? r($.N2) : r($.N3)) * w2;
      return { w4: s34 / r($.N4) / RPM, v12: s12 };
    },
    sim: {
      scenario: 'reduction',
      setup(s, $) {
        Object.assign(s, { N1: $.N1, N2: $.N2, N3: $.N3, N4: $.N4, rpm: $.rpm, m: $.m, idler: $.layout === 'idler' });
      },
      read: (c) => ({ w4: Math.abs(c.w4), v12: c.v12 }),
    },
    cases: [kase('Hibbeler §16.3', { layout: 'compound', rpm: 30000, N1: 20, k2: 3, N3: 20, k4: 2.5, m: 2 }, { w4: 4000, v12: 20 * Math.PI })],
  }),
  problem({
    id: 'u5.16.bike',
    title: 'Application: a road bike’s drivetrain',
    exam: 'u5',
    ch: '16',
    lab: 'bike',
    src: 'Hibbeler §16.3',
    topics: ['gears', 'belt'],
    // Structure: the speed a cadence gives, or the cadence a speed needs; small or big ring, any cog.
    // Designed numbers: the cadence is picked, and the speed is stated to three figures.
    vars: {
      find: choice(['speed', 'the speed'], ['cadence', 'the cadence']),
      Nf: range(34, 50, 16, 'teeth'),
      k: range(0, 10, 1, ''),
      n: range(70, 100, 5, 'rpm'),
      w: range(25, 28, 3, 'mm'),
    },
    derive: ($) => {
      const Nr = CASSETTE[$.k];
      const D = tyreDiameter(0.622, $.w / 1000);
      const kmh = Number(drive({ cadence: $.n, Nf: $.Nf, Nr, D }).kmh.toPrecision(3));
      // The cadence the stated speed needs: the designed one, to within the rounding.
      const n = $.find === 'speed' ? $.n : cadenceFor({ v: kmh / 3.6, Nf: $.Nf, Nr, D });
      return { Nr, D, kmh, cad: n, d: drive({ cadence: n, Nf: $.Nf, Nr, D }) };
    },
    text: (T, $) => ($.find === 'speed'
      ? String.raw`A road bike has a Shimano 105 drivetrain: a ${$.Nf}-tooth chainring, an 11–28 cassette, and a 12.7 mm chain. Its 700×${$.w} tyre on a 622 mm rim is ${Math.round($.D * 1000)} mm across. The rider pedals at ${T.n} in the ${$.Nr}-tooth cog. Find the bike’s speed, in km/h, and the rear wheel’s speed in rpm.`
      : String.raw`A road bike has a Shimano 105 drivetrain: a ${$.Nf}-tooth chainring, an 11–28 cassette, and a 12.7 mm chain. Its 700×${$.w} tyre on a 622 mm rim is ${Math.round($.D * 1000)} mm across. The rider holds ${$.kmh} km/h in the ${$.Nr}-tooth cog. Find the cadence, in rpm, and the chain’s speed.`),
    parts: [
      num('q', ($) => ($.find === 'speed' ? $.d.kmh : $.cad), ($) => ($.find === 'speed' ? 'km/h' : 'rpm'), {
        label: ($) => ($.find === 'speed' ? 'bike speed' : 'cadence'),
        traps: [
          [($) => ($.find === 'speed'
            ? drive({ cadence: $.n, Nf: $.Nr, Nr: $.Nf, D: $.D }).kmh
            : cadenceFor({ v: $.kmh / 3.6, Nf: $.Nr, Nr: $.Nf, D: $.D })),
          'The ratio is upside down. The chain passes the same number of links over both sprockets, so the smaller cog turns faster: ω_wheel = (N_f/N_r) ω_crank.'],
          [($) => ($.find === 'speed'
            ? drive({ cadence: $.n, Nf: $.Nf, Nr: $.Nr, D: 0.622 }).kmh
            : cadenceFor({ v: $.kmh / 3.6, Nf: $.Nf, Nr: $.Nr, D: 0.622 })),
          'That uses the rim’s 622 mm. The road meets the tyre: use the tyre’s outside diameter.'],
        ],
      }),
      num('w', ($) => ($.find === 'speed' ? $.d.wheelRpm : $.d.chain), ($) => ($.find === 'speed' ? 'rpm' : 'm/s'), {
        label: ($) => ($.find === 'speed' ? 'rear wheel speed' : 'chain speed'),
        traps: [
          [($) => ($.find === 'speed' ? ($.n * $.Nr) / $.Nf : ($.Nr * 0.0127 * $.cad) / 60),
            ($) => ($.find === 'speed'
              ? 'The ratio is upside down. In one crank turn N_f links reach a cog of N_r teeth, so it turns N_f/N_r times.'
              : 'The chain’s speed is the same at both ends, but the cog turns faster than the crank. Use the ring’s teeth with the crank’s turns.')],
          [($) => ($.find === 'speed' ? $.d.wWheel : $.Nf * 0.0127 * $.cad),
            ($) => ($.find === 'speed'
              ? 'That is ω in rad/s. The question asks for rpm.'
              : 'The cadence is per minute. Divide by 60 for links per second.')],
        ],
      }),
    ],
    level: 2,
    hints: ['The chain carries one speed from ring to cog. The cog and the wheel share one ω.',
      String.raw`In one crank turn, $N_f$ links leave the ring and $N_f$ teeth of the cog pass: the wheel turns $N_f/N_r$ times.`,
      String.raw`The bike moves $\pi D$ per wheel turn. The chain moves $N_f\,p$ per crank turn.`,
    ],
    steps: ($, sig) => {
      const { d } = $;
      if ($.find === 'speed') {
        return [
          String.raw`Wheel: $n_w = (N_f/N_r)\,n_c = (${$.Nf}/${$.Nr})(${$.n}) = ${sig(d.wheelRpm)}$ rpm.`,
          String.raw`$v = \pi D\,n_w = \pi(${sig($.D)})(${sig(d.wheelRpm)}/60) = ${sig(d.v)}$ m/s $= ${sig(d.kmh)}$ km/h.`,
        ];
      }
      return [
        String.raw`$v = ${$.kmh}/3.6 = ${sig(d.v)}$ m/s. The wheel turns $v/(\pi D) = ${sig(d.wheelRpm / 60)}$ times a second, ${sig(d.wheelRpm)} rpm.`,
        String.raw`Crank: $n_c = (N_r/N_f)\,n_w = (${$.Nr}/${$.Nf})(${sig(d.wheelRpm)}) = ${sig($.cad)}$ rpm.`,
        String.raw`Chain: $N_f\,p\,n_c = ${$.Nf}(0.0127)(${sig($.cad)}/60) = ${sig(d.chain)}$ m/s.`,
      ];
    },
    // Second: the chain's speed averaged along each sprocket's pitch polygon, ω r cos φ over a tooth.
    second: ($) => {
      const perRing = chordalChainSpeed($.Nf, 1);
      const perCog = chordalChainSpeed($.Nr, 1);
      if ($.find === 'speed') {
        const wc = ($.n * 2 * Math.PI) / 60;
        const ww = (perRing * wc) / perCog;
        return { q: ww * ($.D / 2) * 3.6, w: (ww * 60) / (2 * Math.PI) };
      }
      const ww = $.kmh / 3.6 / ($.D / 2);
      const chain = perCog * ww;
      return { q: ((chain / perRing) * 60) / (2 * Math.PI), w: chain };
    },
    sim: {
      scenario: 'cruise',
      setup(s, $) {
        Object.assign(s, { cadence: $.cad, Nf: $.Nf, Nr: $.Nr, width: $.w, crank: 172.5 });
      },
      // For the cadence, the lab's speed at that cadence must be the stated speed.
      read: (c, s, $) => ($.find === 'speed' ? { q: c.kmh, w: c.wheelRpm } : { q: s.cadence * ($.kmh / c.kmh), w: c.chain }),
    },
    cases: [kase('Hibbeler §16.3', { find: 'speed', Nf: 34, k: 5, n: 90, w: 25 }, { q: 22.8, w: 180 })],
  }),
];

export default more;
