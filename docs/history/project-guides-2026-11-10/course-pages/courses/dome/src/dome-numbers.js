/**
 * The dome's own numbers, carried from station to station. Pure: shared by the page and the tests.
 *
 * The learner sets the design pressure and the diameter. Everything else is a figure a source
 * states (traveler.js lists them): NASA's factors for a propellant tank, the measured strength of
 * friction stir welds in 2195 plate, what each repair kept of it, and the crack a standard
 * inspection is counted on to find.
 *
 * The loads are thin-wall membrane loads from pressure alone. A real tank also carries the
 * vehicle's flight loads, so its lands are thicker than these.
 */

export const MPA_PER_KSI = 6.894757;

/** The example dome: 5.5 m across, at the Shuttle hydrogen tank's upper operating pressure. */
export const DEFAULTS = { pressureKPa: 235, diameterM: 5.5 };

/** NASA-STD-5001B, metallic structure: ultimate design factor, and the proof factor for a propellant tank. */
export const FACTORS = { ultimate: 1.4, proof: 1.05 };

/** Average strengths in ksi, 0.32 inch 2195 plate. `wide` is the as-welded 15 inch panel the repairs are compared with. */
export const WELD = {
  fsw: { ftuKsi: 58.7, ftyKsi: 36.6, coldFtuKsi: 95.5, coldFtyKsi: 60.0 },
  fusion: { ftuKsi: 44, coldFtuKsi: 58 },
  wide: { roomKsi: 55.0, coldKsi: 87.6 },
};

/** Ultimate strength of a repaired weld, 15 inch wide panels, at room temperature and at -423 °F. */
export const REPAIRS = [
  { id: 'plug', name: 'Friction plug weld', roomKsi: 57.0, coldKsi: 84.9 },
  { id: 'stir', name: 'Stir weld again, closed with a plug', roomKsi: 55.7, coldKsi: 82.6 },
  { id: 'overlap', name: 'Overlapping stir weld', roomKsi: 56.9, coldKsi: 73.2 },
  { id: 'fusion', name: 'Fusion weld repair', roomKsi: 36.8, coldKsi: 53.3 },
];

/**
 * The surface crack each standard method is counted on to find, 90% of the time with 95%
 * confidence, in metal thicker than `over` mm (`from`: that thick or more). X-ray finds a depth
 * that is a share of the thickness.
 */
export const FLAWS = [
  { id: 'eddy', name: 'Eddy current', over: 1.27, depthMm: 0.51, lengthMm: 5.08 },
  { id: 'penetrant', name: 'Dye penetrant', over: 1.91, depthMm: 0.64, lengthMm: 6.36 },
  { id: 'ultrasonic', name: 'Ultrasound', from: 2.54, depthMm: 0.76, lengthMm: 7.62 },
  { id: 'xray', name: 'X-ray', over: 0, depthOfThickness: 0.7 },
];

const positive = (x) => typeof x === 'number' && Number.isFinite(x) && x > 0;

/**
 * @param {{ pressureKPa?: number, diameterM?: number }} [given] Anything missing, or not a
 *   positive number, falls back to the example dome as a whole.
 */
export function domeNumbers(given = {}) {
  const asked = { ...DEFAULTS, ...given };
  const inputs = positive(asked.pressureKPa) && positive(asked.diameterM) ? { pressureKPa: asked.pressureKPa, diameterM: asked.diameterM } : { ...DEFAULTS };
  const p = inputs.pressureKPa / 1000; // MPa, which is N/mm²
  const r = (inputs.diameterM * 1000) / 2; // mm
  const ftu = WELD.fsw.ftuKsi * MPA_PER_KSI;
  const fty = WELD.fsw.ftyKsi * MPA_PER_KSI;

  /** A seam carrying `load` N per mm of its length: the land that neither breaks at 1.4 p nor yields at proof. */
  const seam = (load) => {
    const ultimateMm = (FACTORS.ultimate * load) / ftu;
    const yieldMm = (FACTORS.proof * load) / fty;
    const landMm = Math.max(ultimateMm, yieldMm);
    return {
      load,
      ultimateMm,
      yieldMm,
      landMm,
      governs: yieldMm >= ultimateMm ? 'yield' : 'ultimate',
      // The same seam fusion welded, sized on ultimate strength, the one figure reported for it.
      fusionUltimateMm: (FACTORS.ultimate * load) / (WELD.fusion.ftuKsi * MPA_PER_KSI),
      stressAtDesignMPa: load / landMm,
      stressAtProofMPa: (FACTORS.proof * load) / landMm,
    };
  };
  const seams = { long: seam(p * r), girth: seam((p * r) / 2) };

  const land = seams.long.landMm;
  const flaws = FLAWS.map((f) => {
    const applies = f.from !== undefined ? land >= f.from : land > f.over;
    const depthMm = f.depthOfThickness ? f.depthOfThickness * land : f.depthMm;
    // X-ray: the table gives a half-length of 1.91 mm up to 2.72 mm of metal, and 0.7 t beyond it.
    const lengthMm = f.depthOfThickness ? 2 * (land <= 2.72 ? 1.91 : 0.7 * land) : f.lengthMm;
    return { id: f.id, name: f.name, applies, depthMm, lengthMm, share: depthMm / land };
  });

  const repairs = REPAIRS.map((x) => ({ ...x, roomShare: x.roomKsi / WELD.wide.roomKsi, coldShare: x.coldKsi / WELD.wide.coldKsi }));

  return {
    inputs,
    radiusMm: r,
    proofKPa: FACTORS.proof * inputs.pressureKPa,
    seams,
    weld: { ftuMPa: ftu, ftyMPa: fty, coldFtuMPa: WELD.fsw.coldFtuKsi * MPA_PER_KSI },
    fusionRatio: WELD.fsw.ftuKsi / WELD.fusion.ftuKsi,
    cryoFactor: WELD.fsw.coldFtuKsi / WELD.fsw.ftuKsi,
    flaws,
    repairs,
    /** The blocks a station can show, by the name the station gives in `numbers`. */
    blocks: { requirement: true, lands: true, flaws: true, repairs: true, proof: true },
  };
}
