/**
 * The hub's front door: the concept map, drawn from map/ as the approved prototype draws it
 * (docs/map/prototype-flux-thread.html). Subject lanes, prerequisites left to right, a reading
 * panel for the chosen concept, the trail of where you have been, and highlighting of what the
 * concept builds on (solid) and where it leads (dashed). `#<concept-id>` opens a concept.
 */
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { buildGraph, COURSES, LAB_CATALOGS, labHref, SUBJECTS } from '@flux/map';
import { BOX, layout, wrapLabel } from './layout.js';

/** The concept the map opens on when the link names none. */
export const START = 'divergence-theorem';

const NS = 'http://www.w3.org/2000/svg';
const TRAIL_MAX = 8;

/** Every concept, from one file each in map/concepts/. */
export function loadConcepts() {
  const mods = import.meta.glob('../../map/concepts/*.js', { eager: true });
  return Object.values(mods).map((m) => /** @type {any} */ (m).default);
}

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
 *   root?: Document,
 * }} [opts]
 */
export function mountMap({ concepts = loadConcepts(), root = document } = {}) {
  const style = root.createElement('style');
  style.textContent = laneCss(SUBJECTS);
  root.head.append(style);

  const graph = buildGraph(concepts);
  const { byId, leads, depth, closure } = graph;
  const subjectOf = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
  const courseOf = Object.fromEntries(COURSES.map((c) => [c.id, c]));
  const colour = (c) => `var(${subjectOf[c.subject].token})`;
  const { lanes, pos, W, H } = layout(concepts, SUBJECTS, depth);
  const { NODEW, NODEH, LEFT } = BOX;

  // Legend: the lanes in use, then the lab markers.
  const legend = root.getElementById('legend');
  legend.innerHTML =
    lanes.map((l) => `<span><i class="sw" style="background:var(${l.subject.token})"></i>${esc(l.subject.label)}</span>`).join('') +
    '<span><i class="dot"></i>Flux lab exists</span><span><i class="dot hollow"></i>No lab yet</span>';

  // ---------- Map ----------
  const svg = root.getElementById('map');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  // Fit the map to its box when that costs at most a fifth of its size. Narrower than that (a
  // phone), it keeps its natural size and scrolls sideways inside the box.
  const mapbox = root.getElementById('mapbox');
  const fit = () => {
    svg.style.minWidth = mapbox.clientWidth >= W * 0.8 ? '' : `${W}px`;
  };
  fit();
  window.addEventListener('resize', fit);
  for (const lane of lanes) {
    el('rect', { x: 0, y: lane.y, width: W, height: lane.h, fill: `var(${lane.subject.token})`, class: 'lane-bg' }, svg);
  }

  const edgeEls = [];
  const edgeLayer = el('g', {}, svg);
  for (const c of concepts) {
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

  const nodeEls = {};
  for (const c of concepts) {
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
    g.addEventListener('click', () => go(c.id));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go(c.id);
      }
    });
    nodeEls[c.id] = g;
  }

  // Lane labels last, with a halo, so edges never run through the text.
  for (const lane of lanes) {
    const t = el(
      'text',
      {
        x: LEFT,
        y: lane.y + 14,
        fill: `var(${lane.subject.token})`,
        class: 'lane-label',
        stroke: 'var(--panel)',
        'stroke-width': 5,
        'paint-order': 'stroke',
        'stroke-linejoin': 'round',
      },
      svg,
    );
    t.textContent = lane.subject.label;
  }

  // ---------- Reading panel ----------
  const detail = root.getElementById('detail');
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
    return `<span class="course-tag">${tag}<span class="status">${esc(course.status)}</span></span>`;
  }

  function labBlock(ref) {
    const course = courseOf[ref.course];
    const meta = LAB_CATALOGS[ref.course][ref.lab];
    const lab = labHref({ course: ref.course, unit: meta.unit, lab: ref.lab });
    const notes = ref.notes ? labHref({ course: ref.course, unit: meta.unit, lab: ref.lab, notes: ref.notes }) : null;
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
    detail.innerHTML = `
      <div class="col">
        <div class="tagrow">${c.courses.map((k) => courseTag(k, c)).join('')}</div>
        <h2 id="concept-title">${esc(c.title)}</h2>
        <div class="eq">${tex(c.eq, true)}</div>
        <p class="idea">${prose(c.idea)}</p>
        <div><h3>Builds on</h3>${c.requires.length ? `<div class="chips">${c.requires.map(chip).join('')}</div>` : '<p class="none">Nothing on the map yet. It is a starting point.</p>'}</div>
        <div><h3>Leads to</h3>${leads[id].length ? `<div class="chips">${leads[id].map(chip).join('')}</div>` : '<p class="none">The end of this thread, for now.</p>'}</div>
      </div>
      <div class="col">
        ${labs}${extra}
        <div><h3>Worth your time</h3><ul class="sources">${srcs}</ul></div>
      </div>`;
    detail.dataset.concept = id;
    detail.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  }

  function highlight(id) {
    const up = closure(id, 'requires');
    const down = closure(id, 'leads');
    for (const k in nodeEls) {
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

  /** On a narrow screen the map scrolls sideways in its box; bring the chosen concept into view. */
  function reveal(id) {
    const box = mapbox;
    if (box.scrollWidth <= box.clientWidth) return;
    const scale = svg.getBoundingClientRect().width / W;
    const cx = (pos[id].x + NODEW / 2) * scale;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ left: Math.max(0, cx - box.clientWidth / 2), behavior: reduce ? 'auto' : 'smooth' });
  }

  let current = null;
  function show(id) {
    if (!byId[id]) return false;
    current = id;
    render(id);
    highlight(id);
    renderTrail(id);
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
  if (!show(first)) show(byId[START] ? START : concepts[0].id);

  return { show, go, get current() { return current; }, graph };
}
