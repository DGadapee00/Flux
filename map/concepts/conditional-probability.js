export default {
  id: 'conditional-probability',
  title: 'Conditional probability and Bayes’ theorem',
  label: ['Conditional', 'probability'],
  subject: 'stats',
  courses: ['sta3032'],
  eq: String.raw`P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)}`,
  idea: String.raw`Knowing that \(B\) happened shrinks the world to \(B\), and \(P(A \mid B)\) is \(A\)'s share of it. Bayes' theorem turns a test's accuracy into what a positive result means. For a rare condition, most positives are false even with a good test, because the healthy group is so much larger. An area model or a tree makes that plain.`,
  requires: [],
  sources: [
    {
      title: 'MIT 18.05, Reading 3: Conditional probability, Bayes’ theorem',
      url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2014/resources/mit18_05s14_reading3/',
      kind: 'Reading notes',
      level: 'Course level',
      why: 'Trees and Bayes with the base-rate example worked.',
    },
    {
      title: 'OpenStax Introductory Statistics 2e, §3.5 Tree and Venn diagrams',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/3-5-tree-and-venn-diagrams',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Conditional probability read off trees.',
    },
  ],
  labs: [
    { course: 'sta3032', lab: 'cond', note: 'A screening test as an area model and a tree: rare conditions make most positives false.' },
  ],
};
