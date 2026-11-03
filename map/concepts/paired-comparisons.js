export default {
  id: 'paired-comparisons',
  title: 'Paired and independent samples',
  label: ['Paired', 'samples'],
  subject: 'stats',
  courses: ['sta3032'],
  eq: String.raw`t = \frac{\bar d}{s_d/\sqrt n}\ \text{(paired)}, \qquad t = \frac{\bar x_1 - \bar x_2}{\sqrt{s_1^2/n_1 + s_2^2/n_2}}\ \text{(independent)}`,
  idea: String.raw`Measuring the same subjects twice lets each one serve as its own control. Taking differences removes the spread between subjects, so a small effect can stand out. Treating paired data as two independent groups leaves that spread in and can hide the effect. When subjects are all alike, pairing gains little.`,
  requires: ['hypothesis-tests'],
  sources: [
    {
      title: 'OpenStax Introductory Statistics 2e, §10.4 Matched or paired samples',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/10-4-matched-or-paired-samples',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The paired t test worked from differences.',
    },
    {
      title: 'MIT 18.05, Reading 19: NHST III, gallery of tests',
      url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2014/resources/mit18_05s14_reading19/',
      kind: 'Reading notes',
      level: 'Course level',
      why: 'Two-sample tests with and without pairing.',
    },
  ],
  labs: [
    { course: 'sta3032', lab: 'paired', note: 'The same subjects before and after: the paired test against the independent one.' },
  ],
};
