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
  'entropy-balance': {
    name: 'Entropy balance',
    statement: 'For an ideal gas, $\\Delta s = \\int c_p\\,dT/T - R\\ln(p_2/p_1)$. An incompressible liquid has $\\Delta s = c\\ln(T_2/T_1)$. A reversible isobar carries $q = \\Delta h$ and $\\Delta s = \\int dh/T$.',
    cue: 'Two states, and a question about the entropy change or the heat along a reversible isobar.',
    family: 'Entropy',
  },
  'isentropic-efficiency': {
    name: 'Isentropic efficiency',
    statement: 'A turbine or nozzle: $h_2 = h_1 - \\eta(h_1 - h_{2s})$. A compressor: $h_2 = h_1 + (h_{2s} - h_1)/\\eta$. Adiabatic generation is $s_2 - s_1$, and it is zero only at $\\eta = 1$.',
    cue: 'A turbine, compressor or nozzle compared with its isentropic exit.',
    family: 'Entropy',
  },
  'lost-work': {
    name: 'Lost work',
    statement: 'Heat $Q$ leaving $T_H$ and entering $T_L$ generates $S_\\mathrm{gen} = Q(1/T_L - 1/T_H)$. Against the room at $T_H$, the unavailable work is $T_H S_\\mathrm{gen}$.',
    cue: 'Heat crossing a temperature difference, or the work that irreversibility destroys.',
    family: 'Entropy',
  },
  brayton: {
    name: 'Brayton cycle',
    statement: 'Cold air: $\\eta = 1 - r_p^{(1-k)/k}$. With $c_p(T)$, $q_\\mathrm{in} = h_3 - h_2$ and $w_\\mathrm{net} = q_\\mathrm{in} - q_\\mathrm{out}$, the isentropic states coming from $s^\\circ(T)$.',
    cue: 'A gas turbine: compressor, combustor, turbine, and a pressure ratio.',
    family: 'Second law',
  },
};
