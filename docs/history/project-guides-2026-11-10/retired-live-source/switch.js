import { TRAVELERS } from '@flux/map/applications/travelers/index.js';
import { pickBuildView } from './traveler-text.js';

/**
 * The two views on Build: the satellite, and a traveler. One shows at a time, and the address says
 * which: `?traveler=<id>` is the traveler, anything else the satellite. Each view keeps its own
 * place in the address (a subsystem, a station); the switch only swaps which is shown.
 *
 * @param {{ root?: Document }} [opts]
 */
export function mountBuildSwitch({ root = document } = {}) {
  const win = root.defaultView;
  const nav = root.querySelector('[data-build-switch]');
  const views = { satellite: root.querySelector('#application-workbench'), traveler: root.querySelector('#traveler-workbench') };
  if (!nav || !views.satellite || !views.traveler) return;

  function show(view) {
    for (const [name, el] of Object.entries(views)) el.hidden = name !== view;
    for (const b of nav.querySelectorAll('[data-build]')) b.setAttribute('aria-pressed', String(b.dataset.build === view));
  }

  nav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-build]');
    if (!button) return;
    const view = button.dataset.build;
    const url = new URL(win.location.href);
    if (view === 'traveler') {
      for (const key of ['application', 'component', 'decision']) url.searchParams.delete(key);
      url.searchParams.set('traveler', TRAVELERS[0].id);
    } else {
      for (const key of ['traveler', 'station']) url.searchParams.delete(key);
      url.searchParams.set('application', 'satellite');
    }
    url.hash = 'applications';
    win.history.pushState(null, '', url);
    show(view);
  });
  win.addEventListener('popstate', () => show(pickBuildView(win.location.search).view));
  show(pickBuildView(win.location.search).view);
}
