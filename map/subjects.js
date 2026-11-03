/**
 * The map's lanes. A lane holds a subject, not a course: one course can sit across several lanes,
 * and one lane can hold concepts from many courses.
 *
 * `token` is the CSS custom property the hub draws the lane in. `dark` and `light` are its values
 * in each theme; each one passes 4.5:1 against that theme's page and panel.
 * The order here is the lanes' order on the map, top to bottom.
 */
export const SUBJECTS = [
  { id: 'calculus', label: 'Calculus', token: '--lane-calculus', dark: '#58c4dd', light: '#1a7590' },
  { id: 'diffeq', label: 'Differential equations', token: '--lane-diffeq', dark: '#5cd0b3', light: '#16775f' },
  { id: 'mechanics', label: 'Mechanics', token: '--lane-mechanics', dark: '#ff9a52', light: '#a8500f' },
  { id: 'em', label: 'Electricity and magnetism', token: '--lane-em', dark: '#f4d345', light: '#8a6800' },
  { id: 'thermo', label: 'Thermodynamics', token: '--lane-thermo', dark: '#83c167', light: '#3f7d27' },
  { id: 'fluids', label: 'Fluid mechanics', token: '--lane-fluids', dark: '#5aa9ff', light: '#1d64b8' },
  { id: 'heat', label: 'Heat transfer', token: '--lane-heat', dark: '#fc6255', light: '#c23a2f' },
  { id: 'circuits', label: 'Circuits and systems', token: '--lane-circuits', dark: '#b39af0', light: '#6a48b8' },
  { id: 'materials', label: 'Mechanics of materials', token: '--lane-materials', dark: '#d2b48c', light: '#7a6235' },
  { id: 'matsci', label: 'Materials science', token: '--lane-matsci', dark: '#8c9cff', light: '#3d4fc4' },
  { id: 'stats', label: 'Statistics', token: '--lane-stats', dark: '#ef86d2', light: '#a2338b' },
];
