/** OpenStax is the section reference; 18.01SC sets this course's order and difficulty. */
const books = {
  1: 'https://openstax.org/books/calculus-volume-1/pages/',
  2: 'https://openstax.org/books/calculus-volume-2/pages/',
};
export const textbook = (volume, section, slug) => ({
  label: `OpenStax Calculus Volume ${volume}, §${section}`,
  url: `${books[volume]}${section.replace('.', '-')}-${slug}`,
});
export const TEXTBOOK = {
  c1: [
    textbook(1, '2.2', 'the-limit-of-a-function'),
    textbook(1, '3.1', 'defining-the-derivative'),
    textbook(1, '3.6', 'the-chain-rule'),
    textbook(1, '3.8', 'implicit-differentiation'),
    textbook(1, '3.9', 'derivatives-of-exponential-and-logarithmic-functions'),
  ],
};
export const OCW = 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/';
