export default {
  id: 'fatigue',
  title: 'Fatigue',
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`\sigma_a = \sigma_f'\,(2N_f)^b\ \text{(Basquin)}, \qquad \frac{da}{dN} = C\,(\Delta K)^m\ \text{(Paris)}`,
  idea: String.raw`A load far below yield, repeated enough times, still breaks parts. Cracks start at notches and surface flaws, where stress concentrates, and grow a little each cycle. The S–N curve gives life against stress amplitude; some steels show an endurance limit below which they last indefinitely. The Paris law integrates crack growth per cycle until the crack reaches the critical length set by the fracture toughness, which is how inspection intervals are set.`,
  requires: ['fracture-toughness', 'stress-concentration'],
  sources: [
    {
      title: 'Fatigue (material) (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Fatigue_(material)',
      kind: 'Reference article',
      level: 'Course level',
      why: 'S–N curves, endurance limits and the stages of fatigue cracking.',
      checked: '2026-11-06',
    },
    {
      title: 'Paris’ law (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Paris%27_law',
      kind: 'Reference article',
      level: 'Deeper',
      why: 'Crack growth per cycle and how it is integrated to a life.',
      checked: '2026-11-06',
    },
  ],
  labs: [],
  candidate: 'Cycle a cracked part and grow the crack by the Paris law until it reaches the critical length. It corrects the idea that a load below yield is safe forever.',
};
