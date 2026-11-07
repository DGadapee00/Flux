/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  kcl: { name: 'Current in equals current out', statement: 'At every node the currents leaving sum to zero; with Ohm’s law on each branch that is one linear equation per node above ground.', cue: 'Unknown node voltages.', family: 'Circuits' },
  kvl: { name: 'Voltages round a loop sum to zero', statement: 'Round every closed loop the rises equal the drops; with loop currents that is one linear equation per window.', cue: 'Unknown loop currents.', family: 'Circuits' },
  count: { name: 'Count before you solve', statement: 'Nodal analysis needs n − 1 equations, mesh analysis b − n + 1. Pick the smaller.', cue: 'Choosing how to analyse a circuit.', family: 'Circuits' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
