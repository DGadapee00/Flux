/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  'heat-pump': { name: 'Moving heat uphill costs more the higher the lift', statement: 'A vapour-compression heat pump delivers COP_HP = (h₂ − h₃)/(h₂ − h₁), at most T_H/(T_H − T_L); a colder source means a larger pressure ratio and a lower COP.', cue: 'A refrigerator, air conditioner or heat pump.', family: 'Cycles' },
  rankine: { name: 'A steam plant trades pressure against wetness', statement: 'η = (w_turbine − w_pump)/q_in with w_pump ≈ vΔp small; raising boiler pressure raises η but wets the exhaust, and reheat restores it.', cue: 'A steam power plant.', family: 'Cycles' },
  engines: { name: 'Compression ratio sets an engine’s efficiency', statement: 'Air-standard Otto efficiency is 1 − 1/r^{k−1}; the Diesel’s is lower by a cutoff factor at the same r, and it wins only through a higher r.', cue: 'Comparing piston-engine cycles.', family: 'Cycles' },
  exergy: { name: 'Exergy is the work energy could give', statement: 'Heat Q at T is worth X = Q(1 − T₀/T) of work against surroundings at T₀; every irreversibility destroys X_destroyed = T₀S_gen.', cue: 'Comparing energy sources, or finding where a process wastes its potential.', family: 'Second law' },
  propulsion: { name: 'Push more air, more gently', statement: 'Thrust is F = ṁ(V_e − V₀) and propulsive efficiency η_p = 2/(1 + V_e/V₀); for a given jet power, more air at a lower jet speed gives more thrust.', cue: 'A jet engine, propeller, fan or rocket producing thrust.', family: 'Compressible flow' },
  psychrometrics: { name: 'Moist air dries when cooled past its dew point', statement: 'ω = 0.622 p_v/(p − p_v) and φ = p_v/p_g(T); cooled at constant ω, air saturates at its dew point, and below it water condenses.', cue: 'Air conditioning, drying, humidifying, or condensation on a cold surface.', family: 'Mixtures and reactions' },
  combustion: { name: 'Combustion balances atoms, then enthalpy', statement: 'Balance the atoms with air as O₂ + 3.76 N₂; with no heat lost, Σ_P N_i h̄_i(T_ad) = Σ_R N_i h̄_i(298 K), and the flame is hottest near stoichiometric.', cue: 'A fuel burning in air: flame temperature, air–fuel ratio, heat released.', family: 'Mixtures and reactions' },
  moles: { name: 'Count molecules, not kilograms', statement: 'A gas’s amount is N = m/M. The mole fraction y = N_i/N and the mass fraction x = m_i/m agree only when the molar masses do: y_i = x_i M/M_i.', cue: 'Masses given, mole fractions or partial pressures wanted.', family: 'Thermodynamics' },
  dalton: { name: 'Each gas fills the vessel', statement: 'In an ideal mixture each gas pushes as if it were alone at the mixture’s T and V: p_i = N_i R̄T/V = y_i p, and the partial pressures add up to p.', cue: 'A partial pressure in a mixture.', family: 'Thermodynamics' },
  choke: { name: 'A sonic throat fixes the flow', statement: 'Once the throat reaches Mach 1 the mass flow is A_t p₀ √(γ/RT₀) (2/(γ+1))^((γ+1)/(2(γ−1))), set by the reservoir alone. Lowering the back pressure further changes the flow downstream of the throat, not the mass flow.', cue: 'A nozzle or orifice with a large pressure drop.', family: 'Compressible flow' },
  shock: { name: 'A shock slows the gas', statement: 'Across a normal shock a supersonic flow drops to subsonic, its pressure, temperature and density rise, and its stagnation pressure falls: entropy rises, and the loss grows with the upstream Mach number.', cue: 'A supersonic flow meeting a higher pressure.', family: 'Compressible flow' },
  weighting: { name: 'Weight by what the property is per', statement: 'A per-mole property averages by mole fraction, M = Σ y_i M_i; a per-kilogram property by mass fraction, c_p = Σ x_i c_p,i and R = R̄/M.', cue: 'A property of the whole mixture.', family: 'Thermodynamics' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
