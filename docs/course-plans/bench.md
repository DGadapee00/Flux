# BENCH Electronics on the bench

A personal-projects module, not a UNF course: how to put real circuits together on a breadboard to
get a job done, and how to find out why one does not work. It sits beside PHY 2049, which teaches
what each part is, and before EEL 3111, which analyses circuits formally. Every unit starts from a
goal ("turn on a light when it gets dark"), not from a component.

Status: **confirmed** (owner, 27 Oct 2026). The owner chose this plan over mapping it to MIT 6.091 (D35).

| | |
|---|---|
| Folder and id | `courses/bench` |
| Port | 5196 (next free after the reserved list in `AGENTS.md`) |
| Track, order | `projects`, 1 (a new track, D35) |
| Shell | `physics` (PHY 2049's UI), plus two new shell parts behind flags: a breadboard view and a meter probe (see "Shell work") |
| Subject libraries | reuse `em/mna.js` and `em/circuit.js`; new `em/nonlinear.js` (Newton–Raphson on the MNA system for diodes, LEDs and transistor switches) and `em/parts.js` (part models with datasheet numbers), each with a selftest |
| When the owner takes it | Not a course. The owner is starting hardware projects now (26 Oct 2026); a parts kit is coming. Built for the screen first, with an "On the bench" list per unit for when the kit arrives. |

## What it is for

The owner can solve RC and Kirchhoff problems but does not yet know how a breadboard is wired, which
part does which job, or how parts combine into something that works. The module teaches one
mental model and uses it in every unit:

**power → sense → decide → drive → output.**

Power comes from a battery, USB or a regulator. A sensor turns something in the world into a
voltage. A comparator, a timer or a microcontroller decides. A transistor drives the load, because
a small signal cannot. The output is a light, a sound, a motor or a relay. Each unit adds one link,
and each build reuses the links before it.

Three habits run through every unit:

1. **Measure before you guess.** Every lab has a meter probe. The student reads voltages across
   parts and currents in series with them, as on a real bench.
2. **Break it on purpose.** Every unit ends with a "Fix it" build that has one fault: a backwards
   LED, a missing ground, a floating input, a resistor across the wrong rows. The student finds it
   with meter readings, not by looking at the answer.
3. **Tie it back to the physics.** Every section names the PHY 2049 idea it rests on, and links to
   that section of PHY 2049's notes (`prereqs`).

## Sources

This plan sets the units and their order, a stated exception to D23 (D35).

- **Textbook:** Tony Kuphaldt, *Lessons in Electric Circuits*, volumes I–III and VI (free, Design
  Science License). Cited by volume and chapter through `src/data/textbook.js`. Nothing copied.
- **Datasheets, for every number on screen:** each part's maker's datasheet, cited by maker and part
  number (D25). Typical values below are to be confirmed against the datasheet when the unit is
  built; none ships unconfirmed.
- **Another view:** PHY 2049's notes on current, resistance, RC circuits and induction; and MIT
  6.091, *Hands-On Introduction to EE Lab Skills* (IAP 2008), whose labs build the same circuits on
  a lab bench with ±15 V supplies. Cited by lab number only; nothing copied.

## Exam style

None: no exam. Practice is design and debugging. Problem shapes: pick a part value from the
standard series and justify it; predict a meter reading; name the fault from three readings; say
which link of the chain a part belongs to.

## Units

**Unit 1. The bench**

- The breadboard: rows of five holes joined underneath, the centre channel, the power rails (and
  the rails split halfway on some boards). A jumper wire is a net, not a part. Power: a bench supply,
  a USB 5 V supply, a 9 V battery. The multimeter: volts across a part, amps in series by breaking the
  circuit, ohms and continuity only with the power off. The fuse in the amps jack, and why.
- `breadboard`: place parts and wires; every hole lights up with its net. Shows that a resistor
  placed along a row is shorted out, and that the two halves of a split rail are not joined.
  Recompute: the nets from the hole map. Check: the MNA solve gives zero current through a shorted
  part.
- `meter`: a powered circuit and a meter with three modes. Shows that a voltmeter goes across and an
  ammeter in series, and that an ammeter across a supply is a short. Recompute: MNA with the meter's
  own resistance (10 MΩ on volts, about 1 Ω on amps). Check: the reading equals the ideal value to
  within the loading the meter adds.
- Application: a USB power bank feeding the rails (5 V, 1 A or 2 A ports; maker's label).
- Problem families: which holes are connected; which mode and which jacks for a measurement; what a
  misplaced probe reads.
- Traps: the meter on amps across the supply; measuring resistance in a powered circuit; a part
  straddling one row instead of the channel.
- Predictions: turn a resistor 90° so both legs are in one row (the current through it drops to
  zero); move the voltmeter to the amps jack (the reading becomes a short-circuit current).
- On the bench: a full-size breadboard, jumper wires, a multimeter, a 9 V battery clip or a
  breadboard power module.

**Unit 2. Light an LED**

- Diodes conduct one way. An LED drops about 2 V (red) to 3 V (blue, white) when lit and needs its
  current limited. Choosing the resistor: R = (V_s − V_f)/I, then the next standard value up, then
  its power, I²R. The resistor colour code and the E12 series. Two LEDs in series share one current;
  two in parallel without their own resistors share it badly.
- `led`: an LED, a resistor and a supply, with the LED's I–V curve and the resistor's load line on a
  graph. Shows that without a resistor the current is set by almost nothing, and that the LED's
  voltage hardly changes as its current changes. Recompute: Newton–Raphson on the Shockley model.
  Check: the intersection of the load line and the curve, found by bisection.
- Application: an indicator LED on 5 V and on 9 V. Numbers: a 5 mm red LED datasheet (forward
  voltage about 2.0 V at 20 mA, 30 mA maximum; to confirm).
- Problem families: pick the resistor for a supply and a colour; the current with a given resistor;
  whether a ¼ W resistor is enough; series versus parallel strings.
- Traps: leaving out V_f (R = V_s/I); the LED backwards (no light, full supply across it); one
  resistor for several parallel LEDs.
- Predictions: halve the resistor (the current nearly doubles, the LED voltage barely moves); flip
  the LED (zero current).
- Reinforces: Ohm's law, power in a resistor (PHY 2049).
- Fix it: an LED that does not light; the readings show the full supply across it.

**Unit 3. Reading the world**

- A sensor whose resistance changes becomes a voltage through a divider: a light-dependent resistor,
  a thermistor, a potentiometer. A button needs a pull-up or pull-down, or the input floats and reads
  noise. Loading: whatever reads the divider draws current and pulls its voltage down, unless its
  resistance is much larger than the divider's.
- `divider`: a divider with a swappable sensor and a load. Shows that the output depends on the
  ratio, not the size, of the resistors, until a load is attached. Recompute: the divider formula.
  Check: MNA with the load.
- `button`: a button with a pull-up, a pull-down, or neither. Shows that an unconnected input has no
  defined voltage. Recompute: MNA with the input's leakage resistance. Check: the two limits by hand.
- Application: a light sensor for a night light. Numbers: a GL5528 LDR (about 10–20 kΩ at 10 lux,
  above 1 MΩ dark) and a 10 kΩ NTC thermistor (B = 3950); to confirm.
- Problem families: pick the fixed resistor for the biggest swing; the output in light and dark; the
  output with a given load; which pull resistor a button needs.
- Traps: loading ignored; the divider upside down (the output rises when it should fall); a pull-up
  so small it wastes power, or so big the input misreads.
- Predictions: put a 1 kΩ load on a 100 kΩ divider (the output collapses); swap the LDR and the
  fixed resistor (the output now falls in the dark).
- Reinforces: Kirchhoff's rules, internal resistance (PHY 2049).
- Fix it: a button that triggers by itself; the input reads half the supply with nothing pressed.

**Unit 4. Switching bigger things**

- A sensor or a logic pin cannot run a motor, a relay or a lamp. A transistor used as a switch can.
  An NPN transistor: base resistor, gain, saturation (V_CE about 0.2 V). A logic-level MOSFET: the
  gate voltage turns it fully on, with almost no gate current. The load goes on the high side of the
  switch; grounds are shared. A relay or motor coil fights a change in current, so switching it off
  makes a voltage spike; a flyback diode gives that current a path.
- `switch`: a load switched by an NPN or a MOSFET. Shows that the base current, not the base
  voltage, decides whether an NPN saturates, and that an undersized base current leaves it hot and
  half-on. Recompute: a switch model of each transistor solved with the load. Check: the power in the
  transistor, I·V_CE, against the load's.
- `flyback`: a coil switched off with and without a diode. Shows the spike, L·di/dt, and how the
  diode clamps it to about 0.7 V above the supply. Recompute: the RL circuit's closed form. Check: an
  RK4 step of L di/dt = −(R + diode)i.
- Application: a night light: the Unit 3 divider driving a transistor that lights a string of LEDs.
  Numbers: 2N2222A (gain 100–300, V_CE(sat) about 0.3 V, 600 mA), IRLZ44N (on-resistance about
  0.025 Ω at 5 V on the gate), 1N4007 (1 A, about 1 V forward); to confirm.
- Problem families: the base resistor for a load current; NPN or MOSFET for a given load; the heat
  in the switch; whether a diode is needed.
- Traps: driving the load from the base; no common ground; a standard MOSFET on a 5 V gate (half-on);
  the flyback diode backwards (a short across the supply).
- Predictions: raise the base resistor tenfold (the transistor leaves saturation and heats up); take
  the flyback diode out (a spike of tens of volts).
- Reinforces: induction and self-inductance (PHY 2049).
- Fix it: a motor that stutters and resets the circuit; the readings show the supply sagging.

**Unit 5. Timing**

- A capacitor charging through a resistor is a clock: it crosses a threshold after a time set by RC.
  The 555 timer uses two thresholds, one third and two thirds of the supply, to turn an RC charge
  into a steady blink (astable) or a single pulse (monostable). Debouncing a button with RC.
- `rc-timer`: an RC charge with a threshold line. Shows that the time to cross a threshold is
  RC·ln(V_s/(V_s − V_th)), and that doubling R or C doubles it. Recompute: the closed form. Check:
  RK4 on dV/dt = (V_s − V)/RC.
- `555`: the 555 as two comparators, a flip-flop and a discharge switch. Shows the capacitor voltage
  bouncing between ⅓ and ⅔ of the supply, and how the two resistors set the on and off times.
  Recompute: f = 1.44/((R₁ + 2R₂)C). Check: stepping the capacitor voltage and the flip-flop in time.
- Application: a 1 Hz blinker and a press-once lamp timer. Numbers: an NE555 datasheet (4.5–16 V,
  200 mA output); to confirm.
- Problem families: R and C for a frequency and a duty cycle; the pulse length of a monostable; a
  debounce time constant.
- Traps: frequency from R₁C alone; electrolytic capacitor backwards; reading µF as nF.
- Predictions: double C (the blink slows to half the rate); make R₂ much bigger than R₁ (the duty
  cycle nears 50%).
- Reinforces: RC circuits (PHY 2049).
- Fix it: a blinker that stays on; the capacitor never reaches two thirds of the supply.

**Unit 6. Deciding**

- A comparator says which of two voltages is bigger: a sensor's against a set point. Near the set
  point a slowly changing input makes it chatter. Hysteresis (a Schmitt trigger) gives it two
  thresholds and a clean switch. Open-collector outputs need a pull-up.
- `comparator`: a slowly drifting, slightly noisy sensor voltage into a comparator, with and without
  hysteresis. Shows the chatter, and the band that stops it. Recompute: the thresholds from the
  feedback divider. Check: stepping the input in time and counting output flips.
- Application: a temperature alarm, thermistor divider into a comparator into a buzzer. Numbers: an
  LM393 datasheet (open-collector output); to confirm.
- Problem families: the set-point divider for a temperature; the hysteresis resistor for a band
  width; which way the output goes when the input rises.
- Traps: no pull-up on an open-collector output; inputs swapped (the alarm sounds when it is cold).
- Predictions: remove the hysteresis (the output flips many times as the input crosses); swap the
  inputs (the output inverts).
- Fix it: an alarm that buzzes faintly near the set point.

**Unit 7. Power**

- A battery is a source with an internal resistance and a capacity in mAh. A linear regulator gives
  a steady 5 V from a higher, varying input; it needs about 2 V of headroom and burns the difference
  as heat, (V_in − V_out)·I. Decoupling capacitors next to each chip supply quick bursts of current.
  Why a motor on the same supply resets a microcontroller.
- `regulator`: a battery, a regulator and a load. Shows the dropout, and the heat that grows with the
  input voltage. Recompute: the regulator model. Check: power in equals power out plus heat.
- Application: running a project from a 9 V battery, and how long it lasts. Numbers: an L7805
  datasheet, an alkaline 9 V battery's capacity and internal resistance; to confirm.
- Problem families: the regulator's heat; battery life for a load; whether a supply droops under a
  load step.
- Traps: battery life as capacity over the peak current; regulator input below the dropout.
- Predictions: raise the input from 7 V to 12 V (the output stays at 5 V, the heat more than
  doubles); start a motor on the same rail (the logic supply dips).
- Reinforces: EMF and internal resistance, power (PHY 2049).

**Unit 8. A microcontroller as the brain**

- A microcontroller pin is a weak 5 V or 0 V source, good for about 20 mA; it can read a voltage as a
  number from 0 to 1023, and it can switch fast to fake an in-between voltage (PWM). Never run a
  motor from a pin; drive it through Unit 4's switch. The internal pull-up. The program is shown,
  not run: the lab models the pins.
- `pwm`: a pin switching at a set duty cycle into an LED or a motor through a MOSFET. Shows that the
  average voltage, the LED's brightness and the motor's speed follow the duty cycle. Recompute: the
  average. Check: integrating the waveform over a period.
- `adc`: a sensor divider into an analog pin. Shows the reading as a number, and the step size,
  5 V/1024. Recompute: the conversion. Check: the reading's voltage within one step of the input.
- Application: a fan that speeds up as it gets warmer: thermistor, analog pin, PWM, MOSFET, fan.
  Numbers: the ATmega328P datasheet (40 mA absolute maximum per pin, 10-bit converter) and an Arduino
  Uno's PWM frequency; to confirm.
- Problem families: the reading for a voltage; the duty cycle for a speed; whether a pin can drive a
  load.
- Traps: a motor or relay straight off a pin; analog readings without a common ground.
- Predictions: halve the duty cycle (half the average voltage); connect a 100 mA load to a pin (it
  exceeds the pin's limit).
- Fix it: a fan that never stops; the pin reads 1023 all the time because the divider's ground wire
  is missing.

**Unit 9. Debugging a build**

- A method: check the supply at the chip, then follow the chain from sensor to output, one stage at
  a time, with the meter. Expected against measured at each node. Common faults by symptom.
- `troubleshoot`: a finished build from an earlier unit with one hidden fault, drawn from a list.
  The student may take a set number of readings, then names the fault. Recompute: MNA of the faulty
  circuit. Check: each reading against the fault-free circuit's.
- Problem families: name the fault from three readings; choose the next most useful reading.
- Traps: probing the wrong side of a part; trusting the schematic instead of the board.

## Shell work

The breadboard view and the meter probe are new UI. A course writes no UI of its own (rule 6), so
both go into `packages/shells/physics/` behind flags, with a test on the shell's fixture course:

- `breadboard`: a hole grid with rails, parts with real footprints, and the net each hole belongs to.
- `probe`: two meter leads the student drags to points; volts, amps or ohms, with the meter's own
  resistance in the solve.

PHY 2049's schematic view (`courses/phy2049/src/scene/schematic.js`) lives in that course, and one
course never imports another. Reusing it means moving it into the shell first, which touches
PHY 2049 (open question 4).

## Prerequisite links

- PHY 2049: current and resistance, Kirchhoff's rules, RC circuits, induction, power.
- Forward: EEL 3111 (nodal analysis, op-amps, first-order circuits).

## Settled (27 Oct 2026, D35)

1. **Sources.** This plan orders the units; Kuphaldt and the datasheets are cited. MIT 6.091 is an
   Another view.
2. **Track.** A new `projects` track, for builds outside the degree map.
3. **Microcontroller depth.** Unit 8 models the pins and shows code without running it.
4. **PHY 2049's schematic view** moves into the physics shell in its own PR before Bench needs it,
   with PHY 2049's smoke and gallery scripts green.
5. **Order.** PHY 2048 has units in progress; Bench is the second course in progress (rule 7).
