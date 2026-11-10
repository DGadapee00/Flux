/**
 * A traveler: one part followed through the shop, station by station. This one is a friction stir
 * welded propellant tank dome, the development article NASA built at Marshall.
 *
 * Every station gives the same things: what happens, what the engineer decides, what goes wrong
 * (with why, and how it is found), the paper it produces, what to ask on the floor, and the map
 * concepts behind it. `numbers` names a block of the dome's own numbers (dome-numbers.js), which
 * follow the part from the requirement to the proof test. `part` is what the drawing lights up.
 *
 * Every figure names a source in `references`, each opened and read on its `checked` date. The
 * text is ours: nothing is copied. Standards that are sold, such as AWS D17.3, are named and not
 * reproduced.
 */
const CHECKED = '2026-11-10';
const ntrs = (id) => `https://ntrs.nasa.gov/citations/${id}`;
const std = (n) => `https://standards.nasa.gov/standard/NASA/NASA-STD-${n}`;
const wiki = (page) => `https://en.wikipedia.org/wiki/${page}`;

const REFERENCES = [
  { id: 'domes', title: 'NASA Marshall, Manufacturing of 5.5 Meter Diameter Cryogenic Fuel Tank Domes for the NASA Ares I Rocket (2012)', url: ntrs('20120016453'), why: 'The part this traveler follows: eight gores, a ring and a fitting in 2195, and how it was welded.', checked: CHECKED },
  { id: 'msfcDecade', title: 'NASA Marshall, A Decade of Friction Stir Welding R&D at NASA’s Marshall Space Flight Center (2006)', url: ntrs('20080009619'), why: 'How the process works, how it was qualified for the Shuttle tank, the self-reacting tool, and which inspections suit it.', checked: CHECKED },
  { id: 'fsw2195', title: 'Lockheed Martin Michoud for NASA, Mechanical Properties of Friction Stir Welds in Al 2195-T8 (1999)', url: ntrs('19990064489'), why: 'Measured strength of the weld warm and cold, against a fusion weld, and what each repair kept of it.', checked: CHECKED },
  { id: 'plug', title: 'NASA Marshall, Friction Pull Plug Welding in Aluminum Alloys (2012)', url: ntrs('20120014529'), why: 'How the hole a stir weld leaves is closed, and the same weld used as a repair.', checked: CHECKED },
  { id: 'std5006', title: 'NASA-STD-5006A, General Welding Requirements for Aerospace Materials', url: std('5006'), why: 'Weld classes, how a procedure is qualified, what a departure triggers, repair limits and the records to keep.', checked: CHECKED },
  { id: 'std5001', title: 'NASA-STD-5001B, Structural Design and Test Factors of Safety for Spaceflight Hardware', url: std('5001'), why: 'The factors on strength, the proof factor for a propellant tank, and what a proof test is for.', checked: CHECKED },
  { id: 'std5009', title: 'NASA-STD-5009C, Nondestructive Evaluation Requirements for Fracture Critical Metallic Components', url: std('5009'), why: 'The crack size each standard inspection is counted on to find.', checked: CHECKED },
  { id: 'std5019', title: 'NASA-STD-5019A, Fracture Control Requirements for Spaceflight Hardware', url: std('5019'), why: 'Proof testing as a flaw screen, and the inspection asked for after proof.', checked: CHECKED },
  { id: 'twi', title: 'TWI, Friction stir welding', url: 'https://www.twi-global.com/technical-knowledge/job-knowledge/friction-stir-welding-147', why: 'The process from the institute that invented it: the weld’s zones, and which alloys it opened up.', checked: CHECKED },
  { id: 'fswWiki', title: 'Wikipedia, Friction stir welding', url: wiki('Friction_stir_welding'), why: 'The defects of a weld run too cold or too hot, the processing window, and the limits of the process.', checked: '2026-11-09' },
  { id: 'al2195', title: 'Wikipedia, 2195 aluminium alloy', url: wiki('2195_aluminium_alloy'), why: 'The alloy against the 2219 it replaced.', checked: CHECKED },
  { id: 'et', title: 'Wikipedia, Space Shuttle external tank', url: wiki('Space_Shuttle_external_tank'), why: 'A flown hydrogen tank: its domes, its alloy and its operating pressure.', checked: CHECKED },
  { id: 'vessel', title: 'Wikipedia, Pressure vessel', url: wiki('Pressure_vessel'), why: 'Thin-wall stress in a cylinder and a sphere.', checked: CHECKED },
];

export default {
  id: 'fsw-dome',
  title: 'A stir-welded tank dome',
  process: 'Friction stir welding',
  part: 'A 5.5 m propellant tank dome',
  lede: 'Follow one part through the shop. This dome closes a 5.5 m liquid hydrogen tank: eight gore panels, a ring and a fitting, joined without melting the metal.',
  why: 'NASA built this dome at Marshall as a development article for the Ares I upper stage, and reports it as the first dome welded entirely by friction stir welding. Its parts are aluminium-lithium alloy 2195.',
  cites: ['domes'],
  stations: [
    {
      id: 'requirement',
      title: 'Requirement',
      part: 'all',
      numbers: 'requirement',
      what: 'The dome closes one end of a propellant tank. The requirement says what it holds, at what pressure and temperature, and how each demand will be shown.',
      decides: [
        'The design pressure: the highest the tank can see, with its failure cases counted.',
        'The factors. NASA asks for 1.4 on ultimate strength, and a proof test at 1.05 times design pressure for a propellant tank.',
        'How each requirement is verified: by analysis, by test or by inspection.',
        'The weld class. A weld whose single failure loses the vehicle is Class A.',
      ],
      wrong: [
        { what: 'A requirement nobody can test', why: 'It was written as a wish, such as “shall not leak”, with no rate, pressure or method.', found: 'At the verification plan, when no test or inspection can be named against it.' },
        { what: 'A pressure that leaves out a failure', why: 'The design pressure took the normal case and not the stuck regulator or the warm tank.', found: 'In review of the pressure system, before the wall is sized.' },
      ],
      paper: [
        { name: 'Requirements', what: 'Each with a number and a way to verify it.' },
        { name: 'Verification plan', what: 'Which test, analysis or inspection closes each requirement.' },
      ],
      ask: ['Where does the design pressure come from, and which failure sets it?', 'Which welds on this part are Class A?'],
      concepts: ['pressure-vessels', 'design-process', 'design-verification'],
      sources: ['std5001', 'std5006', 'et', 'vessel'],
    },
    {
      id: 'material',
      title: 'Material and process',
      part: 'gores',
      what: 'The dome is aluminium-lithium alloy 2195, joined by friction stir welding. The alloy and the process are chosen together, because the alloy sets what a weld can keep.',
      decides: [
        'The alloy. 2195 is about 30% stronger and 5% less dense than the 2219 it replaced, and it resists fracture at cryogenic temperature.',
        'The process. Stir welding joins the metal without melting it, so it avoids the cracks and pores that come with solidifying.',
        'What the weld will be worth. In 2195 plate a stir weld averaged 58.7 ksi, against 44 ksi for a fusion weld.',
        'Traceability: every plate keeps its lot number from the mill to the finished dome.',
      ],
      wrong: [
        { what: 'A weld far weaker than the plate', why: 'Heat undoes the precipitates that give the alloy its strength. Melting does it most.', found: 'In the tensile tests that qualify the weld procedure.' },
        { what: 'Plate from the wrong lot or temper', why: 'The stock was not checked against its certificate when it arrived.', found: 'At receiving inspection, or much later as low test results.' },
      ],
      paper: [
        { name: 'Material certificate', what: 'The mill’s record of alloy, temper, lot and test results.' },
        { name: 'Lot traceability', what: 'The record that ties each gore to the plate it was cut from.' },
      ],
      ask: ['Why this alloy and not 2219, and what did the change cost in weldability?', 'How is a plate’s lot number carried onto the part?'],
      concepts: ['strengthening', 'phase-diagrams', 'fracture-toughness'],
      sources: ['al2195', 'msfcDecade', 'fsw2195', 'twi'],
    },
    {
      id: 'panels',
      title: 'Gore panels',
      part: 'lands',
      numbers: 'lands',
      what: 'Eight gore panels are formed to the dome’s curve and machined. Each keeps a thicker band along its edges, the weld land, because the weld is weaker than the plate.',
      decides: [
        'The land thickness, from the load the seam carries and the strength the weld keeps.',
        'Which check governs. This weld yields at 36.6 ksi and breaks at 58.7 ksi, so not yielding at proof sets the land before strength at 1.4 times pressure does.',
        'Gores or one piece. NASA has also spun a dome from a single blank and welded it only to its ring.',
        'How the curve is measured. NASA used photogrammetry on this dome.',
      ],
      wrong: [
        { what: 'A land too thin', why: 'It was sized on the plate’s strength, not the weld’s.', found: 'In the stress analysis, or at proof if it was missed.' },
        { what: 'Gores that do not meet', why: 'Springback and machining stresses moved the edges.', found: 'At fit-up, as a gap or a step between panels.' },
      ],
      paper: [
        { name: 'Drawing', what: 'The land’s thickness and width, and the class of each weld.' },
        { name: 'In-process inspection record', what: 'The measured thickness and contour of each gore.' },
      ],
      ask: ['How thick is the land against the skin, and which check set it?', 'How is the contour of a formed gore measured?'],
      concepts: ['pressure-vessels', 'stress-on-a-section', 'tolerances-fits', 'design-for-manufacture'],
      sources: ['domes', 'fsw2195', 'std5001', 'vessel'],
    },
    {
      id: 'fitup',
      title: 'Fit-up and fixturing',
      part: 'seams',
      what: 'The gores are brought edge to edge and held. A stir weld pushes hard on the joint, so something must hold the edges together and take that force.',
      decides: [
        'Conventional or self-reacting. A conventional tool pushes against an anvil behind the joint. A self-reacting tool pinches the joint between two shoulders and needs no anvil.',
        'The gap and mismatch allowed between edges, and how they are measured before the weld.',
        'Cleaning: what the procedure asks for at the joint.',
        'Tooling or none. NASA welded parts of this dome with no fixture, using the self-reacting tool.',
      ],
      wrong: [
        { what: 'Mismatch and peaking', why: 'The edges sit at different heights, or meet at an angle. Each bends the joint under load, and the two add.', found: 'With a template after welding. One may be traded against the other only by analysis.' },
        { what: 'A joint that opens during the weld', why: 'The clamps did not hold against the tool’s force.', found: 'As a change in the force record, and as voids at inspection.' },
      ],
      paper: [
        { name: 'Setup sheet', what: 'The fixture, the clamps, and the gap and mismatch measured before welding.' },
        { name: 'Readiness check', what: 'The record that the machine was checked immediately before the production weld.' },
      ],
      ask: ['Is this weld made against an anvil or with a self-reacting tool, and why?', 'What gap and mismatch were measured before the weld started?'],
      concepts: ['static-equilibrium', 'constraint-design', 'tolerance-stackup'],
      sources: ['std5006', 'msfcDecade', 'domes', 'fswWiki'],
    },
    {
      id: 'schedule',
      title: 'Weld schedule',
      part: 'tool',
      what: 'The weld schedule is the set of machine settings. It is found on test panels, proved by breaking them, and then frozen in a procedure.',
      decides: [
        'Three settings: how fast the tool turns, how fast it travels, and how deep it plunges.',
        'Where the window is. Turning faster or travelling slower makes a hotter weld. Too cold leaves voids. Too hot weakens the weld.',
        'The pin tool: its shape, its length against the land, and its service life, all written into the procedure.',
        'The range allowed on each setting. Test welds at the coldest and the hottest end of the range must both pass.',
        'How many test welds. NASA sizes the population so that, with 95% confidence, 90% of welds meet the design strength.',
      ],
      wrong: [
        { what: 'A tunnel void along the weld', why: 'The weld ran too cold: the tool turned too slowly or travelled too fast for the metal to flow.', found: 'By ultrasound or X-ray, and in cut sections of test welds.' },
        { what: 'An unwelded root', why: 'The pin was too short for the land, or the plunge too shallow.', found: 'By dye penetrant on the root side. NASA’s finding was that prevention lies in process control.' },
        { what: 'A weak bond that looks whole', why: 'Low heat let the two sides touch without mixing.', found: 'Poorly. It is very hard to find by inspection, so the procedure has to prevent it.' },
      ],
      paper: [
        { name: 'Welding procedure specification (WPS)', what: 'The settings, tool, joint and cleaning for one weld. The current copy stays at the welding station.' },
        { name: 'Procedure qualification record (PQR)', what: 'The test welds made with those settings, and the test results that proved them.' },
      ],
      ask: ['Which settings are essential variables in this procedure, and what range is each allowed?', 'How many test panels qualified it, and how were they tested?'],
      concepts: ['dry-friction', 'transient-conduction', 'process-variation', 'confidence-intervals'],
      sources: ['msfcDecade', 'fsw2195', 'std5006', 'fswWiki'],
    },
    {
      id: 'weld',
      title: 'The weld',
      part: 'seams',
      what: 'The tool plunges, runs the seam and comes out. The machine holds the settings and records them. The engineer watches for the record leaving its range.',
      decides: [
        'Start and stop: where the tool goes in and where it comes out. Both ends differ from the steady weld.',
        'How the exit hole is closed. NASA closes the hole a self-reacting weld leaves with a friction pull plug weld.',
        'Changing thickness. A retractable pin lets one weld run through a taper, such as 0.320 to 0.650 inch.',
        'What stops a weld: which reading out of range ends the run.',
      ],
      wrong: [
        { what: 'A setting drifts out of its range', why: 'Tool wear, a fixture that gives, or a change in the plate.', found: 'In the weld record. The part is held for review, and the cause is found before the next weld.' },
        { what: 'The exit hole', why: 'The tool leaves a hole where it withdraws.', found: 'It is planned for: run off the part, retract the pin, or plug the hole.' },
        { what: 'A worn pin tool', why: 'It ran past the life it was shown to have.', found: 'In the tool log. A tool at its life is marked and taken out of service.' },
      ],
      paper: [
        { name: 'Weld record', what: 'The settings the machine held along the seam, certified to be within the procedure.' },
        { name: 'Tool log', what: 'Each pin tool’s use against its demonstrated life.' },
      ],
      ask: ['Which reading would make you stop this weld?', 'Where does the tool come out, and how is that hole closed?'],
      concepts: ['dry-friction', 'work-energy', 'process-variation'],
      sources: ['std5006', 'msfcDecade', 'plug', 'fswWiki'],
    },
    {
      id: 'inspection',
      title: 'Inspection',
      part: 'seams',
      numbers: 'flaws',
      what: 'Every Class A weld is looked at, measured, and inspected on its surface and through its volume. Each method finds some flaws and misses others.',
      decides: [
        'Which methods. A Class A weld needs visual, dimensional, surface and volumetric inspection.',
        'Which flaw each is for. Stir weld flaws are mostly flat and thin, so NASA moved to phased array ultrasound for flaws inside and eddy current arrays at the surface.',
        'What X-ray is still for: tunnel voids, and gaps that go through the thickness.',
        'The crack size each method is counted on to find, 90% of the time with 95% confidence.',
      ],
      wrong: [
        { what: 'A root flaw that penetrant cannot see', why: 'The root is pressed shut, so the dye does not enter.', found: 'By eddy current or ultrasound, and by controlling pin depth in the first place.' },
        { what: 'An inspection that was never proved', why: 'The method was assumed to find the flaw size the analysis relies on.', found: 'By qualifying the method before the first production weld, and keeping the proof.' },
        { what: 'Smeared metal hiding a crack', why: 'Machining or grinding closed the surface over it.', found: 'By etching before penetrant is applied.' },
      ],
      paper: [
        { name: 'Inspection report', what: 'The method, the coverage, what was found and where, signed by a certified inspector.' },
        { name: 'Proof of capability', what: 'The record that the method finds the flaw size it is relied on for.' },
      ],
      ask: ['Which flaw is each inspection here for, and which flaw does none of them find well?', 'What crack size does the analysis assume the inspection finds?'],
      concepts: ['fracture-toughness', 'stress-concentration', 'mechanical-waves', 'sampling-distributions'],
      sources: ['std5006', 'std5009', 'msfcDecade'],
    },
    {
      id: 'nonconformance',
      title: 'Nonconformance',
      part: 'seams',
      numbers: 'repairs',
      what: 'An inspection finds something outside the drawing or the procedure. The part stops, and a review board decides: use as is, repair, or scrap.',
      decides: [
        'The disposition, with the analysis or test that supports it.',
        'The repair method. In NASA’s tests a friction plug weld kept nearly all of the weld’s strength, and a fusion weld repair about two thirds.',
        'The root cause, and the corrective action before the next weld. Both are separate from fixing this part.',
        'How the repair is inspected: by the same methods as the original weld.',
      ],
      wrong: [
        { what: 'A repair that makes it worse', why: 'A fusion repair melts metal the stir weld had kept solid. It left the highest strain and the lowest strength.', found: 'In test panels repaired the same way, before the method is allowed on hardware.' },
        { what: 'A third attempt at one spot', why: 'Each repair reheats the metal around it.', found: 'In the repair record. No more than 2 attempts are allowed without the board.' },
        { what: 'A fix with no cause', why: 'The part was repaired and the process was left as it was.', found: 'When the same flaw returns on the next part.' },
      ],
      paper: [
        { name: 'Nonconformance report', what: 'What was found, where, and against which requirement.' },
        { name: 'Review board disposition', what: 'The decision, its basis and who approved it. Every stir weld repair and every plug repair needs one.' },
        { name: 'Repair record', what: 'The place, the flaw and the procedure, kept permanently.' },
      ],
      ask: ['What are the options for this flaw, and what does each cost in strength?', 'What changed in the process after the last nonconformance like this one?'],
      concepts: ['fracture-toughness', 'fatigue', 'strengthening', 'design-verification'],
      sources: ['std5006', 'fsw2195'],
    },
    {
      id: 'proof',
      title: 'Proof and leak test',
      part: 'all',
      numbers: 'proof',
      what: 'The finished tank is pressurised above its design pressure, then checked for leaks. Every propellant tank is proof tested.',
      decides: [
        'The proof pressure: 1.05 times design pressure for a propellant tank, and below yield.',
        'What the test is for. It screens workmanship and shows strength. To screen flaws, its factor has to come from fracture mechanics.',
        'Warm or cold. This weld is 1.6 times stronger at liquid hydrogen temperature, so a room temperature test is harder on it, and the level may be adjusted for the difference.',
        'What is inspected after proof. NASA asks for surface and volumetric inspection of the welds after proof, on the first flight article at least.',
      ],
      wrong: [
        { what: 'A test that cannot fail', why: 'The proof level shows nothing the inspections had not.', found: 'By asking what flaw would have failed at proof, and whether a smaller one can grow to failure in service.' },
        { what: 'Yielding at proof', why: 'The land was sized on ultimate strength alone.', found: 'As growth that stays after the pressure is released.' },
        { what: 'A departure from the test procedure', why: 'A gauge, a ramp or a hold was not as planned.', found: 'It is written up as a nonconformance, like a flaw in the part.' },
      ],
      paper: [
        { name: 'Proof test report', what: 'The pressure, the hold, the temperature, the measured growth and the result.' },
        { name: 'Leak test report', what: 'The method, the rate measured and the limit.' },
        { name: 'Post-proof inspection report', what: 'The welds inspected again after the test.' },
      ],
      ask: ['What would this proof test have failed that inspection would have passed?', 'Is the proof level adjusted for testing warm, and by how much?'],
      concepts: ['pressure-vessels', 'fracture-toughness', 'stress-strain', 'design-verification'],
      sources: ['std5001', 'std5019', 'fsw2195'],
    },
    {
      id: 'acceptance',
      title: 'Acceptance',
      part: 'all',
      what: 'Quality reviews the records before the dome moves on. The question is whether every record exists, agrees with the others, and is closed.',
      decides: [
        'Whether each weld is certified as made within its procedure.',
        'Whether every nonconformance is closed, with its disposition and its repair inspected.',
        'Whether the records trace from the dome back to each plate, tool and procedure.',
        'What the next shop needs to know: the sizes as built, and the repairs and their places.',
      ],
      wrong: [
        { what: 'A break in traceability', why: 'A lot number or a tool was not recorded at the station.', found: 'At the records review, when a weld cannot be tied to its plate or its procedure.' },
        { what: 'An open nonconformance', why: 'The repair was done and the paper was not.', found: 'At buy-off. The part does not move until it is closed.' },
        { what: 'Repairs nobody is counting', why: 'Each one was closed on its own.', found: 'In the running audit of repairs against the length welded, which every shop is asked to keep.' },
      ],
      paper: [
        { name: 'Data package', what: 'Certificates, procedures, weld records, inspection and test reports, and nonconformances.' },
        { name: 'Weld quality audit', what: 'Repairs by place, type and length, against the length of weld made.' },
      ],
      ask: ['Can you trace this weld to its plate lot, its tool and its procedure?', 'How much repair per length of weld is this shop running?'],
      concepts: ['process-variation', 'design-verification'],
      sources: ['std5006'],
    },
    {
      id: 'design',
      title: 'Design for it',
      part: 'lands',
      what: 'The process sets rules on the part. A dome that welds well was drawn that way, with the welding engineer on the design team.',
      decides: [
        'Seam shapes the tool can follow: straight or a steady curve, with room for the tool and the clamps.',
        'The lands: their thickness and width, and how the land blends into the thinner skin.',
        'Where each weld starts and stops, and what closes the exit.',
        'What the drawing says: the weld class, the procedure, and the inspection each seam gets.',
        'How few welds. Fewer panels, or a spun dome, put less weld in the part.',
      ],
      wrong: [
        { what: 'A seam the tool cannot reach', why: 'The joint was drawn before the tool and the fixture were.', found: 'At the first tooling review, or on the shop floor.' },
        { what: 'Thickness that changes along a seam', why: 'A fixed pin suits one thickness.', found: 'When the schedule cannot be qualified. A retractable pin is one answer.' },
        { what: 'A land that ends in a sharp step', why: 'Stress concentrates where the thick land meets the thin skin.', found: 'In the stress analysis, or as a crack starting there.' },
      ],
      paper: [
        { name: 'Drawing', what: 'Seams, lands, weld class, procedure and inspection callouts.' },
        { name: 'Design review record', what: 'What welding, tooling and inspection asked for, and what changed.' },
      ],
      ask: ['What would the welding engineer change about this drawing?', 'Which seam is hardest to reach, clamp or inspect?'],
      concepts: ['design-for-manufacture', 'stress-concentration', 'gdt', 'pressure-vessels'],
      sources: ['msfcDecade', 'fswWiki', 'std5006', 'domes'],
    },
  ],
  cases: [
    {
      id: 'void',
      station: 'inspection',
      title: 'A void along a gore seam',
      situation: 'Phased array ultrasound on a gore seam shows one continuous indication 200 mm long, below the surface, to one side of the weld centre.',
      evidence: [
        'The weld record shows travel speed at the top of its allowed range for that stretch.',
        'The pin tool is near the end of its demonstrated life.',
        'Penetrant on both faces shows nothing.',
        'The seam before it, made the same day, is clean.',
      ],
      task: 'Say what the flaw most likely is, and why. Say what else you would look at before deciding. Then propose a disposition, and what must happen before the next weld.',
      checklist: [
        'The flaw is tied to the evidence, not guessed.',
        'More evidence is asked for before the decision, and each item could change it.',
        'The disposition names the repair, the analysis or test behind it, and how it is inspected again.',
        'Root cause and corrective action are separate from the fix to this part.',
        'The review board is involved, as every stir weld repair requires.',
      ],
      sources: ['std5006', 'msfcDecade', 'fswWiki'],
    },
    {
      id: 'low-panels',
      station: 'schedule',
      title: 'Test panels come in low',
      situation: 'This week’s test panels average 8% below last month’s ultimate strength. The procedure did not change.',
      evidence: [
        'A new plate lot arrived this week.',
        'The fixture’s backing anvil was reworked.',
        'The same pin tool has been used throughout.',
        'Every panel passed inspection.',
      ],
      task: 'List what could have changed, most likely first. Say which test or record would settle each. Decide whether production welding continues in the meantime.',
      checklist: [
        'Material, tool, fixture, machine and test method are each considered.',
        'Each cause has a check that would confirm it or clear it.',
        'The decision on production is stated, with its risk.',
        'The spread of the results is looked at, not only the average.',
      ],
      sources: ['std5006', 'msfcDecade'],
    },
    {
      id: 'growth',
      station: 'proof',
      title: 'Growth after proof',
      situation: 'After the proof test the tank is wider at the dome’s ring than before, by more than the measurement can explain.',
      evidence: [
        'Proof pressure reached its target and held.',
        'The lands were sized on ultimate strength.',
        'No leak was found.',
        'The welds have not yet been inspected after proof.',
      ],
      task: 'Explain what happened, using the weld’s yield and ultimate strength. Say what state the tank is in and what you would do next. Say what should change in the design.',
      checklist: [
        'Yield at proof is checked with numbers, against the weld and not the plate.',
        'The state of the tank is judged: what yielding changed, and what must be inspected.',
        'The design fix is stated: which check should have sized the land.',
        'The departure is written up as a nonconformance.',
      ],
      sources: ['std5001', 'fsw2195', 'std5019'],
    },
    {
      id: 'repair',
      station: 'nonconformance',
      title: 'Choosing a repair',
      situation: 'Eddy current finds a short unwelded root near the fitting. Three repairs are offered: a friction plug, a second stir pass, or a manual fusion weld.',
      evidence: [
        'The fusion weld can be done today. The plug needs tooling set up.',
        'The flaw is 15 mm long, in a land sized by proof.',
        'This place has had one repair attempt already.',
        'The tank flies cold.',
      ],
      task: 'Choose a repair and defend it with the strength each one keeps, warm and cold. Say who must approve it and how it is inspected. Say what you would refuse to do, and why.',
      checklist: [
        'The choice uses the measured strengths, warm and cold.',
        'Schedule pressure is named and weighed, neither ignored nor obeyed.',
        'The count of repair attempts and the board’s role are stated.',
        'The repair is inspected by the same methods as the original weld.',
      ],
      sources: ['fsw2195', 'std5006'],
    },
  ],
  references: REFERENCES,
};
