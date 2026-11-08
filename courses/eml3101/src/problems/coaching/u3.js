/**
 * Unit 3 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { workFrom } from '../bank/u3.js';
import { ottoEta } from '../bank/u3.js';
import { pumpWork } from '../bank/u3.js';
import { carnotHP } from '../bank/u3.js';

export default {
  'u3.1.exergy': {
    traps: {
      X: [
        [($) => workFrom($, 'rejected'), 'That is the heat the Carnot engine rejects, QT₀/T. The work is the rest: Q(1 − T₀/T).'],
        [($) => workFrom($, 'celsius'), 'Use kelvin in T₀/T: 10 °C is 283.15 K.'],
      ],
    },
  },
  'u3.3.otto': {
    traps: {
      eta: [
        [($) => ottoEta($, 'k'), 'The power is k − 1 = 0.4, from T₂/T₁ = r^{k−1}; r^k is the pressure ratio.'],
        [($) => ottoEta($, 'r'), 'Raise r to the power k − 1: η = 1 − 1/r^{0.4}.'],
      ],
    },
  },
  'u3.5.pump': {
    traps: {
      w: [
        [($) => pumpWork($, 'vapour'), 'Use the liquid’s specific volume, 0.00101 m³/kg: the pump moves water, not steam.'],
        [($) => pumpWork($, 'mpa'), 'Put the pressures in kPa: then v Δp is in kJ/kg.'],
      ],
    },
  },
  'u3.7.carnot-hp': {
    traps: {
      cop: [
        [($) => carnotHP($, 'celsius'), 'Use kelvin: 21 °C is 294.15 K.'],
        [($) => carnotHP($, 'fridge'), 'That is the refrigerator’s COP, T_L/(T_H − T_L). A heat pump’s useful output is the heat delivered: T_H/(T_H − T_L).'],
      ],
    },
  },
};
