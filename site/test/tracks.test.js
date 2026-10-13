import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { builtCourses, latestBuilt, TRACKS } from '../src/tracks.js';

const LIVE = {
  mac2313: 'https://flux-mac2313.pages.dev',
  sta3032: 'https://flux-stats.pages.dev',
};

/** Relative hrefs are the copies in this repo. The rest stay on their own sites until imported. */
const PLATFORM_HREF = {
  phy2049: 'phy2049/',
  statics: 'statics/',
};

const PLATFORM = 'https://flux-study.pages.dev/';
const DIST = path.resolve(import.meta.dirname, '../../site/dist');

test('four tracks, each with a built course, in degree order', () => {
  assert.deepEqual(
    TRACKS.map((track) => track.id),
    ['physics', 'math', 'mechanics', 'stats'],
  );
  for (const track of TRACKS) {
    const built = track.courses.filter((course) => course.href);
    assert.ok(built.length >= 1, `${track.id} has a built course`);
    for (const course of built) {
      if (PLATFORM_HREF[course.id]) {
        assert.equal(course.href, PLATFORM_HREF[course.id]);
        assert.equal(course.href.includes('://'), false);
        assert.equal(new URL(course.href, PLATFORM).href, `${PLATFORM}${course.href}`);
      } else {
        assert.equal(course.href, LIVE[course.id]);
        assert.equal(course.href.startsWith('https://'), true);
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

test('after a build, each platform copy has an index under site/dist', () => {
  if (!fs.existsSync(DIST)) return;
  for (const course of builtCourses()) {
    if (!PLATFORM_HREF[course.id]) continue;
    const index = path.join(DIST, course.href, 'index.html');
    assert.equal(fs.existsSync(index), true, index);
  }
});
