import { REFS } from './refs.js';

/**
 * Structure, decision 1 of 4: the frame's material. Figures are the ones each source states; the
 * derived columns are computed from them (../decide.js) and checked a second way in the tests.
 */
export default {
  id: 'structure-material',
  subsystem: 'structure',
  title: 'Material',
  question: 'What is the frame made from?',
  lede: 'Stock arrives as plate, bar or sheet with a mill certificate. The alloy and its temper set what the shop can do to it and what the frame can carry.',
  drivers: [
    'Stiffness for the mass: the first natural frequency must clear the launcher’s limit.',
    'Strength where a fastener or a rail takes the launch load.',
    'Expansion: the frame must grow and shrink with what holds it and what it holds.',
  ],
  read: 'Stiffness for the mass is about 25 for every metal here, so a stiffer metal frame comes from its shape, not its alloy. In bending the measure is ∛E/ρ, where low density wins: aluminium beats titanium by about 40%.',
  columns: [
    { id: 'E', label: 'Stiffness', symbol: 'E', unit: 'GPa', kind: 'number' },
    { id: 'rho', label: 'Density', symbol: 'ρ', unit: 'g/cm³', kind: 'number', dp: 2 },
    { id: 'yield', label: 'Yield strength', symbol: 'σy', unit: 'MPa', kind: 'number' },
    { id: 'cte', label: 'Expansion', symbol: 'α', unit: 'µm/m·K', kind: 'number' },
  ],
  derived: [
    { id: 'specific', label: 'Stiffness for the mass', symbol: 'E/ρ', unit: 'GPa·cm³/g', dp: 1, needs: ['E', 'rho'], from: (v) => v.E / v.rho },
    { id: 'plate', label: 'The same, in bending', symbol: '∛E/ρ', unit: 'plate index', dp: 2, needs: ['E', 'rho'], from: (v) => Math.cbrt(v.E) / v.rho },
    { id: 'strength', label: 'Strength for the mass', symbol: 'σy/ρ', unit: 'MPa·cm³/g', dp: 0, needs: ['yield', 'rho'], from: (v) => v.yield / v.rho },
  ],
  options: [
    {
      id: 'al-6061-t6',
      name: 'Aluminium 6061-T6',
      values: { E: 68, rho: 2.7, yield: 270, cte: 23.2 },
      sources: ['al6061'],
      for: 'Cuts fast, welds, and comes as plate, bar, sheet and extrusion. The default for a first frame.',
      against: 'The lowest strength of the heat-treated picks here. A weld takes about 40% of it away nearby.',
      own: 'Plate or bar in the T6 or T651 temper, with its certificate. Standard carbide cutters.',
    },
    {
      id: 'al-7075-t73',
      name: 'Aluminium 7075-T73',
      values: { E: 71.7, rho: 2.81, yield: 435, cte: 23.6 },
      sources: ['al7075'],
      for: 'About 60% more yield strength than 6061-T6, at nearly the same weight and stiffness.',
      against: 'It forms poorly at room temperature. The stronger T6 temper can crack under stress where it corrodes, which is why T73 exists.',
      own: 'Plate in the T73 temper. Order the temper by name: T6 and T73 are different materials.',
    },
    {
      id: 'al-5052-h32',
      name: 'Aluminium 5052-H32',
      values: { E: 69.3, rho: 2.68, yield: 193, cte: 23.8 },
      sources: ['al5052'],
      for: 'The usual alloy for sheet metal work, and it resists corrosion well.',
      against: 'It cannot be heat treated. Its strength comes from cold work and is the lowest here.',
      own: 'Sheet in the H32 temper.',
    },
    {
      id: 'ti-6al-4v',
      name: 'Titanium Ti-6Al-4V',
      values: { E: 104, rho: 4.43, yield: 880, cte: 8.6 },
      sources: ['ti64', 'expansion'],
      note: 'The low end of the typical ranges for the alloy. The expansion is for titanium.',
      for: 'Twice the strength of 6061-T6 for the mass and about a third of its expansion. It conducts heat about twenty times worse than aluminium, which suits a mount that must not pass heat.',
      against: 'No stiffer for its mass than aluminium, and worse in bending. Slow to cut, because its low conductivity keeps the heat at the tool.',
      own: 'Annealed bar or plate. Plan for far more machining time than aluminium takes.',
    },
    {
      id: 'cfrp-laminate',
      name: 'Carbon fibre laminate',
      values: { E: 181, rho: 1.6, yield: null, cte: -0.8 },
      blank: { yield: 'It breaks without yielding.' },
      sources: ['specific', 'expansion', 'cfrp'],
      note: 'Along the fibres of a ply with 70% fibre, all laid one way.',
      for: 'Along the fibres it is over four times stiffer for its mass than any metal here, and it barely changes length with temperature.',
      against: 'Only along the fibres. A panel loaded in several directions needs plies at several angles and gives much of that back. Carbon against aluminium corrodes the aluminium.',
      own: 'Fibre and resin or prepreg, a mould, vacuum bagging and a cure. An insert wherever a fastener goes.',
    },
  ],
  pick: {
    option: 'al-6061-t6',
    why: 'A first frame is sized by stiffness, and every aluminium alloy has the same stiffness for its mass. So take the one that is easiest to cut and join. Move to 7075-T73 only for a part that strength sizes, such as a thin rail or a loaded lug.',
  },
  changes: [
    'A payload that must hold its alignment through each eclipse: choose for expansion, titanium or carbon fibre.',
    'A mount that must not pass heat: titanium.',
    'A large flat panel where mass is the limit: a carbon fibre laminate, with the layup and inserts that come with it.',
  ],
  watch: [
    'A CubeSat deployer accepts four aluminium alloys without a waiver: 7075, 6061, 5005 and 5052. The frame must expand as the deployer does, or it jams.',
    'A temper is part of the material. Heat from a weld or a hot cure can undo it.',
    'Carbon fibre bolted to aluminium makes a galvanic pair. Isolate the two.',
  ],
  cites: ['selection', 'cubesat'],
  concepts: ['stress-strain', 'beam-deflection', 'forced-resonance', 'strengthening', 'thermal-mismatch', 'corrosion'],
  references: [REFS.al6061, REFS.al7075, REFS.al5052, REFS.ti64, REFS.specific, REFS.selection, REFS.expansion, REFS.cfrp, REFS.cubesat],
};
