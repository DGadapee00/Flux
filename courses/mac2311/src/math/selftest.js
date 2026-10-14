/**
 * Second routes for the Calc I rules. Run: node src/math/selftest.js
 */
import {
  absContinuousAt,
  absDifferentiableAt0,
  chainExpanded,
  chainRule,
  circleSlope,
  circleSlopeSolved,
  deltaFor,
  deltaSearch,
  exactSquare01,
  holeLimit,
  holePlugged,
  ladderVelocity,
  lawAverage,
  lawExact,
  leftSquare01,
  leftSquareLoop,
  midSquare01,
  midSquareLoop,
  polyAt,
  polyAverage,
  powerQuotient,
  powerRule,
  productExpanded,
  productRule,
  quotientQuotient,
  quotientRule,
  secantSlope,
  sidesOfAbs,
  simpsonSquare01,
  sineQuotient,
  sineRule,
  squeezeHolds,
} from './calc1.js';

let failed = 0;

function check(name, cond) {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

function near(a, b, tol = 1e-6) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
}

const f = (x) => x * x;
check('secant of x² at 1, h=0.4, is 2.4', near(secantSlope(f, 1, 0.4), 2.4, 1e-12));
check('left formula n=4 is 0.21875', near(leftSquare01(4), 0.21875, 1e-12));
check('left formula matches the loop', near(leftSquare01(4), leftSquareLoop(4), 1e-12));
check('left formula matches the loop at n=10', near(leftSquare01(10), leftSquareLoop(10), 1e-12));
check('mid formula n=4 is 0.328125', near(midSquare01(4), 0.328125, 1e-12));
check('mid formula matches the loop', near(midSquare01(8), midSquareLoop(8), 1e-12));
check('exact ∫x² on [0,1] is 1/3', near(exactSquare01(), 1 / 3, 1e-12));
check('Simpson agrees with 1/3', near(simpsonSquare01(), 1 / 3, 1e-9));
check('left sum sits under the integral', leftSquare01(4) < exactSquare01());
check('midpoint is closer than the left sum', Math.abs(midSquare01(4) - 1 / 3) < Math.abs(leftSquare01(4) - 1 / 3));

check('power rule matches the quotient', near(powerRule(4, 2), powerQuotient(4, 2), 1e-6));
check('product rule matches the expansion', near(productRule(2, 1, 2), 28, 1e-12));
check('product expansion', near(productExpanded(2, 1, 2), productRule(2, 1, 2), 1e-12));
check('quotient at (2,1) is 8/9', near(quotientRule(1, 2), 8 / 9, 1e-12));
check('quotient matches the difference quotient', near(quotientRule(1, 2), quotientQuotient(1, 2), 1e-6));
check('chain rule at (2,1,1) is 54', near(chainRule(2, 1, 1), 54, 1e-12));
check('chain expansion agrees', near(chainExpanded(2, 1, 1), chainRule(2, 1, 1), 1e-12));
check('circle slope −3/4', near(circleSlope(3, 4), -0.75, 1e-12));
check('solved circle agrees', near(circleSlopeSolved(5, 3), circleSlope(3, 4), 1e-12));

const ladder = ladderVelocity(10, 6, 2);
check('ladder height is 8', near(ladder.y, 8, 1e-12));
check('ladder top velocity is −1.5', near(ladder.dy, -1.5, 1e-12));
check('sine rule matches the quotient', near(sineRule(2, 0), sineQuotient(2, 0), 1e-6));
check('sine at 0 is the coefficient', near(sineRule(2, 0), 2, 1e-12));

check('polynomial plug-in', near(polyAt(2, 3), 10, 1e-12));
check('polynomial average agrees', near(polyAverage(2, 3), polyAt(2, 3), 1e-8));
check('hole limit is 2a', near(holeLimit(3), 6, 1e-12));
check('hole samples agree', near(holePlugged(3), holeLimit(3), 1e-6));
check('limit law', near(lawExact(2, 2), 14, 1e-12));
check('limit law average', near(lawAverage(2, 2), lawExact(2, 2), 1e-8));
check('delta is ε/|m|', near(deltaFor(2, 0.1), 0.05, 1e-12));
check('bisection finds that delta', near(deltaSearch(2, 0.1), 0.05, 1e-6));

const sides = sidesOfAbs(0);
check('left side of |x|/x is −1', near(sides.left, -1, 1e-9));
check('right side of |x|/x is 1', near(sides.right, 1, 1e-9));
check('two-sided limit does not exist', sides.exists === false);
check('|x| is continuous at 0', absContinuousAt(0) === true);
check('|x| is not differentiable at 0', absDifferentiableAt0() === false);
check('squeeze bound holds', squeezeHolds() === true);

if (failed) {
  console.error(`selftest: ${failed} failed`);
  process.exit(1);
}
console.log('selftest ok');
