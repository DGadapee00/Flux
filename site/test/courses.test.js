import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSES, courseLines } from '../src/courses.js';

const LIVE = {
  phy2049: 'https://flux-phy2049.pages.dev',
  mac2313: 'https://flux-mac2313.pages.dev',
  statics: 'https://dgadapee00.github.io/statics-sim/',
  sta3032: 'https://flux-stats.pages.dev',
};

test('PHY 2049 is the first of the four live apps', () => {
  assert.deepEqual(
    COURSES.map((course) => course.id),
    ['phy2049', 'mac2313', 'statics', 'sta3032'],
  );
  for (const course of COURSES) {
    assert.equal(course.href, LIVE[course.id]);
    assert.ok(course.href.startsWith('https://'));
    const lines = courseLines(course);
    assert.equal(lines.code, course.code);
    assert.equal(lines.title, course.title);
    assert.ok(lines.detail.length > 0);
    assert.equal(lines.detail.includes(' · · '), false);
  }
});

test('a missing term does not leave an empty separator', () => {
  const lines = courseLines({
    code: 'MAC 2313',
    title: 'Calculus III',
    term: null,
    blurb: 'Merino',
  });
  assert.equal(lines.detail, 'Merino');
});
