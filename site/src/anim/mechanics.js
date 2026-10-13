/**
 * A triangular truss: pin at A, roller at B, downward load P at the peak C.
 * Member forces are tension-positive. The picture uses the solved forces.
 */

/**
 * @param {number[][]} matrix Rows of [coefficients..., rhs].
 * @returns {number[]}
 */
function solve(matrix) {
  const m = matrix.map((row) => row.slice());
  const n = m.length;
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    const swap = m[col];
    m[col] = m[pivot];
    m[pivot] = swap;
    const div = m[col][col];
    if (Math.abs(div) < 1e-12) throw new Error('truss matrix is singular');
    for (let c = col; c <= n; c += 1) m[col][c] /= div;
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = m[row][col];
      for (let c = col; c <= n; c += 1) m[row][c] -= factor * m[col][c];
    }
  }
  return m.map((row) => row[n]);
}

/**
 * @param {number} [P]
 * @param {number} [h]
 */
export function solveTruss(P = 1, h = 1.2) {
  const A = { x: 0, y: 0 };
  const B = { x: 2, y: 0 };
  const C = { x: 1, y: h };
  const ac = unit(A, C);
  const bc = unit(B, C);
  const ab = unit(A, B);
  // Ax, Ay, By, Tac, Tbc, Tab. Tension pulls a joint toward the other end.
  const rows = [
    [1, 0, 0, ac.x, 0, ab.x, 0],
    [0, 1, 0, ac.y, 0, 0, 0],
    [0, 0, 0, 0, bc.x, -ab.x, 0],
    [0, 0, 1, 0, bc.y, 0, 0],
    [0, 0, 0, -ac.x, -bc.x, 0, 0],
    [0, 0, 0, -ac.y, -bc.y, 0, P],
  ];
  const [ax, ay, by, tac, tbc, tab] = solve(rows);
  return {
    P,
    h,
    A,
    B,
    C,
    Ax: ax,
    Ay: ay,
    By: by,
    Tac: tac,
    Tbc: tbc,
    Tab: tab,
    members: [
      { id: 'ac', from: A, to: C, tension: tac },
      { id: 'bc', from: B, to: C, tension: tbc },
      { id: 'ab', from: A, to: B, tension: tab },
    ],
  };
}

/**
 * @param {{x:number,y:number}} from
 * @param {{x:number,y:number}} to
 */
function unit(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  return { x: dx / length, y: dy / length, length };
}
