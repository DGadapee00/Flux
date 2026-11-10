export default {
  id: 'spacecraft-power',
  title: 'Spacecraft power: arrays, batteries and eclipse',
  label: ['Spacecraft power'],
  subject: 'circuits',
  courses: ['satellite'],
  eq: String.raw`\begin{gathered}E_\text{batt} \ge \frac{P\,T_\text{ecl}}{\mathrm{DoD}\;\eta} \\ P_\text{arr}\,T_\text{sun} \ge P\,T_\text{sun} + \frac{P\,T_\text{ecl}}{\eta}\end{gathered}`,
  idea: 'A satellite in low orbit spends part of each orbit in Earth’s shadow. The solar array must run the loads in sunlight and also refill the battery for the eclipse, so it is sized for more than the average load. The battery is sized so an eclipse uses only part of it: a shallow depth of discharge lets it survive thousands of cycles. Arrays lose output as radiation damages them, so they are sized for the end of the mission.',
  requires: ['electric-power', 'internal-resistance'],
  sources: [
    {
      title: 'MIT 16.851, Lecture 3: Spacecraft power systems',
      url: 'https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l3_scpowersys_dm_done2/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Solar arrays, battery chemistries, depth of discharge and end-of-life sizing for a satellite.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Solar panels on spacecraft',
      url: 'https://en.wikipedia.org/wiki/Solar_panels_on_spacecraft',
      kind: 'Reference',
      level: 'Intro',
      why: 'How arrays are used in orbit, why they degrade and how batteries carry the load.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'satellite', lab: 'power', notes: ['s1'], note: 'An array and battery run through five orbits: an array that only matches the average load lets the battery sink a little every orbit.' },
    { course: 'satellite', lab: 'ageing', notes: ['s3'], note: 'A battery cycled every orbit and an array losing power each year: a fading battery discharges deeper, which fades it faster, so power is sized for end of life. The closed form is checked by marching the battery cycle by cycle.' },
  ],
};
