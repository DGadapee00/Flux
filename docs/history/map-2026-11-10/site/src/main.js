import { hasAnimation, mountCardAnimation } from './anim/draw.js';
import { mountBackup } from './backup.js';
import problems from 'virtual:flux-problems';
import { loadConcepts, loadPaths, mountMap } from './map.js';
import { mountApplications } from './applications/view.js';
import { mountBuildSwitch } from './applications/switch.js';
import { mountTraveler } from './applications/traveler.js';
import { mountToday } from './learner/today.js';
import { mountTabs } from './tabs.js';
import { latestBuilt, visibleTracks } from './tracks.js';

const concepts = loadConcepts();
const paths = loadPaths();
/** @type {ReturnType<typeof mountMap>} */
let map;
/** @type {{ refresh: () => void } | undefined} */
let applications;
/** @type {{ refresh: () => void } | undefined} */
let traveler;
/** @type {ReturnType<typeof mountTabs> | undefined} */
let tabs;
// Today first: the map opens where Today says the learner is.
const today = mountToday({
  concepts,
  paths,
  problems,
  onPath: (course, id) => {
    map.choosePath(course);
    if (id) map.go(id);
    tabs?.show('map');
  },
  onRefresh: () => {
    map.refreshPanel();
    map.refreshStatus();
    applications?.refresh();
    traveler?.refresh();
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
applications = mountApplications(map, undefined, { status: (id) => today.statusOf(id) });
traveler = mountTraveler(map, undefined, { status: (id) => today.statusOf(id) });
mountBuildSwitch();

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

// Last, once every section has been laid out: show one tab and hide the rest. The map is measured
// again when its tab shows, since a hidden box has no width to fit or centre in.
tabs = mountTabs({
  isConcept: (id) => concepts.some((c) => c.id === id),
  onShow: (tab) => {
    if (tab !== 'map' || !map.current) return;
    window.dispatchEvent(new Event('resize'));
    map.show(map.current);
  },
});

if (typeof __BUILD__ !== 'undefined' && __BUILD__.commit) {
  console.log(`FLUX ${__BUILD__.commit}`);
}
