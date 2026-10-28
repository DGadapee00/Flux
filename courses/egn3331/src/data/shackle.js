/**
 * Crosby G-209 screw-pin anchor shackles.
 * Working load and dimensions A (jaw opening) and B (pin diameter) are the
 * catalog table. Stock 1018455 is the 1/2 in row.
 * https://www.mecampbell.com/media/pdf/THECRSE00015_77.pdf
 *
 * A listing of that stock number prints 4400 lbf beside the catalog 2 t,
 * so each catalog tonne is taken as 2200 lbf.
 */
export const LBF_PER_TONNE = 2200;
export const SHACKLE_URL = 'https://www.mecampbell.com/media/pdf/THECRSE00015_77.pdf';

export const SIZES = {
  '3/8': { wll: 1, d: 0.44, jaw: 0.66, stock: '1018419' },
  '1/2': { wll: 2, d: 0.63, jaw: 0.81, stock: '1018455' },
  '5/8': { wll: 3.25, d: 0.75, jaw: 1.06, stock: '1018473' },
  '3/4': { wll: 4.75, d: 0.88, jaw: 1.25, stock: '1018491' },
};

/** Working load in pounds-force, times an optional fraction of the catalog rating. */
export function shackleLoad(size, frac = 1) {
  return LBF_PER_TONNE * SIZES[size].wll * frac;
}
