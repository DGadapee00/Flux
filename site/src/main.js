import { hasAnimation, mountCardAnimation } from './anim/draw.js';
import { mountBackup } from './backup.js';
import { latestBuilt, visibleTracks } from './tracks.js';

/**
 * The hub: every course app, grouped by subject, and one backup of the progress they keep.
 * The track list is `@flux/tracks`. A card's heading opens its latest course.
 */
const root = document.querySelector('#tracks');

for (const track of visibleTracks()) {
  const latest = latestBuilt(track);

  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.track = track.id;

  const heading = document.createElement('h2');
  if (latest) {
    const open = document.createElement('a');
    open.className = 'track-open';
    open.href = latest.href;
    open.dataset.trackOpen = track.id;
    open.textContent = track.name;
    heading.append(open);
  } else {
    // Nothing built yet: the card names the track and lists its courses, and opens nothing.
    card.dataset.unbuilt = '';
    heading.textContent = track.name;
  }

  const stage = document.createElement('div');
  stage.className = 'stage';

  const list = document.createElement('ul');
  list.className = 'courses';
  for (const course of track.courses) {
    const item = document.createElement('li');
    item.className = course.href ? 'built' : 'unbuilt';
    const code = course.code ? `${course.code} ` : '';
    if (course.href) {
      const link = document.createElement('a');
      link.className = 'course-link';
      link.href = course.href;
      link.dataset.course = course.id;
      link.textContent = `${code}${course.title}`.replace(/\s+/g, ' ').trim();
      item.append(link);
      if (course.term) {
        // The term in its own dim line, so every course name reads the same way.
        const when = document.createElement('span');
        when.className = 'term';
        when.textContent = course.term;
        item.append(when);
      }
    } else {
      const label = document.createElement('span');
      label.className = 'course-label';
      label.textContent = `${code}${course.title}`.trim();
      const soon = document.createElement('span');
      soon.className = 'soon';
      soon.textContent = 'not built yet';
      item.append(label, soon);
    }
    list.append(item);
  }

  // A track with no card animation shows no stage. Before, mounting one threw and stopped the
  // page before the Progress section mounted.
  if (hasAnimation(track.id)) {
    card.append(heading, stage, list);
    root.append(card);
    mountCardAnimation(card, stage, track.id);
  } else {
    card.dataset.motion = 'still';
    card.append(heading, list);
    root.append(card);
  }
}

mountBackup();

if (typeof __BUILD__ !== 'undefined' && __BUILD__.commit) {
  console.log(`FLUX ${__BUILD__.commit}`);
}
