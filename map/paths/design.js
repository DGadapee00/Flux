/** Design practice, as a path: from requirements to a tested part, then the sensors, actuators and boards in it. */
export default {
  course: 'design',
  units: [
    { title: 'Start from the need', concepts: ['design-process', 'design-intent-cad'] },
    { title: 'Tolerances and drawings', concepts: ['tolerances-fits', 'tolerance-stackup', 'gdt'] },
    { title: 'Machine elements', concepts: ['constraint-design', 'bolted-joints'] },
    { title: 'Making it', concepts: ['design-for-manufacture', 'process-variation'] },
    { title: 'Proving it', concepts: ['design-verification'] },
    { title: 'Measuring', concepts: ['sensor-basics', 'strain-gauge-bridge', 'temperature-sensors', 'data-acquisition', 'pressure-flow-measurement'] },
    { title: 'Moving things', concepts: ['valves-flow-control', 'actuators', 'microcontrollers'] },
    { title: 'Boards', concepts: ['pcb-design', 'pcb-grounding'] },
  ],
};
