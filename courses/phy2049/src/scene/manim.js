import { ANSWER_LAYER, M } from '@flux/core/scene3d/manim.js';

export * from '@flux/core/scene3d/manim.js';

/*
 * What a colour means in a scene, in every lab. One quantity, one colour: a student who has learned
 * that yellow is E in the Field lab should not find yellow meaning current in Biot–Savart.
 *
 *   E (and light, which is E)   yellow      B, and the inductor that makes it   teal
 *   current I                   gold        force F                             pink
 *   velocity, travel, S         white       capacitor, C                        purple
 *   + charge / plate            red         − charge / plate                    blue
 *   selected                    white ring  a marked point (A)                  purple
 *   images: real / virtual      purple / lavender
 *
 * The three principal rays in the optics labs keep gold / teal / blue: those labs have no current,
 * field or charge on screen, and the rays are named by colour in their text. Magnitude ramps (field
 * lines, equipotentials, wire potential) are colour scales, not these.
 */
export const Q = {
  E: M.yellow,
  B: M.teal,
  I: M.gold,
  F: M.pink,
  v: M.white,
  C: M.purple,
  pos: M.red,
  neg: M.blue,
  select: M.white,
  mark: M.purple,
  imageReal: M.purple,
  imageVirtual: 0xc7b3dc,
};

// The colour-blind-safe ramp moved to the shell with the schematic that uses it.
export { rampColorCVD } from '@flux/shells/physics/schematic.js';

/** Put an object on the answer layer or take it off, for things that are an answer only sometimes. */
export function setAnswer(obj, on) {
  if (!obj || obj.userData.answer === on) return;
  obj.userData.answer = on;
  obj.traverse((o) => o.layers.set(on ? ANSWER_LAYER : 0));
}
