import { REFS } from './refs.js';

/** Structure, decision 4 of 4: the surface, chosen face by face for grounding, wear and temperature. */
export default {
  id: 'structure-finish',
  subsystem: 'structure',
  title: 'Finish',
  question: 'What goes on the surface?',
  lede: 'Bare aluminium marks, corrodes on the ground and can seize against its neighbour in vacuum. The finish also sets whether a joint conducts and how a face trades heat with space.',
  drivers: [
    'Grounding: which faces must conduct across a joint.',
    'Wear: which faces slide, such as the rails in a deployer.',
    'Temperature: how much sunlight a face absorbs and how well it radiates.',
  ],
  read: 'A finish is chosen face by face. Mark each face on the drawing: it conducts, it slides, it radiates, or none of these.',
  columns: [
    { id: 'layer', label: 'Layer', kind: 'text' },
    { id: 'conducts', label: 'Conducts', kind: 'text' },
    { id: 'know', label: 'Know this', kind: 'text' },
  ],
  options: [
    {
      id: 'bare',
      name: 'Bare machined aluminium',
      values: {
        layer: 'The natural oxide, 5 to 15 nm on an alloy',
        conducts: 'Yes',
        know: 'Polished aluminium has an emissivity near 0.04, so it sheds heat poorly',
      },
      sources: ['anodizing', 'emissivity'],
      for: 'No process and no change in size, and the face conducts.',
      against: 'It marks and corrodes in handling, and it radiates heat poorly.',
      own: 'Clean gloves and bagging.',
    },
    {
      id: 'conversion-coat',
      name: 'Chemical conversion coating',
      values: {
        layer: 'A thin chromate film, from a few minutes in a bath',
        conducts: 'Yes',
        know: 'The US standard is MIL-DTL-5541. The film is also a primer for paint and adhesive',
      },
      sources: ['chromate', 'anodizing'],
      for: 'Protects the surface and keeps it conductive, so it suits the faces that ground the frame.',
      against: 'It adds little wear resistance. The usual baths contain hexavalent chromium, which needs strict handling.',
      own: 'Tanks to clean, coat and rinse, with chemical handling and waste disposal.',
      links: [{ to: ['cfrp-laminate'], kind: 'rules-out', why: 'There is no metal surface to convert.' }],
    },
    {
      id: 'anodise',
      name: 'Sulfuric anodise, Type II',
      values: {
        layer: '1.8 to 25 µm of oxide',
        conducts: 'No',
        know: 'Anodised aluminium has an emissivity of 0.56 to 0.88, so it radiates well',
      },
      sources: ['anodizing', 'emissivity'],
      for: 'Resists corrosion and wear, takes dye, and holds paint and adhesive better than bare metal.',
      against: 'It insulates, so grounding faces must be masked. It changes every size it covers: half the layer grows outward, so a 20 µm coat adds 10 µm to each face.',
      own: 'An anodising line: tanks, a power supply, racking, masking and sealing.',
      links: [{ to: ['cfrp-laminate'], kind: 'rules-out', why: 'There is no aluminium surface to anodise.' }],
    },
    {
      id: 'hard-anodise',
      name: 'Hard anodise, Type III',
      values: {
        layer: 'Over 25 µm of oxide',
        conducts: 'No',
        know: 'Aluminium that touches a CubeSat deployer must be anodised, to stop cold welding',
      },
      sources: ['anodizing', 'cubesat'],
      for: 'A hard face for anything that slides.',
      against: 'The thickest layer moves sizes the most, and it needs a chilled tank and closer control.',
      own: 'The anodising line, with a refrigerated tank and a larger power supply.',
      links: [{ to: ['cfrp-laminate'], kind: 'rules-out', why: 'There is no aluminium surface to anodise.' }],
    },
    {
      id: 'paint',
      name: 'Thermal control paint',
      values: {
        layer: 'A paint film over a prepared surface',
        conducts: 'No',
        know: 'Coatings are the first and cheapest thermal control, and they age in orbit',
      },
      sources: ['thermalControl'],
      for: 'Sets how much sunlight a face absorbs and how well it radiates. Chosen with the Thermal subsystem.',
      against: 'It degrades in the space environment, and it is one more process to control.',
      own: 'A spray booth, surface preparation, a cure, and a way to measure film thickness.',
    },
  ],
  pick: {
    option: 'anodise',
    why: 'Anodise the frame for corrosion and handling, and mask the faces that must ground: those get a conversion coating, which conducts. Hard anodise the faces that slide. Leave the outward faces to the Thermal subsystem, which chooses paint or tape for temperature.',
  },
  changes: [
    'A face that radiates heat or sits in sunlight: the Thermal subsystem chooses its coating.',
    'A part that stays inside and grounds through every joint: conversion coat alone.',
    'A close fit: allow for the layer in the tolerance, or mask the fit.',
  ],
  watch: [
    'Anodise insulates. An unmasked joint leaves part of the frame ungrounded.',
    'The layer changes sizes. Put the finish and its thickness on the drawing before the fits are toleranced.',
    'An anodised coat can crack above about 80 °C, because the oxide expands less than the metal. It cracks but does not peel.',
    'Clean bare metal can cold weld to like metal in vacuum. Do not leave sliding faces bare.',
  ],
  cites: ['coldWeld'],
  concepts: ['corrosion', 'thermal-radiation', 'spacecraft-thermal-balance', 'tolerances-fits', 'thermal-mismatch'],
  references: [REFS.anodizing, REFS.chromate, REFS.emissivity, REFS.cubesat, REFS.coldWeld, REFS.thermalControl],
};
