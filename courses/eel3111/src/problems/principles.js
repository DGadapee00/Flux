/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  kcl: { name: 'Current in equals current out', statement: 'At every node the currents leaving sum to zero; with Ohm’s law on each branch that is one linear equation per node above ground.', cue: 'Unknown node voltages.', family: 'Circuits' },
  kvl: { name: 'Voltages round a loop sum to zero', statement: 'Round every closed loop the rises equal the drops; with loop currents that is one linear equation per window.', cue: 'Unknown loop currents.', family: 'Circuits' },
  phasor: { name: 'Phasors add, amplitudes do not', statement: 'In sinusoidal steady state each voltage is a phasor; impedances Z_R = R, Z_L = jωL, Z_C = 1/(jωC) obey Ohm’s law, and Kirchhoff’s laws hold for the phasors, not the amplitudes.', cue: 'A sine source driving resistors, inductors or capacitors.', family: 'Circuits' },
  dependent: { name: 'A dependent source stays in', statement: 'A dependent source sets its value from a voltage or current elsewhere. Write that value in terms of the controlling variable, move it into the matrix, and never switch it off.', cue: 'A source labelled μv_x, g_m v_x, r_m i_x or βi_x.', family: 'Circuits' },
  superpose: { name: 'Responses add, powers do not', statement: 'In a linear circuit each voltage and current is the sum of the parts from each source alone, with the others set to zero: a voltage source becomes a wire, a current source a break. Power is a square, so add the currents first.', cue: 'Several independent sources.', family: 'Circuits' },
  thevenin: { name: 'A network is a line at its terminals', statement: 'Seen from two terminals, a linear network gives V = V_th − I R_th. V_th is the open-circuit voltage, I_N the short-circuit current, and R_th = V_th/I_N, the resistance with every independent source switched off.', cue: 'A load connected to a larger network.', family: 'Circuits' },
  maxpower: { name: 'Matching gives power, not efficiency', statement: 'A load takes the most power, V_th²/(4R_th), when R_L = R_th; then R_th dissipates as much again, so the equivalent is 50% efficient. Efficiency R_L/(R_L + R_th) rises as R_L grows.', cue: 'Choosing a load for a source.', family: 'Circuits' },
  filter: { name: 'Each frequency on its own', statement: 'A filter passes each sine at its own |H(jω)| and delays it by its own phase. A signal made of many sines comes out with a new shape. For RC, |H| = 1/√(1 + (f/f_c)²) with f_c = 1/(2πRC).', cue: 'A signal that is not a sine through a filter.', family: 'Circuits' },
  firstorder: { name: 'τ from what the element sees', statement: 'After a switch moves, a capacitor’s voltage or an inductor’s current relaxes as x(∞) + [x(0⁺) − x(∞)]e^(−t/τ), with τ = R_th C or L/R_th and R_th the Thévenin resistance across the element in that switch position. v_C and i_L carry over the switching; i_C and v_L can jump.', cue: 'A switch moving in a circuit with one capacitor or one inductor.', family: 'Circuits' },
  opamp: { name: 'Feedback sets the gain', statement: 'With enough open-loop gain A, negative feedback holds v₋ at v₊ (a virtual ground in the inverting amplifier), so the gain is −R_f/R₁; the exact gain is −(R_f/R₁)/(1 + (1 + R_f/R₁)/A). The output cannot pass the rails.', cue: 'An op amp with a resistor from its output back to its − input.', family: 'Circuits' },
  count: { name: 'Count before you solve', statement: 'Nodal analysis needs n − 1 equations, mesh analysis b − n + 1. Pick the smaller.', cue: 'Choosing how to analyse a circuit.', family: 'Circuits' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
