import { hasAnimation, mountCardAnimation } from './anim/draw.js';
import { mountBackup } from './backup.js';
import problems from 'virtual:flux-problems';
import { loadConcepts, loadPaths, mountMap } from './map.js';
import { mountApplications } from './applications/view.js';
import { mountToday } from './learner/today.js';
import { latestBuilt, visibleTracks } from './tracks.js';

const concepts = loadConcepts();
const paths = loadPaths();
/** @type {ReturnType<typeof mountMap>} */
let map;
/** @type {{ refresh: () => void } | undefined} */
let applications;
// Today first: the map opens where Today says the learner is.
const today = mountToday({
  concepts,
  paths,
  problems,
  onPath: (course, id) => {
    map.choosePath(course);
    if (id) map.go(id);
  },
  onRefresh: () => {
    map.refreshPanel();
    map.refreshStatus();
    applications?.refresh();
  },
  onLeaveReview: () => map.current && map.show(map.current),
});
map = mountMap({
  concepts,
  paths,
  record: (id) => today.recordHtml(id),
  status: (id) => today.statusOf(id),
  start: () => today.startPoint(),
});
map.refreshPanel();
map.refreshStatus();
// Today sits above the map. A link that names a concept still opens on the map.
if (map.current && decodeURIComponent(window.location.hash.slice(1)) === map.current) {
  document.getElementById('explore')?.scrollIntoView({ block: 'start' });
}
applications = mountApplications(map, undefined, { status: (id) => today.statusOf(id) });

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
