import { REFS } from './refs.js';

/** Structure, decision 3 of 4: how the pieces join, which joints open again, and how each is proved. */
export default {
  id: 'structure-joints',
  subsystem: 'structure',
  title: 'Joints',
  question: 'How do the pieces join?',
  lede: 'A frame in several pieces needs joints, and every joint adds mass, flexibility and something to inspect. Decide first which joints must open again.',
  drivers: [
    'Access: what must come apart for assembly, test and rework.',
    'Load path: the joint carries the launch load and sets the frame’s stiffness.',
    'Proof: how you show the joint is good without breaking it.',
  ],
  read: 'Ask of each joint: will it open again, what load crosses it, and how is it proved. A joint that inspection cannot prove has to be proved by controlling the process that made it.',
  columns: [
    { id: 'opens', label: 'Opens again', kind: 'text' },
    { id: 'proof', label: 'Proved by', kind: 'text' },
    { id: 'know', label: 'Know this', kind: 'text' },
  ],
  options: [
    {
      id: 'bolted',
      name: 'Bolted, with thread inserts',
      values: {
        opens: 'Yes',
        proof: 'Torque at assembly, and a locking feature on every fastener',
        know: 'A torque wrench sets preload to about ±35% dry and ±25% lubricated',
      },
      sources: ['bolted', 'insert', 'galling'],
      for: 'Comes apart as often as integration needs, and each fastener can be checked with a wrench.',
      against: 'Preload from torque scatters widely. A joint that slips under vibration loosens.',
      own: 'Taps, insert tooling, calibrated torque wrenches and controlled fastener lots.',
      links: [
        { to: ['machined'], kind: 'goes-with', why: 'Threads and insert holes are cut in the same setup as the part.' },
        { to: ['conversion-coat'], kind: 'goes-with', why: 'A conversion-coated face still conducts across the joint.' },
      ],
    },
    {
      id: 'one-piece',
      name: 'One piece, no joint',
      values: {
        opens: 'No',
        proof: 'Measuring the part',
        know: 'The stock must be as large as the whole piece',
      },
      sources: [],
      for: 'The stiffest and lightest answer: the joint is designed away.',
      against: 'Bigger stock, longer cuts, and no way in once it is closed.',
      own: 'A machine with the travel for the whole piece.',
      links: [
        { to: ['machined'], kind: 'goes-with', why: 'The joint is machined away.' },
        { to: ['printed-metal'], kind: 'goes-with', why: 'Printing can merge several parts into one.' },
      ],
    },
    {
      id: 'riveted',
      name: 'Riveted',
      values: {
        opens: 'No: each rivet is drilled out',
        proof: 'Looking at every formed tail',
        know: 'A rivet carries shear far better than tension',
      },
      sources: ['rivet'],
      for: 'Fast, light and proven for thin sheet: aircraft frames are held by solid rivets.',
      against: 'It is close to permanent. Opening the joint means drilling out every rivet.',
      own: 'Drill jigs, a rivet gun or squeezer, and a bucking bar.',
      links: [{ to: ['sheet-formed'], kind: 'goes-with', why: 'Rivets suit thin sheet.' }],
    },
    {
      id: 'bonded',
      name: 'Adhesive bonded',
      values: {
        opens: 'No',
        proof: 'Process control and test coupons: a bond cannot be fully tested without breaking it',
        know: 'A large bond area moves high loads between thin parts',
      },
      sources: ['adhesive'],
      for: 'Spreads load over an area with no holes, and joins thin parts and unlike materials.',
      against: 'Strength depends on surface preparation and cure, and neither leaves a visible trace.',
      own: 'A surface preparation line, a way to mix and dispense, fixtures, a cure oven, and coupons made with every batch.',
      links: [
        { to: ['cfrp-laminate'], kind: 'goes-with', why: 'No holes through the fibres, and inserts are bonded in.' },
        { to: ['anodise'], kind: 'goes-with', why: 'Anodised metal holds adhesive better than bare metal.' },
      ],
    },
    {
      id: 'welded',
      name: 'Welded',
      values: {
        opens: 'No',
        proof: 'Test welds pulled to failure, and inspection of each seam',
        know: '6061-T6 keeps about 60% of its strength beside a fusion weld unless it is heat treated again',
      },
      sources: ['al6061', 'fsw'],
      for: 'Permanent and sealed, which a tank needs. Friction stir welding stays below melting, so it avoids pores and solidification cracks.',
      against: 'Heat undoes the temper beside a fusion weld. Friction stir welding needs large forces, heavy clamping and a seam with a plain shape.',
      own: 'A welder and a qualified procedure, or a rigid stir welding machine with its tools. Fixtures either way.',
      // How this process is run, station by station (the DOME course).
      traveler: 'fsw-dome',
      links: [
        { to: ['al-6061-t6'], kind: 'goes-with', why: '6061 welds readily, at a cost in strength beside the weld.' },
        { to: ['cfrp-laminate'], kind: 'rules-out', why: 'A laminate does not weld.' },
      ],
    },
  ],
  pick: {
    option: 'bolted',
    why: 'A first build is opened many times: to fit boards, route harness and fix what a test finds. Bolt everything that may need to open, with an insert in every aluminium thread and a locking feature on every fastener. Design away the joints that never need to open.',
  },
  changes: [
    'A sealed volume, such as a tank: weld it.',
    'Thin sheet panels that stay closed: rivet them.',
    'A laminate, or a part too thin for threads: bond it, and make coupons with every batch.',
  ],
  watch: [
    'Aluminium threads strip and gall. Put a steel insert wherever a screw goes in more than once.',
    'Titanium threads gall too, and so does stainless steel. Lubricate or coat them.',
    'Torque is a poor measure of preload. Where preload matters, measure bolt stretch, which is good to about ±5%.',
    'An anodised face does not conduct. A joint that must ground the frame needs bare or conversion-coated contact.',
  ],
  cites: ['anodizing'],
  foundations: ['bolted-joints', 'fastener-loosening', 'stress-concentration', 'fatigue', 'strengthening'],
  references: [REFS.bolted, REFS.insert, REFS.galling, REFS.rivet, REFS.adhesive, REFS.al6061, REFS.fsw, REFS.anodizing],
};
