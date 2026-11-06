/** Build a satellite, as a path: the aerospace concepts its subsystems need, in build order. */
export default {
  course: 'satellite',
  units: [
    { title: 'Orbit', concepts: ['kepler-equation', 'rocket-equation', 'orbit-transfers'] },
    { title: 'Power', concepts: ['spacecraft-power'] },
    { title: 'Structure', concepts: ['launch-loads'] },
    { title: 'Thermal control', concepts: ['spacecraft-thermal-balance'] },
    { title: 'Attitude control', concepts: ['attitude-rotations', 'euler-rigid-body', 'transfer-functions', 'feedback-control'] },
    { title: 'Communications', concepts: ['thermal-noise', 'link-budget'] },
  ],
};
