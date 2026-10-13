import { mountCardAnimation } from './anim/draw.js';
import { latestBuilt, TRACKS } from './tracks.js';

const root = document.querySelector('#tracks');

for (const track of TRACKS) {
  const latest = latestBuilt(track);
  if (!latest?.href) throw new Error(`${track.id} has no built course`);

  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.track = track.id;

  const heading = document.createElement('h2');
  const open = document.createElement('a');
  open.className = 'track-open';
  open.href = latest.href;
  open.dataset.trackOpen = track.id;
  open.textContent = track.name;
  heading.append(open);

  const stage = document.createElement('div');
  stage.className = 'stage';

  const list = document.createElement('ul');
  list.className = 'courses';
  for (const course of track.courses) {
    const item = document.createElement('li');
    item.className = course.href ? 'built' : 'unbuilt';
    const code = course.code ? `${course.code} ` : '';
    const term = course.term ? ` ${course.term}` : '';
    if (course.href) {
      const link = document.createElement('a');
      link.className = 'course-link';
      link.href = course.href;
      link.dataset.course = course.id;
      link.textContent = `${code}${course.title}${term}`.replace(/\s+/g, ' ').trim();
      item.append(link);
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

  card.append(heading, stage, list);
  root.append(card);
  mountCardAnimation(card, stage, track.id);
}

if (typeof __BUILD__ !== 'undefined' && __BUILD__.commit) {
  console.log(`FLUX ${__BUILD__.commit}`);
}
