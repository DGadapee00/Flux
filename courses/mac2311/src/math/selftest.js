/**
 * Second routes for the Calc I rules. Run: node src/math/selftest.js
 */
import {
  accumArea,
  accumHeight,
  accumSimpson,
  accumStep,
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
  boxBestCut,
  boxBestCutSearch,
  boxVolume,
  boxVolumeRate,
  boxVolumeStep,
  cubicCritical,
  cubicCriticalSearch,
  cubicCriticalValue,
  cubicInflection,
  cubicInflectionSearch,
  differenceLimit,
  differenceLimitHopital,
  ladderStep,
  ladderVelocity,
  newtonSqrt,
  newtonSqrtStep,
  sincLimit,
  sincLimitHopital,
  sqrtLinear,
  sqrtLinearQuotient,
  squareMvt,
  squareMvtQuotient,
  lawAverage,
  lawExact,
  lineIntegral,
  lineIntegralSimpson,
  leftSquare01,
  leftSquareLoop,
  midSquare01,
  midSquareLoop,
  polyAt,
  polyAverage,
  powerIntegral,
  powerIntegralSimpson,
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
  substExpanded,
  substIntegral,
  sineRule,
  limitPicture,
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
check('accumulation of x² up to 1 is 1/3', near(accumArea('quad', 0, 1), 1 / 3, 1e-12));
check('that accumulation grows at height 1', near(accumHeight('quad', 1), 1, 1e-12));
check('a short move of the limit matches the height', near(accumStep('quad', 0, 1), 1, 1e-6));
check('Simpson matches the accumulation', near(accumSimpson('quad', 0, 1), accumArea('quad', 0, 1), 1e-8));
check('accumulation up to 2 is 8/3', near(accumArea('quad', 0, 2), 8 / 3, 1e-12));
check('sine accumulates to 1 by π/2', near(accumArea('sine', 0, Math.PI / 2), 1, 1e-12));
check('line integral on [0, 1] is 2', near(lineIntegral(1), 2, 1e-12));
check('Simpson matches the line integral', near(lineIntegralSimpson(1), 2, 1e-8));
check('∫x³ on [0, 2] is 4', near(powerIntegral(3, 2), 4, 1e-12));
check('Simpson matches that power integral', near(powerIntegralSimpson(3, 2), 4, 1e-8));
check('substitution integral for n=2 is 7/3', near(substIntegral(2), 7 / 3, 1e-12));
check('the binomial expansion agrees', near(substExpanded(2), substIntegral(2), 1e-12));
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
check('a short slide matches that velocity', near(ladderStep(10, 6, 2), -1.5, 1e-4));
check('doubling the base speed doubles the top speed', near(ladderVelocity(10, 6, 4).dy, -3, 1e-12));
check('the top drops faster when the base is farther out', Math.abs(ladderVelocity(10, 8, 2).dy) > Math.abs(ladderVelocity(10, 2, 2).dy));

check('open box at the peak holds 128', near(boxVolume(12, 2), 128, 1e-12));
check('open box slope is zero at the peak', near(boxVolumeRate(12, 2), 0, 1e-12));
check('a short cut change matches that slope', near(boxVolumeStep(12, 1), boxVolumeRate(12, 1), 1e-6));
check('the centered step is zero at the peak', near(boxVolumeStep(12, 2), 0, 1e-6));
check('a scan finds the peak cut', near(boxBestCutSearch(12), boxBestCut(12), 1e-8));
check('the small cut holds less than the peak', boxVolume(12, 1) < boxVolume(12, boxBestCut(12)));
check('the large cut holds less than the peak', boxVolume(12, 4) < boxVolume(12, boxBestCut(12)));
check('square root tangent line', near(sqrtLinear(2), 2.25, 1e-12));
check('square root tangent line as a quotient', near(sqrtLinearQuotient(2), sqrtLinear(2), 1e-12));
check('critical point of x³−3x', near(cubicCritical(3), 1, 1e-12));
check('value at that critical point', near(cubicCriticalValue(3), -2, 1e-12));
check('bisection finds the critical point', near(cubicCriticalSearch(3), 1, 1e-8));
check('mean value c is the midpoint', near(squareMvt(1, 5), 3, 1e-12));
check('secant slope gives the same c', near(squareMvtQuotient(1, 5), squareMvt(1, 5), 1e-12));
check('inflection of x³+3x²', near(cubicInflection(3), -1, 1e-12));
check('bisection finds the inflection', near(cubicInflectionSearch(3), -1, 1e-8));
check('cancelled limit is 4', near(differenceLimit(2), 4, 1e-12));
check("L'Hôpital agrees on that limit", near(differenceLimitHopital(2), 4, 1e-8));
check('sin(2x)/x tends to 2', near(sincLimit(2), 2, 1e-12));
check("L'Hôpital agrees on sine over x", near(sincLimitHopital(2), 2, 1e-6));
check('one Newton step from 2', near(newtonSqrt(2, 2), 1.5, 1e-12));
check('the update formula agrees', near(newtonSqrtStep(2, 2), newtonSqrt(2, 2), 1e-12));
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

const holePic = limitPicture('hole', { a: 3, h: 0.4 });
check('hole limit is 6', near(holePic.limit, 6, 1e-12));
check('hole has no value', Number.isFinite(holePic.value) === false);
check('hole probes match the limit', near(holePic.probeLeft, 6, 1e-5) && near(holePic.probeRight, 6, 1e-5));
check('hole samples sit off the limit by h', near(holePic.sampleLeft, 6 - 0.4, 1e-12) && near(holePic.sampleRight, 6 + 0.4, 1e-12));

const jumpPic = limitPicture('jump', { a: 1, h: 0.2, leftValue: 0, rightValue: 4 });
check('jump sides are the two values', near(jumpPic.left, 0, 1e-12) && near(jumpPic.right, 4, 1e-12));
check('jump has no two-sided limit', jumpPic.exists === false && Number.isFinite(jumpPic.limit) === false);
check('jump probes match the sides', near(jumpPic.probeLeft, 0, 1e-12) && near(jumpPic.probeRight, 4, 1e-12));

const signPic = limitPicture('sign', { a: 0, h: 0.3 });
check('sign sides are −1 and 1', near(signPic.left, -1, 1e-12) && near(signPic.right, 1, 1e-12));
check('sign limit does not exist', signPic.exists === false);

const band = limitPicture('line', { a: 1, h: 0.01, eps: 0.1, m: 2 });
check('line limit is m·a', near(band.limit, 2, 1e-12));
check('line delta matches the bisection', near(band.delta, 0.05, 1e-12) && near(band.deltaAlt, 0.05, 1e-6));
check('a step inside delta stays in the band', band.inside === true);
const outside = limitPicture('line', { a: 1, h: 0.2, eps: 0.1, m: 2 });
check('a step past delta leaves the band', outside.inside === false);

if (failed) {
  console.error(`selftest: ${failed} failed`);
  process.exit(1);
}
console.log('selftest ok');
