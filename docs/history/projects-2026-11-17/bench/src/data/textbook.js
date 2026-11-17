/**
 * Every citation the course shows, in one place (DECISIONS.md, D21, D35). Problems and notes name a
 * topic and ask this file for its citation, so changing a source changes this file only. Nothing is
 * copied from any source: entries are chapter numbers and titles, and the datasheet figures a lab
 * uses are named where they are used.
 */

export const BOOKS = Object.freeze({
  lec: Object.freeze({
    short: 'Kuphaldt',
    author: 'Tony R. Kuphaldt',
    title: 'Lessons in Electric Circuits',
    publisher: 'ibiblio.org (free online)',
    year: 2007,
    license: 'Design Science License, as stated in the book; to be confirmed on the publisher page',
    url: 'https://www.ibiblio.org/kuphaldt/electricCircuits/',
  }),
  usb: Object.freeze({
    short: 'USB 2.0',
    author: 'USB Implementers Forum',
    title: 'Universal Serial Bus Specification, Revision 2.0',
    publisher: 'USB-IF',
    year: 2000,
    license: 'Specification; figures cited, nothing copied',
    url: 'https://www.usb.org/',
  }),
  bc: Object.freeze({
    short: 'USB BC 1.2',
    author: 'USB Implementers Forum',
    title: 'Battery Charging Specification, Revision 1.2',
    publisher: 'USB-IF',
    year: 2010,
    license: 'Specification; figures cited, nothing copied',
    url: 'https://www.usb.org/',
  }),
  iec: Object.freeze({
    short: 'IEC 60063',
    author: 'International Electrotechnical Commission',
    title: 'Preferred number series for resistors and capacitors',
    publisher: 'IEC',
    year: 2015,
    license: 'Standard; the series named, nothing copied',
    url: 'https://webstore.iec.ch/',
  }),
  gl55: Object.freeze({
    short: 'GL55 datasheet',
    author: 'Senba Optical & Electronic',
    title: 'GL55 Series Photoresistor (GL5528)',
    publisher: 'Senba',
    year: null,
    license: 'Datasheet; figures cited, nothing copied',
    url: null,
  }),
  ntc: Object.freeze({
    short: 'NTC 3950',
    author: 'Typical bead thermistor datasheets',
    title: '10 kΩ NTC thermistor, B25/50 = 3950 K',
    publisher: 'various makers',
    year: null,
    license: 'Typical figures; to be confirmed against one maker’s part',
    url: null,
  }),
  avr: Object.freeze({
    short: 'ATmega328P datasheet',
    author: 'Microchip Technology',
    title: 'ATmega48A/PA/88A/PA/168A/PA/328/P datasheet',
    publisher: 'Microchip',
    year: 2020,
    license: 'Datasheet; figures cited, nothing copied',
    url: 'https://www.microchip.com/',
  }),
});

/** topic → where to read about it. Kuphaldt sections are volume and chapter. */
export const SECTIONS = Object.freeze({
  breadboard: { book: 'lec', section: 'VI.1', title: 'Introduction: building circuits' },
  nets: { book: 'lec', section: 'I.5', title: 'Series and parallel circuits' },
  meter: { book: 'lec', section: 'I.8', title: 'DC metering circuits' },
  voltmeter: { book: 'lec', section: 'VI.2', title: 'Basic concepts and test equipment: voltmeter usage' },
  ammeter: { book: 'lec', section: 'VI.2', title: 'Basic concepts and test equipment: ammeter usage' },
  ohmmeter: { book: 'lec', section: 'VI.2', title: 'Basic concepts and test equipment: ohmmeter usage' },
  ohm: { book: 'lec', section: 'I.2', title: "Ohm's law" },
  safety: { book: 'lec', section: 'I.3', title: 'Electrical safety' },
  supply: { book: 'lec', section: 'I.11', title: 'Batteries and power systems' },
  usb: { book: 'usb', section: '7.2', title: 'Power distribution' },
  diode: { book: 'lec', section: 'III.3', title: 'Diodes and rectifiers' },
  led: { book: 'lec', section: 'III.3', title: 'Diodes and rectifiers: light-emitting diodes' },
  power: { book: 'lec', section: 'I.2', title: "Ohm's law: power in electric circuits" },
  colour: { book: 'lec', section: 'V.2', title: 'Color codes: resistor color codes' },
  e12: { book: 'iec', section: 'E12', title: 'The E12 series of preferred values' },
  divider: { book: 'lec', section: 'I.6', title: "Divider circuits and Kirchhoff's laws" },
  loading: { book: 'lec', section: 'I.10', title: "DC network analysis: Thevenin's theorem" },
  ldr: { book: 'gl55', section: 'GL5528', title: 'Light resistance, gamma and dark resistance' },
  ntc: { book: 'ntc', section: 'B', title: 'The beta equation' },
  pullup: { book: 'avr', section: 'I/O ports', title: 'Configuring the pin: the internal pull-up' },
  inputs: { book: 'avr', section: 'DC characteristics', title: 'Input low and high voltages, input leakage' },
});

export function citation(topic) {
  const s = SECTIONS[topic];
  if (!s) return null;
  const b = BOOKS[s.book];
  return `${b.short} §${s.section}`;
}
