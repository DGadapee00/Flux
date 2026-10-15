/**
 * Lists prereqs that point at a course the hub has not built.
 * A prereq id that is not on the hub at all is a failure.
 * An empty list prints nothing extra: there is nothing unbuilt to show.
 */
import { course as dynamics } from '../../courses/egn3321/src/manifest.js';
import { course as calc1 } from '../../courses/mac2311/src/manifest.js';
import { course as calc2 } from '../../courses/mac2312/src/manifest.js';
import { course as mac } from '../../courses/mac2313/src/manifest.js';
import { course as phy } from '../../courses/phy2049/src/manifest.js';
import { course as sta } from '../../courses/sta3032/src/manifest.js';
import { course as mech } from '../../courses/statics/src/manifest.js';
import { TRACKS } from '../../site/src/tracks.js';

const courses = [phy, calc1, calc2, mac, mech, dynamics, sta];
const known = new Map();
for (const track of TRACKS) {
  for (const card of track.courses) known.set(card.id, card);
}

const unbuilt = [];
for (const course of courses) {
  for (const id of course.prereqs || []) {
    const card = known.get(id);
    if (!card) {
      console.error(`${course.id} prereq ${id} is not on the hub`);
      process.exit(1);
    }
    if (!card.href) unbuilt.push(`${course.id} → ${id}`);
  }
}

if (unbuilt.length) {
  console.log('unbuilt prereqs:');
  for (const line of unbuilt) console.log(line);
} else {
  console.log('prereqs ok');
}
