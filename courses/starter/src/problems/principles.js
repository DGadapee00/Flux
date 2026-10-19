/**
 * EXAMPLE PRINCIPLES. The principle step asks which law governs a problem before it is solved, and
 * needs at least four principles to draw distractors from. Principle tags are optional (D16); a
 * course that supplies them gets the step. Replace with the course's own.
 */
export const PRINCIPLES = {
  'net-rate': { name: 'Net rate', statement: 'A quantity changes at inflow minus outflow.', cue: 'Something flows in and out at once.', family: 'Balances' },
  accumulation: { name: 'Accumulation', statement: 'What is there now is what was there plus the net rate times the time.', cue: 'An amount after a given time.', family: 'Balances' },
  conservation: { name: 'Conservation', statement: 'Nothing is created or destroyed: what goes in and does not come out stays.', cue: 'A closed system with no flows.', family: 'Balances' },
  proportion: { name: 'Proportion', statement: 'Double one input and the output scales by a fixed factor.', cue: 'A change to one input.', family: 'Reasoning' },
};

/** Principles mistaken for each one, most tempting first. */
export const CONFUSED = {
  'net-rate': ['accumulation', 'proportion', 'conservation'],
  accumulation: ['net-rate', 'conservation', 'proportion'],
  conservation: ['accumulation', 'net-rate', 'proportion'],
  proportion: ['net-rate', 'accumulation', 'conservation'],
};

/** Pairs never used as each other's distractor. */
export const TWINS = [];

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
