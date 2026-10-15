import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { builtCourses, latestBuilt, TRACKS } from '../src/tracks.js';

const LIVE = {};

/** Relative hrefs are the copies in this repo. The rest stay on their own sites until imported. */
const PLATFORM_HREF = {
  phy2049: 'phy2049/',
  statics: 'statics/',
  mac2311: 'mac2311/',
  mac2312: 'mac2312/',
  mac2313: 'mac2313/',
  sta3032: 'sta3032/',
};

const PLATFORM = 'https://flux-study.pages.dev/';
const DIST = path.resolve(import.meta.dirname, '../../site/dist');

/** Tracks whose first course is not built yet. Their cards list the courses and open nothing. */
const UNBUILT_TRACKS = ['thermal'];

test('five tracks in order, each with a built course unless it is still to come', () => {
  assert.deepEqual(
    TRACKS.map((track) => track.id),
    ['physics', 'math', 'mechanics', 'stats', 'thermal'],
  );
  for (const track of TRACKS) {
    const built = track.courses.filter((course) => course.href);
    if (UNBUILT_TRACKS.includes(track.id)) assert.equal(built.length, 0, `${track.id} has no built course yet`);
    else assert.ok(built.length >= 1, `${track.id} has a built course`);
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
  assert.equal(latestBuilt(TRACKS[4]), null);
  assert.deepEqual(
    builtCourses().map((course) => course.id),
    ['phy2049', 'mac2311', 'mac2312', 'mac2313', 'statics', 'sta3032'],
  );
});

test('Phase 8 courses are on the hub with their codes, not built yet', () => {
  const card = (id) => TRACKS.flatMap((track) => track.courses.map((course) => ({ track: track.id, ...course }))).find((course) => course.id === id);
  assert.deepEqual(
    TRACKS[2].courses.map((course) => course.code),
    ['EGN 3311', 'EGN 3321', 'EGN 3331'],
  );
  for (const [id, track, code, title] of [
    ['egn3321', 'mechanics', 'EGN 3321', 'Dynamics'],
    ['egn3331', 'mechanics', 'EGN 3331', 'Mechanics of Materials'],
    ['eml3100', 'thermal', 'EML 3100', 'Thermodynamics'],
  ]) {
    const course = card(id);
    assert.ok(course, `${id} is on the hub`);
    assert.deepEqual([course.track, course.code, course.title, course.href], [track, code, title, null]);
    assert.match(id, /^[a-z][a-z0-9]*$/);
  }
});

test('after a build, each platform copy has an index under site/dist', (t) => {
  if (!fs.existsSync(DIST)) return;
  // Only judge a build of this commit. A dist left over from an older checkout is not this build.
  const stampFile = path.join(DIST, 'version.json');
  let head = '';
  try {
    head = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return;
  }
  const stamp = fs.existsSync(stampFile) ? JSON.parse(fs.readFileSync(stampFile, 'utf8')) : {};
  if (!stamp.commit || !head.startsWith(stamp.commit.slice(0, 7))) {
    t.skip(`site/dist is from ${stamp.commit || 'an unknown build'}, not ${head}`);
    return;
  }
  for (const course of builtCourses()) {
    if (!PLATFORM_HREF[course.id]) continue;
    const index = path.join(DIST, course.href, 'index.html');
    assert.equal(fs.existsSync(index), true, index);
  }
});
