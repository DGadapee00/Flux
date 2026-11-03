/**
 * The hub's front door: the concept map, drawn from map/ as the approved prototype draws it
 * (docs/map/prototype-flux-thread.html). Subject lanes, prerequisites left to right, a reading
 * panel for the chosen concept, the trail of where you have been, and highlighting of what the
 * concept builds on (solid) and where it leads (dashed). `#<concept-id>` opens a concept. The panel
 * also lists a concept's parallels (its `related` field, read both ways); they are not drawn.
 *
 * The map opens as a local view: the chosen concept, centred, with what it builds on and what it
 * leads to, one step each way. A control widens it to two steps or to the full map, and
 * `?view=two|all` keeps that choice.
 *
 * Finding your way on a map this size: a find box (`/` focuses it) opens a concept, shows one
 * subject or follows a course. A subject filter keeps only the chosen lanes, and `?lanes=a,b`
 * keeps that choice. Zoom buttons and Ctrl with the wheel resize the drawing; Fit shows all of it.
 * Arrow keys move between boxes and Enter opens one; the map is one stop in the tab order.
 *
 * A course is a path through the map (map/paths/). Choosing one numbers its concepts on the map,
 * fades the rest and lists them in teaching order. In a local view the whole path is drawn as well.
 * `?path=<course-id>` keeps the choice.
 */
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { buildGraph, COURSES, LAB_CATALOGS, labHref, notesHref, SUBJECTS } from '@flux/map';
import { find, searchIndex } from './find.js';
import { BOX, inSubjects, layout, nearestInDirection, neighbourhood, SCOPES, subMap, wrapLabel } from './layout.js';

/** The concept the map opens on when the link names none. */
export const START = 'divergence-theorem';

const NS = 'http://www.w3.org/2000/svg';
const TRAIL_MAX = 8;

/** Every concept, from one file each in map/concepts/. */
export function loadConcepts() {
  const mods = import.meta.glob('../../map/concepts/*.js', { eager: true });
  return Object.values(mods).map((m) => /** @type {any} */ (m).default);
}

/** Every course path, from one file each in map/paths/, keyed by course id. */
export function loadPaths() {
  const mods = import.meta.glob('../../map/paths/*.js', { eager: true });
  return Object.fromEntries(Object.values(mods).map((m) => [/** @type {any} */ (m).default.course, /** @type {any} */ (m).default]));
}

/** A path's concept ids in order. */
export const pathOrder = (p) => p.units.flatMap((u) => u.concepts);

/**
 * The lane colours as CSS custom properties, in both themes, from map/subjects.js.
 * @param {typeof SUBJECTS} subjects
 */
export function laneCss(subjects) {
  const dark = subjects.map((s) => `${s.token}: ${s.dark};`).join(' ');
  const light = subjects.map((s) => `${s.token}: ${s.light};`).join(' ');
  return [
    `:root { ${dark} }`,
    `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) { ${light} } }`,
    `:root[data-theme="light"] { ${light} }`,
  ].join('\n');
}

export function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function tex(s, display = false) {
  try {
    return katex.renderToString(s, { displayMode: display, throwOnError: false });
  } catch {
    return `<code class="tex-fallback">${esc(s)}</code>`;
  }
}

/** Prose with inline TeX as \( ... \). */
export function prose(s) {
  return String(s)
    .split(/(\\\([\s\S]*?\\\))/g)
    .map((part) => (part.startsWith('\\(') ? tex(part.slice(2, -2)) : esc(part)))
    .join('');
}

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

/**
 * @param {{
 *   concepts?: any[],
 *   paths?: Record<string, any>,
 *   root?: Document,
 * }} [opts]
 */
export function mountMap({ concepts = loadConcepts(), paths = loadPaths(), root = document } = {}) {
  const style = root.createElement('style');
  style.textContent = laneCss(SUBJECTS);
  root.head.append(style);

  const graph = buildGraph(concepts);
  const { byId, leads, closure, related } = graph;
  const subjectOf = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
  const courseOf = Object.fromEntries(COURSES.map((c) => [c.id, c]));
  const colour = (c) => `var(${subjectOf[c.subject].token})`;
  const { NODEW, NODEH } = BOX;

  // ---------- Disclosures: the subject filter and the course chooser, one open at a time ----------
  /** @type {[HTMLElement, HTMLElement][]} */
  const disclosures = [];
  function disclose(toggle, panel) {
    disclosures.push([toggle, panel]);
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      for (const [t, p] of disclosures) {
        t.setAttribute('aria-expanded', String(t === toggle && open));
        p.hidden = !(t === toggle && open);
      }
    });
  }

  // ---------- Subjects: show only the chosen lanes ----------
  const legend = root.getElementById('legend');
  const lanesState = root.getElementById('lanes-state');
  const usedLanes = layout(concepts, SUBJECTS, graph.depth).lanes.map((l) => l.subject);
  const laneSize = Object.fromEntries(usedLanes.map((l) => [l.id, concepts.filter((c) => c.subject === l.id).length]));
  let lanes = new Set((new URLSearchParams(window.location.search).get('lanes') || '').split(',').filter((id) => laneSize[id]));
  legend.innerHTML =
    '<button type="button" class="lane-toggle" data-lane="">All subjects</button>' +
    usedLanes
      .map(
        (l) =>
          `<button type="button" class="lane-toggle" data-lane="${l.id}"><i class="sw" style="background:var(${l.token})"></i>${esc(l.label)}<span class="count">${laneSize[l.id]}</span></button>`,
      )
      .join('');
  disclose(root.getElementById('lanes-toggle'), legend);

  function renderLanes() {
    legend.querySelectorAll('[data-lane]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.lane ? lanes.has(b.dataset.lane) : lanes.size === 0)),
    );
    lanesState.textContent = !lanes.size ? 'all' : lanes.size === 1 ? subjectOf[[...lanes][0]].label : `${lanes.size} of ${usedLanes.length}`;
  }
  renderLanes();

  /** @param {Iterable<string>} next Subject ids; none, or every one, shows all subjects. */
  function chooseLanes(next) {
    lanes = new Set([...next].filter((id) => laneSize[id]));
    if (lanes.size === usedLanes.length) lanes = new Set();
    setParam('lanes', [...lanes].join(','), '');
    renderLanes();
    redraw();
  }
  legend.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest('[data-lane]');
    if (!b) return;
    const id = b.dataset.lane;
    if (!id) return chooseLanes([]);
    const next = new Set(lanes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    chooseLanes(next);
  });

  // ---------- Map ----------
  const svg = root.getElementById('map');
  const mapbox = root.getElementById('mapbox');
  const inner = root.getElementById('mapinner');
  const tags = root.getElementById('lane-tags');
  const statusEl = root.getElementById('map-status');
  /** What is drawn now: its key, positions and size. */
  let view = { key: '', pos: {}, W: 0, H: 0 };
  let nodeEls = {};
  let edgeEls = [];

  /**
   * Size the drawing. Narrower than the box, it keeps its natural size and sits in the middle.
   * Wider, it fits the box when that costs at most a fifth of its size; past that (a phone, or the
   * full map on a laptop) it keeps its natural size and scrolls inside the box.
   */
  function fit() {
    const box = mapbox.clientWidth;
    const { W } = view;
    if (zoom !== null) {
      inner.style.width = `${Math.round(W * zoom)}px`;
      inner.style.minWidth = inner.style.width;
    } else if (W <= box) {
      inner.style.width = `${W}px`;
      inner.style.minWidth = '';
    } else if (box >= W * 0.8) {
      inner.style.width = '';
      inner.style.minWidth = '';
    } else {
      inner.style.width = `${W}px`;
      inner.style.minWidth = `${W}px`;
    }
    showZoom();
  }
  window.addEventListener('resize', fit);

  // ---------- Zoom ----------
  /** The chosen scale, or null for the automatic size above. A new drawing starts automatic. */
  let zoom = null;
  const ZOOM_MAX = 2;
  const zoomEl = root.getElementById('zoom');
  const zoomLevel = zoomEl.querySelector('[data-zoom="reset"]');
  const scaleNow = () => {
    const w = svg.getBoundingClientRect().width;
    return w && view.W ? w / view.W : 1;
  };
  /** The scale at which the whole drawing fits the box, across and down, never above actual size. */
  function fitScale() {
    let maxH = parseFloat(getComputedStyle(mapbox).maxHeight);
    if (!Number.isFinite(maxH)) maxH = Math.min(window.innerHeight * 0.68, 640);
    return Math.min(1, (mapbox.clientWidth - 4) / view.W, (maxH - 12) / view.H);
  }
  const zoomMin = () => Math.min(0.25, fitScale());

  function showZoom() {
    const now = scaleNow();
    zoomLevel.textContent = `${Math.round(now * 100)}%`;
    // Thin lanes are a few pixels tall when zoomed far out; smaller labels keep them apart.
    tags.classList.toggle('small', now < 0.35);
    /** @type {HTMLButtonElement} */ (zoomEl.querySelector('[data-zoom="out"]')).disabled = now <= zoomMin() + 0.005;
    /** @type {HTMLButtonElement} */ (zoomEl.querySelector('[data-zoom="in"]')).disabled = now >= ZOOM_MAX - 0.005;
  }

  /**
   * Resize the drawing and keep the point under `at` (a screen position, by default the box's
   * centre) where it was.
   * @param {number} next
   * @param {{ x: number, y: number }} [at]
   */
  function setZoom(next, at) {
    const before = scaleNow();
    const rect = svg.getBoundingClientRect();
    const box = mapbox.getBoundingClientRect();
    const ax = at ? at.x : box.left + mapbox.clientWidth / 2;
    const ay = at ? at.y : box.top + mapbox.clientHeight / 2;
    const px = (ax - rect.left) / before;
    const py = (ay - rect.top) / before;
    zoom = Math.min(ZOOM_MAX, Math.max(zoomMin(), next));
    fit();
    const after = svg.getBoundingClientRect();
    mapbox.scrollLeft += after.left + px * zoom - ax;
    mapbox.scrollTop += after.top + py * zoom - ay;
  }

  zoomEl.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest('[data-zoom]');
    if (!b) return;
    const now = scaleNow();
    if (b.dataset.zoom === 'in') setZoom(now * 1.25);
    else if (b.dataset.zoom === 'out') setZoom(now / 1.25);
    else if (b.dataset.zoom === 'fit') setZoom(fitScale());
    else {
      setZoom(1);
      if (current) reveal(current);
    }
  });
  // Ctrl or Cmd with the wheel, and a trackpad pinch, zoom about the pointer. A plain wheel scrolls.
  mapbox.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(scaleNow() * Math.exp(-e.deltaY * 0.0015), { x: e.clientX, y: e.clientY });
    },
    { passive: false },
  );

  /** @param {Set<string>|null} ids The concepts to draw, or null for the full map. */
  function draw(ids) {
    const key = ids ? [...ids].sort().join(',') : '*';
    if (key === view.key) return;
    const sub = ids ? subMap(concepts, ids) : concepts;
    const depth = ids ? buildGraph(sub).depth : graph.depth;
    const { lanes: bands, pos, W, H } = layout(sub, SUBJECTS, depth);
    view = { key, pos, W, H };
    zoom = null;
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    fit();
    for (const lane of bands) {
      el('rect', { x: 0, y: lane.y, width: W, height: lane.h, fill: `var(${lane.subject.token})`, class: 'lane-bg' }, svg);
    }
    edgeEls = [];
    const edgeLayer = el('g', {}, svg);
    for (const c of sub) {
      for (const r of c.requires) {
        const a = pos[r];
        const b = pos[c.id];
        const x1 = a.x + NODEW;
        const y1 = a.y + NODEH / 2;
        const x2 = b.x;
        const y2 = b.y + NODEH / 2;
        const mx = (x2 - x1) * 0.5;
        const p = el('path', { d: `M${x1},${y1} C${x1 + mx},${y1} ${x2 - mx},${y2} ${x2 - 4},${y2}`, class: 'edge' }, edgeLayer);
        edgeEls.push({ from: r, to: c.id, el: p });
      }
    }
    nodeEls = {};
    for (const c of sub) {
      const p = pos[c.id];
      const hasLab = c.labs.length > 0;
      const g = el(
        'g',
        {
          class: 'node',
          tabindex: '-1',
          role: 'button',
          'aria-label': `${c.title}${hasLab ? '' : ', no lab yet'}`,
          'data-concept': c.id,
          transform: `translate(${p.x},${p.y})`,
        },
        svg,
      );
      el('rect', { width: NODEW, height: NODEH, rx: 7, stroke: colour(c) }, g);
      const lines = c.label || wrapLabel(c.title);
      const ty = NODEH / 2 - (lines.length - 1) * 8 + 5;
      lines.forEach((s, i) => {
        const t = el('text', { x: 11, y: ty + i * 16 }, g);
        t.textContent = s;
      });
      el(
        'circle',
        {
          cx: NODEW - 10,
          cy: 10,
          r: 4,
          fill: hasLab ? 'var(--fg)' : 'none',
          stroke: hasLab ? 'none' : 'var(--dim)',
          'stroke-width': 1.5,
        },
        g,
      );
      const badge = el('g', { class: 'step' }, g);
      el('circle', { r: 10 }, badge);
      el('text', { 'text-anchor': 'middle', y: 4 }, badge);
      g.addEventListener('click', () => {
        // In a zoomed-out overview a click also zooms to actual size, so the box can be read.
        if (scaleNow() < 0.45) setZoom(1);
        go(c.id);
      });
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go(c.id);
          return;
        }
        const dir = { ArrowRight: 'right', ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
        if (!dir) return;
        e.preventDefault();
        const next = nearestInDirection(view.pos, c.id, /** @type {any} */ (dir));
        if (next) focusNode(next);
      });
      nodeEls[c.id] = g;
    }
    // Lane labels are HTML over the map, each stuck to the box's left edge, so a lane stays named
    // however far the map is scrolled. A backing keeps edges from running through the text.
    tags.innerHTML = bands
      .map(
        (lane) =>
          `<div class="lane-row" style="top:${(lane.y / H) * 100}%"><span class="lane-label" style="color:var(${lane.subject.token})">${esc(lane.subject.label)}</span></div>`,
      )
      .join('');
    const filtered = lanes.size ? ` in ${lanes.size === 1 ? 'one subject' : `${lanes.size} subjects`}` : '';
    statusEl.textContent = `Showing ${sub.length} of ${concepts.length} concepts${filtered}.`;
  }

  /** Move keyboard focus to a box, the map's one tab stop, and scroll it into the box's view. */
  function focusNode(id) {
    for (const k in nodeEls) nodeEls[k].setAttribute('tabindex', k === id ? '0' : '-1');
    const node = nodeEls[id];
    node.focus({ preventScroll: true });
    const r = node.getBoundingClientRect();
    const b = mapbox.getBoundingClientRect();
    const pad = 24;
    const right = b.left + mapbox.clientWidth;
    const bottom = b.top + mapbox.clientHeight;
    const dx = r.left < b.left + pad ? r.left - b.left - pad : r.right > right - pad ? r.right - right + pad : 0;
    const dy = r.top < b.top + pad ? r.top - b.top - pad : r.bottom > bottom - pad ? r.bottom - bottom + pad : 0;
    if (dx || dy) mapbox.scrollBy({ left: dx, top: dy });
  }

  /** Draw again after the scope, the course or the subjects change. */
  function redraw() {
    if (!current) return;
    draw(visible(current));
    highlight(current);
    reveal(current);
  }

  // ---------- Scope: one step, two steps, the full map ----------
  const scopeEl = root.getElementById('scope');
  let scope = new URLSearchParams(window.location.search).get('view');
  if (!(scope in SCOPES)) scope = 'near';

  function visible(id) {
    let ids = null;
    if (scope !== 'all') {
      ids = neighbourhood(id, SCOPES[scope], (x) => byId[x].requires, (x) => leads[x]);
      if (activePath) for (const x of pathOrder(paths[activePath])) ids.add(x);
    }
    if (!lanes.size) return ids;
    return inSubjects(ids || concepts.map((c) => c.id), (x) => byId[x].subject, lanes, id);
  }

  function setParam(name, value, fallback) {
    const url = new URL(window.location.href);
    if (value && value !== fallback) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
    window.history.replaceState(window.history.state, '', url);
  }

  function chooseScope(next) {
    scope = next in SCOPES ? next : 'near';
    scopeEl.querySelectorAll('[data-scope]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scope === scope)));
    setParam('view', scope, 'near');
    redraw();
  }
  scopeEl.querySelectorAll('[data-scope]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.scope === scope));
    b.addEventListener('click', () => chooseScope(b.dataset.scope));
  });

  // ---------- Reading panel ----------
  const detail = root.getElementById('detail');
  const detailHead = root.getElementById('detail-head');
  const detailBody = root.getElementById('detail-body');
  const trailEl = root.getElementById('trail');
  let trail = [];

  const chip = (id) =>
    `<button class="chip" data-go="${id}" style="--c:${colour(byId[id])}">${esc(byId[id].title)}</button>`;

  function courseTag(id, c) {
    const course = courseOf[id];
    const code = esc(course.code);
    const tag = course.app
      ? `<a class="course" href="${course.app}" style="color:${colour(c)}" title="Open ${esc(course.title)}">${code}</a>`
      : `<span class="course" style="color:${colour(c)}">${code}</span>`;
    const status = course.kind === 'project' ? 'project' : course.status;
    return `<span class="course-tag">${tag}<span class="status">${esc(status)}</span></span>`;
  }

  function labBlock(ref) {
    const course = courseOf[ref.course];
    const meta = LAB_CATALOGS[ref.course][ref.lab];
    const lab = labHref({ course: ref.course, unit: meta.unit, lab: ref.lab });
    const notes = notesHref(ref, meta.unit);
    return `<div class="lab"><h3>In Flux</h3><p><strong>${esc(meta.title)}</strong> lab, ${esc(course.code)}. ${prose(ref.note)}</p><div class="links"><a href="${lab}" data-lab="${ref.course}/${ref.lab}">Open the lab</a>${notes ? `<a href="${notes}" data-notes="${ref.course}/${ref.lab}">Open the notes</a>` : ''}</div></div>`;
  }

  /** Parallels: concepts that share a form or a method with this one without being a prerequisite. */
  function parallels(id) {
    if (!related[id].length) return '';
    const items = related[id].map((r) => `<li>${chip(r.id)}<p class="why">${prose(r.note)}</p></li>`).join('');
    return `<div><h3>Parallels</h3><ul class="parallels">${items}</ul></div>`;
  }

  function render(id) {
    const c = byId[id];
    const labs = c.labs.length
      ? c.labs.map(labBlock).join('')
      : `<div class="lab missing"><h3>No Flux lab yet</h3><p>${prose(c.candidate || '')}</p></div>`;
    const extra = c.labs.length && c.candidate ? `<div class="lab missing"><h3>A lab worth adding</h3><p>${prose(c.candidate)}</p></div>` : '';
    const srcs = c.sources
      .map(
        (s) =>
          `<li class="src"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} <span aria-hidden="true">↗</span></a><div class="meta"><span>${esc(s.kind)}</span><span>${esc(s.level)}</span></div><p class="why">${esc(s.why)}</p></li>`,
      )
      .join('');
    detailHead.innerHTML = `
      <div class="tagrow">${c.courses.map((k) => courseTag(k, c)).join('')}</div>
      <h2 id="concept-title">${esc(c.title)}</h2>
      <div class="eq">${tex(c.eq, true)}</div>`;
    detailBody.innerHTML = `
      <p class="idea">${prose(c.idea)}</p>
      <div><h3>Builds on</h3>${c.requires.length ? `<div class="chips">${c.requires.map(chip).join('')}</div>` : '<p class="none">Nothing on the map yet. It is a starting point.</p>'}</div>
      <div><h3>Leads to</h3>${leads[id].length ? `<div class="chips">${leads[id].map(chip).join('')}</div>` : '<p class="none">The end of this thread, for now.</p>'}</div>
      ${parallels(id)}
      ${labs}${extra}
      <div><h3>Worth your time</h3><ul class="sources">${srcs}</ul></div>`;
    detail.dataset.concept = id;
    detail.scrollTop = 0;
    detail.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  }

  function highlight(id) {
    if (activePath) {
      const order = pathOrder(paths[activePath]);
      const on = new Set(order);
      for (const k in nodeEls) {
        nodeEls[k].setAttribute('tabindex', k === id ? '0' : '-1');
        nodeEls[k].classList.toggle('sel', k === id);
        nodeEls[k].classList.toggle('faded', k !== id && !on.has(k));
        nodeEls[k].classList.toggle('on-path', on.has(k));
        nodeEls[k].querySelector('.step text').textContent = on.has(k) ? String(order.indexOf(k) + 1) : '';
        if (k === id) nodeEls[k].setAttribute('aria-current', 'true');
        else nodeEls[k].removeAttribute('aria-current');
      }
      for (const e of edgeEls) e.el.setAttribute('class', `edge${on.has(e.from) && on.has(e.to) ? ' path' : ' faded'}`);
      return;
    }
    const up = closure(id, 'requires');
    const down = closure(id, 'leads');
    for (const k in nodeEls) {
      nodeEls[k].setAttribute('tabindex', k === id ? '0' : '-1');
      nodeEls[k].classList.remove('on-path');
      nodeEls[k].classList.toggle('sel', k === id);
      nodeEls[k].classList.toggle('faded', k !== id && !up.has(k) && !down.has(k));
      if (k === id) nodeEls[k].setAttribute('aria-current', 'true');
      else nodeEls[k].removeAttribute('aria-current');
    }
    for (const e of edgeEls) {
      const isUp = (e.to === id || up.has(e.to)) && up.has(e.from);
      const isDown = (e.from === id || down.has(e.from)) && down.has(e.to);
      e.el.setAttribute('class', `edge${isUp ? ' up' : isDown ? ' down' : ' faded'}`);
    }
  }

  function renderTrail(id) {
    const i = trail.indexOf(id);
    if (i >= 0) trail = trail.slice(0, i + 1);
    else trail.push(id);
    if (trail.length > TRAIL_MAX) trail = trail.slice(-TRAIL_MAX);
    trailEl.innerHTML =
      '<span>Your path:</span>' +
      trail
        .map((t, j) =>
          j === trail.length - 1
            ? `<span class="now">${esc(byId[t].title)}</span>`
            : `<button data-go="${t}">${esc(byId[t].title)}</button><span aria-hidden="true">→</span>`,
        )
        .join('');
    trailEl.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  }

  /** Centre the chosen concept in the map's box, across and down, when the drawing overflows it. */
  function reveal(id) {
    const p = view.pos[id];
    if (!p) return;
    const scale = svg.getBoundingClientRect().width / view.W;
    const cx = (p.x + NODEW / 2) * scale;
    const cy = (p.y + NODEH / 2) * scale;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    mapbox.scrollTo({
      left: Math.max(0, cx - mapbox.clientWidth / 2),
      top: Math.max(0, cy - mapbox.clientHeight / 2),
      behavior: reduce ? 'auto' : 'smooth',
    });
  }

  // ---------- Course paths ----------
  const chooser = root.getElementById('paths');
  const buttons = root.getElementById('path-buttons');
  const pathList = root.getElementById('path-list');
  const pathIds = COURSES.map((c) => c.id).filter((id) => paths[id]);
  let activePath = null;

  const pathsToggle = root.getElementById('paths-toggle');
  const pathsState = root.getElementById('paths-state');
  disclose(pathsToggle, chooser);
  if (pathIds.length) {
    pathsToggle.hidden = false;
    buttons.innerHTML = pathIds
      .map((id) => `<button type="button" class="path-button" data-path="${id}" aria-pressed="false">${esc(courseOf[id].code)}</button>`)
      .join('');
    buttons.querySelectorAll('[data-path]').forEach((b) =>
      b.addEventListener('click', () => choosePath(activePath === b.dataset.path ? null : b.dataset.path)),
    );
  }

  function renderPathList() {
    if (!activePath) {
      pathList.hidden = true;
      pathList.innerHTML = '';
      return;
    }
    const course = courseOf[activePath];
    let n = 0;
    const units = paths[activePath].units
      .map((u) => {
        const items = u.concepts
          .map((id) => {
            n += 1;
            const here = id === current ? ' aria-current="true"' : '';
            return `<li><button class="chip" data-go="${id}" style="--c:${colour(byId[id])}"${here}><span class="n">${n}</span>${esc(byId[id].title)}${byId[id].labs.length ? '' : ' <span class="gap">no lab yet</span>'}</button></li>`;
          })
          .join('');
        return `<div class="unit">${u.title ? `<h4>${esc(u.title)}</h4>` : ''}<ol class="steps" start="${n - u.concepts.length + 1}">${items}</ol></div>`;
      })
      .join('');
    const open = course.app ? `<a href="${course.app}">Open ${esc(course.code)}</a>` : '';
    pathList.innerHTML = `<div class="path-head"><h3>${esc(course.code)} ${esc(course.title)}, in teaching order</h3><div class="links">${open}<button type="button" class="link" data-clear>Leave the path</button></div></div>${units}`;
    pathList.hidden = false;
    pathList.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
    pathList.querySelector('[data-clear]').addEventListener('click', () => choosePath(null));
  }

  function choosePath(id) {
    activePath = id && paths[id] ? id : null;
    buttons.querySelectorAll('[data-path]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.path === activePath)));
    setParam('path', activePath, null);
    pathsState.textContent = activePath ? courseOf[activePath].code : 'none';
    redraw();
    renderPathList();
  }

  let current = null;
  /** Set when the find box opens a concept, so keyboard focus carries on in the map. */
  let focusOnShow = false;
  function show(id) {
    if (!byId[id]) return false;
    current = id;
    render(id);
    draw(visible(id));
    highlight(id);
    renderTrail(id);
    renderPathList();
    reveal(id);
    if (focusOnShow) {
      focusOnShow = false;
      nodeEls[id]?.focus({ preventScroll: true });
    }
    return true;
  }

  function go(id) {
    if (window.location.hash.slice(1) === id) show(id);
    else window.location.hash = id;
  }

  // A hash that names no concept (#courses, #progress) is a place on the page; the map keeps
  // whatever it was showing.
  window.addEventListener('hashchange', () => show(decodeURIComponent(window.location.hash.slice(1))));
  const first = decodeURIComponent(window.location.hash.slice(1));
  const startPath = new URLSearchParams(window.location.search).get('path');
  if (startPath && paths[startPath]) {
    activePath = startPath;
    buttons.querySelector(`[data-path="${startPath}"]`)?.setAttribute('aria-pressed', 'true');
    pathsState.textContent = courseOf[startPath].code;
  }
  if (!show(first)) show(activePath ? pathOrder(paths[activePath])[0] : byId[START] ? START : concepts[0].id);

  // ---------- Find ----------
  const findInput = /** @type {HTMLInputElement} */ (root.getElementById('find-input'));
  const findList = root.getElementById('find-results');
  const index = searchIndex(concepts, usedLanes, COURSES.filter((c) => paths[c.id]));
  /** @type {ReturnType<typeof searchIndex>} */
  let found = [];
  let foundTotal = 0;
  let active = -1;

  function closeFind() {
    found = [];
    active = -1;
    findList.hidden = true;
    findList.innerHTML = '';
    findInput.setAttribute('aria-expanded', 'false');
    findInput.removeAttribute('aria-activedescendant');
  }

  function option(r) {
    if (r.kind === 'subject') {
      const l = subjectOf[r.id];
      return `<i class="sw" style="background:var(${l.token})"></i><span class="find-title">${esc(r.title)}</span><span class="find-meta">Subject: show only this lane, ${laneSize[r.id]} concepts</span>`;
    }
    if (r.kind === 'course') return `<i class="sw course-sw"></i><span class="find-title">${esc(r.title)}</span><span class="find-meta">Course: follow its path</span>`;
    const c = byId[r.id];
    return `<i class="sw" style="background:${colour(c)}"></i><span class="find-title">${esc(r.title)}</span><span class="find-meta">${esc(subjectOf[c.subject].label)}, ${esc(r.courses.join(', '))}${r.hasLab ? '' : ', no lab yet'}</span>`;
  }

  function renderFind() {
    if (!findInput.value.trim()) return closeFind();
    findList.innerHTML = found.length
      ? found.map((r, i) => `<li role="option" id="find-opt-${i}" data-i="${i}" aria-selected="${i === active}">${option(r)}</li>`).join('') +
        (foundTotal > found.length ? `<li class="find-note" aria-hidden="true">${foundTotal - found.length} more. Keep typing to narrow them.</li>` : '')
      : '<li class="find-note">No match. Try part of a name, a subject or a course code.</li>';
    findList.hidden = false;
    findInput.setAttribute('aria-expanded', 'true');
    if (active >= 0) {
      findInput.setAttribute('aria-activedescendant', `find-opt-${active}`);
      findList.querySelector(`#find-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
    } else findInput.removeAttribute('aria-activedescendant');
  }

  /** The first concept of a subject, by depth on the map then title. */
  function firstOf(subject) {
    return concepts
      .filter((c) => c.subject === subject)
      .sort((a, b) => graph.depth[a.id] - graph.depth[b.id] || a.title.localeCompare(b.title))[0].id;
  }

  function pick(r) {
    findInput.value = '';
    closeFind();
    focusOnShow = true;
    if (r.kind === 'subject') {
      chooseLanes([r.id]);
      if (scope === 'near') chooseScope('all');
      if (byId[current].subject !== r.id) return go(firstOf(r.id));
    } else if (r.kind === 'course') {
      choosePath(r.id);
      const order = pathOrder(paths[r.id]);
      if (!order.includes(current)) return go(order[0]);
    } else return go(r.id);
    show(current);
  }

  findInput.addEventListener('input', () => {
    ({ results: found, total: foundTotal } = find(index, findInput.value));
    active = found.length ? 0 : -1;
    renderFind();
  });
  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!found.length) return;
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + found.length) % found.length;
      renderFind();
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(found[active]);
    } else if (e.key === 'Escape' && !findList.hidden) {
      e.preventDefault();
      closeFind();
    }
  });
  findInput.addEventListener('focus', () => {
    if (findInput.value.trim()) findInput.dispatchEvent(new Event('input'));
  });
  findInput.addEventListener('blur', closeFind);
  // Keep focus in the box while a match is pressed, so the click lands before the list closes.
  findList.addEventListener('mousedown', (e) => e.preventDefault());
  findList.addEventListener('click', (e) => {
    const li = /** @type {HTMLElement} */ (e.target).closest('[data-i]');
    if (li) pick(found[Number(li.dataset.i)]);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/** @type {HTMLElement} */ (e.target).closest?.('input, textarea, select, [contenteditable="true"]')) return;
    e.preventDefault();
    findInput.focus();
    findInput.select();
  });

  return {
    show,
    go,
    choosePath,
    chooseScope,
    chooseLanes,
    setZoom,
    get current() {
      return current;
    },
    get path() {
      return activePath;
    },
    get scope() {
      return scope;
    },
    graph,
  };
}
