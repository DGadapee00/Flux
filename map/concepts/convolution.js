export default {
  id: 'convolution',
  title: 'Convolution',
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`y(t) = \int_0^t w(t - \tau)\,f(\tau)\,d\tau, \qquad \mathcal L\{w * f\} = W(s)\,F(s)`,
  idea: String.raw`A linear system at rest answers any input by adding up its impulse response, shifted to each moment of the input and weighted by it. So the output now carries a weighted memory of the input's past, and keeps responding after the input stops. In the Laplace domain convolution becomes a plain product.`,
  requires: ['laplace-transform'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §6.3 Convolution',
      url: 'https://www.jirka.org/diffyqs/html/convolution_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Convolution and its transform, with worked circuits.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.03SC, Convolution',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-iii-fourier-series-and-laplace-transform/convolution/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'The weighted-history picture on video, with problems.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'convolution', notes: ['s6'], note: 'An RC circuit keeps responding after a pulse ends, sample by weighted sample.' },
  ],
};
