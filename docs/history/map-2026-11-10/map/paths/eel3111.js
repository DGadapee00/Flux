/**
 * EEL 3111 Circuit Analysis I, in the order of its archived plan
 * (docs/history/guidance-2026-11-02/docs/course-plans/eel3111.md), checked against MIT 6.002
 * Circuits and Electronics, Spring 2007 (docs/ocw/6-002.md). EEL 3111 has no Flux app, so every new
 * concept here is a gap with a candidate lab. 6.002's transistor and digital-logic lectures are left
 * out, as the plan scopes them.
 */
export default {
  course: 'eel3111',
  units: [
    { title: 'Basic laws', concepts: ['current-resistance', 'electric-power', 'kirchhoff', 'voltage-divider'] },
    { title: 'Methods of analysis', concepts: ['nodal-analysis', 'dependent-sources'] },
    { title: 'Circuit theorems', concepts: ['superposition', 'thevenin-norton'] },
    { title: 'Operational amplifiers', concepts: ['op-amp'] },
    { title: 'Capacitors, inductors and first-order circuits', concepts: ['capacitance', 'inductance', 'rc-circuits', 'first-order-circuits'] },
    { title: 'Second-order circuits', concepts: ['second-order-circuits'] },
    { title: 'Sinusoidal steady state', concepts: ['ac-circuits', 'impedance-analysis', 'ac-power', 'filters'] },
  ],
};
