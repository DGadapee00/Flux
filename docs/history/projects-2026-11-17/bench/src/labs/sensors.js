/**
 * The sensors and the microcontroller input the Unit 3 labs and problems use, with where each number
 * comes from (PROVENANCE.md).
 *
 * GL5528 light-dependent resistor (Senba GL55 series datasheet): 10–20 kΩ at 10 lux, taken here at
 * its middle, 15 kΩ; gamma 0.6 between 10 and 100 lux; at least 1 MΩ dark.
 * 10 kΩ NTC thermistor, B = 3950 K: the common bead part's beta-equation figures, typical rather
 * than one maker's.
 * ATmega328P input (Microchip datasheet, DC characteristics, VCC 2.4–5.5 V): low below 0.3·VCC, high
 * above 0.6·VCC; pin leakage at most 1 µA; internal pull-up 20–50 kΩ. Its 10-bit ADC reads
 * ADC = V_in·1024/V_ref, and is designed for sources of about 10 kΩ or less.
 */
export const LDR = { name: 'GL5528 LDR', r10: 15e3, gamma: 0.6, rdark: 1e6 };
export const NTC = { name: '10 kΩ NTC thermistor', r25: 10e3, beta: 3950 };
export const MCU = { vil: 0.3, vih: 0.6, leak: 1e-6, pullup: [20e3, 50e3], adcBits: 10, adcSource: 10e3 };

/** The 10-bit reading of `v` against a `vref` reference, as the ATmega328P datasheet defines it. */
export function adcCount(v, vref = 5) {
  return Math.max(0, Math.min(1023, Math.floor((v * 1024) / vref)));
}
