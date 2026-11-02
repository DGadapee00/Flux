/**
 * The hub's front door: the concept map, drawn from map/ as the approved prototype draws it
 * (docs/map/prototype-flux-thread.html). Subject lanes, prerequisites left to right, a reading
 * panel for the chosen concept, the trail of where you have been, and highlighting of what the
 * concept builds on (solid) and where it leads (dashed). `#<concept-id>` opens a concept.
 *
 * The map opens as a local view: the chosen concept, centred, with what it builds on and what it
 * leads to, one step each way. A control widens it to two steps or to the full map, and
 * `?view=two|all` keeps that choice.
 *
 * A course is a path through the map (map/paths/). Choosing one numbers its concepts on the map,
 * fades the rest and lists them in teaching order. In a local view the whole path is drawn as well.
 * `?path=<course-id>` keeps the choice.
 */
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { buildGraph, COURSES, LAB_CATALOGS, labHref, notesHref, SUBJECTS } from '@flux/map';
import { BOX, layout, neighbourhood, SCOPES, subMap, wrapLabel } from './layout.js';

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
  const { byId, leads, closure } = graph;
  const subjectOf = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
  const courseOf = Object.fromEntries(COURSES.map((c) => [c.id, c]));
  const colour = (c) => `var(${subjectOf[c.subject].token})`;
  const { NODEW, NODEH } = BOX;

  // Legend: every lane in use on the full map, then the lab markers.
  const legend = root.getElementById('legend');
  legend.innerHTML =
    layout(concepts, SUBJECTS, graph.depth)
      .lanes.map((l) => `<span><i class="sw" style="background:var(${l.subject.token})"></i>${esc(l.subject.label)}</span>`)
      .join('') + '<span><i class="dot"></i>Flux lab exists</span><span><i class="dot hollow"></i>No lab yet</span>';

  // ---------- Map ----------
  const svg = root.getElementById('map');
  const mapbox = root.getElementById('mapbox');
  const inner = root.getElementById('mapinner');
  const tags = root.getElementById('lane-tags');
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
    if (W <= box) {
      inner.style.width = `${W}px`;
      inner.style.minWidth = '';
    } else if (box >= W * 0.8) {
      inner.style.width = '';
      inner.style.minWidth = '';
    } else {
      inner.style.width = `${W}px`;
      inner.style.minWidth = `${W}px`;
    }
  }
  window.addEventListener('resize', fit);

  /** @param {Set<string>|null} ids The concepts to draw, or null for the full map. */
  function draw(ids) {
    const key = ids ? [...ids].sort().join(',') : '*';
    if (key === view.key) return;
    const sub = ids ? subMap(concepts, ids) : concepts;
    const depth = ids ? buildGraph(sub).depth : graph.depth;
    const { lanes, pos, W, H } = layout(sub, SUBJECTS, depth);
    view = { key, pos, W, H };
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    fit();
    for (const lane of lanes) {
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
          tabindex: '0',
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
      g.addEventListener('click', () => go(c.id));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go(c.id);
        }
      });
      nodeEls[c.id] = g;
    }
    // Lane labels are HTML over the map, each stuck to the box's left edge, so a lane stays named
    // however far the map is scrolled. A backing keeps edges from running through the text.
    tags.innerHTML = lanes
      .map(
        (lane) =>
          `<div class="lane-row" style="top:${(lane.y / H) * 100}%"><span class="lane-label" style="color:var(${lane.subject.token})">${esc(lane.subject.label)}</span></div>`,
      )
      .join('');
  }

  // ---------- Scope: one step, two steps, the full map ----------
  const scopeEl = root.getElementById('scope');
  let scope = new URLSearchParams(window.location.search).get('view');
  if (!(scope in SCOPES)) scope = 'near';

  function visible(id) {
    if (scope === 'all') return null;
    const ids = neighbourhood(id, SCOPES[scope], (x) => byId[x].requires, (x) => leads[x]);
    if (activePath) for (const x of pathOrder(paths[activePath])) ids.add(x);
    return ids;
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
    if (current) {
      draw(visible(current));
      highlight(current);
      reveal(current);
    }
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

  if (pathIds.length) {
    chooser.hidden = false;
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
    if (current) {
      draw(visible(current));
      highlight(current);
      reveal(current);
    }
    renderPathList();
  }

  let current = null;
  function show(id) {
    if (!byId[id]) return false;
    current = id;
    render(id);
    draw(visible(id));
    highlight(id);
    renderTrail(id);
    renderPathList();
    reveal(id);
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
  }
  if (!show(first)) show(activePath ? pathOrder(paths[activePath])[0] : byId[START] ? START : concepts[0].id);

  return {
    show,
    go,
    choosePath,
    chooseScope,
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
