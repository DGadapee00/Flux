/**
 * The principle that decides each thermodynamics problem. Tags are optional data for the practice
 * loop: the panel names the principle with the solution and, after a miss, asks what went wrong.
 * No problem asks the student to name the principle first.
 */
export const PRINCIPLES = {
  'cycle-balance': {
    name: 'First law for a cycle',
    statement: 'A cycle returns to its first state, so $\\Delta U = 0$ and $Q_H = Q_L + W$ when every term is a positive magnitude.',
    cue: 'Heat and work around a closed loop, with no property table.',
    family: 'Second law',
  },
  'carnot-limit': {
    name: 'Carnot limit',
    statement: 'A reversible engine between two reservoirs has $\\eta = 1 - T_L/T_H$. The refrigerator and heat pump on the same reservoirs have $\\mathrm{COP_R} = T_L/(T_H - T_L)$ and $\\mathrm{COP_{HP}} = \\mathrm{COP_R} + 1$. Temperatures are absolute.',
    cue: 'Two temperatures and a question about the best possible engine, refrigerator or heat pump.',
    family: 'Second law',
  },
  clausius: {
    name: 'Clausius inequality',
    statement: 'For a cycle, $\\oint \\delta Q/T \\le 0$, with heat into the device positive. Zero is reversible. Positive is impossible.',
    cue: 'A claim with heats and reservoir temperatures, asking whether the device can exist.',
    family: 'Second law',
  },
  brayton: {
    name: 'Brayton cycle',
    statement: 'Cold air: $\\eta = 1 - r_p^{(1-k)/k}$. With $c_p(T)$, $q_\\mathrm{in} = h_3 - h_2$ and $w_\\mathrm{net} = q_\\mathrm{in} - q_\\mathrm{out}$, the isentropic states coming from $s^\\circ(T)$.',
    cue: 'A gas turbine: compressor, combustor, turbine, and a pressure ratio.',
    family: 'Second law',
  },
};
