import * as THREE from 'three';
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

/**
 * A ramp for readers with red-green colour blindness: dark blue → light blue → pale → amber →
 * orange runs along the blue–yellow axis they do see, with lightness steps between neighbours.
 * The circuit wires use it, since there colour is the only cue for potential.
 */
const CVD_RAMP = [0x1d4f8c, 0x3f8fd6, 0x8fd0ee, 0xece6b8, 0xf4b942, 0xe07b39].map((h) => new THREE.Color(h));
export function rampColorCVD(t, out = new THREE.Color()) {
  const x = Math.max(0, Math.min(1, t)) * (CVD_RAMP.length - 1);
  const i = Math.min(CVD_RAMP.length - 2, Math.floor(x));
  return out.copy(CVD_RAMP[i]).lerp(CVD_RAMP[i + 1], x - i);
}

/** Put an object on the answer layer or take it off, for things that are an answer only sometimes. */
export function setAnswer(obj, on) {
  if (!obj || obj.userData.answer === on) return;
  obj.userData.answer = on;
  obj.traverse((o) => o.layers.set(on ? ANSWER_LAYER : 0));
}
