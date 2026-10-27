import { fromForward } from '@flux/subjects/em/diode.js';

/**
 * The LEDs the Bench labs and problems use: 5 mm through-hole parts at their typical forward voltage
 * at 20 mA. Red and yellow are the older GaAsP/AlInGaP chips, about 2 V; green, blue and white are
 * InGaN chips, about 3.2 V. These are typical datasheet values for the colour, not one maker's part.
 * The course model behind each is `fromForward` with ideality 2 and 10 Ω of series resistance, which
 * passes through the 20 mA point and gives a curve as steep as a datasheet's: about 0.2 V from 10 to
 * 30 mA.
 */
export const LEDS = {
  red: { name: 'red', vf: 2.0, color: '#ff4a3d' },
  yellow: { name: 'yellow', vf: 2.1, color: '#ffd23f' },
  green: { name: 'green', vf: 3.2, color: '#3ddc6a' },
  blue: { name: 'blue', vf: 3.2, color: '#4d86ff' },
  white: { name: 'white', vf: 3.2, color: '#f2f4ff' },
};

/** The rated current the typical forward voltages are given at, and the usual absolute maximum. */
export const I_RATED = 0.02;
export const I_MAX = 0.03;

/** The course model of an LED of colour `c`, shifted by `dv` volts (a part-to-part spread). */
export function ledModel(c, dv = 0) {
  return fromForward({ vf: LEDS[c].vf + dv, iF: I_RATED });
}
