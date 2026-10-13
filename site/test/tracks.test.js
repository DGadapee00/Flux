import assert from 'node:assert/strict';
import test from 'node:test';
import { builtCourses, latestBuilt, TRACKS } from '../src/tracks.js';

const LIVE = {
  mac2313: 'https://flux-mac2313.pages.dev',
  statics: 'https://dgadapee00.github.io/statics-sim/',
  sta3032: 'https://flux-stats.pages.dev',
};

/** PHY is the platform copy. The other three stay on their own sites until they are ported. */
const PLATFORM = 'https://flux-study.pages.dev/';

test('four tracks, each with a built course, in degree order', () => {
  assert.deepEqual(
    TRACKS.map((track) => track.id),
    ['physics', 'math', 'mechanics', 'stats'],
  );
  for (const track of TRACKS) {
    const built = track.courses.filter((course) => course.href);
    assert.ok(built.length >= 1, `${track.id} has a built course`);
    for (const course of built) {
      if (course.id === 'phy2049') {
        assert.equal(course.href, 'phy2049/');
        assert.equal(new URL(course.href, PLATFORM).href, 'https://flux-study.pages.dev/phy2049/');
      } else {
        assert.equal(course.href, LIVE[course.id]);
        assert.ok(course.href.startsWith('https://'));
      }
    }
    for (const course of track.courses) {
      if (!course.href) assert.equal(course.href, null);
    }
  }
});

test('the card opens the latest built course, and D5 is on the list', () => {
  assert.equal(latestBuilt(TRACKS[0]).id, 'phy2049');
  assert.equal(latestBuilt(TRACKS[1]).id, 'mac2313');
  assert.equal(latestBuilt(TRACKS[1]).term, 'Spring 2026');
  assert.equal(latestBuilt(TRACKS[2]).id, 'statics');
  assert.equal(latestBuilt(TRACKS[2]).code, 'EGN 3311');
  assert.equal(latestBuilt(TRACKS[3]).id, 'sta3032');
  assert.deepEqual(
    builtCourses().map((course) => course.id),
    ['phy2049', 'mac2313', 'statics', 'sta3032'],
  );
});
