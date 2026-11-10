import { REFS } from './refs.js';

/** Structure, decision 2 of 4: the route from stock to a frame, and what the shop must own to run it. */
export default {
  id: 'structure-process',
  subsystem: 'structure',
  title: 'Process',
  question: 'How is the frame made?',
  lede: 'The shop turns stock into a frame. Each route needs its own machines, tooling and inspection, and each limits the shapes and alloys you can use.',
  drivers: [
    'Quantity: one frame, or a few.',
    'Interfaces: rails, mating faces and bolt patterns must land on size.',
    'Shape: pockets and ribs, or channels and forms no cutter can reach.',
  ],
  read: 'Compare what each route leaves you to do. Machine time is the visible cost. The steps after it, and the kit to check the result, are the rest.',
  columns: [
    { id: 'start', label: 'Starts from', kind: 'text' },
    { id: 'does', label: 'Does well', kind: 'text' },
    { id: 'after', label: 'Leaves you to do', kind: 'text' },
  ],
  options: [
    {
      id: 'machined',
      name: 'Machine from plate',
      values: {
        start: 'Plate or bar',
        does: 'Any wrought alloy, with the interfaces cut in the same setup as the pockets',
        after: 'Deburr, clean and measure. Most of the stock leaves as chips',
      },
      sources: ['milling'],
      for: 'One machine and its tooling make the whole frame, in the alloy and temper you bought.',
      against: 'The cutter must reach every surface, and thin walls move under it.',
      own: 'A mill, workholding, cutters and the software to program it. Calipers, micrometers and a height gauge to check the result.',
      links: [
        { to: ['al-6061-t6', 'al-7075-t73'], kind: 'goes-with', why: 'Plate in either alloy is cut to shape and keeps its temper.' },
        { to: ['cfrp-laminate'], kind: 'rules-out', why: 'A laminate is laid up to shape. Cutting only trims it.' },
      ],
    },
    {
      id: 'sheet-formed',
      name: 'Cut and bend sheet',
      values: {
        start: 'Sheet',
        does: 'Covers, panels and brackets, fast and light. Air bending holds an angle to about ±0.5°',
        after: 'Allow for springback: the sheet is bent past the angle. Then join the pieces',
      },
      sources: ['bending', 'al5052', 'al7075'],
      for: 'The fastest route from stock to a light panel or bracket.',
      against: 'A bent sheet is thin. Its stiffness comes from folds and from the joints you add.',
      own: 'A shear, laser or waterjet to cut. A press brake and its dies to bend.',
      links: [
        { to: ['al-5052-h32'], kind: 'goes-with', why: '5052 is the usual alloy for sheet metal work.' },
        { to: ['al-7075-t73'], kind: 'rules-out', why: '7075 forms poorly at room temperature.' },
        { to: ['cfrp-laminate'], kind: 'rules-out', why: 'A cured laminate does not bend to shape.' },
      ],
    },
    {
      id: 'printed-metal',
      name: 'Print in metal',
      values: {
        start: 'Alloy powder',
        does: 'Thin walls, hidden channels and shapes no cutter can reach, in lots of one. Layers are 20 to 100 µm',
        after: 'Remove supports, heat treat, machine every interface, then show the inside is sound',
      },
      sources: ['slm', 'mitAm', 'alsi10mg'],
      note: 'Laser powder bed fusion, also called selective laser melting.',
      for: 'Several parts become one, and the shape is nearly free.',
      against: 'Unmelted gaps, pores and cracks can hide inside. Grains grow along the build direction, so strength depends on direction.',
      own: 'The printer and its inert gas, with oxygen held below 1000 ppm. Safe powder handling, a furnace, a way to cut parts off the plate, and a mill for the interfaces.',
      links: [
        { to: ['ti-6al-4v'], kind: 'goes-with', why: 'Titanium is one of the powders these machines run.' },
        { to: ['al-6061-t6', 'al-7075-t73', 'al-5052-h32'], kind: 'rules-out', why: 'A temper comes from working and heat treating wrought stock. Printing melts powder, and powder bed machines run their own aluminium alloy, AlSi10Mg.' },
        { to: ['cfrp-laminate'], kind: 'rules-out', why: 'A laminate is not printed from metal powder.' },
      ],
    },
    {
      id: 'laid-up',
      name: 'Lay up a laminate',
      values: {
        start: 'Fibre and resin, or prepreg',
        does: 'Stiff light panels, with the fibres pointed where the load goes',
        after: 'Cure, trim, and bond in an insert for every fastener',
      },
      sources: ['cfrp'],
      for: 'The lightest stiff panel.',
      against: 'The mould comes first. Every joint is a bonded insert, and a cured laminate cannot be reworked as metal can.',
      own: 'A mould, vacuum bagging, an oven or autoclave, and dust control for trimming.',
      links: [
        { to: ['cfrp-laminate'], kind: 'goes-with', why: 'The layup makes the laminate.' },
        { to: ['al-6061-t6', 'al-7075-t73', 'al-5052-h32', 'ti-6al-4v'], kind: 'rules-out', why: 'Metal stock is cut, bent or printed. It is not laid up.' },
      ],
    },
  ],
  pick: {
    option: 'machined',
    why: 'At one frame, the route with the least tooling and the fewest steps after it wins. Machining cuts the interfaces in the same setup as the rest, in the alloy you chose, and the shop needs the mill for every other route anyway. Print the frame in plastic first to check fit and access: that copy does not fly.',
  },
  changes: [
    'Internal channels, or several parts that could be one: print it, and accept the steps after the build.',
    'Flat covers and plain brackets: cut and bend sheet.',
    'Many identical frames: tooling for forming or casting starts to pay, because its cost is shared across the lot.',
  ],
  watch: [
    'A printed part still needs a mill. Faces that mate or seal are machined after the build.',
    'A printed part can look sound and hide pores. Plan how the inside is checked before you choose the route.',
    'Bending works the metal. A temper that bends well and a temper that is strong are often different.',
    'Fixturing is part of the design. A part that cannot be held cannot be cut.',
  ],
  concepts: ['design-for-manufacture', 'tolerances-fits', 'gdt', 'process-variation', 'design-process'],
  references: [REFS.milling, REFS.bending, REFS.slm, REFS.mitAm, REFS.alsi10mg, REFS.al5052, REFS.al7075, REFS.cfrp],
};
