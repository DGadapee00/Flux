/**
 * Travelers: one part followed through the shop, station by station. A traveler is depth on
 * demand: the decisions (../decisions/) say which process to pick, and a traveler shows how that
 * process is run, what goes wrong at each step and the paper each step leaves behind.
 */
import fswDome from './fsw-dome.js';

export const TRAVELERS = [fswDome];

export const travelerById = Object.fromEntries(TRAVELERS.map((t) => [t.id, t]));
