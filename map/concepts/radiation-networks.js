export default {
  id: 'radiation-networks',
  title: 'Gray-body radiation networks',
  label: ['Radiation', 'networks'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`q_i = \frac{E_{b,i} - J_i}{(1 - \varepsilon_i)/(\varepsilon_i A_i)}, \qquad q_{ij} = \frac{J_i - J_j}{1/(A_iF_{ij})}`,
  idea: String.raw`A gray surface reflects part of what lands on it, so what leaves it, its radiosity \(J\), is emission plus reflection. Each surface then behaves like a node joined to its black-body potential through a surface resistance, and to every other node through a space resistance set by the view factor. Solve the network as a circuit and the heat flows come out. A thin shield between two plates adds two surface resistances, so one polished shield can cut the exchange roughly in half or better.`,
  requires: ['view-factors', 'thermal-resistance'],
  related: [
    {
      id: 'kirchhoff',
      note: String.raw`The network is solved as a circuit: radiosities are node voltages, and heat flows balance at each node.`,
    },
  ],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapter 10 builds the gray-body network and treats shields.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.51, calendar: Gray body networks (lecture 23)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course’s lecture on exchange among gray surfaces.',
      checked: '2026-11-06',
    },
  ],
  labs: [],
  candidate: 'Two hot plates with radiation shields you add one at a time and polish. It corrects the idea that a shield must be cold to work: it floats at an in-between temperature, and its low emissivity does the work.',
};
