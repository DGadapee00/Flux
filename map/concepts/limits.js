export default {
  id: 'limits',
  title: 'Limits and continuity',
  label: ['Limits and', 'continuity'],
  subject: 'calculus',
  courses: ['mac2311'],
  eq: String.raw`\lim_{x\to a} f(x) = L \iff \forall\varepsilon>0\ \exists\delta>0:\ 0<|x-a|<\delta \Rightarrow |f(x)-L|<\varepsilon`,
  idea: String.raw`A limit is the value a function heads toward as its input closes in, whatever happens exactly there. Both sides must agree. A function is continuous where its limit equals its value, so its graph has no jump or hole. The \(\varepsilon\)–\(\delta\) definition makes "closes in" precise: any tolerance on the output can be met by a tight enough input. A \(0/0\) form needs algebra or L'Hôpital's rule before the limit shows.`,
  requires: [],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 1, §2.2 The limit of a function',
      url: 'https://openstax.org/books/calculus-volume-1/pages/2-2-the-limit-of-a-function',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'One-sided limits and the cases where a limit does not exist.',
    },
    {
      title: 'MIT 18.01SC, Part A: Definition and basic rules',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/1.-differentiation/part-a-definition-and-basic-rules/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Limits and continuity as the course sets them up for derivatives.',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'limits', notes: ['s2', 's1', 's3', 's4', 's5', 'c2/s5', 'c6/s1'], note: String.raw`Slide \(a\) and \(h\) and watch both sides close in, with an \(\varepsilon\) band.` },
  ],
};
