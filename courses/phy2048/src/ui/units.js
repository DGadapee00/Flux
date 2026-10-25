import { createUnits as createPhysicsUnits } from '@flux/shells/physics/units.js';
import { LAB_META } from '../catalog.js';
import { unitsForLab } from '../data/quantities.js';

/** The units reference over this course's quantities. @param {{ onOpen?: () => void }} [opts] */
export function createUnits(opts = {}) {
  return createPhysicsUnits({ ...opts, unitsForLab, labMeta: LAB_META });
}
