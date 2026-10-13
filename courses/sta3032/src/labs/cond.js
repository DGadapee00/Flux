/**
 * Conditional probability (Ch 2): a screening test as an area model and a tree.
 *
 * The unit square is everyone. A vertical cut splits off P(A), the people with the condition;
 * within each column, the shaded part is those who test positive: P(B | A) of the A column (gold,
 * true positives) and P(B | A′) of the rest (pink, false positives). P(A | B) is the gold area
 * over all the shaded area: Bayes' rule, as a picture.
 *
 * What it corrects: that P(A | B) and P(B | A) are the same number (for a rare condition they are
 * wildly different), and that a "95% accurate" test gives a 95% reliable positive.
 */
import { defineLab } from './define.js';
import { setup, label, C, alpha } from '../plot/plot.js';

const f4 = (x) => x.toFixed(4);

export default defineLab({
  id: 'cond',
  title: 'Conditional probability',
  ch: ['2'],
  blurb: 'A screening test as an area model and a tree: why P(A | B) and P(B | A) are different numbers, and Bayes’ rule as a picture.',
  height: 1.1,
  params: [
    { id: 'pA', label: '$P(A)$: has the condition', type: 'range', min: 0.001, max: 0.6, step: 0.001, value: 0.1 },
    { id: 'sens', label: String.raw`$P(B \mid A)$: positive if they have it`, type: 'range', min: 0, max: 1, step: 0.01, value: 0.9 },
    { id: 'fpr', label: String.raw`$P(B \mid A')$: positive if they don’t`, type: 'range', min: 0, max: 1, step: 0.01, value: 0.1 },
  ],
  scenarios: [
    { id: 'rare', label: 'A rare disease, a good test (1%, 95%, 5%)', state: { pA: 0.01, sens: 0.95, fpr: 0.05 } },
    { id: 'common', label: 'A common condition, same test (30%)', state: { pA: 0.3, sens: 0.95, fpr: 0.05 } },
    { id: 'indep', label: 'A useless test: B independent of A', state: { pA: 0.2, sens: 0.3, fpr: 0.3 } },
  ],

  compute(s) {
    const AB = s.pA * s.sens;
    const AnB = s.pA * (1 - s.sens);
    const nAB = (1 - s.pA) * s.fpr;
    const nAnB = (1 - s.pA) * (1 - s.fpr);
    const pB = AB + nAB;
    return { AB, AnB, nAB, nAnB, pB, post: pB > 0 ? AB / pB : NaN, npv: nAnB / (AnB + nAnB) };
  },

  draw(canvas, s, r) {
    const { ctx, w, h } = setup(canvas);
    // Area model: top part of the canvas.
    const side = Math.min(w - 24, h * 0.52);
    const x0 = (w - side) / 2;
    const y0 = 20;
    const cut = x0 + side * s.pA;
    const box = (x, y, bw, bh, fill) => {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, bw, bh);
    };
    box(x0, y0, side, side, alpha(C.text, 0.05));
    // A column: positives at the bottom.
    box(x0, y0 + side * (1 - s.sens), cut - x0, side * s.sens, alpha(C.gold, 0.85));
    box(cut, y0 + side * (1 - s.fpr), x0 + side - cut, side * s.fpr, alpha(C.pink, 0.6));
    ctx.strokeStyle = alpha(C.text, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, side - 1, side - 1);
    ctx.beginPath();
    ctx.moveTo(cut, y0);
    ctx.lineTo(cut, y0 + side);
    ctx.stroke();
    label(ctx, `A: ${(100 * s.pA).toPrecision(3)}%`, Math.max(x0 + 2, cut - 2), y0 - 4, { color: C.gold, align: s.pA < 0.3 ? 'left' : 'right' });
    label(ctx, "A′", x0 + side - 4, y0 - 4, { color: C.muted, align: 'right' });
    label(ctx, 'tested positive (B) →', x0 + side - 6, y0 + side - 6, { color: C.text, align: 'right' });

    // Tree, below.
    const ty = y0 + side + 26;
    const th = h - ty - 10;
    const cx = [14, w * 0.3, w * 0.58];
    const ys = [ty + th * 0.125, ty + th * 0.375, ty + th * 0.625, ty + th * 0.875];
    const mid = [(ys[0] + ys[1]) / 2, (ys[2] + ys[3]) / 2];
    const root = (mid[0] + mid[1]) / 2;
    const edge = (xa, ya, xb, yb, txt, col) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xa, ya);
      ctx.lineTo(xb, yb);
      ctx.stroke();
      const up = yb < ya;
      label(ctx, txt, (xa + xb) / 2, (ya + yb) / 2 + (up ? -4 : 4), { color: C.muted, align: 'center', baseline: up ? 'bottom' : 'top' });
    };
    edge(cx[0], root, cx[1], mid[0], s.pA.toFixed(3), C.gold);
    edge(cx[0], root, cx[1], mid[1], (1 - s.pA).toFixed(3), C.muted);
    edge(cx[1], mid[0], cx[2], ys[0], s.sens.toFixed(2), C.gold);
    edge(cx[1], mid[0], cx[2], ys[1], (1 - s.sens).toFixed(2), C.muted);
    edge(cx[1], mid[1], cx[2], ys[2], s.fpr.toFixed(2), C.pink);
    edge(cx[1], mid[1], cx[2], ys[3], (1 - s.fpr).toFixed(2), C.muted);
    label(ctx, 'A', cx[1] - 8, mid[0], { color: C.gold, baseline: 'middle', align: 'right' });
    label(ctx, "A′", cx[1] - 8, mid[1], { color: C.muted, baseline: 'middle', align: 'right' });
    const leaves = [
      ['A ∩ B', r.AB, C.gold],
      ["A ∩ B′", r.AnB, C.muted],
      ["A′ ∩ B", r.nAB, C.pink],
      ["A′ ∩ B′", r.nAnB, C.muted],
    ];
    leaves.forEach(([t, p, col], i) => label(ctx, `${t} = ${f4(p)}`, cx[2] + 8, ys[i], { color: col, baseline: 'middle' }));
    return {};
  },

  readout(s, r) {
    return [
      ['$P(B)$', `$${f4(r.pB)}$`],
      [String.raw`$P(A \mid B)$`, `$${Number.isFinite(r.post) ? f4(r.post) : '—'}$`],
      [String.raw`$P(B \mid A)$`, `$${s.sens.toFixed(2)}$`],
    ];
  },

  explain(s, r) {
    const out = [
      String.raw`Total probability: $P(B) = P(A)P(B \mid A) + P(A')P(B \mid A') = ${f4(r.AB)} + ${f4(r.nAB)} = ${f4(r.pB)}$, all the shaded area.`,
      String.raw`Bayes' rule: $P(A \mid B) = \dfrac{P(A \cap B)}{P(B)} = \dfrac{${f4(r.AB)}}{${f4(r.pB)}} = ${Number.isFinite(r.post) ? f4(r.post) : '—'}$: the gold share of the shaded area.`,
    ];
    if (Math.abs(s.sens - s.fpr) < 1e-9) out.push(String.raw`Here $P(B \mid A) = P(B \mid A')$: testing positive is equally likely either way, so B is independent of A, and $P(A \mid B) = P(A)$. The test tells you nothing.`);
    else if (r.nAB > r.AB) out.push(String.raw`The pink area (false positives) is bigger than the gold (true positives): most positives come from the large group without the condition, even though each of them tests positive only ${Math.round(100 * s.fpr)}% of the time.`);
    return out;
  },

  predictions: [
    {
      id: 'rare',
      setup: { pA: 0.5, sens: 0.95, fpr: 0.05 },
      change: { pA: 0.01 },
      prompt: 'A test catches 95% of cases and gives 5% false positives. When half the people have the condition, P(has it | positive) = 0.95. Now the condition is rare: 1 in 100. P(has it | positive) becomes about…',
      options: [['95', 'still 0.95'], ['50', 'about 0.5'], ['16', 'below 0.2']],
      outcome: (b, a) => (a.post > 0.9 ? '95' : a.post > 0.3 ? '50' : '16'),
      expect: '16',
      why: 'Out of 10,000 people: 100 have it and 95 of them test positive; 9,900 do not, and 5% of them, 495, test positive anyway. So only 95 of 590 positives have it: 0.161. A rare condition is swamped by false positives.',
    },
    {
      id: 'independent',
      setup: { pA: 0.3, sens: 0.9, fpr: 0.1 },
      change: { fpr: 0.9 },
      prompt: 'Make the false-positive rate equal to the detection rate: P(B | A′) = P(B | A) = 0.9. P(A | B) becomes…',
      options: [['pa', 'equal to P(A) = 0.3'], ['high', 'about 0.9'], ['zero', 'close to 0']],
      outcome: (b, a, s) => (Math.abs(a.post - s.pA) < 1e-9 ? 'pa' : a.post > 0.8 ? 'high' : a.post < 0.1 ? 'zero' : 'other'),
      expect: 'pa',
      why: 'If B is just as likely with or without A, knowing B happened tells you nothing about A: A and B are independent, and P(A | B) = P(A). In the square, both columns are shaded to the same height, so the gold share of the shading is the gold share of the width.',
    },
    {
      id: 'specificity',
      setup: { pA: 0.01, sens: 0.95, fpr: 0.05 },
      change: { fpr: 0.01 },
      prompt: 'For the rare condition (1%), P(has it | positive) is only 0.16. Cut the false-positive rate from 5% to 1%. P(has it | positive)…',
      options: [['little', 'barely changes'], ['lot', 'roughly triples'], ['one', 'goes to almost 1']],
      outcome: (b, a) => (a.post > 0.9 ? 'one' : a.post > 2 * b.post ? 'lot' : 'little'),
      expect: 'lot',
      why: 'The false positives were most of the positives, so cutting them five-fold matters a lot: 95 true against 99 false positives now, P(A | B) = 0.49. Raising the detection rate instead would hardly help; it is already 95%.',
    },
  ],
});
