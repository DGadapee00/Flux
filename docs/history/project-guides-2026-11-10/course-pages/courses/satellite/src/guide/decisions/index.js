/**
 * Decisions: the choices a subsystem's Make side asks for. One file each, like concepts.
 * A decision is a card to read in a minute: the question, what drives it, the usual options with
 * the figures that separate them, the usual pick and why, and what would change it. Every figure
 * names the source it was read in (refs.js). Options carry links to options of other decisions,
 * because design, material and process are one choice: see ../decide.js.
 *
 * A recipe lists its decisions in the order they are made (../recipes.js, `decisions`).
 */
import material from './structure-material.js';
import process from './structure-process.js';
import joints from './structure-joints.js';
import finish from './structure-finish.js';

export const DECISIONS = [material, process, joints, finish];

export const decisionById = Object.fromEntries(DECISIONS.map((d) => [d.id, d]));

/** Every option by id, with the decision it belongs to. Option ids are unique across decisions. */
export const optionById = Object.fromEntries(DECISIONS.flatMap((d) => d.options.map((o) => [o.id, { option: o, decision: d }])));

/** A subsystem's decisions, in the order written here. */
export const decisionsOf = (subsystem) => DECISIONS.filter((d) => d.subsystem === subsystem);
