export default {
  id: 'centroids',
  title: 'Centroids and area moments of inertia',
  label: ['Centroids,', 'area moments'],
  subject: 'mechanics',
  courses: ['statics'],
  eq: String.raw`\bar x = \frac{\sum A_i\bar x_i}{\sum A_i}, \qquad I_x = \sum\left(\bar I_i + A_i d_i^2\right)`,
  idea: String.raw`The centroid is an area's balance point. For a shape built from rectangles, triangles and circles, weight each part's centroid by its area; a hole is a part with negative area. The area moment of inertia measures how far the area sits from an axis and sets a beam's stiffness. Pappus's theorems turn a centroid's travel into a surface area or a volume.`,
  requires: ['double-integrals'],
  sources: [
    {
      title: 'Engineering Statics: Open and Interactive (Baker and Haynes)',
      url: 'https://engineeringstatics.org/',
      kind: 'Free textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'Centroids and area moments by composite parts, with interactive figures.',
    },
    {
      title: 'OpenStax Calculus Vol. 3, §5.6 Calculating centers of mass and moments of inertia',
      url: 'https://openstax.org/books/calculus-volume-3/pages/5-6-calculating-centers-of-mass-and-moments-of-inertia',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'The integrals behind the composite-part tables.',
    },
  ],
  labs: [
    { course: 'statics', lab: 'sections', notes: ['s4', 's5'], note: 'L, T and I sections and a plate with a hole, by the composite-part table.' },
    { course: 'statics', lab: 'pappus', note: 'A torus and a sphere from Pappus: the surface and the volume use different centroids.' },
  ],
};
