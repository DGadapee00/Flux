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
  count: { name: 'Count before you solve', statement: 'Nodal analysis needs n − 1 equations, mesh analysis b − n + 1. Pick the smaller.', cue: 'Choosing how to analyse a circuit.', family: 'Circuits' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
