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

if (failed) {
  console.error(`selftest: ${failed} failed`);
  process.exit(1);
}
console.log('selftest ok');
