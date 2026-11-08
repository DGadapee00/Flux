export default {
  id: 'drag-lift',
  title: 'Drag and lift',
  label: ['Drag and lift'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`F_D = \tfrac12\,C_D\,\rho V^2 A, \qquad F_L = \tfrac12\,C_L\,\rho V^2 A`,
  idea: String.raw`A body in a stream feels shear on its surface and a pressure difference between front and back. Dimensional analysis packs both into coefficients that depend on shape, Reynolds number and roughness. Streamlined bodies lose most to friction; blunt ones to the low-pressure wake left where the boundary layer separates. A momentum balance on a box round the body finds the drag from the wake's missing momentum. A turbulent layer clings longer, so the wake narrows and drag can fall as speed rises.`,
  requires: ['boundary-layer', 'momentum-cv'],
  sources: [
    {
      title: 'Cleynen, Fluid Dynamics for Engineers',
      url: 'https://fluidmech.ninja/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Drag and lift coefficients, separation and the drag crisis.',
      checked: '2026-11-06',
    },
    {
      title: 'NASA Glenn, Beginner’s guide to aeronautics: The drag equation',
      url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-equation/',
      kind: 'Reference',
      level: 'Intro',
      why: 'What the drag coefficient holds and what it leaves out, from the people who test wings.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3015', lab: 'drag', notes: ['s13'], note: 'A ball through air with a speed slider and a smooth or rough surface: past the drag crisis a faster or rougher ball has less drag. Checked by the distance it coasts to half speed, marched in time and integrated over speed.' },
  ],
};
