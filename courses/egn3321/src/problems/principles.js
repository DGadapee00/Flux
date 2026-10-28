/**
 * The principle that governs each Dynamics problem (docs/COURSE-STANDARD.md, section 4).
 *
 * Novices file problems by what they look like ("the pulley one"); experts by the law that decides
 * them (Chi, Feltovich & Glaser). These tags index the bank by principle, so the same law shows up
 * across chapters: a collar on a spring, a rolling disk and a released bar all answer to work and
 * energy. Each template gets one primary principle, then up to two it also leans on. The primary
 * is the one shown with a solution and used to group the list.
 *
 * Hibbeler sections are where each principle is stated (src/problems/kit.js cites them).
 * problems-check confirms every template is tagged with principles that exist.
 */
export const PRINCIPLES = {
  // --- Kinematics of a particle (Ch 12)
  'rect-kin': {
    name: 'Rectilinear kinematics',
    statement: 'Along a line, $v = ds/dt$, $a = dv/dt$ and $a\\,ds = v\\,dv$. With constant $a$ these integrate to $v = v_0 + at$ and $s = s_0 + v_0t + \\tfrac12at^2$.',
    cue: 'Position, speed or acceleration along a straight line, with no forces asked about.',
    family: 'Kinematics',
  },
  'curv-kin': {
    name: 'Curvilinear motion',
    statement: 'On a curved path, split the motion: $x$–$y$ components move independently (a projectile), or $n$–$t$ components give $a_t = \\dot v$ and $a_n = v^2/\\rho$.',
    cue: 'A curved path: a projectile, a radius of curvature, or a normal acceleration.',
    family: 'Kinematics',
  },
  'polar-kin': {
    name: 'Polar coordinates',
    statement: 'Measured from a fixed point, $v_r = \\dot r$, $v_\\theta = r\\dot\\theta$, $a_r = \\ddot r - r\\dot\\theta^2$ and $a_\\theta = r\\ddot\\theta + 2\\dot r\\dot\\theta$: the unit vectors turn with the line.',
    cue: 'A distance and an angle from a fixed point: a slotted arm, a radar, a cam.',
    family: 'Kinematics',
  },
  'rel-motion': {
    name: 'Relative motion',
    statement: 'Positions, velocities and accelerations add as vectors: $\\vec v_B = \\vec v_A + \\vec v_{B/A}$, seen from translating axes.',
    cue: 'One moving thing seen from another.',
    family: 'Kinematics',
  },

  // --- Kinetics of a particle (Ch 13, 15, 14: momentum before energy, D29)
  newton: {
    name: 'Newton’s second law',
    statement: '$\\Sigma\\vec F = m\\vec a$, in the components the path suggests: $x$–$y$ on a straight track, $n$–$t$ on a curve with $\\Sigma F_n = mv^2/\\rho$.',
    cue: 'Forces and an acceleration at one instant.',
    family: 'Kinetics',
  },
  constraint: {
    name: 'Constraints: dependent motion',
    statement: 'A rope of fixed length ties positions together: write its length in the coordinates, $\\Sigma\\, n_i s_i = L$, and differentiate for the speeds and accelerations.',
    cue: 'Pulleys, a block and tackle, bodies joined by one rope.',
    family: 'Kinematics',
  },
  drag: {
    name: 'Drag and terminal speed',
    statement: 'A fluid resists with $F = kv^2$ (fast, large bodies) or $bv$ (slow, small ones). The motion levels off where drag equals the driving force: $v_t = \\sqrt{mg/k}$.',
    cue: 'Air or water resistance, a parachute, a falling ball.',
    family: 'Kinetics',
  },
  impulse: {
    name: 'Impulse and momentum',
    statement: '$m\\vec v_1 + \\sum\\int \\vec F\\,dt = m\\vec v_2$: the impulse of the forces changes the momentum.',
    cue: 'A force acting over a time.',
    family: 'Momentum',
  },
  'momentum-cons': {
    name: 'Conservation of linear momentum',
    statement: 'With no external impulse on the system, $\\Sigma m\\vec v$ is the same before and after: in a collision, a recoil, or a body splitting.',
    cue: 'Bodies push on each other briefly, and nothing outside does.',
    family: 'Momentum',
  },
  restitution: {
    name: 'Coefficient of restitution',
    statement: 'Along the line of impact, $e = (v_{B2} - v_{A2})/(v_{A1} - v_{B1})$. $e = 1$ is elastic, $e = 0$ plastic. Along the contact plane each body keeps its own momentum.',
    cue: 'A collision where the rebound matters.',
    family: 'Momentum',
  },
  'angular-momentum': {
    name: 'Angular momentum of a particle',
    statement: '$\\vec H_O = \\vec r\\times m\\vec v$, and $\\Sigma\\vec M_O = \\dot{\\vec H}_O$: with no moment about $O$, $H_O$ is conserved.',
    cue: 'A moment about a point, or a particle on a string or a central force.',
    family: 'Momentum',
  },
  'variable-mass': {
    name: 'Variable mass: thrust',
    statement: 'A body ejecting mass at $\\dot m$ with relative speed $v_e$ feels a thrust $\\dot m v_e$; integrated, $\\Delta v = v_e\\ln(m_0/m_f)$ less gravity loss.',
    cue: 'Mass leaves the body as it moves: a rocket, a jet.',
    family: 'Momentum',
  },
  energy: {
    name: 'Work and energy',
    statement: '$T_1 + \\Sigma U_{1\\to2} = T_2$. With only conservative forces doing work, $T_1 + V_1 = T_2 + V_2$, with $V_g = mgy$ and $V_e = \\tfrac12ks^2$.',
    cue: 'Speeds at two positions, with forces that depend on position.',
    family: 'Energy',
  },
  power: {
    name: 'Power and efficiency',
    statement: 'Power is the rate of work: $P = \\vec F\\cdot\\vec v$. Efficiency is power out over power in.',
    cue: 'A rate: how fast work is done, a motor rating, horsepower.',
    family: 'Energy',
  },

  // --- Kinematics of a rigid body (Ch 16)
  'fixed-axis': {
    name: 'Rotation about a fixed axis',
    statement: 'Every point moves on a circle: $v = \\omega r$, $a_t = \\alpha r$, $a_n = \\omega^2 r$. Gears and belts share the speed at the contact: $\\omega_A r_A = \\omega_B r_B$.',
    cue: 'A wheel, gear, belt or pulley turning about a fixed axle.',
    family: 'Rigid kinematics',
  },
  'rel-velocity': {
    name: 'Relative velocity in a rigid body',
    statement: '$\\vec v_B = \\vec v_A + \\vec\\omega\\times\\vec r_{B/A}$. The instantaneous centre is the point with zero velocity: every speed is $\\omega$ times the distance from it.',
    cue: 'Two points of one moving body, or a linkage at one instant.',
    family: 'Rigid kinematics',
  },
  'rel-accel': {
    name: 'Relative acceleration in a rigid body',
    statement: '$\\vec a_B = \\vec a_A + \\vec\\alpha\\times\\vec r_{B/A} - \\omega^2\\vec r_{B/A}$. Solve the velocities first: $\\omega$ is needed for the last term.',
    cue: 'An acceleration in a linkage or a rolling body.',
    family: 'Rigid kinematics',
  },
  'rotating-axes': {
    name: 'Rotating axes and the Coriolis term',
    statement: 'Seen from axes that turn at $\\Omega$: $\\vec a_B = \\vec a_A + \\dot{\\vec\\Omega}\\times\\vec r + \\vec\\Omega\\times(\\vec\\Omega\\times\\vec r) + 2\\vec\\Omega\\times\\vec v_{rel} + \\vec a_{rel}$. The Coriolis term needs both turning and sliding.',
    cue: 'A point that slides along a turning body: a pin in a slot, a collar on a spinning rod.',
    family: 'Rigid kinematics',
  },
  rolling: {
    name: 'Rolling without slipping',
    statement: 'The contact point is at rest: $v_G = \\omega r$ and $a_G = \\alpha r$. Friction holds it there only while $F \\le \\mu_s N$.',
    cue: 'A wheel, disk or ball rolling on a surface.',
    family: 'Rigid kinematics',
  },

  // --- Kinetics of a rigid body (Ch 17–18)
  'rigid-newton': {
    name: 'Equations of motion of a rigid body',
    statement: '$\\Sigma\\vec F = m\\vec a_G$ and $\\Sigma M_G = I_G\\alpha$ (or $\\Sigma M_P = \\Sigma(\\mathcal M_k)_P$ about any point). Translation, rotation and general plane motion are special cases.',
    cue: 'Forces and moments on a body that turns or might tip.',
    family: 'Rigid kinetics',
  },
  inertia: {
    name: 'Mass moment of inertia',
    statement: '$I = \\int r^2\\,dm$. Shift axes with $I = I_G + md^2$, and build composites from parts, subtracting holes.',
    cue: 'How hard a body is to spin: shapes, axes, holes.',
    family: 'Rigid kinetics',
  },
  'rigid-energy': {
    name: 'Work and energy for a rigid body',
    statement: '$T = \\tfrac12mv_G^2 + \\tfrac12I_G\\omega^2$, and $T_1 + \\Sigma U_{1\\to2} = T_2$. A couple does work $M\\,\\Delta\\theta$.',
    cue: 'A body that turns, with speeds at two positions.',
    family: 'Rigid kinetics',
  },

  // --- Impulse and momentum of a rigid body (Ch 19)
  'rigid-momentum': {
    name: 'Impulse and momentum of a rigid body',
    statement: '$H_G = I_G\\omega$, and about any point $H_P = \\vec r_{G/P}\\times m\\vec v_G + I_G\\omega$. The angular impulse changes it: $H_1 + \\sum\\int M\\,dt = H_2$.',
    cue: 'Moments acting over a time on a turning body, or its angular momentum about a point.',
    family: 'Rigid kinetics',
  },
  'angular-cons': {
    name: 'Conservation of angular momentum',
    statement: 'With no moment about a point during an interval, $H$ about it is kept: $I_1\\omega_1 = I_2\\omega_2$, and through a blow on a pinned body, about the pin.',
    cue: 'Mass moves in or out on a free spinner, or a blow lands on a pinned body.',
    family: 'Rigid kinetics',
  },

  // --- Tools
  units: {
    name: 'Units and dimensions',
    statement: 'Every term of an equation has the same dimensions. Convert with exact factors, and round to three figures at the end.',
    cue: 'A conversion, a rounding, or a check of an equation’s form.',
    family: 'Tools',
  },
};

/** Template id → [primary, …secondary]. */
export const PRINCIPLE_TAGS = {
  'u1.1.convert': ['units'],
  'u1.1.figures': ['units'],
  'u1.1.homogeneous': ['units'],
  'u1.12.polynomial': ['rect-kin'],
  'u1.12.separate': ['rect-kin'],
  'u1.12.distance': ['rect-kin'],
  'u1.12.erratic': ['rect-kin'],
  'u1.12.projectile': ['curv-kin'],
  'u1.12.path': ['curv-kin'],
  'u1.12.relative': ['rel-motion', 'rect-kin'],
  'u1.12.polar': ['polar-kin'],
  'u1.12.radar': ['polar-kin', 'rel-motion'],
  'u1.12.polar-dir': ['polar-kin'],
  'u1.12.polar-sym': ['polar-kin'],
  'u2.13.atwood': ['newton'],
  'u2.13.incline': ['newton'],
  'u2.13.tow': ['newton'],
  'u2.13.bank': ['newton', 'curv-kin'],
  'u2.13.loop': ['newton', 'curv-kin'],
  'u2.13.spring': ['newton', 'curv-kin'],
  'u2.13.incline-ft': ['newton', 'units'],
  'u2.13.constraint': ['constraint'],
  'u2.13.tackle': ['newton', 'constraint'],
  'u2.13.terminal': ['drag', 'newton'],
  'u2.13.polar-eom': ['newton', 'polar-kin'],
  'u2.13.drag-ask': ['drag'],
  'u3.14.speed': ['energy'],
  'u3.14.rough': ['energy'],
  'u3.14.stop': ['energy'],
  'u3.14.power': ['power', 'newton'],
  'u3.14.hp': ['power', 'units'],
  'u3.14.paths': ['energy'],
  'u3.14.same': ['energy'],
  'u3.14.us': ['energy', 'units'],
  'u3.14.frames': ['energy', 'momentum-cons'],
  'u4.15.impulse': ['impulse'],
  'u4.15.recoil': ['momentum-cons'],
  'u4.15.ballistic': ['momentum-cons', 'energy'],
  'u4.15.central': ['restitution', 'momentum-cons'],
  'u4.15.oblique': ['restitution', 'momentum-cons'],
  'u4.15.angular': ['angular-momentum'],
  'u4.15.rocket': ['variable-mass'],
  'u4.15.rocket-ft': ['variable-mass', 'units'],
  'u5.16.belt': ['fixed-axis'],
  'u5.16.gears': ['fixed-axis'],
  'u5.16.pulley-ft': ['fixed-axis', 'units'],
  'u5.16.absolute': ['rel-velocity'],
  'u5.16.bar': ['rel-velocity'],
  'u5.16.ladder': ['rel-velocity'],
  'u5.16.rocker': ['rotating-axes', 'rel-velocity'],
  'u5.16.coriolis-dir': ['rotating-axes'],
  'u5.16.cart-rod': ['rotating-axes'],
  'u5.16.wheel': ['rolling', 'rel-velocity'],
  'u5.16.accel': ['rel-accel', 'rel-velocity'],
  'u5.16.rotor-tip': ['rel-velocity', 'rel-accel'],
  'u6.17.rod': ['inertia'],
  'u6.17.spread': ['inertia'],
  'u6.17.plate': ['inertia'],
  'u6.17.hole': ['inertia'],
  'u6.17.crate': ['rigid-newton'],
  'u6.17.pin': ['rigid-newton', 'inertia'],
  'u6.17.pin-ft': ['rigid-newton', 'units'],
  'u6.17.roll': ['rigid-newton', 'rolling'],
  'u7.18.ke': ['rigid-energy', 'inertia'],
  'u7.18.race': ['rigid-energy', 'rolling'],
  'u7.18.race-ft': ['rigid-energy', 'units'],
  'u7.18.bar': ['rigid-energy'],
  'u7.18.couple': ['rigid-energy'],
  'u7.18.slots': ['rigid-energy', 'rel-velocity'],
  'u7.18.spring': ['rigid-energy'],
  'u7.18.wheel-hill': ['rigid-energy', 'rolling'],
  'u8.19.momentum': ['rigid-momentum'],
  'u8.19.angular-impulse': ['rigid-momentum'],
  'u8.19.spin': ['angular-cons', 'rigid-energy'],
  'u8.19.ballistic-bar': ['angular-cons', 'rigid-energy'],
  'u8.19.strike': ['angular-cons', 'restitution'],
  'u8.19.percussion': ['rigid-momentum'],
  'u8.19.free-bar': ['momentum-cons', 'angular-cons', 'restitution'],
  'u8.19.bat': ['angular-cons', 'restitution'],
  'u8.19.spin-ask': ['angular-cons'],
  'u8.19.impact-ask': ['angular-cons'],
  'u8.19.sweet-ask': ['angular-cons'],
};
