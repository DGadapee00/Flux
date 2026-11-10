/**
 * Text for a traveler, with no page in it: how the dome's numbers read at a station, and which
 * Build view an address asks for. Kept apart from traveler.js so the tests can run it in Node.
 */
import { travelerById } from '@flux/map/applications/travelers/index.js';
import { FACTORS, WELD } from '@flux/map/applications/travelers/dome-numbers.js';

/** A number to three significant figures, as plain digits. */
export function fig(x) {
  return String(Number(Number(x).toPrecision(3)));
}

const pct = (share) => `${Math.round(100 * share)}%`;

/**
 * One block of the dome's numbers as rows to print: `{ title, rows: [{ label, value, strong? }], note }`.
 * @param {string} name A block name from a station's `numbers`.
 * @param {ReturnType<import('@flux/map/applications/travelers/dome-numbers.js').domeNumbers>} n
 */
export function blockRows(name, n) {
  const { long, girth } = n.seams;
  const dome = `${fig(n.inputs.pressureKPa)} kPa, ${fig(n.inputs.diameterM)} m across`;
  if (name === 'requirement') {
    return {
      title: 'This dome’s numbers',
      rows: [
        { label: `Proof pressure, at ${FACTORS.proof} times design`, value: `${fig(n.proofKPa)} kPa` },
        { label: 'Load in a seam along the barrel, p r', value: `${fig(long.load)} N per mm of seam` },
        { label: 'Load in a seam around the tank, p r / 2', value: `${fig(girth.load)} N per mm of seam` },
      ],
      note: 'Pressure pulls a seam along the barrel apart twice as hard as a seam around it. A hemisphere’s seams all carry the smaller load. This dome is elliptical, so its loads change from crown to rim. The numbers follow the part: they return at the panels, the inspection and the proof test.',
    };
  }
  if (name === 'lands') {
    return {
      title: `The weld land, for ${dome}`,
      rows: [
        { label: 'Weld strength used', value: `${fig(n.weld.ftuMPa)} MPa ultimate and ${fig(n.weld.ftyMPa)} MPa yield (${WELD.fsw.ftuKsi} and ${WELD.fsw.ftyKsi} ksi)` },
        { label: `Barrel seam, not to break at ${FACTORS.ultimate} times pressure`, value: `${fig(long.ultimateMm)} mm` },
        { label: 'Barrel seam, not to yield at proof', value: `${fig(long.yieldMm)} mm` },
        { label: 'Barrel seam land', value: `${fig(long.landMm)} mm: ${long.governs === 'yield' ? 'yield at proof governs' : 'ultimate strength governs'}`, strong: true },
        { label: 'Land for a seam around the tank', value: `${fig(girth.landMm)} mm` },
        { label: 'The barrel seam fusion welded, on ultimate strength', value: `${fig(long.fusionUltimateMm)} mm against ${fig(long.ultimateMm)} mm: ${pct(n.fusionRatio - 1)} thicker` },
      ],
      note: 'From pressure alone. A real tank also carries the vehicle’s flight loads, so its lands are thicker: NASA’s test plate was 0.32 inch, about 8 mm.',
    };
  }
  if (name === 'flaws') {
    return {
      title: `What inspection is counted on to find, in a ${fig(long.landMm)} mm land`,
      rows: n.flaws.map((f) => ({
        label: f.name,
        value: f.applies
          ? `a crack ${fig(f.depthMm)} mm deep and ${fig(f.lengthMm)} mm long, ${pct(f.share)} of the land`
          : 'not covered: the land is thinner than this method’s range',
      })),
      note: 'These are surface cracks a standard method finds 90% of the time, with 95% confidence. A smaller flaw may still be there, so the analysis has to show the part survives it. A thicker land makes each a smaller share.',
    };
  }
  if (name === 'repairs') {
    return {
      title: 'What each repair kept of the weld’s strength',
      rows: n.repairs.map((r) => ({ label: r.name, value: `${pct(r.roomShare)} warm, ${pct(r.coldShare)} cold`, strong: r.id === 'fusion' })),
      note: 'Ultimate strength of repaired welds in 15 inch wide panels of 0.32 inch 2195, against the same weld unrepaired. Warm is room temperature. Cold is −423 °F, liquid hydrogen.',
    };
  }
  if (name === 'proof') {
    return {
      title: `The proof test, for ${dome}`,
      rows: [
        { label: 'Proof pressure', value: `${fig(n.proofKPa)} kPa` },
        { label: 'Stress in the barrel land at proof', value: `${fig(long.stressAtProofMPa)} MPa, ${pct(long.stressAtProofMPa / n.weld.ftyMPa)} of the weld’s yield`, strong: true },
        { label: 'Stress at design pressure', value: `${fig(long.stressAtDesignMPa)} MPa, ${pct(long.stressAtDesignMPa / n.weld.ftuMPa)} of its ultimate strength` },
        { label: 'The weld cold', value: `${fig(n.weld.coldFtuMPa)} MPa ultimate, ${n.cryoFactor.toFixed(1)} times its room temperature strength` },
      ],
      note: 'The land was sized so the weld reaches yield at proof and no further. Run warm, the test loads the weld closer to its strength than a cold flight does.',
    };
  }
  throw new Error(`No numbers block named ${name}`);
}

/**
 * Which Build view an address asks for. `?traveler=<id>` shows that traveler, at `&station=<id>`
 * or its first station. Anything else, or a traveler that does not exist, shows the satellite.
 * @param {string} search `location.search`
 */
export function pickBuildView(search) {
  const q = new URLSearchParams(search);
  const t = travelerById[q.get('traveler')];
  if (!t) return { view: 'satellite' };
  const station = t.stations.find((s) => s.id === q.get('station')) || t.stations[0];
  return { view: 'traveler', traveler: t.id, station: station.id };
}
