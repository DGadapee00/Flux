/**
 * Unit 3 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { phaseState } from '@flux/subjects/matsci/phasediagram.js';
import { TIE, share } from '../bank/u3.js';

export default {
  'u3.1.lever': {
    traps: {
      w: [
        [($) => 1 - share($), 'That is the other phase. A phase’s share is the arm on the far side from it.'],
        [($) => ($.ask === 'L' ? TIE[$.T].xL : TIE[$.T].xS), 'That is the phase’s composition, read at the tie line’s end. Its amount comes from the lever rule.'],
      ],
    },
  },
  'u3.3.ends': {
    traps: {
      x: [
        [() => 0.5, 'That is the alloy’s overall composition. Each phase’s composition is at the tie line’s end.'],
        [($) => phaseState({ x0: 0.5, T: $.T })[$.ask === 'L' ? 'xS' : 'xL'], 'That is the other end. The liquid is on the liquidus, the left, nickel-poor end; the solid on the solidus.'],
      ],
    },
  },
};
