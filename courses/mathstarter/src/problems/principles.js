/**
 * EXAMPLE PRINCIPLES. Principle tags are optional (D16). A course that supplies them gets the
 * deciding principle shown with each solution, "what went wrong" after a miss, the weak-principle
 * list and a group-by-principle view. There is no question about the principle before a problem.
 * Replace with the course's own.
 */
export const PRINCIPLES = {
  'net-rate': { name: 'Net rate', statement: 'A quantity changes at inflow minus outflow.', cue: 'Something flows in and out at once.', family: 'Balances' },
  accumulation: { name: 'Accumulation', statement: 'What is there now is what was there plus the net rate times the time.', cue: 'An amount after a given time.', family: 'Balances' },
  conservation: { name: 'Conservation', statement: 'Nothing is created or destroyed: what goes in and does not come out stays.', cue: 'A closed system with no flows.', family: 'Balances' },
  proportion: { name: 'Proportion', statement: 'Double one input and the output scales by a fixed factor.', cue: 'A change to one input.', family: 'Reasoning' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
