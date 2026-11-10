/** Beginner lessons layered over the sourced shop traveler. Examples are qualitative,
 * not machine recipes or acceptance limits. Station references remain alongside each lesson. */
export const COURSE_ORDER = ['requirement', 'design', 'material', 'panels', 'fitup', 'schedule', 'weld', 'inspection', 'nonconformance', 'proof', 'acceptance'];
export const LESSONS = {
  requirement: {
    goal: 'Turn “make a tank” into requirements someone can verify.',
    terms: 'A dome closes the end of a tank. A requirement is a measurable promise. Design pressure includes the demanding cases the system must survive; operating pressure describes normal use.',
    steps: ['Name the fluid, operating temperature, pressure range, envelope, service life and interfaces. Mark unknowns instead of guessing.', 'Set the example pressure and diameter below. Change one at a time and watch how the seam loads change.', 'Write how each requirement will be checked: calculation, measurement, inspection or test. Identify who owns each unresolved input.'],
    machine: 'Requirements sheet and sizing model',
    setup: 'Start with units and load cases. The calculator models pressure membrane loads only. It does not cover supports, launch loads, buckling, fatigue or a complete vessel design.',
    good: 'Every input has a unit, a reason and a planned verification. Increasing pressure or diameter increases the load the seams carry.',
    bad: '“Strong enough” has no measurable limit. A pressure input without its failure cases can produce a convincing but incomplete sizing result.',
    task: 'Record the fluid, temperature, pressure, diameter, service conditions and three acceptance checks. List what you still need to learn.',
    question: 'The pressure number came from normal operation only. What comes next?',
    options: ['Size the wall and start machining.', 'Review credible pressure failure cases before freezing the requirement.', 'Use a thicker plate without changing the requirement.'], answer: 1,
    explain: 'A thicker plate cannot repair a missing load case. Establish the pressure envelope and verification plan first.'
  },
  design: {
    goal: 'Sketch a part that can be formed, joined, measured and inspected.',
    terms: 'A gore is a curved panel, like a segment of an orange peel. A weld land is a thicker edge reserved for joining. A datum is the reference used to locate and measure a feature.',
    steps: ['Sketch the dome, ring, crown fitting and barrel interface. Label which seams must seal and which carry load.', 'Compare a formed one-piece dome with a dome assembled from gores. Record tooling access, machine capacity, seams, inspection access and cost drivers.', 'Mark weld lands, smooth thickness transitions, clamp space, tool entry and exit, and inspection access before detailing the drawing.'],
    machine: 'CAD model and manufacturing review', setup: 'Overlay the tool, fixture and inspection probe on the proposed seam. Check the whole path, including starts and stops.',
    good: 'The welding tool can follow each seam, the fixture can support it, and the inspector can reach the required surfaces.',
    bad: 'A seam disappears behind the fitting or a sharp land transition concentrates stress. A model that looks complete may still be unbuildable.',
    task: 'Describe your chosen route and one rejected alternative. Sketch the tool access and label the critical dimensions and interfaces.',
    question: 'When should the weld fixture be considered?', options: ['While laying out the joints and tool access.', 'After the finished panels arrive.', 'Only if the weld fails.'], answer: 0,
    explain: 'The fixture and tool need space and load paths. Those constraints belong in the initial design.'
  },
  material: {
    goal: 'Choose material and joining process together, then explain how you would characterize them.',
    terms: 'An alloy is a controlled mixture of metals. Temper describes its processing condition. Yield is the start of permanent deformation; ultimate strength is the maximum tensile stress reached in a test. A coupon is a small test specimen.',
    steps: ['Compare the reference 2195 alloy with an alternative using density, strength at service temperature, availability, formability, joining and cost. The reference choice is not automatically your choice.', 'Trace the plate certificate to its alloy, temper and lot. Identify which properties are supplier values and which are qualified design values.', 'Plan tensile coupons of the parent plate and welded joint in relevant directions and temperatures. Compare yield, ultimate strength and elongation, including result spread.'],
    machine: 'Tensile test frame', setup: 'A prepared coupon sits in grips. A load cell measures force; an extensometer measures extension over a known gauge length. Convert force to stress using the original cross-sectional area and extension to strain using the gauge length.',
    good: 'A traceable specimen, valid setup and usable stress-strain curve support separate yield, ultimate and ductility results for the plate and joint.',
    bad: 'Grip slip, an incorrect specimen area or an untraceable coupon makes the result suspect. A plate certificate does not prove the strength of a weld.',
    task: 'Write your material/process decision and a characterization plan: specimens, temperatures, measurements, traceability and who approves the allowables.',
    question: 'Which strength should size a welded seam?', options: ['The strongest plate result.', 'The average of any available aluminium tests.', 'Qualified joint properties for the relevant condition.'], answer: 2,
    explain: 'Joining changes the local material condition. The seam must be assessed with joint properties, including the test and service conditions.'
  },
  panels: {
    goal: 'Follow raw stock into a curved panel with controlled wall and weld lands.',
    terms: 'Forming changes shape. Machining removes material. A tolerance is the permitted variation in a feature; nominal size is the intended value.',
    steps: ['Plan blanks, forming tooling and the forming route with the supplier. Preserve identification when cutting each blank.', 'Plan CNC machining and workholding to leave the skin and the thicker weld lands. Model the stock and the fixture before making cuts.', 'Measure the panel against the drawing: profile, wall thickness, lands and edge location. Compare actual readings with the stated tolerances.'],
    machine: 'Forming tooling, CNC mill and dimensional measurement', setup: 'Forming tooling gives the panel its curve. The mill follows a programmed path to remove stock. A thickness gauge and profile measurement check the result against drawing references; the historical dome used photogrammetry for shape.',
    good: 'Measured thickness and profile meet the drawing, and weld lands remain continuous. The inspection map shows where each measurement was taken.',
    bad: 'A panel looks smooth but has a thin spot, a springback error or a damaged land. Appearance and the CNC program are not dimensional evidence.',
    task: 'Write a route from stock to inspected panel. List what you measure after forming and after machining, and where each result is recorded.',
    question: 'The CNC program finished without alarms. Is the panel accepted?', options: ['Yes, the program controls every dimension.', 'No, actual geometry still needs inspection against the drawing.', 'Yes, if its surface is shiny.'], answer: 1,
    explain: 'Workholding, stock variation and tool behavior can change the result. Measure the part that was made.'
  },
  fitup: {
    goal: 'Understand how the joint stays aligned while the tool loads it.',
    terms: 'Fit-up is the alignment before joining. Mismatch is a height difference between edges. A fixture locates and holds the part; an anvil supports a conventional stir weld from behind.',
    steps: ['Identify the load path from tool through joint, support and fixture. Compare a conventional tool with the self-reacting arrangement.', 'Check joint preparation and cleaning against the approved procedure. Measure gap and mismatch along the joint.', 'Record the setup, measurement locations and readiness checks. Resolve departures before releasing the setup to weld.'],
    machine: 'Weld fixture and alignment gauges', setup: 'The panel edges sit in the fixture. Gauges check edge gap and relative height. The fixture must hold the seam while providing clearance for the tool.',
    good: 'Gap and mismatch meet the qualified procedure throughout the seam, and the fixture and tool can follow the path.',
    bad: 'One clamp hides a large gap or the joint opens under load. A single measurement at the start does not describe the whole seam.',
    task: 'Describe the fixture load path and record where you would check alignment. Explain what makes this setup ready to weld.',
    question: 'A joint is outside the allowed gap. What should happen?', options: ['Weld faster to cross it.', 'Hide it with the tool shoulder.', 'Hold the setup and resolve it against the approved procedure.'], answer: 2,
    explain: 'The qualified process assumes a defined joint geometry. An unexplained gap is a departure before welding starts.'
  },
  schedule: {
    goal: 'Connect machine settings to evidence that a joining process works.',
    terms: 'Friction stir welding uses a rotating tool to soften and move metal without melting it. The WPS is the approved welding procedure; the PQR records the tests used to qualify it.',
    steps: ['Locate rotation, travel, plunge or force control, tool geometry and joint thickness on the procedure. Explain what each changes.', 'Follow a coupon from a trial weld through inspection, sectioning and mechanical testing.', 'Explain why both ends of the qualified process window need evidence. Do not derive a production schedule from the example sizing calculator.'],
    machine: 'Friction stir welding machine, qualification mode', setup: 'Rotation turns the tool; travel moves it down the seam. The tool, joint, fixture and control method form one qualified setup. The machine settings alone do not define weld quality.',
    good: 'Inspection and destructive tests support the documented operating window for the defined material, thickness, tool and joint.',
    bad: 'A smooth weld surface hides a tunnel or weak bond. A good-looking bead is not a substitute for qualification.',
    task: 'Map each machine variable to its physical effect. List the qualification evidence you would ask to see before production.',
    question: 'One trial weld looks smooth. What does that prove?', options: ['Only its visible appearance; qualification still needs inspection and testing.', 'The full process window is safe.', 'All welds will meet design strength.'], answer: 0,
    explain: 'Internal defects and joint strength need their own evidence, including tests of the qualified range.'
  },
  weld: {
    goal: 'Read a production record and make a defensible hold decision.',
    terms: 'A process window is the qualified range of settings. An excursion leaves that range. A weld record ties measurements along the seam to the procedure, tool and part.',
    steps: ['Match the part, current WPS, tool identity, demonstrated tool life and readiness record.', 'Follow entry, steady travel and exit. Compare recorded rotation, travel and the specified force or position controls with their qualified ranges.', 'Locate excursions along the seam. Hold affected hardware for the authorized review process and preserve the original record.'],
    machine: 'Friction stir welding machine, production mode', setup: 'The tool plunges, travels along the joint and withdraws. The operator monitors procedure-defined controls while the machine records their history. Entry and exit need their own planned treatment.',
    good: 'The trace remains within the qualified ranges and the start, stop and exit treatment match the approved procedure. Inspection is still required.',
    bad: 'A force or position excursion coincides with joint movement. Returning to the normal range later does not erase the affected section.',
    task: 'Write the operator-to-quality handoff for an excursion: seam location, reading, procedure limit, affected part and next decision owner.',
    question: 'A reading leaves its qualified range then recovers. What do you do?', options: ['Accept it because it recovered.', 'Preserve the record and hold affected hardware for review.', 'Delete the spike as noise.'], answer: 1,
    explain: 'Recovery does not show what happened inside the joint during the excursion. Keep the evidence and follow the approved disposition process.'
  },
  inspection: {
    goal: 'Explain what an inspection signal can tell you and what it can miss.',
    terms: 'Nondestructive evaluation examines a part without cutting it apart. An indication is a signal to interpret; it is not automatically a rejectable defect. Coverage describes what was actually examined.',
    steps: ['Map visual, dimensional, surface and volumetric methods to the flaw types they target.', 'Follow calibration or reference checks into a scan. Relate a signal to its location, depth, coverage and the approved acceptance criteria.', 'Compare surface and internal findings with the weld record. Ask whether the method can reliably find the flaws assumed by the analysis.'],
    machine: 'Phased array ultrasonic instrument', setup: 'A probe sends sound into the joint and records returning echoes. A scan relates response to position and depth. Reference checks, coupling and coverage are needed before interpreting indications.',
    good: 'A qualified method, valid reference checks and documented coverage support interpretation against approved criteria. A quiet screen alone is not acceptance.',
    bad: 'A repeatable indication needs evaluation; loss of coupling or missing coverage can also hide flaws. A clean penetrant result does not clear an internal flaw.',
    task: 'Choose methods for a surface crack and an internal tunnel. Explain the evidence needed before accepting or rejecting an ultrasonic indication.',
    question: 'Surface penetrant is clear but ultrasound has an internal indication. Which conclusion fits?', options: ['The part must be flawless.', 'Ultrasound is wrong whenever penetrant is clear.', 'The methods see different flaws; evaluate the indication and coverage.'], answer: 2,
    explain: 'Penetrant relies on a surface opening. Internal indications need assessment with the qualified method and acceptance criteria.'
  },
  nonconformance: {
    goal: 'Separate fixing this part from preventing the next defect.',
    terms: 'A nonconformance is a departure from a requirement. A disposition states what happens to this part. Root cause and corrective action address why it happened and how to prevent recurrence.',
    steps: ['Record the exact requirement, finding, location and evidence. Identify and hold affected hardware.', 'Compare use as is, an approved repair and scrap with the authorized review board. Include strength, access, prior repairs and reinspection.', 'Record approval and repair evidence. Check that the corrective action addresses the process cause rather than only the visible flaw.'],
    machine: 'Review record and approved repair tooling', setup: 'Repair is a new controlled process. Its qualified procedure, strength basis, tool access and inspection plan must fit this joint and its history.',
    good: 'An authorized disposition links the repair to supporting analysis or tests, reinspection and a closed record.',
    bad: 'An available welder repairs the flaw before approval, or the same defect returns because no process cause was addressed.',
    task: 'Use one of the cases below. Write the containment, disposition evidence, reinspection and corrective action as separate items.',
    question: 'What closes a repair?', options: ['Authorized disposition, recorded repair and required reinspection.', 'A promise that the next part will be better.', 'A surface that looks repaired.'], answer: 0,
    explain: 'A physical repair and its acceptance evidence belong together. Corrective action also needs to address recurrence.'
  },
  proof: {
    goal: 'Distinguish strength evidence, leak evidence and permanent deformation.',
    terms: 'Proof tests demonstrate a specified load condition. Leak tests measure containment. Elastic deformation recovers after unloading; permanent growth can indicate yielding.',
    steps: ['Read the approved test plan: load level, temperature, instrumentation, limits, inspection and authorization. Explain the difference between proof and leak objectives.', 'Compare pressure and deformation histories, including measurements before loading and after unloading.', 'Interpret leaks, residual growth or procedure departures through the review process. Identify what remains unproved about service life and operating conditions.'],
    machine: 'Controlled pressure test rig and leak detector', setup: 'A qualified test team uses a reviewed rig with calibrated pressure and temperature sensing, deformation measurements and specified protection. This lesson interprets records; it is not a pressure-test operating procedure.',
    good: 'The required load history is documented, deformation meets the approved limits, the specified leak criterion is met and required inspections are complete.',
    bad: 'Pressure reached its target but measurable permanent growth remains. No visible leak does not show that the structure stayed elastic.',
    task: 'List the evidence for strength and leak acceptance separately. Explain how residual growth changes your decision.',
    question: 'The pressure held and there was no leak, but the ring stayed larger after unloading. What next?', options: ['Release it because there was no leak.', 'Hold it for structural evaluation and required inspection.', 'Increase the next proof load.'], answer: 1,
    explain: 'Permanent growth can indicate yielding. A leak result cannot clear that structural concern.'
  },
  acceptance: {
    goal: 'Explain the full build and hand over a traceable part with known limits.',
    terms: 'As-built means what was actually made. Traceability connects that hardware to material, processes and records. Acceptance means the defined requirements have documented evidence.',
    steps: ['Trace one seam backward through inspection, production record, procedure, tool and material lot.', 'Check dimensions, test reports, closed nonconformances and interface requirements. Include handling, protection and handoff instructions from the responsible team.', 'Give a teach-back: requirements, design, material, forming, machining, joining, inspection, repair and testing. Name unresolved risks and the specialists still needed.'],
    machine: 'As-built drawing and acceptance data package', setup: 'Review records against the acceptance checklist and the actual part identity. A completed lesson notebook is preparation for this review, not a hardware release.',
    good: 'Each requirement has evidence and an accountable approval. Repairs and limitations stay visible to the next team.',
    bad: 'The part passes tests but a plate lot is missing, a repair has no closure or the next team receives only the nominal CAD model.',
    task: 'Write your final build plan from blank stock to handoff. Identify the most likely failure at each stage, the measurement that would reveal it and who can approve the result.',
    question: 'A seam has no material lot record. Can passing proof restore that traceability?', options: ['Yes, proof establishes its alloy and temper.', 'Yes, if the drawing is complete.', 'No, the missing record needs an authorized resolution.'], answer: 2,
    explain: 'Proof records one tested condition. It does not identify the material or replace missing manufacturing evidence.'
  }
};
