/**
 * Second routes for the Calc II rules. Run: node src/math/selftest.js
 */
import {
  areaBetween,
  areaBetweenSimpson,
  diskSimpson,
  diskVolume,
  sampleFn,
  segmentLength,
  segmentSimpson,
  shellSimpson,
  shellVolume,
  springSimpson,
  springWork,
  taylorError,
  taylorHorner,
  taylorSum,
  washerShell,
  washerSimpson,
  washerVolume,
  arcsinHalf,
  arcsinHalfSimpson,
  improperArea,
  improperSimpson,
  improperTail,
  altGroups,
  altSum,
  cardioidArea,
  cardioidNaive,
  cardioidSimpson,
  circleAt,
  circleLength,
  circleLengthSimpson,
  circleSlopeImplicit,
  lineAt,
  lineDistance,
  lineLength,
  paraAt,
  paraLength,
  paraLengthSimpson,
  paraSlopeCart,
  paraSpeedDiff,
  polarX,
  polarXCo,
  polarY,
  polarYCo,
  shiftArea,
  shiftDisk,
  shiftNaive,
  shiftSimpson,
  unitArea,
  unitAreaDisk,
  unitNaive,
  geomLoop,
  geomPartial,
  geomTerm,
  harmonicSplit,
  harmonicSum,
  ln2,
  ln2Recip,
  onesLoop,
  onesSum,
  partialLn,
  partialSimpson,
  partialSplit,
  partsXSin,
  partsXSinSimpson,
  squareSplit,
  squareSum,
  sinExact,
  sinSimpson,
  sinSimpson4,
  sinSimpsonPanels,
  sinSquaredHalf,
  sinSquaredSimpson,
  sinTrap,
  sinTrap4,
  sinTrapPanels,
} from './calc2.js';

let failed = 0;

function check(name, cond) {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

function near(a, b, tol = 1e-9) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
}

check('disks of √x on [0, 4] hold 8π', near(diskVolume(4), 8 * Math.PI, 1e-12));
check('shells of that solid hold 8π', near(shellVolume(4), 8 * Math.PI, 1e-12));
check('Simpson disks match the antiderivative', near(diskSimpson(4), diskVolume(4), 1e-8));
check('Simpson shells match the antiderivative', near(shellSimpson(4), shellVolume(4), 1e-8));
check('disks and shells still agree at b = 1', near(diskVolume(1), shellVolume(1), 1e-12));
check('that common volume is π/2', near(diskVolume(1), Math.PI / 2, 1e-12));

check('area between x and x² is 1/6', near(areaBetween(), 1 / 6, 1e-12));
check('Simpson matches that area', near(areaBetweenSimpson(), areaBetween(), 1e-8));
check('washer volume is 2π/15', near(washerVolume(), (2 * Math.PI) / 15, 1e-12));
check('shells rebuild the washer', near(washerShell(), washerVolume(), 1e-12));
check('Simpson matches the washer', near(washerSimpson(), washerVolume(), 1e-8));
check('segment length is √2', near(segmentLength(), Math.SQRT2, 1e-12));
check('Simpson matches the segment', near(segmentSimpson(), segmentLength(), 1e-8));
check('spring work for k=4, d=2 is 8', near(springWork(4, 2), 8, 1e-12));
check('Simpson matches the spring', near(springSimpson(4, 2), springWork(4, 2), 1e-8));

check('Maclaurin line for sine at 1/2 is 1/2', near(taylorSum('sin', 0, 1, 0.5), 0.5, 1e-12));
check('Horner matches that line', near(taylorHorner('sin', 0, 1, 0.5), taylorSum('sin', 0, 1, 0.5), 1e-12));
check('order 3 is 23/48', near(taylorSum('sin', 0, 3, 0.5), 23 / 48, 1e-12));
check('Horner matches order 3', near(taylorHorner('sin', 0, 3, 0.5), 23 / 48, 1e-12));
check('order 5 is 1841/3840', near(taylorSum('sin', 0, 5, 0.5), 1841 / 3840, 1e-12));
check('Horner matches order 5', near(taylorHorner('sin', 0, 5, 0.5), taylorSum('sin', 0, 5, 0.5), 1e-12));
check('order 5 sits closer than order 1', taylorError('sin', 0, 5, 0.5) < taylorError('sin', 0, 1, 0.5));
check('the polynomial matches sine at the centre', near(taylorError('sin', 0, 4, 0), 0, 1e-12));

const shift = Math.PI / 2 + 0.4;
check('shifted order 2 is 0.92', near(taylorSum('sin', Math.PI / 2, 2, shift), 0.92, 1e-12));
check('Horner matches the shift', near(taylorHorner('sin', Math.PI / 2, 2, shift), taylorSum('sin', Math.PI / 2, 2, shift), 1e-12));

check('exp order 4 at 1/2 is 633/384', near(taylorSum('exp', 0, 4, 0.5), 633 / 384, 1e-12));
check('Horner matches exp', near(taylorHorner('exp', 0, 4, 0.5), taylorSum('exp', 0, 4, 0.5), 1e-12));
check('cos order 2 at 1/2 is 7/8', near(taylorSum('cos', 0, 2, 0.5), 7 / 8, 1e-12));
check('Horner matches cos', near(taylorHorner('cos', 0, 2, 0.5), 7 / 8, 1e-12));
check('sample of sine', near(sampleFn('sin', 0), 0, 1e-12));

check('four-panel trapezoid is (π/4)(1+√2)', near(sinTrap(4), sinTrap4(), 1e-12));
check('panel trap matches the weights', near(sinTrapPanels(4), sinTrap(4), 1e-12));
check('eight-panel trap matches too', near(sinTrapPanels(8), sinTrap(8), 1e-12));
check('four-panel Simpson is (π/6)(1+2√2)', near(sinSimpson(4), sinSimpson4(), 1e-12));
check('panel Simpson matches the weights', near(sinSimpsonPanels(4), sinSimpson(4), 1e-12));
check('exact sine integral is 2', near(sinExact(), 2, 1e-12));
check('Simpson is closer than the trapezoid at n=4', Math.abs(sinSimpson(4) - 2) < Math.abs(sinTrap(4) - 2));
check('Simpson is closer at n=8', Math.abs(sinSimpson(8) - 2) < Math.abs(sinTrap(8) - 2));
check('eight panels beat four, for the trapezoid', Math.abs(sinTrap(8) - 2) < Math.abs(sinTrap(4) - 2));
check('eight panels beat four, for Simpson', Math.abs(sinSimpson(8) - 2) < Math.abs(sinSimpson(4) - 2));

check('area up to 2 is 1/2', near(improperArea(2), 0.5, 1e-12));
check('area up to 4 is 3/4', near(improperArea(4), 0.75, 1e-12));
check('area up to 8 is 7/8', near(improperArea(8), 0.875, 1e-12));
check('tail up to 2 is 1/2', near(improperTail(2), 0.5, 1e-12));
check('area and tail add to 1', near(improperArea(4) + improperTail(4), 1, 1e-12));
check('Simpson matches the improper area', near(improperSimpson(4), improperArea(4), 1e-8));

check('parts integral is π', near(partsXSin(), Math.PI, 1e-12));
check('Simpson matches the parts integral', near(partsXSinSimpson(), Math.PI, 1e-8));
check('sine squared on a quarter turn is π/4', near(sinSquaredHalf(), Math.PI / 4, 1e-12));
check('Simpson matches that sine squared', near(sinSquaredSimpson(), sinSquaredHalf(), 1e-8));
check('arcsin of 1/2 is π/6', near(arcsinHalf(), Math.PI / 6, 1e-12));
check('Simpson matches that arcsin', near(arcsinHalfSimpson(), arcsinHalf(), 1e-8));
check('partial fractions equal ln(4/3)', near(partialSplit(), partialLn(), 1e-12));
check('Simpson matches the partial fractions', near(partialSimpson(), partialLn(), 1e-8));

check('eight geometric halves sum to 255/128', near(geomPartial(0.5, 8), 255 / 128, 1e-12));
check('the geometric loop agrees', near(geomLoop(0.5, 8), geomPartial(0.5, 8), 1e-12));
check('the eighth half-power is 1/128', near(geomTerm(0.5, 8), 1 / 128, 1e-12));
check('a long geometric partial sits on its limit', near(geomPartial(0.5, 40), 2, 1e-9));
check('H_8 is 761/280', near(harmonicSum(8), 761 / 280, 1e-12));
check('splitting H_8 agrees', near(harmonicSplit(8), harmonicSum(8), 1e-12));
check('H_n sits above ln(n+1)', harmonicSum(12) > Math.log(13));
check('eight alternating terms sum to 533/840', near(altSum(8), 533 / 840, 1e-12));
check('grouping the alternating terms agrees', near(altGroups(8), altSum(8), 1e-12));
check('ln 2 from the reciprocal agrees', near(ln2Recip(), ln2(), 1e-12));
check('four squares sum to 205/144', near(squareSum(4), 205 / 144, 1e-12));
check('splitting the squares agrees', near(squareSplit(8), squareSum(8), 1e-12));
check('the squares stay under π²/6', squareSum(12) < (Math.PI * Math.PI) / 6);
check('eight ones sum to 8', near(onesSum(8), 8, 1e-12));
check('the ones loop agrees', near(onesLoop(8), onesSum(8), 1e-12));

const top = circleAt(Math.PI / 2);
check('unit circle at π/2 is (0, 1)', near(top.x, 0, 1e-12) && near(top.y, 1, 1e-12));
check('that tangent is horizontal', top.slope != null && near(top.slope, 0, 1e-12));
check('implicit slope agrees at π/2', near(circleSlopeImplicit(Math.PI / 2), 0, 1e-12));
check('unit-circle speed is 1', near(top.speed, 1, 1e-12));
check('quarter-circle length is π/2', near(circleLength(Math.PI / 2), Math.PI / 2, 1e-12));
check('Simpson matches the quarter circle', near(circleLengthSimpson(Math.PI / 2), Math.PI / 2, 1e-9));
const corner = circleAt(Math.PI / 4);
check('slope at π/4 is −1', near(corner.slope, -1, 1e-12));
check('implicit slope agrees at π/4', near(circleSlopeImplicit(Math.PI / 4), -1, 1e-12));

const para = paraAt(1);
check('parabola at 1 is (1, 1)', near(para.x, 1, 1e-12) && near(para.y, 1, 1e-12));
check('parabola slope is 2', near(para.slope, 2, 1e-12) && near(paraSlopeCart(1), 2, 1e-12));
check('parabola speed is √5', near(para.speed, Math.sqrt(5), 1e-12));
check('a difference quotient matches that speed', near(paraSpeedDiff(1), Math.sqrt(5), 1e-6));
check('parabola length matches Simpson', near(paraLengthSimpson(1), paraLength(1), 1e-8));

const line = lineAt(1);
check('line at 1 is (1, 2)', near(line.x, 1, 1e-12) && near(line.y, 2, 1e-12));
check('line slope is 2', near(line.slope, 2, 1e-12));
check('line length is the distance √5', near(lineLength(1), Math.sqrt(5), 1e-12) && near(lineDistance(1), Math.sqrt(5), 1e-12));

check('r=2 at π/3 is (1, √3)', near(polarX(2, Math.PI / 3), 1, 1e-12) && near(polarY(2, Math.PI / 3), Math.sqrt(3), 1e-12));
check('cofunction conversion agrees', near(polarXCo(2, Math.PI / 3), polarX(2, Math.PI / 3), 1e-12) && near(polarYCo(2, Math.PI / 3), polarY(2, Math.PI / 3), 1e-12));

check('unit disk has area π', near(unitArea(2 * Math.PI), Math.PI, 1e-12));
check('the disk fraction agrees', near(unitAreaDisk(2 * Math.PI), Math.PI, 1e-12));
check('integrating r around the unit circle gives 2π', near(unitNaive(2 * Math.PI), 2 * Math.PI, 1e-12));
check('a half turn of the unit circle is π/2', near(unitArea(Math.PI), Math.PI / 2, 1e-12));
check('full cardioid area is 3π/2', near(cardioidArea(2 * Math.PI), (3 * Math.PI) / 2, 1e-12));
check('Simpson matches the cardioid', near(cardioidSimpson(2 * Math.PI), (3 * Math.PI) / 2, 1e-8));
check('cardioid to π is 3π/4', near(cardioidArea(Math.PI), (3 * Math.PI) / 4, 1e-12));
check('integrating the cardioid radius gives 2π', near(cardioidNaive(2 * Math.PI), 2 * Math.PI, 1e-9));
check('shifted circle has area π', near(shiftArea(Math.PI / 2), Math.PI, 1e-12) && near(shiftDisk(), Math.PI, 1e-12));
check('Simpson matches the shifted circle', near(shiftSimpson(Math.PI / 2), Math.PI, 1e-8));
check('half of that circle is π/2', near(shiftArea(0), Math.PI / 2, 1e-12));
check('integrating r on the shifted circle gives 4', near(shiftNaive(Math.PI / 2), 4, 1e-12));

if (failed) {
  console.error(`selftest: ${failed} failed`);
  process.exit(1);
}
console.log('selftest ok');
