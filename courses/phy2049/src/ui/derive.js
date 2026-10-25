import { createDerive as createPhysicsDerive } from '@flux/shells/physics/derive.js';
import { derivationById, derivationsFor } from '../derive/index.js';
import { agreesHeadless } from '../derive/agree.js';
import { M, Q } from '../scene/manim.js';

/** What a derivation's picture may name: the scene colours (Q) and the shared mark colour. */
const colors = { mark: M.lavender, I: Q.I, B: Q.B, white: M.white };

/** Step-through derivations over this course's derivation set. */
export function createDerive(api) {
  return createPhysicsDerive(api, { derivationsFor, derivationById, agrees: agreesHeadless, colors });
}
