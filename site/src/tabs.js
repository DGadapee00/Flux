/**
 * The hub's tabs: Today, Map, Build and Courses. One shows at a time; the rest are hidden.
 *
 * The address picks the tab, so every link that worked on the one long page still lands:
 * `#<concept id>` opens the Map on that concept, `#review-<id>` a review on Today,
 * `?application=…#applications` a project on Build, and `#progress` the backup on Courses.
 */

export const TABS = /** @type {const} */ (['today', 'map', 'build', 'courses']);

/** Old section anchors and the tab each belongs to. */
const ANCHORS = {
  today: 'today',
  map: 'map',
  explore: 'map',
  build: 'build',
  applications: 'build',
  courses: 'courses',
  tracks: 'courses',
  progress: 'courses',
};

/**
 * The tab an address asks for, or null when it names none (the current tab stays).
 * @param {string} hash `location.hash`, with or without its `#`
 * @param {string} search `location.search`
 * @param {(id: string) => boolean} isConcept
 * @returns {typeof TABS[number] | null}
 */
export function tabFor(hash, search, isConcept) {
  const h = decodeURIComponent(String(hash || '').replace(/^#/, ''));
  if (h.startsWith('review-')) return 'today';
  if (ANCHORS[h]) return /** @type {any} */ (ANCHORS[h]);
  if (h && isConcept(h)) return 'map';
  if (h) return null;
  // No hash: a project or a map setting in the query still says where the link was going.
  const q = new URLSearchParams(search);
  if (q.has('application')) return 'build';
  if (q.has('path') || q.has('view') || q.has('lanes')) return 'map';
  return 'today';
}

/**
 * @param {{
 *   isConcept: (id: string) => boolean,
 *   onShow?: (tab: typeof TABS[number]) => void,
 *   root?: Document,
 * }} opts
 */
export function mountTabs({ isConcept, onShow = () => {}, root = document }) {
  const win = root.defaultView;
  const panels = [...root.querySelectorAll('[data-tab]')];
  const links = [...root.querySelectorAll('[data-tab-link]')];
  /** @type {typeof TABS[number]} */
  let current = 'today';

  /** @param {typeof TABS[number]} tab */
  function show(tab) {
    const changed = tab !== current;
    current = tab;
    for (const p of panels) p.hidden = p.dataset.tab !== tab;
    for (const a of links) {
      if (a.dataset.tabLink === tab) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
    root.body.dataset.activeTab = tab;
    onShow(tab);
    // Where the view lands. #progress goes to the backup. On a phone, whose header is tall, a link
    // to a concept goes past the header to the map itself. A new tab otherwise starts at its top,
    // with the tabs in view.
    const h = decodeURIComponent(win.location.hash.slice(1));
    if (h === 'progress') root.getElementById('progress')?.scrollIntoView({ block: 'start' });
    else if (changed && tab === 'map' && isConcept(h) && win.innerWidth < 720) root.getElementById('explore')?.scrollIntoView({ block: 'start' });
    else if (changed) win.scrollTo(0, 0);
  }

  function route() {
    show(tabFor(win.location.hash, win.location.search, isConcept) || current);
  }

  win.addEventListener('hashchange', route);
  win.addEventListener('popstate', route);
  // A tab link sets the address itself: left to the browser, #today or #map would also jump to the
  // element with that id, and the tab would open part way down.
  for (const a of links) {
    a.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const tab = /** @type {typeof TABS[number]} */ (a.dataset.tabLink);
      if (win.location.hash !== `#${tab}`) win.history.pushState(null, '', `#${tab}`);
      show(tab);
    });
  }
  route();

  return {
    show,
    get current() {
      return current;
    },
  };
}
