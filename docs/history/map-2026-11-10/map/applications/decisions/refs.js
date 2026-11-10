/**
 * Sources the decisions cite, each opened and read on its `checked` date. A decision lists the ones
 * it uses; an option names the ones its figures come from. `why` is our own one-line reason.
 * Nothing is copied from a source: the cards are written fresh and the figures are facts it states.
 */
const wiki = (page) => `https://en.wikipedia.org/wiki/${page}`;
const CHECKED = '2026-11-09';

export const REFS = {
  al6061: { id: 'al6061', title: 'Wikipedia, 6061 aluminium alloy', url: wiki('6061_aluminium_alloy'), why: 'Properties by temper, and what a weld does to T6.', checked: CHECKED },
  al7075: { id: 'al7075', title: 'Wikipedia, 7075 aluminium alloy', url: wiki('7075_aluminium_alloy'), why: 'Strength by temper, and why T73 gives up strength to resist cracking.', checked: CHECKED },
  al5052: { id: 'al5052', title: 'Wikipedia, 5052 aluminium alloy', url: wiki('5052_aluminium_alloy'), why: 'Properties of the sheet alloy and what it is used for.', checked: CHECKED },
  ti64: { id: 'ti64', title: 'Wikipedia, Ti-6Al-4V', url: wiki('Ti-6Al-4V'), why: 'Property ranges, and why it is slow to machine.', checked: CHECKED },
  specific: { id: 'specific', title: 'Wikipedia, Specific modulus', url: wiki('Specific_modulus'), why: 'Stiffness for the mass, with a table, and why bending changes the measure.', checked: CHECKED },
  selection: { id: 'selection', title: 'Wikipedia, Material selection', url: wiki('Material_selection'), why: 'The plate index and how a performance index is derived.', checked: CHECKED },
  expansion: { id: 'expansion', title: 'Wikipedia, Thermal expansion', url: wiki('Thermal_expansion'), why: 'A table of expansion coefficients for metals and carbon fibre.', checked: CHECKED },
  cfrp: { id: 'cfrp', title: 'Wikipedia, Carbon fiber reinforced polymer', url: wiki('Carbon_fiber_reinforced_polymer'), why: 'How a laminate is laid up, and the galvanic pair it makes with aluminium.', checked: CHECKED },
  cubesat: { id: 'cubesat', title: 'Wikipedia, CubeSat', url: wiki('CubeSat'), why: 'The structure rules: allowed alloys and anodised contact faces.', checked: CHECKED },
  milling: { id: 'milling', title: 'Wikipedia, Milling (machining)', url: wiki('Milling_(machining)'), why: 'What a mill does and the marks its cutters leave.', checked: CHECKED },
  bending: { id: 'bending', title: 'Wikipedia, Bending (metalworking)', url: wiki('Bending_(metalworking)'), why: 'Press brake bending, springback and the accuracy of a bend.', checked: CHECKED },
  slm: { id: 'slm', title: 'Wikipedia, Selective laser melting', url: wiki('Selective_laser_melting'), why: 'How a powder bed machine builds a part, its defects and what follows the build.', checked: CHECKED },
  mitAm: { id: 'mitAm', title: 'MIT 2.008, Lecture 23: Additive manufacturing', url: 'https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2025/resources/mit2_008_s25_lec23_pdf/', why: 'The workflow every printing process shares, and the safety and defect limits of metal powder beds.', checked: CHECKED },
  alsi10mg: { id: 'alsi10mg', title: 'Wikipedia, AlSi10Mg', url: wiki('AlSi10Mg'), why: 'The aluminium alloy that powder bed machines run.', checked: CHECKED },
  bolted: { id: 'bolted', title: 'Wikipedia, Bolted joint', url: wiki('Bolted_joint'), why: 'Preload, and a table of how well each tightening method sets it.', checked: CHECKED },
  insert: { id: 'insert', title: 'Wikipedia, Threaded insert', url: wiki('Threaded_insert'), why: 'Why a soft material gets a steel thread.', checked: CHECKED },
  galling: { id: 'galling', title: 'Wikipedia, Galling', url: wiki('Galling'), why: 'Which metals seize in a thread and how to prevent it.', checked: CHECKED },
  rivet: { id: 'rivet', title: 'Wikipedia, Rivet', url: wiki('Rivet'), why: 'How a rivet is set and which loads it carries.', checked: CHECKED },
  adhesive: { id: 'adhesive', title: 'Wikipedia, Adhesive bonding', url: wiki('Adhesive_bonding'), why: 'What bonding does well, and why a bond cannot be fully tested without breaking it.', checked: CHECKED },
  fsw: { id: 'fsw', title: 'Wikipedia, Friction stir welding', url: wiki('Friction_stir_welding'), why: 'A weld made below melting: what it avoids and what it demands of the machine.', checked: CHECKED },
  anodizing: { id: 'anodizing', title: 'Wikipedia, Anodizing', url: wiki('Anodizing'), why: 'The anodising types, their thickness, and how the layer changes size and conduction.', checked: CHECKED },
  chromate: { id: 'chromate', title: 'Wikipedia, Chromate conversion coating', url: wiki('Chromate_conversion_coating'), why: 'The thin coating that protects aluminium and still conducts.', checked: CHECKED },
  emissivity: { id: 'emissivity', title: 'Wikipedia, Emissivity', url: wiki('Emissivity'), why: 'A table of emissivities, bare and anodised aluminium among them.', checked: CHECKED },
  coldWeld: { id: 'coldWeld', title: 'Wikipedia, Cold welding', url: wiki('Cold_welding'), why: 'Why clean like metals stick in vacuum.', checked: CHECKED },
  thermalControl: { id: 'thermalControl', title: 'Wikipedia, Spacecraft thermal control', url: wiki('Spacecraft_thermal_control'), why: 'Coatings as the first thermal control, and how they age.', checked: CHECKED },
};
