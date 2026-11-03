export default {
  id: 'descriptive-statistics',
  title: 'Describing data',
  subject: 'stats',
  courses: ['sta3032'],
  eq: String.raw`\bar x = \frac1n\sum x_i, \qquad s^2 = \frac{1}{n-1}\sum (x_i - \bar x)^2, \qquad \text{IQR} = Q_3 - Q_1`,
  idea: String.raw`A data set is summarised by where it sits and how far it spreads. The mean and standard deviation are pulled by one extreme value; the median and quartiles are not. A histogram's shape depends on its bins, so try more than one. A box plot marks values past \(1.5\,\text{IQR}\) from the quartiles as possible outliers, to look at, not to delete.`,
  requires: [],
  sources: [
    {
      title: 'OpenStax Introductory Statistics 2e, §2.4 Box plots',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/2-4-box-plots',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Quartiles, fences and outliers drawn step by step.',
    },
    {
      title: 'OpenStax Introductory Statistics 2e, §2.7 Measures of the spread of the data',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/2-7-measures-of-the-spread-of-the-data',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Standard deviation and why it divides by n − 1.',
    },
  ],
  labs: [
    { course: 'sta3032', lab: 'describe', note: 'One data set as a histogram, a dot plot and a box plot, with the largest value moved.' },
  ],
};
