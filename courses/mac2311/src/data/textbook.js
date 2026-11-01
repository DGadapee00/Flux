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
  c5: [
    textbook(2, '7.1', 'parametric-equations'),
    textbook(2, '7.2', 'calculus-of-parametric-curves'),
    textbook(2, '7.3', 'polar-coordinates'),
    textbook(2, '7.4', 'area-and-arc-length-in-polar-coordinates'),
    textbook(2, '7.5', 'conic-sections'),
  ],
  c4: [
    textbook(2, '3.1', 'integration-by-parts'),
    textbook(2, '3.2', 'trigonometric-integrals'),
    textbook(2, '3.3', 'trigonometric-substitution'),
    textbook(2, '3.4', 'partial-fractions'),
    textbook(2, '2.4', 'arc-length-of-a-curve-and-surface-area'),
  ],
  c3: [
    textbook(1, '5.2', 'the-definite-integral'),
    textbook(1, '5.3', 'the-fundamental-theorem-of-calculus'),
    textbook(1, '5.4', 'integration-formulas-and-the-net-change-theorem'),
    textbook(1, '5.5', 'substitution'),
    textbook(2, '2.2', 'determining-volumes-by-slicing'),
    textbook(2, '2.5', 'physical-applications'),
    textbook(2, '2.6', 'moments-and-centers-of-mass'),
    textbook(2, '3.6', 'numerical-integration'),
  ],
  c2: [
    textbook(1, '4.1', 'related-rates'),
    textbook(1, '4.2', 'linear-approximations-and-differentials'),
    textbook(1, '4.4', 'the-mean-value-theorem'),
    textbook(1, '4.7', 'applied-optimization-problems'),
    textbook(1, '4.9', 'newtons-method'),
    textbook(1, '4.10', 'antiderivatives'),
  ],
  c1: [
    textbook(1, '2.2', 'the-limit-of-a-function'),
    textbook(1, '3.1', 'defining-the-derivative'),
    textbook(1, '3.6', 'the-chain-rule'),
    textbook(1, '3.8', 'implicit-differentiation'),
    textbook(1, '3.9', 'derivatives-of-exponential-and-logarithmic-functions'),
  ],
};
export const OCW = 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/';
