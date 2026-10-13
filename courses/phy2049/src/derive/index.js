/**
 * Step-through derivations ("Set it up"), by lab. Exam 4 is the pilot: RC, Biot–Savart and Ampère.
 * The format is described at the top of exam4.js; src/ui/derive.js shows them, and
 * scripts/derive-check.mjs runs every line against the real lab.
 */
import { EXAM4 } from './exam4.js';

export const DERIVATIONS = [...EXAM4];

export const derivationById = (id) => DERIVATIONS.find((d) => d.id === id) || null;

/** Every derivation a lab offers, in the order written. */
export const derivationsFor = (labId) => DERIVATIONS.filter((d) => d.lab === labId);
