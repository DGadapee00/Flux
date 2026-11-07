/**
 * The circuits the Nodes lab solves. Each branch runs from node a to node b with a resistor R (Ω)
 * in series with an EMF V (volts, pushing current from a to b). Node 0 is ground. `meshes` lists the
 * windows of the drawing, each as [branch, +1 with the branch or −1 against it]. `path` is how the
 * branch is drawn, from a to b; `nodes` gives where each node's dot sits.
 *
 * `run`, where given, is the straight run of the path that holds the element (else the longest).
 *
 * `V` and `Rx` in the lab scale the first source and set the resistor marked `x`.
 */
export const CIRCUITS = {
  parallel: {
    name: 'Four branches between two rails',
    nodes: 2,
    dots: [[0, 0], [0, 2], [4.8, 0], [4.8, 2]],
    nodeAt: [[2.4, 0], [2.4, 2]],
    rails: [[[0, 0], [4.8, 0]], [[0, 2], [4.8, 2]]],
    branches: [
      { a: 0, b: 1, R: 2, V: 10, path: [[0, 0], [0, 2]], source: true },
      { a: 0, b: 1, R: 4, V: 0, path: [[1.6, 0], [1.6, 2]], x: true },
      { a: 0, b: 1, R: 3, V: 6, path: [[3.2, 0], [3.2, 2]] },
      { a: 0, b: 1, R: 6, V: 0, path: [[4.8, 0], [4.8, 2]] },
    ],
    meshes: [
      [[0, 1], [1, -1]],
      [[1, 1], [2, -1]],
      [[2, 1], [3, -1]],
    ],
  },
  series: {
    name: 'One loop, four resistors',
    nodes: 4,
    dots: [[0, 0], [0, 2], [2.4, 2], [2.4, 0]],
    nodeAt: [[0, 0], [0, 2], [2.4, 2], [2.4, 0]],
    rails: [],
    branches: [
      { a: 0, b: 1, R: 1, V: 12, path: [[0, 0], [0, 2]], source: true },
      { a: 1, b: 2, R: 2, V: 0, path: [[0, 2], [2.4, 2]] },
      { a: 2, b: 3, R: 3, V: 0, path: [[2.4, 2], [2.4, 0]], x: true },
      { a: 3, b: 0, R: 4, V: 0, path: [[2.4, 0], [0, 0]] },
    ],
    meshes: [[[0, 1], [1, 1], [2, 1], [3, 1]]],
  },
  bridge: {
    name: 'A bridge',
    nodes: 4,
    dots: [[1.5, 0], [1.5, 3], [-0.4, 1.5], [3.4, 1.5]],
    nodeAt: [[1.5, 0], [1.5, 3], [-0.4, 1.5], [3.4, 1.5]],
    rails: [],
    branches: [
      { a: 0, b: 1, R: 1, V: 12, path: [[1.5, 0], [-1.6, 0], [-1.6, 3], [1.5, 3]], run: 1, source: true },
      { a: 1, b: 2, R: 2, V: 0, path: [[1.5, 3], [-0.4, 1.5]] },
      { a: 1, b: 3, R: 3, V: 0, path: [[1.5, 3], [3.4, 1.5]] },
      { a: 2, b: 0, R: 4, V: 0, path: [[-0.4, 1.5], [1.5, 0]] },
      { a: 3, b: 0, R: 2, V: 0, path: [[3.4, 1.5], [1.5, 0]] },
      { a: 2, b: 3, R: 5, V: 0, path: [[-0.4, 1.5], [3.4, 1.5]], x: true },
    ],
    meshes: [
      [[0, 1], [1, 1], [3, 1]],
      [[2, 1], [5, -1], [1, -1]],
      [[5, 1], [4, 1], [3, -1]],
    ],
  },
};

/** The circuit with the first source set to V volts and the marked resistor to Rx ohms. */
export function build(id, V, Rx) {
  const c = CIRCUITS[id];
  const first = c.branches.findIndex((b) => b.source);
  return { ...c, branches: c.branches.map((b, k) => ({ ...b, V: k === first ? V : b.V, R: b.x ? Rx : b.R })) };
}
