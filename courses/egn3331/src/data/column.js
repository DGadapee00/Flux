/**
 * Akron adjustable column, ICC-ES ESR-1767 (reissued April 2020).
 * Table 1: 3 in nominal tube, nominal wall 0.120 in, design wall 0.112 in.
 * Table 2: ASTM A500 Grade B, Fy = 42 ksi. Ends fixed against translation and
 * free to rotate, so the course model uses K = 1. The listed length includes
 * up to 4 in of adjusting screw. E is not in the report.
 */

export const COLUMN_URL = 'https://akronproducts.com/wp-content/uploads/Akron-ESR-1767_2022.pdf';
export const COLUMN_OD_IN = 3;
export const COLUMN_T_IN = 0.112;
export const COLUMN_T_NOM_IN = 0.120;
export const COLUMN_FY_KSI = 42;
export const COLUMN_E_KSI = 29000;
export const COLUMN_ROWS = [
  { L: 76, asd: 13.5, lrfd: 20.3 },
  { L: 124, asd: 8.7, lrfd: 13.0 },
  { L: 145, asd: 6.6, lrfd: 10.0 },
];

export function columnRow(lengthIn) {
  return COLUMN_ROWS.find((row) => Math.abs(row.L - lengthIn) < 0.51) || null;
}
