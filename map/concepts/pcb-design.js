export default {
  id: 'pcb-design',
  title: 'From schematic to circuit board',
  label: ['Circuit boards'],
  subject: 'circuits',
  courses: ['design'],
  eq: String.raw`\begin{gathered}\text{schematic} \to \text{footprints}\\ \to \text{placement} \to \text{routing}\\ \to \text{checks} \to \text{files}\end{gathered}`,
  idea: 'A printed circuit board replaces wires with copper traces on a stiff board. The schematic says what connects to what; each part gets a footprint that matches its pins; then the parts are placed and the connections routed in copper, with vias between layers. Design rule checks catch traces too close or too thin for the maker. Placement decides most of the result: short, direct paths for the parts that matter.',
  requires: ['breadboard-circuits', 'kirchhoff'],
  sources: [
    {
      title: 'Wikipedia, Printed circuit board',
      url: 'https://en.wikipedia.org/wiki/Printed_circuit_board',
      kind: 'Reference',
      level: 'Intro',
      why: 'Layers, traces and vias, and how boards are designed and made.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Electronic design automation',
      url: 'https://en.wikipedia.org/wiki/Electronic_design_automation',
      kind: 'Reference',
      level: 'Intro',
      why: 'The software flow a board goes through: schematic capture, placement and routing.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'board', notes: ['s2'], note: 'A motor and a sensor sharing ground copper, against a star ground and a plane. It covers return paths and IR drop, not trace heating.' },
  ],
};
